---
name: code-review
description: Pre-PR audit of the current branch diff against best-practice principles, OWASP top-10, and this project's conventions.
when_to_use: Before opening a PR, or before merging a feature branch into main. Run after all tests are green.
---

# Code review workflow

A self-review pass that catches the issues most likely to reach production.
Not a substitute for human review — a way to get the diff into a state where
human review is productive.

## Trigger

Branch is feature-complete; tests are green; diff is staged or committed.

## Preconditions

- All tests green: `npm test` in any touched package.
- Build green: `npm run build`.
- Diff is reviewed: `git diff main...HEAD --stat` shows the expected files.

## Review checklist

Walk through every item. For each finding, decide: fix now / fix in a follow-up
issue / accept with a justification. **Never** "accept" silently — every accept
needs a written reason.

### A. Architecture & SOLID

- [ ] Each new module has one clear responsibility.
- [ ] Routes are thin; logic lives in services.
- [ ] Dependencies (db, clock, logger) are injected, not imported globally,
      where it matters for testability.
- [ ] No layering violations (services don't import Express types; engine
      doesn't import Prisma directly unless that's its job).
- [ ] No premature abstractions (interfaces with one impl; "framework"
      modules built for hypothetical future needs).

### B. Types

- [ ] No `any`. No `as` casts hiding shape mismatches.
- [ ] No `// @ts-expect-error` without a comment explaining why.
- [ ] Function signatures explicit at module boundaries (exports).
- [ ] Inferred types from Zod schemas, not hand-typed duplicates.

### C. Validation & error handling

- [ ] Every HTTP request body parsed by a Zod schema from `contracts/`.
- [ ] Every env var accessed via the validated `config/env.ts`.
- [ ] Errors are typed (`DomainError` subclasses) and mapped centrally.
- [ ] No `catch {}` (silent). No `catch (e) { console.log(e) }` only — handle
      or rethrow.
- [ ] No leaking Prisma error shapes or stack traces to clients.

### D. Tests

- [ ] New behaviour has at least one test.
- [ ] Backend integration tests hit real Postgres (no mocks of Prisma).
- [ ] Tests assert on observable outputs, not internal calls.
- [ ] Boundary values tested for any threshold rule (denomination validators).
- [ ] Removed/changed code has tests removed/updated, not commented out.
- [ ] No `.skip` / `.only` / `xit` left behind.

### E. Security (OWASP-ish, scoped to what we have)

- [ ] **A01 Broken access control**: every protected route checks ownership
      (does this user own this batch?), not just authentication.
- [ ] **A02 Crypto**: bcrypt cost ≥12; JWT secret from env; no hard-coded
      secrets anywhere in the diff.
- [ ] **A03 Injection**: all DB access via Prisma; any `$queryRaw` reviewed
      with parameterised inputs.
- [ ] **A04 Insecure design**: rate limiting on auth endpoints; password reset
      tokens (when added) single-use and time-limited.
- [ ] **A05 Misconfiguration**: CORS allowlist, not `*`. No `app.use(cors())`
      bare.
- [ ] **A07 Auth failures**: login responses don't distinguish "user not
      found" vs "wrong password"; failed logins logged + counted.
- [ ] **A09 Logging**: no logging of tokens, passwords, full request bodies,
      or PII.

### F. Frontend specifics

- [ ] No `useEffect` doing data fetching.
- [ ] No `localStorage` writes for data the backend owns.
- [ ] No `alert()`. Toasts via `use-toast`.
- [ ] No new global Context for a single feature's data.
- [ ] No re-declared Zod schemas (use `@contracts/*`).

### G. Hygiene

- [ ] No `console.log` left behind. Use the project logger when one exists;
      otherwise none.
- [ ] No commented-out code. Git remembers.
- [ ] No `// TODO` without an issue ID.
- [ ] No new dependencies without justification in the commit message.
- [ ] No files added that should be gitignored (`.env`, `dist/`, `coverage/`).

### H. Migrations & data

- [ ] If `schema.prisma` changed, a migration is committed.
- [ ] Migration SQL reviewed, matches intent.
- [ ] Seed updated if necessary.

### I. Compliance / domain (this project's specials)

- [ ] Any threshold change in a denomination JSON cites a `source` with a
      retrieval date.
- [ ] PDF templates use injected clock, not `new Date()`.
- [ ] Italian diacritics render in PDFs (manual check).
- [ ] Validator rules have boundary tests.

## Output

After walking the checklist, produce a short report:

- Findings (issue + file:line + suggested fix).
- Accepts (with reason).
- Open questions for the reviewer.

If any **must-fix** items remain (security, broken tests, missing migrations),
fix them before opening the PR.

## Anti-patterns

- Skimming the checklist. Read every item against this diff specifically.
- Rationalising a finding away because the diff is "nearly done." Compliance
  shipping is the wrong place for haste.
