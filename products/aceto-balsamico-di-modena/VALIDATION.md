# Aceto Balsamico di Modena IGP validation

Validation date: 2026-05-09

## Sources reviewed

- `products/aceto-balsamico-di-modena/docs/piano-di-controllo.zip`
  - `DPC030 - rev 22052025.pdf` — CSQA piano dei controlli, rev. 22/05/2025.
  - `MOD001 Domanda di adesione  rev22052025.pdf` — registration form.
  - `Allegato 2 a MOD 001 rev22052025.pdf` — technical annex.
  - `MOD 003 - Modello richiesta correzione-rev22052025.pdf` — correction request form.
- MASAF disciplinare PDF, downloaded 2026-05-09:
  `https://www.masaf.gov.it/flex/cm/pages/ServeAttachment.php/L/IT/D/1%252Fa%252F1%252FD.87188f5f32d178a6d2ad/P/BLOB%3AID%3D3345/E/pdf?mode=download`
- CSQA public product page, checked 2026-05-09:
  `https://www.csqa.it/it-it/dop-igp-stg/aceto-balsamico-di-modena-igp`

## Producer and operator types covered

DPC030 applies to these supply-chain operators:

- `produttore_mosto_cantina`
- `intermediario_uve`
- `produttore_mosto_cotto_concentrato`
- `intermediario_mosti_abm_sfuso`
- `produttore_aceto_di_vino`
- `elaboratore`
- `imbottigliatore`

The current app batch form primarily represents finished or certifiable ABM handled by an `elaboratore` or `imbottigliatore`. The submission config now records DOPS 4.0 communication duties for all operator categories visible in DPC030 Table 2.

## Changes made

### `fields.json`

- Added `productType` with values `affinato`, `invecchiato`, and `riserva`.
- Replaced flat acidity, density, and aging rules with product-type-specific rules:
  - `affinato`: density >= 1.06 g/ml, acidity >= 6%, aging >= 2 months.
  - `invecchiato`: density >= 1.15 g/ml, acidity >= 5.5%, aging >= 36 months.
  - `riserva`: density >= 1.25 g/ml, acidity >= 5.5%, aging >= 60 months.
- Kept shared finished-product analytical limits:
  - reducing sugars >= 110 g/L
  - actual alcohol <= 1.5% vol
  - dry extract >= 30 g/L
  - total SO2 <= 100 mg/L
  - ash >= 2.5 per mille
- Updated UI hints so the form no longer suggests the old single threshold set.

### `submission.json`

- Replaced generated generic ministry/PEC/SIAN rules with CSQA DOPS 4.0 web-portal communications from DPC030 Table 2.
- Added operator type, DPC control code, and deadline metadata for auditability.
- Marked event-based obligations as manual, unscheduled rules because the current scheduler only supports monthly fixed-day recurrences.
- Marked `M410` and `M440` for `imbottigliatore` as monthly schedules due on day 10, matching "entro il 10 del mese successivo".

## Open questions

- DPC030 Table 2 is portal-centric. Exact DOPS 4.0 form availability and field names should be confirmed inside the CSQA portal with real credentials.
- Some table rows combine multiple form codes (for example `M100A/M100B/M130`, `M340/M350`). The current config keeps them combined where the DPC table combines them; future workflow automation may need separate rule records per portal form.
- The current form stores aging as months. The disciplinare expresses `affinato` as 60 days and `invecchiato`/`riserva` as years. Month conversion is pragmatic for the existing UI but should become date-based before production use.
- Packaging/container and label-presentation requirements from DPC030 Table 1 are not represented in `fields.json`; the current batch form only covers analytical and aging checks.
