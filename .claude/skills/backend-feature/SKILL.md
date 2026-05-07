---
name: backend-feature
description: Build or modify an Express route end-to-end with TDD, Zod validation, Prisma persistence, and a Supertest integration test. Invoke when adding/changing any backend HTTP endpoint or service.
when_to_use: Adding a new route, changing the behaviour of an existing route, or adding a new service function called by a route.
---

# Backend feature workflow

End-to-end recipe for shipping a backend change in this repo. Pairs with
`tdd-workflow`. Read CLAUDE.md §4 (backend conventions) first.

## Trigger

You are about to add or modify code under `backend/src/`.

## Preconditions

- Plan approved.
- Postgres is up: `docker compose ps` shows `postgres` healthy. If not,
  `docker compose up -d` from repo root.
- `backend/.env` exists. If not, copy `.env.example` and set `DATABASE_URL`,
  `JWT_SECRET` (≥32 chars), `PORT`, `CORS_ORIGIN`.
- `npm test` is green on `master`/`main` before you start. If it isn't, fix
  that first — don't build on a red base.

## Steps

### 1. Define the contract

- Create or update the Zod schema in `backend/src/contracts/<area>.ts`.
  Request body, response body, path params. Export inferred TS types.
- The contracts/ directory is shared with the frontend (see
  `api-contract-sync` skill). Treat changes here as API-breaking until proven
  otherwise.

### 2. Write the failing integration test

- File: `backend/tests/<area>.integration.test.ts`.
- Use Supertest against the actual app from `src/index.ts`. No mocks for the
  database, JWT, or Prisma. Reset data with a `beforeEach` that truncates the
  relevant tables (or uses a transaction rollback pattern).
- Cover at minimum: happy path, validation failure (400), auth failure (401)
  if the route is protected, not-found (404) where applicable.
- Run it: `cd backend && npx jest tests/<area>.integration.test.ts`.
  Confirm it fails for the *correct reason* (route 404 because not implemented,
  not "Cannot find module './something'").

### 3. Schema (only if needed)

- If new persistence is required, run the `prisma-migration` skill.
- Don't add Prisma fields you won't use *in this PR*.

### 4. Service

- File: `backend/src/services/<area>.ts`.
- Pure-ish functions: take inputs (incl. a `prisma` client and any other
  dependencies as arguments), return values or throw typed `DomainError`s.
- No `req` / `res` here. No HTTP status codes. No JWT logic. Those belong in
  routes / middleware.
- Write a unit test for non-trivial service logic
  (`backend/tests/services/<area>.test.ts`). Validator/engine logic in
  particular needs unit tests at boundary values.

### 5. Route

- File: `backend/src/routes/<area>.ts`.
- Steps in the handler:
  1. Parse via Zod schema (`schema.parse(req.body)`); rely on error middleware
     to map ZodError → 400.
  2. Auth: pull `req.user` set by auth middleware.
  3. Call service.
  4. Map result to response shape; send.
- Mount the router in `src/index.ts`.

### 6. Make the integration test pass

- Run the integration test. If red, read the message; fix the *root cause*,
  not the symptom. If the body shape is wrong, fix it; don't change the test.
- Once green, run the entire backend suite: `npm test`.

### 7. Refactor

- With everything green, clean up duplication, extract helpers, rename.
- Re-run the suite after each refactor.

### 8. Manual sanity check

- `npm run dev`, hit the endpoint with `curl` or the frontend, confirm it
  behaves as expected end-to-end.

### 9. Commit

- `feat(backend): <one-line summary>` (or `fix(backend): …`).

## Definition of done

- Integration test fails when the route handler body is removed.
- Zod schema exported from `contracts/`; route and tests both use it.
- Service tested independently of the route.
- No new `any`, no silent catches, no console.log left behind.
- `npm test` green; `npm run build` (`tsc`) green.

## Anti-patterns

- Mocking Prisma. We test against real Postgres — see CLAUDE.md §6.
- Putting business logic in the route handler.
- Catching and rethrowing errors with a generic message — you lose the cause.
- Returning Prisma error shapes to the client.
- Adding "just-in-case" fields to the response. Add them when a caller needs them.
