# Known issues uncovered while writing the test suite

This file records bugs, smells, and design quirks that were *pinned* by tests
but **not fixed** in the test PR. Each one has a follow-up planning task to
fix it the right way (plan first, TDD, root-cause).

The tests intentionally pin the *current* behavior so any future fix moves
the test from green to red — at which point the test gets updated alongside
the fix.

---

## 1. Validation banner doesn't block save

**Where**: [frontend/src/pages/BatchForm.tsx](frontend/src/pages/BatchForm.tsx)

**Behavior pinned**: When `validateBatch` returns warnings (e.g. acidity 5%
violates the 6% minimum), the form shows a red banner with the violation
strings — but the "Salva lotto" button is still enabled. The user can save
a non-conformant batch and the only signal is `hasWarnings: true` on the
record.

**Why this matters**: For a compliance product, allowing a user to "save"
a batch that fails the disciplinare without explicit acknowledgement is a
real product issue. CSQA submissions could include batches the producer
didn't realise were flagged.

**Test pinning it**: `BatchForm.test.tsx` →
"validation banner > does not block save (pinned current behaviour)".

**Suggested fix (future PR)**: confirm with the user whether the intended
flow is (a) hard-block, (b) confirmation modal "save with X warnings?",
or (c) keep as-is but make `hasWarnings` more visible after save. Once
decided, update the test.

---

## 2. Validator's `> 0` guard treats zero as "field absent"

**Where**: [frontend/src/contexts/AppDataContext.tsx:60-78](frontend/src/contexts/AppDataContext.tsx)

**Behavior pinned**: `validateBatch({ acidity: 0 })` returns `[]` — no
warnings — because the rule is gated by `value > 0`. Same for every other
numeric field.

**Why this matters**: Zero is a valid input that violates every "min" rule,
not an "absent" sentinel. A producer who genuinely measured 0 g/l of dry
extract should see the warning, not pass silently. The intent appears to
be "allow partial saves where some fields haven't been entered yet" —
solved correctly by checking `value !== undefined && value !== null` only.

**Test pinning it**: `AppDataContext.validator.test.ts` →
"returns no warnings when every numeric field is exactly zero".

**Suggested fix (future PR)**: replace the `> 0` guard with proper
nullishness checks. When a field is genuinely empty in the form, it should
be `undefined` (the form already does `parseFloat(form.x) || undefined`).
Once `> 0` is removed, the existing boundary tests still hold; only the
zero-case tests need updating.

---

## 3. Lab report extraction is a hardcoded mock

**Where**: [frontend/src/pages/LabReportsPage.tsx:11-17](frontend/src/pages/LabReportsPage.tsx)

**Behavior pinned**: Every uploaded PDF, regardless of content, results in
a LabReport with the exact same `MOCK_EXTRACTED` values, hardcoded
`labName: "Laboratorio Analisi Modena"`, and `status: "processed"`.

**Why this matters**: This is intentional Lovable scaffold. It's listed
here so we don't forget that "real PDF extraction" is on the roadmap.

**Suggested fix (future PR)**: integrate a real PDF extractor (likely
Claude API on the backend). Update tests to mock the network call instead.

---

## 4. Documents page is hardcoded mock data

**Where**: [frontend/src/pages/DocumentsPage.tsx](frontend/src/pages/DocumentsPage.tsx)

**Behavior pinned**: The "Operatore" name (Acetaia Esempio S.r.l.), ICQRF
code (IT-041-BIO-123), and the static "Non conformità: 0" line in the PDF
preview are all hardcoded.

**Why this matters**: These should pull from `companyInfo` and the actual
batch warning counts. Listed as scaffold-cleanup task.

**Suggested fix (future PR)**: replace hardcoded strings with values from
context. Once the backend exists, the entire page should fetch real
declarations rather than mocking 3 rows.

---

## 5. localStorage write effects fire on initial mount

**Where**: [frontend/src/contexts/AppDataContext.tsx:119-122](frontend/src/contexts/AppDataContext.tsx)

**Behavior**: Each `useEffect(() => localStorage.setItem(...), [state])`
fires once on mount, writing the freshly-loaded value back to localStorage.
No data loss, but a wasted write per state slice on every page load.

**Why this matters**: Minor. Listed for completeness because tests would
otherwise hide the redundancy. Will become irrelevant once the
localStorage→API migration lands.

---

## 6. Toast hook keeps unbounded module-level state

**Where**: [frontend/src/hooks/use-toast.ts](frontend/src/hooks/use-toast.ts)

**Behavior pinned**: `memoryState`, `listeners`, and the `count` ID
generator live at module scope. A test cannot reset them. The 1,000,000 ms
remove-delay means dismissed toasts linger in memory for ~16 minutes.

**Why this matters**: Carry-over from shadcn's stock toast hook. The
listener leak in particular (`listeners.push(setState)` re-pushes on every
state change) is a known shadcn quirk. Not user-facing in practice, but
worth a clean-up pass when we touch this area.

**Suggested fix (future PR)**: replace with `sonner` everywhere
(`BatchForm.tsx` already uses sonner directly). Once `use-toast.ts` has no
callers, delete it.

---

## 7. AppSidebar and NavLink are dead code

**Where**: [frontend/src/components/AppSidebar.tsx](frontend/src/components/AppSidebar.tsx),
[frontend/src/components/NavLink.tsx](frontend/src/components/NavLink.tsx)

**Behavior pinned**: Both components are exported but not mounted anywhere
in `App.tsx`. They have full tests so a re-introduction stays faithful to
the documented behavior.

**Why this matters**: Dead code accumulates. Per CLAUDE.md ("no dead code"),
either delete them or wire them up.

**Suggested fix (future PR)**: decide intent. If the dropdown in
`AppLayout.tsx` is the long-term nav, delete both. If a sidebar is on the
roadmap, swap AppLayout's dropdown for AppSidebar.

---

## 8. Date-dependent components rely on the wall clock

**Where**: `BatchForm`, `HomePage`, `CalendarPage`, `DashboardPage`,
`DocumentsPage`, `LabReportsPage` — anywhere `new Date()` or `format(now, …)`
is called inline.

**Behavior pinned**: KPIs, calendar "today" highlight, document period
buckets, and lab-report "uploaded today" timestamp all depend on the exact
moment `new Date()` is invoked.

**Why this matters**: There is no central clock to inject in tests. We
work around it with `vi.setSystemTime`, but production code has no
boundary to swap a clock for testing other than the global one.

**Suggested fix (future PR)**: introduce a `useClock()` hook (or pass a
clock prop where the component is testable) so production code can be
migrated to a deterministic clock when needed (e.g. server-side rendering
or "view declaration as of date X" features).
