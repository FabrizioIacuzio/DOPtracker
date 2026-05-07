---
name: pdf-declaration
description: Build or modify a CSQA-style declaration PDF using PDFKit. Uses deterministic dates and asserts on extracted text, not pixels.
when_to_use: Adding a new declaration template; changing the layout/content of an existing declaration; adding a new section or summary table.
---

# PDF declaration workflow

Declarations are the product's deliverable. They must be deterministic,
testable, and easy for an auditor to read.

## Trigger

You are creating or modifying a PDF generator under `backend/src/services/pdf/`.

## Preconditions

- Plan approved.
- You have a sample of the target declaration (CSQA / CCPB) — either an
  official template or a previous filing the user has shared. Layout matches
  what the control body expects.
- The data shape feeding the PDF is settled (don't iterate on the underlying
  model and the PDF in the same commit).

## File layout

```
backend/src/services/pdf/
├── index.ts                       # entry: pickTemplate(declarationType) → render
├── _engine.ts                     # PDFKit helpers (cell, table, header, footer)
├── _clock.ts                      # injectable Clock interface
└── templates/
    └── csqa-abm-igp.ts            # one file per (control body, denomination)
```

## Steps

### 1. Make the clock injectable

- All "today" / "now" goes through a `Clock` interface (`now(): Date`).
- Tests pass a `FixedClock(new Date('2026-01-15T00:00:00Z'))`.
- Production passes `SystemClock`.
- Never call `new Date()` inside a template.

### 2. Write the failing test first

- File: `backend/tests/services/pdf/<template>.test.ts`.
- Render the PDF to a Buffer.
- Extract text using `pdf-parse` (preferred) or PDFKit's text-only mode for
  asserting structure. Assert on:
  - The producer name appears in the header.
  - The reference period appears in the expected format.
  - Each parameter row contains the expected value AND unit.
  - Totals match summed inputs.
  - The signature/date block uses the injected clock.
- Run: must fail.

### 3. Build the template

- One file per template. No cross-template helpers leaking template-specific
  layout. Shared utilities live in `_engine.ts`.
- Style: A4, margins consistent with the source document, single font family
  (a Latin font with Italian diacritics — verify `à`, `è`, `ò` render).
- Tables: build once, reuse via `_engine.ts`. Each row's cells should be
  parameterised — no hard-coded coordinates per row.
- Page breaks: explicit. If a table can overflow, the engine handles
  continuation; never trim silently.

### 4. Make the test pass

- Iterate until extracted text matches assertions. If text extraction is
  flaky, the layout is fragile — fix the layout rather than the test.

### 5. End-to-end check

- Wire the template to the route that generates declarations.
- Generate one PDF for a known batch from the seed.
- Open it in a viewer. Visual sanity check: nothing overlaps, no clipped
  text, accents render correctly, footer page-number on every page.

### 6. Determinism check

- Generate the same PDF twice with the same `FixedClock`. Buffers may differ
  by metadata; *extracted text* must be identical. Add a test for this.

### 7. Commit

- `feat(pdf): add <body>-<denomination> declaration template`.

## Definition of done

- Template renders for a known-good batch and matches the source document
  layout closely enough for the control body to accept it.
- Tests assert text content for header, parameter rows, totals, signature
  block.
- No `new Date()` outside `_clock.ts`.
- Italian diacritics render correctly.
- Determinism test passes.

## Anti-patterns

- Pixel snapshot tests. Brittle, hard to review, and don't catch wrong values
  with the right layout.
- Calling `new Date()` directly in a template. Tests will be flaky and
  declarations will have today's date even when the user is regenerating an
  old period.
- Hard-coding row Y-coordinates. Use the engine's table helpers — they handle
  flow.
- One mega-template covering all denominations with `if` branches. One file
  per template.
- Returning the Buffer to the client without setting `Content-Type:
  application/pdf` and a `Content-Disposition: attachment; filename=...`.
