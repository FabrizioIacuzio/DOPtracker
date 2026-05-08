# Products Folder — Single Source of Truth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all denomination-specific data (batch fields, validation rules, submission config, metadata, regulatory docs) into a `products/` folder at the repo root that both the backend and frontend read from directly.

**Architecture:** Pure-JSON data files per denomination, TypeScript loaders in each package updated to resolve paths into `products/`. No runtime fetching — Vite bundles the JSONs at build time; Node reads them via `fs` at startup.

**Tech Stack:** Vite `import.meta.glob` (frontend), Node `fs.readFileSync` (backend), TypeScript types unchanged.

---

## Folder Structure

```
products/
  {denomination-id}/          ← kebab-case slug, same as existing denominationId
    fields.json               ← batch form fields + validation rules  (frontend)
    submission.json           ← channel, certifying body, documents, deadlines  (backend)
    metadata.json             ← display name, category, protection type  (both)
    docs/
      disciplinare.pdf        ← regulation PDF (if available)
      piano-di-controllo.zip  ← control plan ZIP (moved from worktree)
```

45 denomination folders total, named after existing denomination slugs:
`aceto-balsamico-di-modena`, `gorgonzola`, `fontina`, `asiago`, etc.

---

## JSON Schemas

### `fields.json`
Used by: `frontend/src/lib/denominationFields.ts` loader, frontend `BatchForm`, frontend validator.

```json
{
  "fields": [
    {
      "key": "supplier",
      "label": "Fornitore mosto",
      "type": "text",
      "required": false
    },
    {
      "key": "volume",
      "label": "Volume",
      "type": "number",
      "unit": "L",
      "required": false
    }
  ],
  "rules": [
    {
      "field": "acidity",
      "min": 6,
      "message": "Acidità totale sotto il minimo (6 %)"
    },
    {
      "field": "alcohol",
      "max": 1.5,
      "message": "Titolo alcolometrico sopra il massimo (1.5 % vol)"
    }
  ]
}
```

Fields array mirrors `DenominationField` type. Rules array mirrors `ValidationRule` type. Both types stay defined in `frontend/src/lib/denominationFields.ts`.

### `submission.json`
Used by: `backend/src/denominations/loader.ts`, `SubmissionService`.
This is the existing `backend/src/denominations/configs/*.json` format — files are moved, not reformatted.

```json
{
  "channel": "pec",
  "certifyingBody": "CSQA",
  "submissionTarget": "csqa@pec.csqa.it",
  "documents": ["batch_record", "lab_report"],
  "deadlines": [
    { "month": 1, "day": 31, "label": "Dichiarazione annuale" }
  ]
}
```

### `metadata.json`
Used by: both frontend (onboarding category display) and backend (denomination listing).

```json
{
  "id": "aceto-balsamico-di-modena",
  "displayName": "Aceto Balsamico di Modena IGP",
  "protectionType": "IGP",
  "category": "Aceto",
  "certifyingBody": "CSQA"
}
```

---

## Loader Changes

### Frontend — `frontend/src/lib/denominationFields.ts`

Replace the 32KB hardcoded TypeScript object map with a Vite glob loader. Types (`DenominationField`, `ValidationRule`, `DenominationConfig`) remain in this file. All callers (`BatchForm`, `validateDenominationFields`, `getDenominationConfig`) keep their existing signatures.

```typescript
// Types stay here (DenominationField, ValidationRule, DenominationConfig)
// ...

const fieldFiles = import.meta.glob('../../../products/*/fields.json', { eager: true });

export function getDenominationConfig(id: string): DenominationConfig {
  const mod = fieldFiles[`../../../products/${id}/fields.json`] as DenominationConfig | undefined;
  if (!mod) throw new Error(`Unknown denomination: ${id}`);
  return mod;
}

export function validateDenominationFields(
  denominationId: string,
  fields: Record<string, string | number>,
): string[] {
  const config = getDenominationConfig(denominationId);
  // same validation logic as today
  // ...
}
```

Vite bundles all 45 JSONs at build time — no runtime fetch, behaviour identical to today.

### Backend — `backend/src/denominations/loader.ts`

Update path resolution to point at `products/` instead of `configs/`. Function signature unchanged.

```typescript
import path from "path";
import fs from "fs";

export function loadSubmissionConfig(id: string): SubmissionConfig {
  const file = path.resolve(__dirname, `../../../products/${id}/submission.json`);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
```

`__dirname` inside `backend/src/denominations/` → `../../../` reaches the repo root → `products/{id}/submission.json`.

---

## Migration Map

| Current location | New location |
|---|---|
| `backend/src/denominations/configs/{id}.json` | `products/{id}/submission.json` |
| 45 denomination objects in `frontend/src/lib/denominationFields.ts` | `products/{id}/fields.json` (45 files) |
| `.worktrees/abm-igp-bootstrap/docs/denominations/csqa/{id}/metadata.json` | `products/{id}/metadata.json` |
| `.worktrees/abm-igp-bootstrap/docs/denominations/csqa/{id}/piano-di-controllo.zip` | `products/{id}/docs/piano-di-controllo.zip` |

Files deleted after migration:
- `backend/src/denominations/configs/` (entire directory)
- Hardcoded denomination data in `frontend/src/lib/denominationFields.ts` (replaced with loader; types stay)

Files untouched:
- All routes, services, tests, React components
- `backend/src/denominations/types.ts`
- `frontend/src/contexts/AppDataContext.tsx`

---

## Path Anchoring

`products/` lives at the repo root. Relative paths from loaders:

- `backend/src/denominations/loader.ts` → `../../../products/` (3 levels up from `src/denominations/`)
- `frontend/src/lib/denominationFields.ts` → `../../../products/` (3 levels up from `src/lib/`)

---

## What Does Not Change

- Public API of `getDenominationConfig(id)` and `validateDenominationFields(id, fields)`
- Public API of `loadSubmissionConfig(id)` in the backend
- All TypeScript types (`DenominationField`, `ValidationRule`, `DenominationConfig`, `SubmissionConfig`)
- All tests — they call the same functions, which now read from JSON files
- All React components and backend services

---

## Adding a New Denomination

After this change, adding denomination `X` requires:
1. Create `products/x/fields.json` — define batch fields and validation rules
2. Create `products/x/submission.json` — define submission channel
3. Create `products/x/metadata.json` — define display name, category, protection type
4. Add `x` to the onboarding category list in `frontend/src/pages/Onboarding.tsx`

No changes to loaders, services, or any other code.
