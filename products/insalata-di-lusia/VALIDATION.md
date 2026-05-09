# Insalata di Lusia IGP validation

## Documents checked

- EU Official Journal single document, `Insalata di Lusia`, 2019/C 3/11, retrieved 2026-05-09: https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A52019XC0107%2807%29
- CSQA product page, retrieved 2026-05-09: https://www.csqa.it/it-it/dop-igp-stg/insalata-di-lusia-i-g-p
- CSQA control plan from repository archive: `products/insalata-di-lusia/docs/piano-di-controllo.zip`, file `Dpc041_del_17_04_19.pdf`, revision 2019-04-17.

## Product rules validated

- Official varieties: only `Cappuccia` and `Gentile`. The generated `iceberg` option was removed.
- Stem length: maximum 6 cm.
- Trimmed head weight:
  - `Cappuccia`: 200-500 g.
  - `Gentile`: 150-450 g.
- Maximum production yield per hectare per cycle:
  - `Cappuccia`: 55 t/ha.
  - `Gentile`: 50 t/ha.
- Cultivation, harvest, trimming, and washing must occur in the defined geographical area. This is documented but not currently modeled as a batch-form rule.

## Submission rules validated

- DPC041 section 7.2:
  - Agricultural producers submit `MOD002 - Denuncia di produzione` for each cultivation cycle immediately after harvest and no later than 7 days after harvest, with variety, SAU, and potentially eligible harvested quantities.
  - Recognized packers submit monthly communications by the 15th of the following month, including `MOD004` quantities procured by variety and recognized producer, and `MOD005` quantities packed as Insalata di Lusia IGP, returned, or declassified.
  - Recognized IV Gamma packers submit monthly communications by the 15th of the following month, including `MOD004_a` quantities procured from recognized packers and `MOD006` quantities processed by variety and returned.
- DPC041 section 7.1: operators keep self-monitoring documentation and traceability records for at least five years and make them available for CSQA checks.
- DPC041 module list: `MOD001` is the access request to the control system.

## Open questions

- DPC041 says documents are transmitted to CSQA but does not specify a dedicated portal or SIAN channel. `submission.json` therefore uses CSQA PEC as the formal channel and records this as a schema-level approximation.
- The app cannot express "within 7 days after harvest" as a schedule, so `MOD002` is represented with `deadline` and `instructions` and no `schedule`.
- The app validates `yield_t_per_ha` directly. It does not yet derive yield from SAU and harvested quantity.
- The app does not yet model geographic-area compliance, package uniformity, food-grade container suitability, or IV Gamma processing details beyond submission metadata.
