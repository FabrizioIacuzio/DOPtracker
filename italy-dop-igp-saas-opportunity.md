# Italy DOP/IGP Compliance SaaS — Business Intelligence Report
*Prepared for internal use — Barcelona team, May 2026*

---

## Table of Contents
1. [The Opportunity in One Paragraph](#1-the-opportunity-in-one-paragraph)
2. [The Problem](#2-the-problem)
3. [The Service Concept](#3-the-service-concept)
4. [Target Market — Who You Sell To](#4-target-market--who-you-sell-to)
5. [Competitor Landscape](#5-competitor-landscape)
6. [Data Sources — Where Everything Comes From](#6-data-sources--where-everything-comes-from)
7. [Lab Reports — Are They Standardized?](#7-lab-reports--are-they-standardized)
8. [Automation — What Can Be Done Without a Human Employee](#8-automation--what-can-be-done-without-a-human-employee)
9. [The Submission Model — Why the Client Uploads, Not You](#9-the-submission-model--why-the-client-uploads-not-you)
10. [Product Build Plan](#10-product-build-plan)
11. [How to Find Every Producer](#11-how-to-find-every-producer)
12. [Key Contacts & Associations](#12-key-contacts--associations)
13. [Addressable Market & Revenue Model](#13-addressable-market--revenue-model)
14. [Exit Scenarios & Enterprise Value](#14-exit-scenarios--enterprise-value)
15. [Tech Stack](#15-tech-stack)
16. [Risks & Upsides](#16-risks--upsides)

---

## 1. The Opportunity in One Paragraph

Italy has 897 registered Geographical Indications (DOP, IGP, DOC, DOCG) generating €20.7 billion in production value in 2024, growing at 7.7% YoY. Every one of the 194,387 certified operators in this system must maintain detailed production logs, submit periodic declarations to their control body, and be ready for ICQRF inspections at any time. The vast majority of these operators — specifically the medium-sized producers with 10–80 employees — manage this compliance entirely on paper and Excel. No commercial SaaS product exists to serve them. The regulatory pressure has just intensified: DLgs 51/2026 came into force in May 2026, tightening ICQRF enforcement. The window to enter this market as the first mover is open now.

---

## 2. The Problem

### What DOP/IGP Producers Must Document

Every certified producer must maintain, per their denomination's *disciplinare di produzione* (production rulebook):

- **Daily batch records** — raw material intake (supplier ID, volume, quality), processing parameters (temperature, time, additive quantities), output volume and batch ID
- **Aging/maturing calendar** — for cheeses: weekly turning logs, weight measurements, rind treatments, cave conditions; for balsamic vinegar: barrel movement records, refill declarations
- **Quality test results** — results from ACCREDIA-accredited lab tests (acidity, humidity, fat content, etc.) cross-referenced against disciplinare thresholds
- **Supplier declarations** — milk supplier certificates, raw material provenance statements
- **Periodic declarations to the consorzio** — monthly or quarterly production summaries submitted to the protection consortium in a defined format
- **Control body declarations** — structured batch records submitted to the authorised control body (e.g. CSQA, CCPB) for ICQRF audit compliance
- **Non-conformity reports** — formal documentation of any deviation from spec (a wheel that fails quality inspection, a batch with out-of-range acidity)

### The Current Workflow (What You Are Replacing)

A 40-person DOP producer today:
- Keeps paper binders with handwritten daily logs
- Transcribes batch data into Excel sheets at the end of each week
- Assembles Word documents for periodic consorzio declarations, copy-pasting from Excel
- Prints, signs, scans, and emails PDFs to the control body
- When ICQRF announces an inspection, spends 2–3 days searching through binders and spreadsheets to compile the required documentation

**Estimated admin cost:** one person at ~3–5 hours/week = €3,500–5,800/year in salary cost. A €99–149/month SaaS subscription breaks even in admin savings alone, before counting risk reduction.

### The Regulatory Forcing Function (Now)

- **EU Regulation 2024/1143** (in force May 2024): unified GI framework for all food, wine, and spirits. Tightened producer record-keeping requirements and increased control body powers.
- **DLgs 51/2026** (in force May 2026): Italian implementation decree. Increased sanctions for non-compliant documentation, stricter ICQRF inspection authority. This is the current forcing function.
- **PNRR Missione 2**: Italy's national digital transition plan mandates digital records for certified agri-food producers by 2026.

---

## 3. The Service Concept

### What You Offer

A **mobile app + web app** that configures itself per denomination and takes away the documentation burden from the producer. The flow:

1. **Configure the client** — when a new customer signs up, you configure their account as "Aceto Balsamico di Modena IGP producer" (or whichever denomination). This loads the correct form fields, validation rules, and output templates for that denomination. The producer never sees rules they don't need.

2. **Producer logs data on the phone** — a simple, pre-configured mobile form asks only the questions relevant to their denomination. A cavekeeper logging a Gorgonzola wheel rotation takes 90 seconds. A balsamic producer recording a daily production batch takes 2 minutes. No knowledge of the disciplinare required — the form enforces the rules invisibly.

3. **System validates in real time** — your rule engine checks each entry against the disciplinare thresholds. If a batch's acidity is out of spec, the system flags it immediately, before it becomes an ICQRF problem. The producer is told what is wrong and what to do.

4. **System compiles the declaration** — at the end of the reporting period (monthly/quarterly, depending on denomination), your system assembles all logged data into a pre-filled declaration PDF, in the exact format the control body expects. This document is also used as the audit pack for ICQRF inspections.

5. **Producer uploads to the portal** — since no API exists yet for most control body portals, the producer logs into their CSQA/CCPB/consorzio portal and uploads the generated PDF. Your system provides a **submission checklist**: one page that tells them exactly which portal to use, which menu to navigate to, and which file to attach. Total time: under 5 minutes.

### What You Are NOT

- You are not a compliance consultant substituting the producer in their legal obligations
- You are not submitting documents on their behalf (see section 9 for why this is deliberate)
- You are not an ERP system — you are a focused compliance workflow tool

### The TurboTax Analogy









TurboTax does not file your taxes for you. You click Submit. But TurboTax did 99% of the work, and you pay €40/year for it. Your product does 99% of the compliance work, and producers pay €99–149/month for it. The final upload is the producer's legal act — which is correct, because the declaration is their legal declaration.

---

## 4. Target Market — Who You Sell To

### The Sweet Spot: Medium Industrial Producers

**Target profile:** 10–80 employees, 500T–5,000T/year production, established DOP/IGP certification, regular ICQRF inspection cycle, no internal ERP or compliance software.

**Why this segment specifically:**
- Too large to manage compliance with paper + a part-time gestor
- Too small for enterprise ERP implementation (TeamSystem Agri, SAP) — those cost €50K+ to implement and require dedicated IT
- Structurally excluded from the giant consortia's internal systems (Parmigiano Reggiano's p-Chip system is for the consortium's labelling, not the individual dairy's internal workflow)
- The compliance burden is the same regardless of size — the paperwork for a 20-person caseificio is nearly identical to that of a 100-person one

### Concrete Examples of Target Customers

**Cheeses (DOP):**
- A Gorgonzola DOP producer making 2,000 wheels/month in Novara or Bergamo (~40 producers of this type exist)
- A Pecorino Toscano DOP caseificio with 30 employees in Siena
- An Asiago DOP co-op with 15 member farms in Vicenza
- A Taleggio DOP producer in Lombardy

**Cured meats (IGP/DOP):**
- A Bresaola della Valtellina IGP factory with 40 employees in Sondrio
- A Prosciutto di Modena DOP producer with 25 employees
- A Mortadella Bologna IGP producer with 30 employees

**Balsamic vinegar (IGP) — ideal MVP segment:**
- Aceto Balsamico di Modena IGP: 300 producers in Modena/Reggio Emilia, €889M sector value, 93% export rate
- High compliance burden (aging declarations, batch tracking, volume reconciliations)
- No internal consortia system
- Strong motivation to have clean records for international buyers (US, Germany, UK)

**Who NOT to target (at first):**
- 3-person artisan caseifici (can't pay; admin burden is manageable by hand)
- Parmigiano Reggiano's 300 dairies (have their own p-Chip system; consortium is protective of its data layer)
- Grana Padano's large producers (same issue; +€2B consortium has internal tools)

---

## 5. Competitor Landscape

### Direct Software Competitors

| Competitor | What They Do | Gap | Threat Level |
|---|---|---|---|
| **TeamSystem Agri** | Italian SME ERP with agricultural modules. Covers invoicing, inventory, accounting. | No DOP aging logs, no ICQRF report generation, no consorzio declaration templates. Different product category entirely. | Potential acquirer, not a competitor |
| **Zucchetti Agricoltura** | Same as TeamSystem — ERP for agri-food SMEs | Same gaps as TeamSystem | Potential acquirer |
| **OliveSuite** (olivesuite.app) | Cost analytics for olive oil producers. Spanish language. | No multi-party lot traceability, no PDO rule engine, no ICEX PDF generation | Relevant only for olive oil vertical |
| **IBM Food Trust / Trace One / FoodLogiQ** | Enterprise food traceability platforms | €50K+ entry cost. Zero relevance to a 30-person dairy in Emilia-Romagna | No overlap |
| **CSQA's internal portal** | CSQA operates a client-facing portal for submission | It is the destination, not a workflow tool. Producers prepare documents manually before using it | Not a competitor — you feed into it |

### The Real Incumbent

**Excel + paper + Word** is the actual competitor in 95%+ of the target market. You are not displacing a SaaS product — you are displacing inertia. This is both the challenge (longer sales cycle) and the opportunity (no switching cost from a competitor, no contract to fight).

### Confirmed Gap

After exhaustive research: **no commercial SaaS product exists specifically for Italian DOP/IGP producer compliance logging, ICQRF report generation, and consorzio batch declaration management.** The space is unoccupied by any venture-backed or bootstrapped startup. The Ismea-Qualivita 2025 report itself notes that "small farms often struggle with the administrative demands of certification, and repeated calls for simplification underline the need for clearer procedures."

---

## 6. Data Sources — Where Everything Comes From

### 6.1 The Disciplinari (Production Rulebooks) — Free, Public

The disciplinare is the legal document specifying what records must be kept, what quality parameters apply, and what the audit format looks like. This is the source of truth for your rule engine.

| Source | Content | URL |
|---|---|---|
| **EU eAmbrosia** | Official EU register. All 897 Italian GIs with linked product specification (disciplinare) downloadable as PDF | `ec.europa.eu/agriculture/quality/door/list.html` |
| **EU GIview (EUIPO)** | All EU GI data with product specifications, producer group contacts, and control body information | `euipo.europa.eu/it/gi-hub` |
| **Italian Masaf portal** | Full Italian DOP/IGP list with downloadable disciplinari and Piani di Controllo per denomination | `masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/396` |
| **Qualigeo (Fondazione Qualivita)** | Enriched data — consorzio contacts, member counts, production maps, economic data | `qualigeo.eu` |

**How to use them:** Download disciplinari as PDFs. Run through an LLM (GPT-4, Claude API) to extract structured data: required record types, quality parameter thresholds, aging requirements, submission frequencies, consorzio declaration format. Output: a JSON config object per denomination. One engineer structures 30–50 denominations in 2–3 weeks.

### 6.2 The Piani di Controllo — Free, Public

Each authorised control body publishes a "Piano di Controllo" for each denomination they certify. This is literally the audit checklist — it specifies which documents to collect, which measurements to record, and with what frequency.

- **CSQA**: `csqa.it/it-it/dop-igp-stg` — individual pages per denomination with downloadable control plans. CSQA alone controls 82 denominations. Download all of them in one afternoon.
- **CCPB**: `ccpb.it` — similar structure
- **Bioagricert**: `bioagricert.org`

### 6.3 The Producer List — Semi-Public

**ICQRF official registry:** 194,387 certified operators. Not a downloadable spreadsheet — access requires formal request under Italian transparency law (accesso agli atti). Not the fastest route.

**Practical shortcuts:**

1. **Consorzio member directories** — each of 189 consortia maintains a member list. Email the *ufficio tecnico* of 30–40 relevant consortia asking for a certified member list. Many share it, especially if you frame the request as "we are building a compliance tool for your members."

2. **CSQA denomination pages** — CSQA lists certified operators per denomination (e.g. the Prosciutto di Parma page lists all registered prosciuttifici). Scraping these gives a ready prospect list.

3. **LinkedIn** — search "responsabile qualità DOP", "quality manager DOP IGP", "responsabile produzione caseificio" + province. This is your cold outreach list. Target: 200 contacts identified → 10–15 demos booked → 2–3 pilot customers in month 1.

4. **Trade fairs** — Cibus (Parma, May annually) and Vinitaly (Verona, April annually). A demo booth costs €3,000–8,000 and reaches exactly the right customer profile in 2 days.

---

## 7. Lab Reports — Are They Standardized?

### Short Answer: Parameters Yes, Format No

**What IS standardized (the good news):**

All labs conducting official DOP/IGP analysis must be ACCREDIA-accredited under ISO/IEC 17025 and must use the specific analytical methods prescribed by the denomination's disciplinare. For every denomination:
- The parameter names are consistent (e.g. "acidità totale", "umidità", "contenuto di grassi")
- The units are consistent (g/100g, %, °Brix)
- The test method reference numbers are consistent (e.g. "ISO 1735" for fat in cheese)

This means the **vocabulary** of every Italian DOP/IGP lab report is predictable.

**What is NOT standardized:**

The PDF layout of the "Rapporto di Prova" (test report) is each lab's own design. No mandated national template exists. Lab A in Modena has a different table structure from Lab B in Parma.

**Practical implication for the product:**

This is a solved engineering problem. Because parameter names and units are consistent, an LLM reading:

> "acidità totale: 6.2 g/100g" or "umidità: 38.5%"

...will extract those values reliably regardless of PDF layout — exactly like receipt-scanning apps work across hundreds of different receipt formats. You are not parsing free text; you are extracting named numerical values with known units from structured scientific documents. Expected extraction accuracy: 95%+.

Any extraction error is caught by the rule engine validation step: if an extracted value falls outside the expected range for that denomination, the system flags it for the producer to confirm manually before it is saved to the compliance record.

**In practice:** producers in a given denomination cluster around 3–5 regional labs. Across your first denomination (ABM), you will likely encounter 8–12 distinct PDF formats. Each format is a one-time learning exercise for the extraction model.

**ICQRF official labs** (4 labs, gold standard for official analysis):
- Conegliano/Susegana: accreditation number 00231
- Modena: 00204
- Perugia: 00230
- Catania / Roma: 00552

These are the reference labs. If you train your PDF extractor on their format first, you cover the most common official test reports.

---

## 8. Automation — What Can Be Done Without a Human Employee

### Layer 1 — Data Collection (100% automatable, no company employee needed)

The producer or their line supervisor logs data directly into the app:

- **Daily batch log** — mobile form pre-configured per denomination. Takes 2–3 minutes. Fields: raw material supplier, volume, batch ID, temperature, key process parameters.
- **Aging calendar** — auto-generated when a batch is created. System sends automated reminders (email/SMS/push notification) when a wheel needs turning, weighing, or rind treatment. Producer taps "done."
- **Lab report upload** — producer photographs or uploads the lab PDF. LLM extraction reads key parameters and auto-populates the compliance record. Rule engine validates against disciplinare thresholds.
- **Supplier declarations** — milk/raw material suppliers receive an email link to a simple web form. They fill it in directly. No phone calls.

### Layer 2 — Compilation & PDF Generation (100% automatable)

- **Periodic declaration** — system assembles the monthly/quarterly consorzio declaration from logged data. Outputs a pre-filled PDF in the exact format the control body expects. Producer reviews on-screen, signs digitally, and it's ready for upload.
- **Audit pack** — when ICQRF announces an inspection, producer clicks "generate audit pack." System pulls all relevant batch records for the inspection period, formats them in the control body's required order, generates a printable/PDF pack. What used to take 2–3 days of binder-searching takes 30 seconds.
- **Non-conformity report** — when a deviation is flagged, the system generates the pre-populated report form. Producer adds a 3-line explanation. Done.

### Layer 3 — Portal Submission (60–80% automatable; remaining 20–40% done by the producer, not your employees)

| Portal | Status | Automation possible? |
|---|---|---|
| **OLICERT** (Puglia olive oil DOP, Camera di Commercio Bari) | Documented public web portal | Yes — form submission or browser automation |
| **Cantina Italia** (ICQRF wine register) | Structured XML interface for stock declarations | Yes — generate XML, producer uploads |
| **Consorzio member portals** (Grana Padano, some others) | Online form-based submission | Yes — browser automation (Playwright) with producer's credentials |
| **CSQA client portal** | Manual PDF upload by producer | No API yet. Producer logs in, attaches the generated PDF. Takes 5 minutes. |
| **CCPB portal** | Email + web portal submission | Partially — producer uploads pre-filled PDF |

**The key insight:** For CSQA and CCPB (covering the majority of denominations), the submission step that remains is the producer uploading a pre-filled PDF to their own portal account. This is not your company's employee doing work — it is the legally responsible party (the producer) performing their legal act. You have automated everything except the final click.

### What Your Company Needs Zero Employees For

- Data collection: zero employees (producer self-serves)
- Validation: zero employees (rule engine runs automatically)
- PDF compilation: zero employees (automated)
- Audit pack generation: zero employees (automated)
- Portal submission: zero employees (producer does it)

**The only internal human you eventually need:** one Italian-speaking customer success person, at ~€40K/year, who handles onboarding calls and maintains the relationship with consorzio partners. This one person can support 200+ active customers.

---

## 9. The Submission Model — Why the Client Uploads, Not You

This is a deliberate architectural and legal choice, not a limitation.

### Legal Reason

In Italian law, the producer is the legally responsible signatory on declarations submitted to control bodies and consortia. The declaration is their legal statement of compliance. If your company submitted on their behalf without formal *procura* (power of attorney), you would enter grey territory around professional liability and potentially regulated professional services. By having them click upload, you carry zero legal exposure. This protects your company.

### Commercial Reason

The TurboTax model is proven at scale. TurboTax never files on your behalf without your click. H&R Block's software doesn't either. The value proposition is: "we did 99% of the work, you click submit." That is worth €99–149/month to a producer who currently spends 4 hours/week on paperwork. You do not need to own the submission step to charge for the value.

### Operational Reason

If you submitted on behalf of customers, you would need to:
- Manage their portal credentials securely
- Handle failed submissions and retry logic per portal
- Deal with each portal's downtime and maintenance windows
- Carry liability for missed deadlines caused by technical failures

By having the producer submit, all of this operational risk stays where it belongs — with the responsible party.

### Making the Upload Step Trivial

For each denomination, provide a **submission checklist** — a one-page document (auto-generated by your system) that tells the producer:
- Which portal URL to go to
- Which menu to navigate to
- Which file to attach (with the exact filename your system generated)
- Which fields to fill manually if any remain

This reduces the producer's cognitive load for the submission step to near-zero. Total time for the upload: under 5 minutes. This is a product feature, not a service.

### Year 2+ — The API Partnership Path

Once you have 100+ customers on a given control body's denominations, you have leverage to approach CSQA or CCPB with a partnership proposal: "we can provide an integration that allows direct submission from our platform, reducing incomplete/incorrect submissions and lowering your review workload." This is a win for them — fewer error-prone manual uploads from producers. If they provide an API key, you eliminate the upload step entirely for those denominations. This is a year 2 conversation, not a year 0 requirement.

---

## 10. Product Build Plan

### Phase 1 — MVP (Months 0–4): One Denomination, Go Deep

**Target denomination: Aceto Balsamico di Modena IGP (ABM)**

Why ABM is the ideal first denomination:
- 300 producers, €889M sector value, 93% export rate — big enough for a business, small enough to know them all
- All clustered in Modena/Reggio Emilia — one trip, 20 producer meetings
- Highly structured compliance (aging declarations, batch tracking, acidity tests, volume reconciliations) — exactly what software solves
- Not dominated by a giant consorzio system (unlike Parmigiano Reggiano with p-Chip)
- CSQA is the main control body — one partnership → access to the whole denomination
- Export pressure = willingness to pay (US, Germany, UK buyers increasingly demand digital provenance)

**Build steps:**

| Step | Action | Time |
|---|---|---|
| 1 | Download ABM disciplinare from eAmbrosia and control plan from CSQA. Run through LLM. Extract required record types, parameter thresholds, submission frequencies. Output: JSON config for ABM. | 3 days |
| 2 | Contact Consorzio Tutela Aceto Balsamico di Modena (info@balsamico.it, Viale Monte Kosica 111, 41121 Modena). Request 5 producer discovery interviews. | Week 1 |
| 3 | Build core MVP: batch logger (mobile form) + rule engine validator + CSQA declaration PDF generator | 6–8 weeks, 2 devs |
| 4 | Run free 3-month pilot with 3 producers. Sit with them on-site for 1 day each. | Months 2–4 |
| 5 | Launch paid pricing at €99/month. Target: 20 customers by month 6 = €24K ARR | Month 5 |

### Phase 2 — Expansion (Months 5–12): 5 More Denominations

All recommended under CSQA (minimises new control body integrations). Add one new denomination every 3–4 weeks once the engine is proven.

| Denomination | Why | Producers |
|---|---|---|
| Gorgonzola DOP | Novara/Bergamo cluster, strong export, high compliance burden | ~40 medium producers |
| Bresaola della Valtellina IGP | Sondrio cluster, export-oriented, strong regional identity | ~30 producers |
| Prosciutto di Modena DOP | Geographic proximity to ABM base, same region | ~30 producers |
| Speck Alto Adige IGP | Bolzano, bilingual German/Italian — team language advantage | ~30 producers |
| Mortadella Bologna IGP | Bologna, high volume, export-driven | ~50 producers |

**Month 12 target:** 6 denominations, 80–120 paying customers, €100–140K ARR. Hire first Italian-speaking customer success person.

---

## 11. How to Find Every Producer

### Immediate (Week 1, Zero Cost)
1. **LinkedIn** — search "responsabile qualità DOP", "direttore tecnico caseificio", "responsabile produzione IGP" + province. Identify 200 contacts. Send personalised Italian-language emails mentioning DLgs 51/2026 compliance specifically. Expected response rate: 8–15%.
2. **CSQA denomination pages** — each denomination page on csqa.it lists certified operators. Download the list. This is your cold outreach database.

### Short Term (Month 1–2, Low Cost)
3. **Consorzio uffici tecnici** — email the technical office of each target consorzio. Ask: "We are building compliance software for [denomination] producers — can we speak to 5 members about their current workflow?" Many will forward to their member list.
4. **Google Maps + LinkedIn cross-reference** — search "caseificio DOP [denomination] [province]" on Google Maps. Find the company. Find the quality manager on LinkedIn. Two-step, zero cost.

### Medium Term (Month 3–6)
5. **Cibus Parma (May annually)** — major Italian food fair. €3,000–8,000 for a small exhibit booth. 30,000+ visitors including DOP producers, consorzio managers, ICQRF officials.
6. **Vinitaly Verona (April annually)** — for the wine denomination expansion. Same profile of attendees.
7. **Consorzio annual assembly** — every consorzio holds an annual general assembly where all members attend. Presenting for 10 minutes costs nothing if the consorzio secretary endorses it. This is worth 12 months of cold outreach.

---

## 12. Key Contacts & Associations

### Target Consorzio (Phase 1)

**Consorzio Tutela Aceto Balsamico di Modena**
- Address: Viale Monte Kosica 111, 41121 Modena
- Email: info@balsamico.it
- Role: Represents all 300 ABM producers. One endorsement unlocks warm access to the entire denomination.

### Control Bodies (Integration Partners)

**CSQA Certificazioni Srl** *(primary target)*
- Controls 82 denominations, representing >50% of Italy's GI production value
- Website: csqa.it
- Contact for partnerships: info@csqa.it
- Strategy: Position your software as "compliance preparation software that reduces incorrect submissions to CSQA." They benefit from fewer errors. You get a partnership endorsement and eventually an API pathway.

**CCPB Srl** *(secondary)*
- Handles DOP/IGP/STG and wine denominactions
- Website: ccpb.it
- Contact: ccpb@ccpb.it

**ICQRF (Ispettorato Centrale della tutela della Qualità)**
- The national regulator and enforcement body
- Ministry of Agriculture, Via XX Settembre 20, Roma
- Role: Understand their required data formats before building. Their acceptance of your generated documents = product validation.

### Key Data Bodies

**Fondazione Qualivita / Qualigeo**
- Website: qualivita.it / qualigeo.eu
- Role: Publishes the annual Ismea-Qualivita report (the authoritative GI economic data). Partnership or endorsement positions your SaaS as the sector's recommended compliance tool.

### Target Consortia for Phase 2

| Consorzio | Denomination | Location | Notes |
|---|---|---|---|
| Consorzio del Gorgonzola | Gorgonzola DOP | Novara | ~90 producers total, target the 40 mid-size |
| Consorzio Bresaola della Valtellina | Bresaola IGP | Sondrio | Strong export focus (target: DE, CH) |
| Consorzio Prosciutto di Modena | Prosciutto di Modena DOP | Modena | Geographic overlap with ABM — same sales trip |
| IDM Südtirol / Alto Adige Marketing | Speck Alto Adige IGP | Bolzano | Bilingual IT/DE — team language advantage |
| Consorzio Mortadella Bologna | Mortadella Bologna IGP | Bologna | ~120 members, target the 50 mid-size |

---

## 13. Addressable Market & Revenue Model

### Market Size (Italy-Only, Conservative)

| Segment | Target producers | ARPU (€/month) | Potential ARR |
|---|---|---|---|
| Balsamic vinegar (ABM IGP) | 120 of 300 | €99 | €143K |
| DOP cheeses (ex. Parmigiano/Grana) | 600 producers | €110 | €792K |
| Cured meats (DOP/IGP) | 200 producers | €99 | €238K |
| Wine (DOC/DOCG, small wineries) | 1,000 producers | €80 | €960K |
| **Total conservative TAM (Italy)** | **~1,920** | **€95 avg** | **€2.2M ARR** |

At **30% market penetration**: €660K ARR — achievable in 4–5 years as first mover.
At **full penetration**: €2.2M ARR — 10+ year horizon, requires expansion to wine.

### Expansion TAM

Adding Spain (32 olive oil PDOs, ~1,800 cooperatives, 400–600 with active PDO compliance), the combined platform reaches:
- ~4,000 paying customers across Italy + Spain
- €100/month average ARPU
- **€4.8M ARR** at full penetration

Adding France (AOC cheeses, wines) and Germany (regional food GIs):
- Pan-EU GI compliance platform
- **€8–12M ARR** at scale

### Pricing Model

| Tier | Price | What's included |
|---|---|---|
| **Starter** | €79/month | 1 denomination, up to 50 batches/month, PDF generation, email support |
| **Standard** | €129/month | 2 denominations, unlimited batches, audit pack generator, priority support |
| **Pro** | €199/month | 3+ denominations, multi-site, API access (when available), consorzio portal integration, dedicated onboarding |

---

## 14. Exit Scenarios & Enterprise Value

*Based on 2025–2026 SaaS M&A benchmark data: bootstrapped private SaaS trades at 4–6x ARR; growing (25%+ YoY) vertical SaaS at 6–8x ARR; vertical SaaS with embedded workflow and high NRR at 8–12x ARR.*

### Scenario A — Italy-Only, Cheese Focus (3–5 years)

400 producers × €95/month = **€456K ARR**
Exit multiple: 4–6x ARR (bolt-on acquisition by TeamSystem or Zucchetti)
**Exit range: €1.8M – €2.7M**

### Scenario B — Italy Multi-Category (5–7 years)

1,500 producers across cheese, cured meats, balsamic vinegar × €100/month = **€1.8M ARR**
Growing 25%+ YoY, NRR >100%, deeply embedded in producer workflows
Exit multiple: 6–8x ARR
**Exit range: €10.8M – €14.4M**
Likely acquirer: CSQA (gains software embedded in 1,500 of their certified producers), or PE-backed compliance roll-up.

### Scenario C — Pan-EU GI Platform (8–10 years)

4,000+ producers across Italy + Spain + France × €95/month avg = **€4.56M ARR**
Vertical SaaS with regulatory moat, multi-country, expanding to wine
Exit multiple: 8–12x ARR
**Exit range: €36M – €55M**
Likely acquirers: **SGS** (€7B revenue, global inspection/certification), **Bureau Veritas** (€6B), **LRQA** — all actively acquiring digital compliance tools embedded in their audit workflows.

*Comparable exit proof: Trace One (food compliance SaaS) acquired by Clarivate in 2021, rumoured ~€200M+ — a direct proof of buyer appetite in this space.*

---

## 15. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React SPA (Italian-first, English secondary) — mobile-responsive for field entry |
| **Mobile app** | React Native (share code with web frontend) |
| **Backend** | Node.js (Express) or Django (Python) |
| **Database** | PostgreSQL — batch tracking, lot lineage graph, aging calendar |
| **Rule engine** | JSON config per denomination (extracted from disciplinari via LLM) |
| **PDF extraction** | Claude API or GPT-4 Vision for lab report parsing |
| **PDF generation** | PDFKit or Puppeteer/Chromium for declaration document assembly |
| **Digital signature** | Yousign (EU-native) or DocuSign — for signed declarations |
| **Portal automation** | Playwright or Puppeteer for control body portal form submission (where applicable) |
| **Auth** | Standard JWT + optional SPID login integration (Italian national auth — standard in the sector) |
| **Payments** | Stripe + Nexi (Italian payment gateway, required for Italian VAT compliance) |
| **Notifications** | Resend (email) + push notifications for aging calendar reminders |
| **Infrastructure** | AWS EU (Frankfurt or Milan region) — data residency in EU required for Italian clients |

---

## 16. Risks & Upsides

### Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Conservative buyer persona (artisan producers) | High | Lead with consorzio endorsements, not cold outreach |
| Long B2B sales cycle (3–6 months per consorzio endorsement) | Medium | Start pilot free; sell on admin cost saving, not regulatory fear |
| 893 different disciplinare rule sets to model | Medium | Build the engine once; denomination config is data, not code. Add denominations incrementally. |
| ICQRF report format changes with regulation updates | Low-medium | Monitor Masaf and EU GI regulation updates. Rule engine is config-based — updates are a JSON edit, not a code deploy. |
| Control body portals add authentication barriers | Low | Browser automation (Playwright) handles most modern auth flows. |
| CSQA builds a competing producer-facing tool | Low | They are a certification body, not a software company. More likely to acquire you than compete. |

### Upsides

| Upside | Impact |
|---|---|
| Zero direct SaaS competitor confirmed | First-mover advantage in a €20.7B sector |
| DLgs 51/2026 enforcement is live NOW | Regulatory forcing function creates urgency for first customers |
| Near-zero churn once data is in | Batch records and aging calendars cannot be migrated to a paper ledger — once in, always in |
| Natural acquirer pool exists | SGS, Bureau Veritas, CSQA, TeamSystem all motivated buyers |
| Sector growing 7.7% YoY | TAM is expanding, not contracting |
| Italian speaker on Barcelona team | Direct access to decision-makers without language barrier |
| Expansion path is clear | Italy cheese → Italy wine → Spain olive oil → France AOC → Pan-EU |
| High NRR potential | Compliance software is not cancelled when times are hard — regulatory requirements don't disappear |

---

## Summary — The One-Page Version

**What:** B2B SaaS — mobile app + webapp for Italian DOP/IGP certified producers to manage compliance documentation without specialist knowledge.

**Who:** Medium industrial producers (10–80 employees) making DOP/IGP certified products — cheeses, cured meats, balsamic vinegar, wine. Sweet spot: companies too large for paper, too small for enterprise ERP.

**How it works:** Producer logs daily batch data on a pre-configured mobile form (2 min/day). System validates against denomination rules automatically. At the end of each reporting period, system generates a pre-filled compliance declaration PDF. Producer uploads it to their control body portal (5 min). Audit packs generated on demand in 30 seconds instead of 2 days of binder-searching.

**Why now:** DLgs 51/2026 in force since May 2026. €20.7B sector, 7.7% growth, zero direct SaaS competitor.

**Start with:** Aceto Balsamico di Modena IGP — 300 producers, €889M sector, 93% export, all in Modena, all under CSQA. First email: info@balsamico.it.

**Revenue model:** €79–199/month per producer. Target: 20 customers at month 6 (€24K ARR) → 100 customers at month 18 (€130K ARR) → 1,500 customers at year 5 (€1.8M ARR).

**Exit:** €10–55M depending on scale, to SGS, Bureau Veritas, CSQA, TeamSystem, or a PE compliance roll-up.

---

*Sources: Ismea-Qualivita 2025 Report · ICQRF 2024 Annual Report (masaf.gov.it) · EU eAmbrosia GI register · EUIPO GIview · CSQA denomination portfolio (csqa.it) · ACCREDIA lab accreditation database · Windsor Drake SaaS Valuation Multiples 2026 · Axial SaaS M&A data 2025 · Fondazione Qualivita / Qualigeo*
