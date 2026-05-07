---
name: prisma-migration
description: Safely change the Prisma schema. Generates a migration, updates seed, runs tests, and produces a prod checklist.
when_to_use: Any edit to backend/prisma/schema.prisma — adding a model, adding/removing a column, changing a type, adding an index, renaming.
---

# Prisma migration workflow

Schema changes are the highest-blast-radius edits in the backend. Treat them
that way.

## Trigger

You are about to edit `backend/prisma/schema.prisma`.

## Preconditions

- Plan approved. The plan names every model and column being changed and *why*.
- Postgres is up: `docker compose ps`.
- `npm test` is green.
- No uncommitted changes in `backend/prisma/`. If there are, commit or stash
  before starting — migration generation must run on a clean slate.

## Steps

### 1. Edit the schema

- Make the schema change. **One logical change per migration.** "Add user
  table" is one migration. "Add user table and rename Batch.acidity to
  Batch.acidity_pct" is two — split them.
- Field defaults: prefer DB-side defaults over app-side defaults for invariants
  that should hold regardless of caller (e.g. `createdAt @default(now())`).
- Indexes: add when you have a query that needs them. Don't speculate.
- Cascade behaviour: be explicit (`onDelete: Restrict | SetNull | Cascade`).
  Default is `Restrict` — make sure that's what you want.

### 2. Generate the migration

```bash
cd backend
npx prisma migrate dev --name <verb>_<noun>
```

Examples: `add_users_table`, `add_batch_aging_entries`, `index_batches_by_producer`.

- This creates `backend/prisma/migrations/<timestamp>_<name>/migration.sql`.
- **Read the generated SQL.** If it does something unexpected (e.g. drops a
  column you didn't intend to remove), stop. Don't proceed with a wrong
  migration.

### 3. Update seed

- File: `backend/prisma/seed.ts`.
- If the schema change requires seed data (a default producer, an admin user),
  update the seed.
- Run: `npx prisma db seed` — must succeed.

### 4. Update Zod contracts

- If a model is exposed via the API, update the relevant schema in
  `backend/src/contracts/`. Frontend may need updates — flag in the PR
  description.

### 5. Tests

- Run the full backend suite: `npm test`. Integration tests will exercise the
  new schema against the migrated DB.
- If a test now fails because the schema's stricter (e.g. a `NOT NULL` column
  added), fix the test by providing the data — don't loosen the schema.

### 6. Backfill plan (if applicable)

- For non-trivial migrations on data that already exists in *any* environment
  beyond local dev, write a backfill plan in the PR description:
  - What data is being changed?
  - Is the change reversible?
  - Order of operations (deploy code that tolerates both old + new shape →
    run migration → backfill → deploy code that requires new shape)?
- For now (pre-prod) this is documentation discipline; once we have prod, it
  becomes a runbook.

### 7. Reset sanity check (local)

- Reset and re-apply to ensure the migration is reproducible from zero:

```bash
npx prisma migrate reset --force
```

- Tests still green after reset.

### 8. Commit

- One commit for the schema + migration + seed + contract updates.
- `feat(db): add <thing>` / `refactor(db): rename …`.
- Migration directory MUST be committed (do not `.gitignore` migrations).

## Definition of done

- `migration.sql` reviewed and matches intent.
- Seed runs.
- All tests green.
- `prisma migrate reset --force` from clean produces the same schema.
- Commit includes schema, migration, seed, and any contract/route adjustments
  the schema change implies.

## Anti-patterns

- Editing a migration's SQL after it has been applied anywhere except your
  local dev DB. Migrations are append-only.
- `prisma db push` for tracked changes. `db push` skips the migration files —
  fine for throwaway prototyping, never for committed schema.
- Multiple unrelated changes in one migration. Bisecting becomes painful.
- Renaming a column without a deprecation step in code. In a deployed system,
  do `add new → backfill → switch reads → switch writes → drop old`. We're
  pre-prod, so a single rename is acceptable now — but document it.
- Adding a column with a runtime default but no DB default for an invariant
  the DB should enforce.
