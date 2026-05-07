# DOPtracker

SaaS for Italian food producers to automate **DOP / IGP** compliance documentation. First denomination: **Aceto Balsamico di Modena IGP**.

Producers log batches → the app validates them against the disciplinare → it generates CSQA / CCPB declaration PDFs that the producer submits.

## Repo layout

| Path                                | What                                                |
|-------------------------------------|-----------------------------------------------------|
| [backend/](backend/)                | Express + TypeScript + Prisma + Postgres API        |
| [frontend/](frontend/)              | React + Vite + Tailwind + shadcn SPA                |
| [docs/](docs/)                      | MVP plan and supporting docs                        |
| [docker-compose.yml](docker-compose.yml) | Postgres for local dev                         |
| [italy-dop-igp-saas-opportunity.md](italy-dop-igp-saas-opportunity.md) | Market & regulatory dossier |
| [CLAUDE.md](CLAUDE.md)              | Mandatory workflow and conventions for this repo    |
| [.claude/skills/](.claude/skills/)  | Workflow skills used by Claude Code                 |

## Quickstart

Prerequisites: Node 20+, npm, Docker (for Postgres).

```bash
# 1. Postgres
docker compose up -d
docker compose ps                       # confirm postgres is healthy

# 2. Backend
cd backend
cp .env.example .env                    # then fill in JWT_SECRET (≥32 chars)
npm install
npm run db:migrate                      # prisma migrate dev
npm run dev                             # http://localhost:3000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                             # http://localhost:5173
```

## Tests

```bash
cd backend  && npm test                 # jest + supertest, real Postgres
cd frontend && npm test                 # vitest + RTL
```

## Working in this repo

Read [CLAUDE.md](CLAUDE.md) before making any change. Summary:

1. **Plan first.** Enter plan mode, wait for explicit approval.
2. **TDD always.** Failing test → minimal impl → refactor.
3. **Root-cause fixes only.** No quick patches, no silenced errors.
4. **Validate at boundaries** with Zod. No `any`. No mocked DB in backend integration tests.

The skills in [.claude/skills/](.claude/skills/) are the operating procedures for the recurring task types in this repo: backend feature, frontend feature, denomination config, Prisma migration, PDF declaration, API contract sync, code review, and the TDD workflow itself. Use `/<skill-name>` from Claude Code to invoke one.
