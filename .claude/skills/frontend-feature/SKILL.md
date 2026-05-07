---
name: frontend-feature
description: Build or modify a React page/component using RHF+Zod, TanStack Query, and Vitest+RTL. Replaces localStorage with API calls when touching legacy pages.
when_to_use: Adding a new page or component, changing the behaviour of an existing page, or migrating a page from localStorage to the backend API.
---

# Frontend feature workflow

End-to-end recipe for a frontend change. Read CLAUDE.md §5 first.

## Trigger

You are about to add or modify code under `frontend/src/`.

## Preconditions

- Plan approved.
- Backend is running OR you have a clear plan to add the matching backend route
  in the same task (use the `backend-feature` skill).
- `frontend/.env` exists with `VITE_API_BASE_URL`. If not, copy from `.env.example`.
- `npm test` is green before you start.

## Steps

### 1. Identify the contract

- If the feature needs server data, check `backend/src/contracts/` for the
  Zod schema. If missing, run `backend-feature` first to create it. Frontend
  imports the schema; never duplicates it.

### 2. Write the failing test

- Place: colocated `<Component>.test.tsx` next to the component.
- Use Vitest + React Testing Library. Query by accessible role/label, not by
  test-id unless there is no semantic alternative.
- Mock the network at the fetch boundary (MSW preferred when added; until then,
  a thin mock of the query hook is acceptable).
- Cover: render, primary user interaction, validation error, server error toast.
- Run: `cd frontend && npx vitest run <path>` — must fail correctly.

### 3. Form schema (if applicable)

- Use the shared Zod schema from `contracts/` via path alias. Do not redefine.
- Wire RHF: `useForm({ resolver: zodResolver(schema) })`. Show field errors
  inline; do not use `alert()`.

### 4. Server state

- Reads: `useQuery({ queryKey, queryFn })`. Co-locate the hook with the page or
  put shared ones under `frontend/src/api/`.
- Writes: `useMutation`. On success, invalidate relevant queries and toast.
  On error, toast the message; let the form keep its values.
- No `useEffect(() => { fetch(...) }, [])`. If you find one, replace it as part
  of this task.

### 5. localStorage migration (legacy pages)

- If the page you're touching reads/writes through `AppDataContext` (localStorage),
  migrate it now: replace context reads with queries, context writes with
  mutations. Do not leave dual paths — pick one source of truth in this PR.
- Keep `LanguageContext` (i18n) untouched; it's purely client state.

### 6. Component

- Build the component. Keep it focused — extract subcomponents when a section
  exceeds ~80 lines or has its own state.
- Use existing shadcn/ui components from `frontend/src/components/ui/`. Do not
  hand-roll buttons, dialogs, etc.
- Tailwind classes: prefer the existing design tokens already in use; do not
  introduce arbitrary colors/spacing.

### 7. Routing

- Add a lazy route in [frontend/src/App.tsx](frontend/src/App.tsx) if it's a page.
- Add nav entry in [frontend/src/components/AppSidebar.tsx](frontend/src/components/AppSidebar.tsx) if user-facing.

### 8. Make the test pass; run the full suite

- `npx vitest run` — all green.
- `npm run build` — type errors are blocking.

### 9. Manual check in the browser

- `npm run dev`, exercise the golden path AND one error path. Type-checking
  is not feature-checking.

### 10. Commit

- `feat(frontend): <summary>` (or `fix(frontend): …`).

## Definition of done

- Test fails when the component's primary handler is broken.
- No `localStorage.*` calls in the migrated path.
- No `useEffect` doing data fetching.
- No `any`, no `// @ts-expect-error` without a comment explaining why.
- Build is green; manual exercise of golden + error path works.

## Anti-patterns

- Re-declaring the Zod schema instead of importing from `contracts/`.
- Catching errors only to toast a generic "Something went wrong" — surface the
  server's error code/message when present.
- Adding a new global Context for one feature's data. Use Query for server
  data; use local component state for ephemeral UI state.
- Pixel-perfect snapshots. Test behaviour.
- `data-testid` everywhere when role/label would work.
