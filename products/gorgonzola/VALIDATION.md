# Gorgonzola DOP validation

## Documents checked

- `products/gorgonzola/docs/piano-di-controllo.zip` -> `Gorgonzola DOP approvato 10.07.2024/DPC012_rev_06.06.2024.pdf`, CSQA Piano dei Controlli DPC012, rev. 06.06.2024.
- Official production specification: `Disciplinare_Gorgonzola_22.9.2017.pdf`, published by Consorzio per la tutela del Formaggio Gorgonzola DOP: https://gorgonzola.com/wp-content/uploads/2023/08/Disciplinare_Gorgonzola_22.9.2017.pdf
- CSQA product page: https://www.csqa.it/it-it/dop-igp-stg/gorgonzola-dop
- MASAF authorization page for CSQA: https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/21771

## Product rules validated

The previous `fields.json` modeled only `dolce` and `piccante`, with one generic aging rule and one generic weight range. The disciplinare and DPC012 Table 1 define three market types:

- `dolce`: weight 9-13.5 kg; aging 50-150 days.
- `piccante`: weight 9-13.5 kg; aging 80-270 days.
- `piccola_piccante`: weight 5.5 kg to less than 9 kg; aging 60-200 days.

The fat-on-dry-matter rule remains valid at minimum 48%.

## Submission rules validated

DPC012 section 10 and Table 2 say periodic data must be transmitted to CSQA through the dedicated CSQA portal, or by email to `dati.reg@csqa.it` when the portal is absent or unavailable.

Configured rules:

- `AC01`: annual milk production declaration, due by January 31. This is manual/unscheduled because the current scheduler only supports monthly rules.
- `CC04`: transformer production data for DOP-suitable cheese, due by the 5th of the following month.
- Monthly periodic data from DPC012 Table 2, due by the 10th of the following month.

## Open questions

- The current app schema cannot represent role-specific forms in detail. Gorgonzola has at least these operator roles: milk producer, milk collector, transformer, aging operator, portioning operator, and pre-packager.
- The current scheduler cannot represent annual deadlines such as AC01 by January 31.
- DPC012 also describes PEC use for analysis revision requests. This is not configured as a scheduled submission because it is an exception workflow, not a periodic declaration.
