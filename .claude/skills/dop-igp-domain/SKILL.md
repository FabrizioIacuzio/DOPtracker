---
name: dop-igp-domain
description: Reference material for the Italian DOP/IGP compliance domain — ABM IGP thresholds, CSQA submission cadence, ICQRF terminology, regulatory context.
when_to_use: When a task involves disciplinare rules, declarations, control bodies, or regulatory terms and you need to confirm domain facts before designing.
---

# DOP/IGP domain reference

Use this skill as a *reference*, not a workflow. It points at primary sources
in this repo and summarises terms you'll keep encountering.

## Primary sources in this repo

- [italy-dop-igp-saas-opportunity.md](../../../italy-dop-igp-saas-opportunity.md) — full
  market & regulatory dossier. Authoritative on business context.
- [docs/superpowers/plans/2026-05-04-dop-igp-saas-mvp.md](../../../docs/superpowers/plans/2026-05-04-dop-igp-saas-mvp.md) —
  MVP implementation plan; the architecture this codebase is converging on.
- [frontend/src/contexts/AppDataContext.tsx](../../../frontend/src/contexts/AppDataContext.tsx) —
  *transitional* hardcoded ABM IGP rules. **Do not treat as source of truth.**
  When backend denomination JSON exists, that is the source of truth; this
  file gets removed.

## Regulatory context (high level)

- **DOP (Denominazione di Origine Protetta)** ≈ EU's PDO. Stricter
  geographic + production constraints; entire production tied to the region.
- **IGP (Indicazione Geografica Protetta)** ≈ EU's PGI. At least one stage
  of production tied to the region.
- **Disciplinare di produzione**: the binding rulebook for a given
  denomination. Defines parameters (ingredients, ranges of physical/chemical
  values, aging time, packaging, region of production).
- **DLgs 51/2026**: Italian decree (effective May 2026) strengthening ICQRF
  inspection authority and producer record-keeping obligations. The reason
  the market is open *now*.

## Control bodies

- **CSQA** — third-party certifier. Audits producers against the disciplinare
  and counter-signs declarations before they go to the consortium / authorities.
- **CCPB** — alternative certifier; same role for some denominations.
- **ICQRF** — state inspectorate (Repressione Frodi). Has enforcement power.
- The producer is responsible for keeping batch records and producing
  periodic declarations. Our app helps the producer; the producer signs and
  submits to CSQA/CCPB; CSQA/CCPB countersigns. **We are never in the legal
  loop.**

## Aceto Balsamico di Modena IGP (ABM) — first denomination

Sector economics (per dossier): ~300 producers, €889M sector, 93% export rate.

**Indicative parameter thresholds** (do not hard-code from this list — confirm
against the disciplinare PDF and write a denomination JSON file with `source`
and retrieval date; see `denomination-config` skill):

| Parameter        | Threshold              | Notes                              |
|------------------|------------------------|------------------------------------|
| Acidity          | ≥ 6.0 %                | Total acidity, expressed as acetic |
| Density          | ≥ 1.06 g/ml            |                                    |
| Reducing sugars  | ≥ 110 g/l              |                                    |
| Aging            | ≥ 60 days (≥ 2 months) | In wood barrels                    |
| Alcohol          | ≤ 1.5 % vol            |                                    |
| Dry extract      | ≥ 30 g/l               |                                    |
| SO₂              | ≤ 100 mg/l             |                                    |
| Ash              | ≥ 2.5 ‰                |                                    |

These match what the frontend currently hardcodes. They are the *starting
point*, not the audit-of-record. Treat the disciplinare as canonical.

## Submission cadence (typical)

- Producers maintain a **batch register** (real-time as production happens).
- Periodic declarations submitted to CSQA/CCPB (frequency varies per
  denomination; for ABM, commonly quarterly or per production cycle).
- Annual summaries.

## Glossary

| Term                    | Meaning                                                       |
|-------------------------|---------------------------------------------------------------|
| Disciplinare            | The binding production rulebook for a denomination            |
| Lotto / batch           | A discrete production unit with traceable inputs and outputs  |
| Mosto                   | Cooked grape must (ABM input)                                 |
| Aceto di vino           | Wine vinegar (ABM input)                                      |
| Invecchiamento / aging  | Time in wood barrels                                          |
| Bollo / sigillo         | Seal applied after CSQA approval                              |
| Estratto secco          | Dry extract (analytical parameter)                            |
| Acidità totale          | Total acidity                                                 |
| Solfiti                 | Sulfites (SO₂)                                                |

## Designing with the domain in mind

- A "batch" in the system maps to a *lotto* in the disciplinare. The schema
  should preserve that vocabulary in user-facing strings (Italian + English),
  not invent new terms.
- A declaration is *for a period* and *for a producer*. Aggregate at write
  time only when the periodicity is known; otherwise compute on read.
- Rules are versioned per disciplinare. When the disciplinare changes (it
  does), we need to be able to recompute past declarations against the rules
  *as they were at the production date*. Plan for `denomination_version`
  on every batch.

## When to ask the user

- Whenever a threshold or rule comes from "I think it's around X" rather
  than the disciplinare. Stop and ask. Wrong thresholds are the worst
  possible bug for this product.
- Whenever a regulatory term is ambiguous in context — Italian compliance
  vocabulary doesn't always map 1:1 to English.
