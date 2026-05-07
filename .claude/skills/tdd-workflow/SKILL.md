---
name: tdd-workflow
description: Enforce strict red → green → refactor for any code change. Invoke at the start of every coding task before writing implementation code.
when_to_use: Any task that adds or changes behaviour. Skip only for typo fixes, comment edits, or formatting.
---

# TDD workflow

The discipline that keeps compliance bugs out of this codebase.

## Trigger

You are about to write or modify code that has observable behaviour (a route, a
service function, a component's logic, a validator rule, a PDF section). Before
touching the implementation file, run this skill.

## Preconditions

- Plan mode has been entered AND the user has approved the plan via
  `ExitPlanMode`. If not, stop and plan first — see CLAUDE.md §2.
- You know the *one* behaviour you are about to add or change. If you have more
  than one, split them and do one at a time.

## Steps

### 1. Red — write the failing test first

- Locate the right test file. Backend: `backend/tests/<area>.test.ts` (Supertest
  for routes; unit for services/engine). Frontend: colocated `*.test.tsx` next
  to the component, or `frontend/src/**/__tests__/`.
- Write **one** test for the behaviour. Be specific. Assert on outputs, not
  internal calls.
- Run only that test:
  - Backend: `cd backend && npx jest -t "<test name>"`
  - Frontend: `cd frontend && npx vitest run -t "<test name>"`
- The test MUST fail. Read the failure message. Confirm it fails for the
  *reason you expect* — e.g. "expected 200, got 404" because the route doesn't
  exist yet, NOT "Cannot find module" because of a typo. If it fails for the
  wrong reason, fix the test setup before proceeding.

### 2. Green — minimum code to pass

- Write the smallest code that makes the test pass. Resist adding adjacent
  features, defensive checks for impossible inputs, or "while I'm here"
  refactors.
- Run the targeted test again — must pass.
- Run the full package suite (`npm test`) — must pass. If a previously green
  test goes red, you broke it; fix it before continuing.

### 3. Refactor — with the safety net

- Now is when you clean up: extract a helper, rename, deduplicate.
- After each refactor, run the full suite. Green stays green.
- Stop refactoring when the code is clear, not when it is "perfect."

### 4. Commit

- One logical change per commit. Conventional commits.
- Message says *why*. The diff says *what*.

## Definition of done

- New behaviour has at least one test that fails when the implementation is
  removed (verify by temporarily deleting the relevant lines and re-running).
- All tests in the touched package pass.
- No `// TODO`, no commented-out code, no skipped tests.
- Types are precise (no `any`, no `as` casts hiding mismatches).

## Anti-patterns (do not do these)

- Writing the implementation first and the test after ("retro-TDD"). The test
  no longer protects against regressions of the design choices.
- Tests that mock the unit under test. The test must exercise real code.
- Tests asserting on private internals (function call counts, internal state).
  Assert on observable outputs.
- Disabling a failing test to "come back to it." Fix it or delete it with the
  reason in the commit message.
- Snapshot tests as the *only* test for a behaviour. Snapshots catch
  unintentional change; they don't specify intent.
