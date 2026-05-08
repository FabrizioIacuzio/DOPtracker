# Products Folder — Single Source of Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all denomination data (fields, validation rules, submission configs, metadata, regulatory docs) into a `products/{id}/` folder at the repo root so both the backend and frontend read from a single authoritative location.

**Architecture:** A one-time migration script extracts data from the existing scattered locations (`frontend/src/lib/denominationFields.ts`, `backend/src/denominations/configs/`, and the `.worktrees` docs) into 45 denomination folders. The backend `loader.ts` and frontend `denominationFields.ts` are then updated to point at the new location; all other code is untouched.

**Tech Stack:** Node 20 / ts-node (migration script), Vite `import.meta.glob` (frontend loader), `fs.readFileSync` (backend loader).

---

## File Map

| Action | Path |
|--------|------|
| Create | `scripts/tsconfig.json` |
| Create | `scripts/migrate-to-products.ts` |
| Create | `products/{id}/fields.json` × 45 |
| Create | `products/{id}/submission.json` × 45 |
| Create | `products/{id}/metadata.json` × 45 |
| Create | `products/{id}/docs/piano-di-controllo.zip` × 45 (local only, git-ignored) |
| Modify | `backend/src/denominations/loader.ts` |
| Modify | `frontend/src/lib/denominationFields.ts` |
| Modify | `.gitignore` |
| Delete | `backend/src/denominations/configs/` (entire directory) |

---

### Task 1: Write the migration script

**Files:**
- Create: `scripts/tsconfig.json`
- Create: `scripts/migrate-to-products.ts`

- [ ] **Step 1: Create `scripts/tsconfig.json`**

This gives ts-node a CommonJS context that can `require` the frontend TS file without Vite aliases:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "target": "es2020",
    "strict": false,
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 2: Create `scripts/migrate-to-products.ts`**

```typescript
// Run with: npx ts-node --project scripts/tsconfig.json scripts/migrate-to-products.ts
import fs from 'fs'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DENOMINATION_CONFIGS } = require('../frontend/src/lib/denominationFields') as {
  DENOMINATION_CONFIGS: Record<string, { fields: unknown[]; rules: unknown[] }>
}

const ROOT = path.resolve(__dirname, '..')
const PRODUCTS_DIR = path.join(ROOT, 'products')
const CONFIGS_DIR = path.join(ROOT, 'backend/src/denominations/configs')
const WORKTREE_DIR = path.join(ROOT, '.worktrees/abm-igp-bootstrap/docs/denominations/csqa')

const CATEGORY_MAP: Record<string, string> = {
  'aceto-balsamico-di-modena': 'Aceto',
  'gorgonzola': 'Formaggi',
  'asiago': 'Formaggi',
  'fontina': 'Formaggi',
  'grana-padano': 'Formaggi',
  'bitto': 'Formaggi',
  'casatella-trevigiana': 'Formaggi',
  'montasio': 'Formaggi',
  'monte-veronese': 'Formaggi',
  'nostrano-valtrompia': 'Formaggi',
  'piave': 'Formaggi',
  'provolone-valpadana': 'Formaggi',
  'spressa-delle-giudicarie': 'Formaggi',
  'valle-daosta-fromadzo': 'Formaggi',
  'valtellina-casera': 'Formaggi',
  'ricotta-di-bufala-campana': 'Formaggi',
  'bresaola-della-valtellina': 'Salumi',
  'sopressa-vicentina': 'Salumi',
  'chianti-classico': 'Vino',
  'garda': 'Vino',
  'miele-delle-dolomiti-bellunesi': 'Altro',
  'salmerino-del-trentino': 'Altro',
  'aglio-bianco-polesano': 'Ortaggi & Frutta',
  'amarene-brusche-di-modena': 'Ortaggi & Frutta',
  'asparago-bianco-di-bassano': 'Ortaggi & Frutta',
  'asparago-bianco-di-cimadolmo': 'Ortaggi & Frutta',
  'asparago-di-badoere': 'Ortaggi & Frutta',
  'ciliegia-di-marostica': 'Ortaggi & Frutta',
  'cipollotto-nocerino': 'Ortaggi & Frutta',
  'fagiolo-di-lamon-della-vallata-bellunese': 'Ortaggi & Frutta',
  'insalata-di-lusia': 'Ortaggi & Frutta',
  'marrone-di-combai': 'Ortaggi & Frutta',
  'marrone-di-san-zeno': 'Ortaggi & Frutta',
  'marroni-del-monfenera': 'Ortaggi & Frutta',
  'mela-di-valtellina': 'Ortaggi & Frutta',
  'mela-val-di-non': 'Ortaggi & Frutta',
  'melanzana-rossa-di-rotonda': 'Ortaggi & Frutta',
  'pera-mantovana': 'Ortaggi & Frutta',
  'pesca-di-verona': 'Ortaggi & Frutta',
  'radicchio-di-chioggia': 'Ortaggi & Frutta',
  'radicchio-di-verona': 'Ortaggi & Frutta',
  'radicchio-rosso-di-treviso': 'Ortaggi & Frutta',
  'radicchio-variegato-di-castelfranco': 'Ortaggi & Frutta',
  'susina-di-dro': 'Ortaggi & Frutta',
  'uva-da-tavola-di-canicatti': 'Ortaggi & Frutta',
}

let count = 0

for (const [id, config] of Object.entries(DENOMINATION_CONFIGS)) {
  const dir = path.join(PRODUCTS_DIR, id)
  const docsDir = path.join(dir, 'docs')
  fs.mkdirSync(docsDir, { recursive: true })

  // 1. fields.json — batch form fields + validation rules
  fs.writeFileSync(
    path.join(dir, 'fields.json'),
    JSON.stringify(config, null, 2) + '\n',
    'utf-8',
  )

  // 2. submission.json — moved from backend/src/denominations/configs/
  const submissionSrc = path.join(CONFIGS_DIR, `${id}.json`)
  if (fs.existsSync(submissionSrc)) {
    fs.copyFileSync(submissionSrc, path.join(dir, 'submission.json'))
  } else {
    console.warn(`  WARNING: no submission config for ${id} — writing empty stub`)
    fs.writeFileSync(path.join(dir, 'submission.json'), JSON.stringify({ id, submission_rules: [] }, null, 2) + '\n', 'utf-8')
  }

  // 3. metadata.json — adapted from worktree metadata
  const metaSrc = path.join(WORKTREE_DIR, id, 'metadata.json')
  if (fs.existsSync(metaSrc)) {
    const raw = JSON.parse(fs.readFileSync(metaSrc, 'utf-8')) as {
      name: string; type: string; controlBody: string
    }
    const meta = {
      id,
      displayName: `${raw.name} ${raw.type}`,
      protectionType: raw.type,
      category: CATEGORY_MAP[id] ?? 'Altro',
      certifyingBody: raw.controlBody,
    }
    fs.writeFileSync(path.join(dir, 'metadata.json'), JSON.stringify(meta, null, 2) + '\n', 'utf-8')
  } else {
    console.warn(`  WARNING: no worktree metadata for ${id}`)
  }

  // 4. docs/piano-di-controllo.zip — copy from worktree (local only, git-ignored)
  const zipSrc = path.join(WORKTREE_DIR, id, 'piano-di-controllo.zip')
  if (fs.existsSync(zipSrc)) {
    fs.copyFileSync(zipSrc, path.join(docsDir, 'piano-di-controllo.zip'))
  }

  console.log(`  ✓ ${id}`)
  count++
}

console.log(`\nDone — migrated ${count} denominations to products/`)
```

- [ ] **Step 3: Commit the migration script**

```bash
git add scripts/tsconfig.json scripts/migrate-to-products.ts
git commit -m "chore: add products-folder migration script"
```

---

### Task 2: Run the migration and gitignore binary docs

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Run the migration script from the repo root**

```bash
cd C:\Users\fabri\OneDrive\Desktop\dop
npx ts-node --project scripts/tsconfig.json scripts/migrate-to-products.ts
```

Expected output: 45 lines like `  ✓ aceto-balsamico-di-modena` followed by `Done — migrated 45 denominations to products/`.

Any `WARNING:` lines mean a file was missing from source — review them. Every denomination should get `fields.json` and `submission.json` at minimum.

- [ ] **Step 2: Spot-check the output**

```bash
# Should print 45
ls products/ | wc -l

# Inspect one denomination
cat products/gorgonzola/fields.json
cat products/gorgonzola/submission.json
cat products/gorgonzola/metadata.json
```

`fields.json` must have `fields` and `rules` arrays. `submission.json` must have `id`, `name`, `type`, `control_body`, `submission_rules`. `metadata.json` must have `id`, `displayName`, `protectionType`, `category`, `certifyingBody`.

- [ ] **Step 3: Gitignore binary docs (ZIPs and PDFs are not committed — they total ~146 MB)**

Open `.gitignore` and append:

```
# Products: binary regulatory docs (large, source is .worktrees)
products/*/docs/*.zip
products/*/docs/*.pdf
```

- [ ] **Step 4: Stage and commit the JSON files only**

```bash
git add products/
git add .gitignore
git commit -m "chore: migrate denomination data to products/ folder"
```

Verify no ZIP or PDF files were staged:

```bash
git show --stat HEAD | grep -E "\.(zip|pdf)"
```

Expected: no matches.

---

### Task 3: Update the backend loader

**Files:**
- Modify: `backend/src/denominations/loader.ts`

The current loader scans a flat `configs/` directory for `*.json` files. The new loader scans `products/` for denomination subdirectories and reads `submission.json` from each.

- [ ] **Step 1: Verify the existing backend tests pass before changing anything**

```bash
cd backend && npm test
```

Expected: all tests pass. Note the count so you can confirm nothing broke afterward.

- [ ] **Step 2: Replace `backend/src/denominations/loader.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import { DenominationConfigSchema, DenominationConfig } from './types'

const PRODUCTS_DIR = path.resolve(__dirname, '../../../products')

export function loadAllConfigs(dir: string = PRODUCTS_DIR): Map<string, DenominationConfig> {
  const map = new Map<string, DenominationConfig>()
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const submissionFile = path.join(dir, entry.name, 'submission.json')
    if (!fs.existsSync(submissionFile)) continue
    const raw: unknown = JSON.parse(fs.readFileSync(submissionFile, 'utf-8'))
    const result = DenominationConfigSchema.safeParse(raw)
    if (!result.success) {
      throw new Error(`Invalid submission config in ${entry.name}: ${result.error.message}`)
    }
    map.set(result.data.id, result.data)
  }
  return map
}
```

Path math: `__dirname` in dev (ts-node) = `backend/src/denominations/`. Three `../` levels up = repo root. Same in compiled output: `backend/dist/denominations/` → three levels up = repo root. ✓

- [ ] **Step 3: Search for any backend code that calls `loadAllConfigs` with a custom directory argument**

```bash
grep -r "loadAllConfigs(" backend/src/ backend/tests/ 2>/dev/null
```

If any call passes a non-default directory (e.g., a test fixture dir), update that call site to use a temporary directory containing denomination subdirectories with `submission.json` files instead of flat JSON files. If all calls use the default (no argument), nothing else changes.

- [ ] **Step 4: Run backend tests**

```bash
cd backend && npm test
```

Expected: same pass count as Step 1.

- [ ] **Step 5: Commit**

```bash
git add backend/src/denominations/loader.ts
git commit -m "refactor(backend): loader reads submission.json from products/ folder"
```

---

### Task 4: Update the frontend loader

**Files:**
- Modify: `frontend/src/lib/denominationFields.ts`

Replace the 650-line hardcoded TypeScript map with a Vite `import.meta.glob` loader. The public API (`getDenominationConfig`, `validateDenominationFields`, all exported types) is identical — callers are untouched.

- [ ] **Step 1: Verify the existing frontend tests pass before changing anything**

```bash
cd frontend && npm test
```

Expected: 183 tests pass.

- [ ] **Step 2: Replace `frontend/src/lib/denominationFields.ts` with the glob loader**

```typescript
export type FieldType = 'number' | 'text' | 'date' | 'select'

export interface DenominationField {
  key: string
  label: string
  type: FieldType
  unit?: string
  hint?: string
  options?: string[]
  min?: number
  max?: number
  required?: boolean
}

export interface ValidationRule {
  field: string
  label: string
  min?: number
  max?: number
  unit?: string
}

export interface DenominationConfig {
  fields: DenominationField[]
  rules: ValidationRule[]
}

// Vite resolves this glob at build time against the repo root.
// Vitest supports import.meta.glob natively — no additional config needed.
const fieldFiles = import.meta.glob('../../../products/*/fields.json', { eager: true })

export function getDenominationConfig(denominationId: string): DenominationConfig {
  const key = `../../../products/${denominationId}/fields.json`
  const mod = fieldFiles[key] as DenominationConfig | undefined
  return mod ?? { fields: [], rules: [] }
}

export function validateDenominationFields(
  denominationId: string,
  fields: Record<string, string | number>,
): string[] {
  const config = getDenominationConfig(denominationId)
  const warnings: string[] = []
  for (const rule of config.rules) {
    const raw = fields[rule.field]
    const value = typeof raw === 'string' ? parseFloat(raw) : raw
    if (!value || value <= 0) continue
    if (rule.min !== undefined && value < rule.min) {
      warnings.push(`${rule.label} sotto il minimo (${rule.min}${rule.unit ? ' ' + rule.unit : ''})`)
    }
    if (rule.max !== undefined && value > rule.max) {
      warnings.push(`${rule.label} sopra il massimo (${rule.max}${rule.unit ? ' ' + rule.unit : ''})`)
    }
  }
  return warnings
}
```

Glob path math: `frontend/src/lib/` + `../../../` = repo root → `products/*/fields.json`. ✓

- [ ] **Step 3: Run frontend tests**

```bash
cd frontend && npm test
```

Expected: 183 tests pass. If any test fails with "Unknown denomination" or empty fields, the fields.json for that denomination was not generated correctly in Task 2 — re-check that denomination's `fields.json` content.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/denominationFields.ts
git commit -m "refactor(frontend): replace hardcoded denomination map with products/ glob loader"
```

---

### Task 5: Delete the old backend configs directory

**Files:**
- Delete: `backend/src/denominations/configs/` (entire directory — 45 JSON files)

- [ ] **Step 1: Remove the old configs directory from git**

```bash
git rm -r backend/src/denominations/configs/
```

- [ ] **Step 2: Run all tests to confirm nothing depends on the deleted directory**

```bash
cd frontend && npm test
cd ../backend && npm test
```

Both must pass. If the backend fails with "ENOENT: no such file or directory, scandir ... configs", it means some code path still references the old directory — find it with:

```bash
grep -r "denominations/configs" backend/src/ backend/tests/
```

and update the path to use `products/`.

- [ ] **Step 3: Commit the deletion**

```bash
git add -A
git commit -m "chore: remove backend/src/denominations/configs (moved to products/)"
```

---

### Task 6: Final verification and summary commit

- [ ] **Step 1: Run the full test suite one more time from the repo root**

```bash
cd frontend && npm test && cd ../backend && npm test
```

Expected: all tests pass in both packages.

- [ ] **Step 2: Verify the new folder structure is correct**

```bash
# Each denomination has the three required JSON files
for dir in products/*/; do
  echo -n "$dir: "
  ls "$dir" | tr '\n' ' '
  echo
done
```

Every denomination must show `docs/  fields.json  metadata.json  submission.json`.

- [ ] **Step 3: Remove the now-unused migration script (optional)**

The migration script is a one-time tool. Keep it in `scripts/` as documentation, or delete it:

```bash
# Keep it — it documents how the migration was done
# Or: git rm scripts/migrate-to-products.ts scripts/tsconfig.json
```

Either choice is fine. If kept, leave it as-is.

- [ ] **Step 4: Push to master**

```bash
git push origin master
```
