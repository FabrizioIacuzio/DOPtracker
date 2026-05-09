# Mozzarella di Bufala Campana DOP validation

## Documents checked

- Consorzio Tutela Mozzarella di Bufala Campana DOP product site, retrieved 2026-05-09: https://www.mozzarelladop.it/
- Consorzio production page, retrieved 2026-05-09: https://www.mozzarelladop.it/bufala-campana/produzione
- Production specification text for the DOP, MIPAAF Provvedimento 11/02/2008, retrieved 2026-05-09: https://www.disciplinare.it/mozzarella-di-bufala-campana-dop.html
- RINA AGRIFOOD DOP product page, retrieved 2026-05-09: https://www.rina.org/it/agroqualita/prodotti-tipici/prodotti-tipici-dop
- RINA AGRIFOOD registro di produzione, Rev. 01 12/01/2026: https://scresources.rina.org/it/food/Registro-di-produzione-mozzarella-bufala-campana-dop.pdf
- MASAF authorization for RINA AGRIFOOD S.p.A., D.M. 695742 del 30/12/2025: https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/23952
- MASAF page on tracciabilita latte di bufala e trasformati, retrieved 2026-05-09: https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/6381

## Product rules validated

- The product is made only from fresh whole buffalo milk from the DOP supply chain.
- Milk must be transformed within 60 hours.
- The milk quality thresholds modeled are:
  - fat minimum 7.2%;
  - protein minimum 4.2%.

## Submission and workflow mapping

- RINA AGRIFOOD is the current control body per MASAF D.M. 695742 del 30/12/2025.
- MASAF DM 9406/2014 creates traceability obligations for buffalo milk and transformed products, covering production, transformation, purchase and sale data for farmers, intermediaries and transformers.
- `workflow.json` maps the first app workflow into four operational sections: buffalo farm, milk collection, transformation, and packaging.

## Open questions

- The RINA Piano dei Controlli must still be parsed in full for exact portal/submission deadlines and document codes.
- Shape, size, packaging, label and mark requirements are not fully modeled because the current app field model is focused on numeric batch validation.
- The current app has no native datetime field; workflow fields for milking and delivery use text until the form renderer supports datetime inputs.
