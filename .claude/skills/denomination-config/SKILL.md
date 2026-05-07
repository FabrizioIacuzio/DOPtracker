---
name: denomination-config
description: Add a new DOP/IGP denomination or modify rule thresholds for an existing one. Drives the validator engine and frontend rendering.
when_to_use: Adding a new denomination JSON; changing acidity/density/aging/etc. thresholds; adding a new rule type the engine doesn't yet support.
---

# Denomination configuration workflow

The product's value is being right about disciplinare rules. This skill keeps
those rules data-driven, version-controlled, and tested.

## Trigger

You are adding a new DOP/IGP denomination, or changing the rules for an existing
one (e.g. ABM IGP).

## Preconditions

- Plan approved.
- You have the source-of-truth disciplinare document or an authoritative summary.
  Cite it in the JSON `source` field. Don't infer thresholds from memory or
  the frontend's hardcoded values — those may be stale.
- You understand which rules are *advisory* (warn) vs. *blocking* (reject
  declaration).

## File layout

```
backend/src/denominations/
├── index.ts            # loader: validates each JSON against the meta-schema
├── _schema.ts          # Zod meta-schema for denomination files
├── abm-igp.json        # Aceto Balsamico di Modena IGP
└── <slug>.json         # one file per denomination
```

`<slug>` uses kebab-case (`abm-igp`, `parmigiano-reggiano-dop`).

## Steps

### 1. Define or extend the meta-schema (only if needed)

- File: `backend/src/denominations/_schema.ts`.
- The Zod schema describes what a valid denomination file looks like:
  - `id` (slug), `name`, `category` (vinegar/cheese/cured-meat/wine), `source`
    (URL or doc ref + retrieval date), `version`.
  - `parameters[]`: each has `key`, `label_it`, `label_en`, `unit`, `type`
    (number/integer/months/percent), and `rules[]`.
  - Rule kinds supported by the engine: `min`, `max`, `min_inclusive`,
    `max_inclusive`, `equal_to`, `one_of`, `aging_min_months`. If you need a
    new kind, extend the engine *and* its tests in this same task.
- Any change to the meta-schema requires updating its tests in
  `backend/tests/denominations/schema.test.ts`.

### 2. Write the validator tests first

- File: `backend/tests/denominations/<slug>.test.ts`.
- For every rule, write tests at:
  - the boundary value (e.g. `acidity: 6.0` for `min_inclusive: 6`)
  - just below boundary (must fail)
  - just above (must pass)
  - missing field (must fail with a specific error code)
- Run: must fail (no JSON file yet).

### 3. Author the JSON

- File: `backend/src/denominations/<slug>.json`.
- Include `source` with retrieval date so we can audit later.
- Localise labels (`label_it`, `label_en`).
- Mark each rule with `severity`: `"blocking"` or `"advisory"`.

### 4. Loader registration

- The loader in `backend/src/denominations/index.ts` should auto-discover JSON
  files in this directory and validate each against the meta-schema at startup.
  If startup fails, the file is wrong — *do not* loosen the schema to make it
  load.

### 5. Engine support

- Run the tests. If the engine doesn't support a rule kind your JSON uses,
  add it in `backend/src/engine/validator.ts` with its own unit tests in
  `backend/tests/engine/validator.test.ts` (boundary values, missing input,
  null/undefined handling).

### 6. Frontend rendering

- The frontend fetches the active denomination config from the backend
  (`GET /denominations/:slug`) and renders the batch form dynamically.
- If you introduced a new `parameter.type` or a new rule kind that needs a
  different input affordance (e.g. date pickers for aging), update the form
  renderer in [frontend/src/pages/BatchForm.tsx](frontend/src/pages/BatchForm.tsx)
  with a Vitest test for the new affordance.

### 7. Real-batch sanity check

- Take a known-good real batch (from the user's notes or a sample in the docs)
  and run it through the validator manually (`npm run validate -- <slug> <batch.json>`
  if a CLI exists; otherwise a quick test). Result must match what the
  disciplinare body would conclude.

### 8. Commit

- `feat(denomination): add <slug>` or `fix(denomination): correct <slug> <param>`.
- Mention the source doc + retrieval date in the commit body.

## Definition of done

- JSON validates against the meta-schema; loader picks it up at startup.
- Every rule has boundary tests (above/at/below) — all green.
- Every rule cites a source.
- Frontend renders the form for the new denomination without a code change
  (other than any new parameter types you explicitly added).
- A wrong batch is rejected with the right error code; a correct batch passes.

## Anti-patterns

- Hardcoding rule values in TypeScript. Rules live in JSON.
- Skipping the boundary tests "because it's obvious." Off-by-one on a boundary
  is the single most common compliance bug.
- Loosening the meta-schema to accept a malformed file. Fix the file.
- Adding a denomination without a `source` field. We must be able to defend
  every threshold to a producer or auditor.
- Mixing rule changes with unrelated refactors in the same commit. Rule
  changes need their own audit trail.
