# Grana Padano DOP validation

## Documents checked

- Official Consorzio Grana Padano disciplinare page, retrieved 2026-05-09: https://www.granapadano.it/it-it/larte-della-produzione/la-dop/disciplinare-grana-padano-dop/
- Official disciplinare PDF linked from the Consorzio page, retrieved 2026-05-09: https://www.granapadano.it/public/file/DisciplinareGranaPadanoDOP2022-50232.pdf
- CSQA control plan from repository archive: `products/grana-padano/docs/piano-di-controllo.zip`, file `DPC001_rev_19_febbrabio_2025.pdf`, revision 2025-02-19.

## Product rules validated

- Fat on dry matter: minimum 32%.
- Natural maturation: minimum 9 months from forming for standard Grana Padano DOP.
- Riserva: minimum 20 months from forming and qualitative requirements for the second fire brand.
- Wheel weight: 24-40 kg. The disciplinare states this range applies to the average of the lot submitted to expert assessment, with a 2.5% tolerance for single wheels only when the whole lot is within range. The current app rule applies the 24-40 kg warning to the recorded wheel value because the field model does not yet represent lot-average tolerance.

## Submission rules validated

- DPC001 section 10: each recognized operator must transmit periodic information to CSQA through the dedicated CSQA portal or, when unavailable, by email to `dati.reg@csqa.it`.
- DPC001 Table 2:
  - AC01 annual milk production declaration due by January 31.
  - BC01/BC02 monthly milk collection communications.
  - CC01/CC02/CC03/CC05/CC06/CC07 monthly transformation communications.
  - CC04/CC08/CC09 event-based preventive use notifications.
  - DC01/DC02/DC03 monthly aging and marking communications.
  - EC01 weekly grating work programs due by the Thursday before the activity week.
  - EC02 daily grating work register due by the 10th of the following month.
- DPC001 section 8.4: the fire-branding request, e.g. MOD003, must identify the producer dairy matricola, production month/year, number of wheels, and storage site before expert assessment and marking.

## Open questions

- `submission.json` can only express monthly schedules with a numeric day. Annual deadlines, weekly deadlines, and generic "within the following month" deadlines are recorded in `deadline` and `instructions` instead of `schedule`.
- The app field model does not yet support lot-average tolerances, so the wheel-weight tolerance described by the disciplinare is documented but not precisely modeled.
- The app does not yet model physical product checks for diameter, heel height, rind thickness, grating humidity, granulometry, or rind percentage. These are present in the disciplinare/DPC001 and should be added when the batch form supports those workflows.
