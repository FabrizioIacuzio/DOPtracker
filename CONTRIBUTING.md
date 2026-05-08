# DOPtracker — Collaborator Onboarding

Welcome. This doc gets you from zero to productive on the project. Read `CLAUDE.md` for the full coding conventions — this doc focuses on setup and what work is available.

---

## What this product is

A SaaS for Italian food producers to manage DOP/IGP compliance. Producers log production batches, the app validates them against the official disciplinare rules, and generates/submits the required compliance documents to the certifying body (CSQA, Check Fruit, etc.).

First market: 45 denominations across northern Italy — Aceto Balsamico di Modena IGP, Gorgonzola DOP, Fontina DOP, Chianti Classico DOCG, and 41 others.

---

## Stack

| Layer    | Tech |
|----------|------|
| Backend  | Node 20 · Express 4 · TypeScript · Prisma + PostgreSQL 16 · Jest + Supertest |
| Frontend | React 18 · Vite · TypeScript · Tailwind + shadcn/ui · React Router 6 · Vitest + RTL |
| Infra    | Postgres via `docker-compose.yml`; everything else runs on the host |

---

## Dev setup

```bash
# 1. Clone
git clone https://github.com/FabrizioIacuzio/DOPtracker.git
cd DOPtracker

# 2. Start Postgres
docker compose up -d

# 3. Backend
cd backend
cp .env.example .env          # fill in values (see below)
npm install
npm run db:migrate            # runs prisma migrate dev
npm run dev                   # starts on :3000

# 4. Frontend (new terminal)
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:3000
npm install
npm run dev                   # starts on :8080
```

**Minimum `.env` for backend:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doptracker
JWT_SECRET=<any-string-at-least-32-chars>
CORS_ORIGIN=http://localhost:8080
PORT=3000
JOB_WORKER_POLL_INTERVAL_SECONDS=30
JOB_WORKER_BATCH_SIZE=10
```

---

## Project layout

```
DOPtracker/
├── products/                   ← SINGLE SOURCE OF TRUTH for denomination data
│   ├── aceto-balsamico-di-modena/
│   │   ├── fields.json         ← batch form fields + validation rules (used by frontend)
│   │   ├── submission.json     ← compliance channel config (used by backend)
│   │   ├── metadata.json       ← display name, category, protection type
│   │   └── docs/               ← regulatory PDFs / piano di controllo (local only, git-ignored)
│   ├── gorgonzola/
│   └── ... (45 total)
├── backend/
│   ├── src/
│   │   ├── denominations/      ← loader.ts reads products/*/submission.json
│   │   ├── routes/             ← submissions.ts (only route so far)
│   │   ├── services/           ← submissionService, jobWorker, denominationService, channels/
│   │   ├── middleware/         ← error.ts, auth.ts (stub)
│   │   └── config/env.ts       ← Zod-validated env loader
│   └── prisma/schema.prisma    ← User, SubmissionSchedule, SubmissionJob, Submission
└── frontend/
    └── src/
        ├── lib/denominationFields.ts   ← thin loader, reads products/*/fields.json via Vite glob
        ├── pages/                      ← Onboarding, BatchForm, HomePage, CalendarPage, etc.
        └── contexts/AppDataContext.tsx ← app state (localStorage-backed, transitional)
```

---

## Running tests

```bash
# Frontend (183 tests)
cd frontend && npm test

# Backend (48 tests)
cd backend && npm test
```

Tests must pass before every commit. Never `--no-verify`.

---

## Current state — what's built

| Area | Status |
|------|--------|
| Onboarding flow (45 denominations) | ✅ Done |
| Denomination-specific batch forms | ✅ Done |
| Batch validation against disciplinare rules | ✅ Done |
| Calendar + dashboard + charts | ✅ Done |
| `products/` as single source of truth | ✅ Done |
| Compliance submission job queue (backend) | ✅ Done |
| Submission channel handlers (PEC, portal, SIAN, PDF) | ✅ Done |
| Prisma schema (User, SubmissionJob, Submission) | ✅ Done |

---

## Open work — pick something up

### 1. Authentication (backend + frontend)
**Scope:** `backend/src/routes/auth.ts`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`

The `User` model already exists in the Prisma schema. What's missing:
- `POST /auth/register` — hash password with bcrypt (cost ≥ 12), return JWT
- `POST /auth/login` — verify password, return JWT
- `GET /auth/me` — return current user from token
- Apply `authMiddleware` (stub already in `backend/src/middleware/auth.ts`) to protected routes
- Frontend Login and Register pages
- Store JWT in `localStorage`, attach as `Authorization: Bearer ...` header via an Axios/fetch interceptor

See `CLAUDE.md §7` for JWT and bcrypt requirements.

---

### 2. Batch CRUD API (backend + frontend migration)
**Scope:** `backend/src/routes/batches.ts`, update `frontend/src/pages/BatchForm.tsx`, `frontend/src/contexts/AppDataContext.tsx`

The frontend currently saves batches to `localStorage`. Per `CLAUDE.md §5`, every new feature must hit the API — and touching a localStorage page means migrating it as part of that task.

What's needed:
- `POST /batches` — create a batch (denomination-aware, stores `fields` as JSON)
- `GET /batches` — list batches for the authenticated producer
- `GET /batches/:id` — get single batch
- `PUT /batches/:id` — update batch fields, set `modifiedAt`
- Update `BatchForm.tsx` to call the API instead of `AppDataContext.addBatch`
- Update `HomePage.tsx` and `CalendarPage.tsx` to fetch from API instead of reading context

Prisma model to add:
```prisma
model Batch {
  id             String   @id @default(cuid())
  producerId     String
  denominationId String
  batchId        String
  date           String
  fields         Json
  notes          String   @default("")
  hasWarnings    Boolean  @default(false)
  createdAt      DateTime @default(now())
  modifiedAt     DateTime?
  producer       User     @relation(fields: [producerId], references: [id])
}
```

---

### 3. Add a missing denomination
**Scope:** `products/{new-id}/` only (+ one line in `Onboarding.tsx`)

Some denominations currently have minimal configs. To add or improve one:

1. Edit `products/{id}/fields.json` — add the batch form fields from the official disciplinare
2. Edit `products/{id}/submission.json` — add the correct submission channel (PEC/portal/SIAN)
3. Edit `products/{id}/metadata.json` — confirm display name and category are correct
4. If it's a new denomination not yet in the onboarding list, add it to `frontend/src/pages/Onboarding.tsx` in the correct category

Good starting candidates with thin configs today: `bresaola-della-valtellina`, `sopressa-vicentina`, `chianti-classico`, `amarene-brusche-di-modena`.

The regulatory docs are in `products/{id}/docs/piano-di-controllo.zip` locally (not committed due to size — ask the repo owner to share them).

---

### 4. PDF declaration generation
**Scope:** `backend/src/services/pdfService.ts` (new), `backend/src/routes/submissions.ts` (add endpoint)

When a submission is triggered, the backend should generate a CSQA-style declaration PDF using PDFKit. The PDF content is denomination-specific (different fields, different certifying body letterhead).

- `GET /submissions/:id/pdf` — generate and stream the PDF for a completed submission
- PDFs must include: producer name, denomination, batch date range, key production parameters from `fields`
- Tests assert extracted text content (not pixel diffs) — inject a clock for deterministic dates

See `CLAUDE.md §6` for PDF testing approach.

---

## How to work on this project

1. **Always branch off `master`**: `git checkout -b feat/your-feature`
2. **Plan before coding**: enter plan mode, wait for approval, then TDD (red → green → refactor). See `CLAUDE.md §2`.
3. **One feature per PR**, conventional commit title: `feat(scope): …`, `fix(scope): …`
4. **Never mock the database** in backend integration tests — use the real Postgres from docker-compose
5. **Never push directly to `master`** — open a PR

If you're using Claude Code, it reads `CLAUDE.md` automatically and knows the full conventions.
