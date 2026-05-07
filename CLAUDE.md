# CLAUDE.md — DOPComply / DOPtracker

This file is loaded automatically by Claude Code on every session in this repo.
It is the source of truth for how we work here. Read it at the start of any session
and follow it. If anything below conflicts with a transient instruction, ask before
deviating.

---

## 1. Project at a glance

**Product**: SaaS for Italian food producers to automate **DOP / IGP** compliance
documentation. First denomination: **Aceto Balsamico di Modena IGP (ABM)**.
Producers log batches → app validates against the disciplinare → app generates
CSQA / CCPB declaration PDFs → producer submits them. Producer-final-upload model
(TurboTax-style) — we have no legal exposure.

**Stack**

| Layer    | Tech                                                                                |
|----------|--------------------------------------------------------------------------------------|
| Backend  | Node 20+ · Express 4 · TypeScript · Prisma + PostgreSQL 16 · JWT/bcrypt · PDFKit · Jest+Supertest |
| Frontend | React 18 · Vite · TypeScript · Tailwind + shadcn/ui · React Router 6 · TanStack Query · React Hook Form + Zod · Vitest + RTL |
| Infra    | Postgres in `docker-compose.yml`; everything else runs on the host                  |

**Repo layout**

```
DOPtracker/
├── backend/        # Express API (scaffolded — no src/ yet)
├── frontend/       # React SPA (production-ready UI, localStorage-backed)
├── docs/           # MVP plan and supporting docs
├── docker-compose.yml
├── italy-dop-igp-saas-opportunity.md   # business / market dossier
└── .claude/
    ├── skills/     # workflow skills — see §10 below
    ├── settings.json
    └── hooks/
```

---

## 2. Mandatory workflow

Every non-trivial task in this repo MUST follow this loop. **No exceptions for
"quick fixes."** A "quick fix" that bypasses the loop is the most common source
of regressions in this codebase's domain — compliance bugs are not bugs we get
to ship and patch later.

1. **Plan first.** Enter plan mode (`EnterPlanMode`). Explore the relevant code,
   identify reuse, design the smallest correct change.
2. **Wait for explicit user approval** of the plan via `ExitPlanMode`. Do not
   proceed until the user has approved.
3. **TDD.** For every behavioural change:
   - Write the failing test first.
   - Run it. Confirm it fails for the *right reason* (not a typo, not a setup error).
   - Write the minimum code to make it pass.
   - Run all tests; confirm green.
   - Refactor with the test as a safety net.
4. **Root-cause fixes only.** When something breaks, find *why* before deciding
   *how*. Do not silence errors, widen `catch` blocks, comment out failing tests,
   or add feature flags to skip code paths. If the root cause is out of scope,
   stop and surface it — don't paper over it.

What counts as "trivial" (no plan mode required): typo fixes, single-line obvious
bug fixes, comment edits, formatting. Everything else: plan first.

---

## 3. Coding principles

- **SOLID, with judgment.** Single-purpose modules, dependency injection at the
  boundaries (clock, logger, db), no premature abstraction. Three similar lines
  is fine — abstract on the fourth, with a real reason.
- **Validate at every boundary** with Zod: HTTP request bodies, env vars,
  denomination JSON files, anything coming from disk or network. Internal calls
  trust their types.
- **No `any`.** If you genuinely need it, use `unknown` and narrow.
- **No silent catches.** A `catch` either handles the error (log + recover with
  a known fallback) or rethrows. Never `catch {}`.
- **No dead code.** Unused exports, commented-out blocks, "we might need this
  later" — delete it. Git remembers.
- **Comments only for non-obvious *why*.** Don't restate the code. Don't
  reference the current task or PR (it rots).
- **Errors are values at API boundaries.** Return typed error responses
  (`{error: {code, message}}`). Don't leak stack traces or Prisma error shapes
  to clients.
- **Strict TS.** `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.

---

## 4. Backend conventions

**Layout** (when `src/` is created — see `docs/superpowers/plans/2026-05-04-dop-igp-saas-mvp.md`):

```
backend/src/
├── index.ts                  # express bootstrap, top-level error handler
├── config/env.ts             # Zod-validated env loader
├── contracts/                # shared Zod schemas (also imported by frontend)
├── denominations/            # *.json specs + loader
├── engine/validator.ts       # generic rule engine driven by denomination JSON
├── middleware/               # auth, error, ratelimit
├── routes/                   # thin: parse → call service → respond
├── services/                 # business logic; no Express types here
└── prisma/                   # schema, migrations, seed
```

**Rules**

- Routes are thin. Parse + auth + call service + map result. Logic lives in services.
- Services never touch `req`/`res`. They take and return plain values.
- A service test is a unit test (no HTTP). A route test is a Supertest integration
  test against a real Postgres (docker-compose). **Never mock the database.**
- Prisma migrations are named `<verb>_<noun>` (e.g. `add_batch_aging_entries`).
  Never edit a migration that's been applied to anything other than your local DB.
- One concern per route file. `routes/batches.ts` only routes for `/batches`.
- Errors thrown from services should be typed (`class DomainError extends Error { code: string }`)
  and mapped centrally in the error middleware.

---

## 5. Frontend conventions

- **Server state**: TanStack Query. **Client state**: React state / Context.
  No `useEffect(() => fetch(...), [])` patterns — they will be flagged in review.
- **Forms**: React Hook Form + Zod resolver. Schema is the source of truth;
  re-export it from `contracts/` so the backend uses the same schema.
- **Routing**: React Router 6. New page → add a lazy route in
  [frontend/src/App.tsx](frontend/src/App.tsx).
- **Errors**: surface via the existing toast hook (`use-toast`). Don't `alert()`.
  Don't swallow.
- **localStorage** is a transitional artefact from the Lovable scaffold. New
  features hit the API. When you touch a page that still uses it, replace its
  storage with API calls *as part of that task* (don't leave dual paths).
- **Tests**: Vitest + React Testing Library. Test behaviour from the user's
  perspective (queries by role/label), not implementation details.

---

## 6. Testing — non-negotiables

- A backend route is not "done" until it has a Supertest integration test that
  fails when the route is broken (delete the handler body — test must go red).
- Integration tests use a real Postgres from `docker-compose`. We do not mock
  the database. Reason: the whole product is data-correctness; a mocked test
  proves nothing about the actual SQL Prisma generates.
- Validator (rule engine) has unit tests covering each rule for a denomination,
  including the boundary values (e.g. acidity exactly 6.0%).
- PDF tests assert extracted text content + structure, not pixel diffs.
  Inject a clock so dates are deterministic.
- `npm test` (both packages) must pass before any commit. Never `--no-verify`.

---

## 7. Security baseline

- JWT: HS256 with a per-env secret (≥32 bytes), `exp` set, refresh tokens stored
  hashed if/when added.
- Passwords: `bcrypt` cost ≥ 12.
- Never log tokens, passwords, or full request bodies on auth routes.
- All queries through Prisma (no raw SQL without an explicit reason + review).
- CORS: explicit allowlist from env, no `*` in production.
- Rate-limit `/auth/login` and `/auth/register` (express-rate-limit).
- Env vars loaded through Zod-validated `config/env.ts`. Missing required vars
  → fail-fast at startup, not at first request.
- `.env` files never committed. `.env.example` documents what's needed.

---

## 8. Git conventions

- **Never** `--no-verify`. **Never** amend commits already pushed. **Never**
  force-push `main`.
- One feature per branch. Conventional commits:
  `feat(scope): …`, `fix(scope): …`, `chore: …`, `test: …`, `refactor: …`, `docs: …`.
- Commit messages explain the *why*, not the *what* (the diff shows the what).
- Pre-commit: `npm test && npm run build` in any package you touched.
- PRs: title in conventional-commit form; body has Summary, Why, Test plan.

---

## 9. Common commands

```bash
# Postgres
docker compose up -d
docker compose ps
docker compose logs -f postgres

# Backend
cd backend
npm install
npm run db:migrate          # prisma migrate dev
npm run db:generate         # prisma generate
npm run dev                 # nodemon
npm test                    # jest --runInBand --forceExit
npm run build               # tsc

# Frontend
cd frontend
npm install
npm run dev                 # vite
npm test                    # vitest
npm run build               # vite build
```

---

## 10. Skills index

Skills live in [.claude/skills/](.claude/skills/). Invoke them via the Skill tool
or by typing `/<skill-name>`.

| Skill | When to use |
|---|---|
| `tdd-workflow` | Starting any code change. Enforces red→green→refactor. |
| `backend-feature` | Adding/changing an Express route end-to-end. |
| `frontend-feature` | Adding/changing a React page or component (with API). |
| `denomination-config` | Adding a new DOP/IGP or editing existing rule thresholds. |
| `prisma-migration` | Any change to `schema.prisma`. |
| `pdf-declaration` | Building or modifying a CSQA-style declaration PDF. |
| `api-contract-sync` | Sharing schemas/types between backend and frontend. |
| `code-review` | Auditing a diff before opening a PR. |
| `dop-igp-domain` | Reference: ABM IGP rules, CSQA process, ICQRF terms. |

---

## 11. What we do not do

- We do not introduce features beyond what a task requires.
- We do not add backwards-compatibility shims for code that hasn't shipped.
- We do not skip TDD because something seems "obvious."
- We do not silence test failures or type errors.
- We do not push directly to `main`. Always via a feature branch.
- We do not edit migrations that have run anywhere but local dev.
