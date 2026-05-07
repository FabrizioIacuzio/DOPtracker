---
name: api-contract-sync
description: Keep request/response Zod schemas shared between backend and frontend. Single source of truth at backend/src/contracts/, imported by frontend via path alias.
when_to_use: Adding a new endpoint, changing a request/response shape, or noticing FE/BE drift.
---

# API contract sync workflow

Drift between the backend's API and the frontend's expectations is a
predictable bug source. We avoid it by sharing the schemas, not redeclaring them.

## Trigger

You are about to define or change the shape of any HTTP request body, response
body, or query/path parameter.

## Preconditions

- Plan approved.
- TypeScript strict mode is on in both packages (it should be — verify
  `backend/tsconfig.json` and `frontend/tsconfig.json` have `"strict": true`).

## Source of truth

- Schemas live at `backend/src/contracts/<area>.ts` (e.g. `auth.ts`,
  `batches.ts`, `denominations.ts`, `declarations.ts`).
- Each file exports:
  - The Zod schemas (`<Name>Schema`).
  - The inferred TS types (`export type Foo = z.infer<typeof FooSchema>`).
  - Path constants if the path has parameters (`export const ROUTES.batches.byId = '/batches/:id'`).

## Frontend access

- Path alias in `frontend/tsconfig.json` and `frontend/vite.config.ts`:

  ```
  "@contracts/*": ["../backend/src/contracts/*"]
  ```

- Frontend imports: `import { LoginSchema, type LoginRequest } from '@contracts/auth'`.
- Vite is configured to bundle TS from outside `frontend/src/` for these
  imports. If a build error arises about scope, fix the Vite config — do not
  copy schemas into `frontend/`.

## Steps

### 1. Add or modify the schema

- Define request and response schemas in the appropriate file under
  `backend/src/contracts/`.
- Export inferred types alongside.

### 2. Backend: use the schema

- The route uses `Schema.parse(req.body)`.
- The service signature uses the inferred TS type.
- The integration test imports the same schema to construct fixtures
  (`Schema.parse(fixture)` in the arrange step proves the fixture itself is valid).

### 3. Frontend: use the schema

- RHF: `useForm({ resolver: zodResolver(Schema) })` — the form is validated by
  the same rules the server applies.
- Query/mutation function signatures use the inferred TS types.
- If the response shape changes, the frontend's compile error is the contract
  alarm. Fix the consumers, don't widen the type.

### 4. Drift guard (CI)

- A simple guard test ensures no schema is duplicated in the frontend:
  `frontend/src/test/no-schema-duplicates.test.ts` greps the frontend tree
  for ad-hoc Zod schemas matching API paths and fails if any are found.
  (Add this check once we have CI; for now, manual discipline + code review.)

### 5. Versioning (when we hit prod)

- Pre-prod: change schemas freely.
- Once we have real users, breaking changes go through a deprecation step:
  ship `/v2/<route>` alongside `/v1/`, switch the frontend, then remove `/v1/`
  in a later release.

## Definition of done

- One schema per (request, response, params) shape, in `backend/src/contracts/`.
- Both backend and frontend import that schema.
- No `// @ts-expect-error` masking type mismatches.
- Inferred types used everywhere instead of hand-typed interfaces.

## Anti-patterns

- Defining a "frontend-only" duplicate of the API shape because it's "easier."
  When the backend changes, the duplicate goes stale silently.
- Splitting one logical request into request and response schemas that don't
  share their nested types. Compose with `.pick()`, `.extend()`, `.merge()`.
- Loose schemas like `z.record(z.unknown())` for structured data. We need
  precision — that's the entire point of this layer.
- Using `as` casts to satisfy TS instead of fixing the schema.
