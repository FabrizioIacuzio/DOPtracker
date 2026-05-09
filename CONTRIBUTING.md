# DOPtracker — Collaborator Onboarding

## The most important thing to understand

The data in `products/` was generated automatically from PDF scans and AI inference — **it has not been validated by a human against the official regulations.** Before any new feature gets built, the compliance data must be correct. A batch form that shows the wrong thresholds, or a submission that goes to the wrong channel, is worse than no app at all.

**The primary job for new collaborators is: find the official documents, read them, and validate or correct `products/{denomination}/`.**

Software development is secondary to this.

---

## What this product does

Italian DOP/IGP producers must submit compliance documentation to their certifying body (CSQA, Check Fruit, consortium, or ministry) on a schedule defined by the official *disciplinare* (production regulation) and *piano dei controlli* (control plan). This app:

1. Lets producers log production batches with denomination-specific parameters
2. Validates batch data against the disciplinare thresholds (e.g. ABM: acidity ≥ 6%, density ≥ 1.06 g/ml)
3. Generates and routes the required documents to the right recipient via the right channel (PEC email, web portal, SIAN telematic system, etc.)

The data driving steps 2 and 3 lives in `products/`.

---

## How `products/` works

Each denomination has its own folder:

```
products/
  aceto-balsamico-di-modena/
    fields.json      ← what the batch form shows + what gets validated
    submission.json  ← who to submit to, which channel, on what schedule
    metadata.json    ← display name, category, certifying body
    docs/            ← official PDFs (local only, not in git — ask repo owner)
```

**`fields.json` example:**
```json
{
  "fields": [
    { "key": "acidity", "label": "Acidità totale", "type": "number", "unit": "%", "hint": "Min 6%" }
  ],
  "rules": [
    { "field": "acidity", "label": "Acidità totale", "min": 6, "unit": "%" }
  ]
}
```

**`submission.json` example:**
```json
{
  "id": "aceto-balsamico-di-modena",
  "name": "Aceto Balsamico di Modena IGP",
  "type": "IGP",
  "control_body": { "name": "CSQA Certificazioni Srl", "type": "csqa", "pec": "..." },
  "submission_rules": [
    { "id": "rule-01", "doc_type": "declaration", "label": "Dichiarazione annuale", "channel": "pec", "schedule": { "frequency": "monthly", "due_day": 15 } }
  ]
}
```

Changing any of these files immediately changes what producers see in the app and what gets submitted. **This is why accuracy is critical.**

---

## Primary task: Denomination validation

### Step 1 — Get the official documents

For each denomination you're working on:

1. **Piano dei controlli** — The official control plan published by the certifying body. This is the most important document. It defines who does what, when, and how. Download from the MASAF (Ministero dell'Agricoltura) website:
   - Go to: `https://www.masaf.gov.it` → Qualità → Prodotti DOP IGP STG → Piano dei controlli
   - Or search: `"[denomination name]" "piano dei controlli" site:masaf.gov.it`
   - The repo already has these downloaded for all 45 denominations in `products/{id}/docs/` (ask the repo owner to share the files — they're too large for git)

2. **Disciplinare di produzione** — The production specification registered with the EU. Defines the product parameters (chemical thresholds, aging times, etc.). Find on:
   - EUR-Lex: `https://eur-lex.europa.eu` → search the denomination name
   - MASAF website same section

3. **Certifying body website** — CSQA (`csqa.it`), Check Fruit, or the consortium directly. Often has forms, tariffs, and portal instructions that the piano dei controlli doesn't fully explain.

### Step 2 — Read and map the compliance procedure

Work through the piano dei controlli and answer these questions. Write your answers in `products/{id}/VALIDATION.md` (create this file):

**About the producer:**
- What types of producers exist? (e.g. for ABM: cantina, elaboratore, imbottigliatore — different rules apply to each)
- What must each producer declare and when?
- What documents must they submit?

**About submission:**
- What is the exact submission channel? (PEC address? Portal URL? SIAN? Fax number?)
- What is the submission schedule? (Monthly by day X? Annual? Per-batch?)
- What document types are required? (Registration, monthly declaration, lab analysis, etc.)
- Are there different rules for different producer types?

**About production parameters:**
- What measurable parameters does the disciplinare specify? (acidity, density, aging time, fat content, etc.)
- What are the exact minimum/maximum thresholds with units?
- Are there parameters that vary by variety or typology?

### Step 3 — Compare against `products/{id}/fields.json` and `submission.json`

Open the current files and go through them line by line against the official document:

- Is every field in `fields.json` actually required by the disciplinare?
- Are the min/max values in `rules` exactly correct (right number, right unit)?
- Are there parameters in the disciplinare that are missing from the file?
- In `submission.json`, is the channel correct? The schedule? The PEC/portal address?
- Is the certifying body correct?

### Step 4 — Update and document

- Correct any errors in `fields.json` and `submission.json`
- In `products/{id}/VALIDATION.md`, write:
  - Which documents you read (name, version/date, URL or local path)
  - What you changed and why
  - Anything you're uncertain about (open questions)
  - Producer types covered (if the denomination has multiple)

### Step 5 — Open a PR

Branch name: `data/validate-{denomination-id}`
PR title: `data(products): validate {Denomination Name} against official documents`
PR body: paste your `VALIDATION.md` summary.

---

## Start here: ABM IGP

Aceto Balsamico di Modena IGP is the reference denomination — the most documented, the first in the app, and the one to validate first. Everything else is based on the patterns established here.

**Documents available locally** (in `products/aceto-balsamico-di-modena/docs/` — ask repo owner):
- `DPC030 - rev 22052025.pdf` — Piano dei controlli, 30 pages. **Read this first.**
- `MOD001 Domanda di adesione rev22052025.pdf` — Producer registration form
- `Allegato 2 a MOD 001 rev22052025.pdf` — Technical annex to the registration
- `Allegato 1 a MOD 001 - Elenco fornitori uve idonee ABM rev2025.pdf` — Approved grape suppliers list
- `MOD 003 - Modello richiesta correzione-rev22052025.pdf` — Correction request form

**Key things to clarify for ABM:**
- The piano dei controlli lists multiple operator types (cantina, elaboratore, imbottigliatore). Does our batch form and submission config cover all of them, or only one? Which one?
- What is the exact submission schedule and channel per operator type?
- Are all 8 chemical parameters in `fields.json` (acidity, density, sugars, aging, alcohol, dry extract, SO₂, ash) actually required for every submission, or only for lab reports?

**Current `products/aceto-balsamico-di-modena/fields.json`** has 12 fields and 8 validation rules. Compare every one of them against the DPC030 document.

---

## Priority order for validation

## AI-assisted audit status (not human-validated)

The following product folders have been analyzed and corrected by Codex against the cited official documents. Treat them as **AI-audited, pending human regulatory review**. Do not present them as legally validated until a human reviewer has checked the sources and signed off.

| Denomination | Status | Primary sources checked |
|--------------|--------|-------------------------|
| `aceto-balsamico-di-modena` | AI-audited, pending human review | MASAF 2025 disciplinare and local CSQA DPC030 package |
| `bresaola-della-valtellina` | Thin working config, pending deeper audit | Consorzio disciplinare page and CSQA product page identified |
| `gorgonzola` | AI-audited, pending human review | Official disciplinare, CSQA product page, local CSQA DPC012 package |
| `grana-padano` | AI-audited, pending human review | Consorzio disciplinare page/PDF, local CSQA DPC001 package |
| `insalata-di-lusia` | AI-audited, pending human review | EU 2019/C 3/11 single document, CSQA product page, local CSQA DPC041 package |
| `mozzarella-di-bufala-campana` | AI-audited initial config, pending human review | Official disciplinare/Consorzio source, RINA AGRIFOOD production register, MASAF RINA authorization, MASAF buffalo milk traceability page |

Each fully audited product has a `products/{id}/VALIDATION.md` file with the document list, modeled rules, submission mapping, and open questions. `bresaola-della-valtellina` is visible because it has a working config, but still needs that deeper validation file.

### Product UX visibility as of 2026-05-09

The onboarding UX intentionally shows only high-value priority denominations that currently have working product configs:

- `aceto-balsamico-di-modena`
- `bresaola-della-valtellina`
- `gorgonzola`
- `grana-padano`
- `mozzarella-di-bufala-campana`

All other products are hidden from onboarding until they are implemented one at a time. `parmigiano-reggiano` remains excluded by product-owner instruction.

Dashboard metrics and lab report uploads must be scoped to the selected product. Lab analysis is not considered mandatory for any product until the specific control plan has been human-validated. See `docs/market-research/priority-lab-analysis-requirements-2026.json`.

| Priority | Denomination | Why |
|----------|-------------|-----|
| 1 | `grana-padano` | Largest 2024 food DOP/IGP value and strong YoY growth |
| 2 | `mozzarella-di-bufala-campana` | Large market, implemented initial config |
| 3 | `gorgonzola` | Large and growing, implemented config |
| 4 | `prosciutto-di-san-daniele` | High-value missing cured-meat workflow |
| 5 | `aceto-balsamico-di-modena` | Reference product with multi-operator workflow |
| 6 | `mortadella-bologna` | High-value meat IGP, source package identified |
| 7 | `pasta-di-gragnano` | High value plus double-digit growth |
| 8 | `bresaola-della-valtellina` | Visible thin config, needs deeper audit |
| 9 | `speck-alto-adige` | Fast-growing cured-meat workflow candidate |
| 10 | `mela-alto-adige` | Best high-growth fruit candidate in the top-15 |
| 11 | `terra-di-bari` | Lower value but exceptional YoY growth |

`parmigiano-reggiano` would rank second by market value, but is intentionally skipped until reopened by the product owner. Smaller fruit and vegetable denominations should stay hidden unless a customer lead justifies them.

---

## Dev setup (for software contributors)

```bash
# 1. Clone
git clone https://github.com/FabrizioIacuzio/DOPtracker.git
cd DOPtracker

# 2. Start Postgres
docker compose up -d

# 3. Backend
cd backend
cp .env.example .env     # fill in values (see below)
npm install
npm run db:migrate
npm run dev              # :3000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev              # :8080
```

**Minimum `.env` for backend:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doptracker
JWT_SECRET=<any-string-32-chars-minimum>
CORS_ORIGIN=http://localhost:8080
PORT=3000
JOB_WORKER_POLL_INTERVAL_SECONDS=30
JOB_WORKER_BATCH_SIZE=10
```

**Tests:**
```bash
cd frontend && npm test   # 183 tests
cd backend && npm test    # 48 tests
```

Read `CLAUDE.md` for full coding conventions before writing any code. Key rules: TDD always, never mock the database, always branch off master.

---

## Open software work (after data is validated)

- **Authentication** — `POST /auth/register`, `POST /auth/login`, JWT middleware. User model already exists in Prisma.
- **Batch CRUD API** — `POST/GET/PUT /batches`. Frontend currently uses localStorage; needs migration to the real API.
- **PDF declaration generation** — Generate CSQA-style declaration PDFs using PDFKit when a submission is triggered.

These should not be started until the denomination data they depend on is validated.
