# Compliance Submission Service — Design Spec

**Date:** 2026-05-08
**Scope:** Denomination config system (Spec A) + compliance submission service with Postgres-backed job queue (Spec B)
**Denominations covered:** 36 Italian DOP/IGP products mapped in `scripts/submission_methods.csv`

---

## 1. Context and Goals

DOP/IGP producers must regularly submit two types of data to their control body:
1. **Lab analysis reports** — results from accredited laboratory tests
2. **Operational records** — daily/monthly production data collected by the producer

Each denomination's *piano di controllo* specifies exactly what to submit, how (channel), and to whom (control body). Channels found across 36 denominations:

| Channel | Automation | Count |
|---|---|---|
| PEC (certified email) | Automated — platform PEC via SMTP | most common |
| Email (non-certified) | Automated — platform email via SMTP | occasional fallback |
| CSQA web portal | Manual — skipped for now | common for dairy/cheese |
| SIAN telematic system | Manual — skipped for now | common for fruit/vegetables |
| PDF format (electronic) | Automated — attach and send | Mela Val di Non, Canicattì |
| Fax | Manual — skipped for now | Cipollotto Nocerino only |

**Model:** Producer-final (TurboTax-style). We generate documents and automate sending where possible. We never forge signatures or act without explicit producer trigger or pre-approved schedule.

**Submission model:**
- Platform PEC (option B): all outbound PEC sends go from a single platform PEC address. Producer receives a copy. Legal delivery receipt stored in `Submission` record.
- Manual channels: app returns instructions; no outbound call from our server.
- Triggers: manual (producer clicks Submit) and scheduled (recurring regulatory reports).

---

## 2. Decomposition

This spec covers two sub-systems built in sequence:

- **Spec A — Denomination Config System**: JSON configs for all 36 denominations encoding submission rules, validated by Zod at startup.
- **Spec B — Compliance Submission Service**: service layer, Postgres job queue, channel handlers, worker, and API routes.

---

## 3. Spec A — Denomination Config System

### 3.1 Config File Structure

One JSON file per denomination at `backend/src/denominations/configs/<slug>.json`.

```jsonc
{
  "id": "asiago",
  "name": "Asiago DOP",
  "type": "DOP",
  "control_body": {
    "name": "CSQA Certificazioni Srl",
    "type": "csqa",
    "pec": "regolamentato@pec.csqa.it",
    "email": "regolamentato@csqa.it",
    "address": "via S. Gaetano, 74, 36016 Thiene (VI)"
  },
  "submission_rules": [
    {
      "id": "monthly-production-report",
      "doc_type": "notification",
      "label": "Comunicazione mensile produzioni",
      "channel": "web_portal",
      "automation": "manual",
      "recipient": "csqa",
      "schedule": { "frequency": "monthly", "due_day": 15 },
      "instructions": "Accedere al portale CSQA dedicato entro il 15 del mese successivo. Compilare le maschere relative alle quantità prodotte e cedute."
    },
    {
      "id": "self-monitoring-records",
      "doc_type": "self_monitoring",
      "label": "Documenti autocontrollo",
      "channel": "pec",
      "automation": "automated",
      "recipient": "csqa",
      "schedule": null,
      "instructions": null
    }
  ]
}
```

**Field definitions:**

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable slug matching directory name |
| `name` | string | Full official denomination name |
| `type` | `"DOP" \| "IGP"` | Designation type |
| `control_body.type` | `"csqa" \| "check_fruit" \| "consortium" \| "ministry"` | Control body category |
| `submission_rules[].doc_type` | enum | `lab_analysis \| register \| declaration \| notification \| application_form \| self_monitoring \| label \| document_generic` |
| `submission_rules[].channel` | enum | `pec \| email \| web_portal \| telematic_sian \| fax \| pdf_format` |
| `submission_rules[].automation` | `"automated" \| "manual"` | Whether platform sends or producer does |
| `submission_rules[].schedule` | `null \| { frequency, due_day }` | Null = one-off; otherwise recurring |
| `submission_rules[].instructions` | `string \| null` | Shown in UI when `automation = manual` |

### 3.2 Seed Script

`scripts/seed_denomination_configs.py` reads `scripts/submission_methods.csv` and generates the 36 JSON files as a starting-point scaffold. Generated files are manually verified and enriched (exact PEC addresses, due dates, Italian labels) before committing.

### 3.3 Zod Validation

`backend/src/denominations/types.ts` exports the Zod schema. `backend/src/denominations/loader.ts` reads all configs at startup, validates each, and throws with the file name if any fails. Missing or malformed configs are boot-time errors — never silent.

`DenominationService.getConfig(id)` and `DenominationService.getRule(denominationId, ruleId)` are the only access points. No other code reads JSON directly.

---

## 4. Spec B — Compliance Submission Service

### 4.1 Database Models

```prisma
model SubmissionSchedule {
  id              String   @id @default(cuid())
  producerId      String
  denominationId  String
  ruleId          String
  active          Boolean  @default(true)
  nextRunAt       DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  producer        User     @relation(fields: [producerId], references: [id])
  jobs            SubmissionJob[]

  @@unique([producerId, denominationId, ruleId])
}

model SubmissionJob {
  id              String            @id @default(cuid())
  scheduleId      String?
  producerId      String
  denominationId  String
  ruleId          String
  status          SubmissionJobStatus @default(pending)
  runAt           DateTime
  attempts        Int               @default(0)
  maxAttempts     Int               @default(3)
  payload         Json
  errorMessage    String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  schedule        SubmissionSchedule? @relation(fields: [scheduleId], references: [id])
  producer        User              @relation(fields: [producerId], references: [id])
  submission      Submission?
}

model Submission {
  id              String           @id @default(cuid())
  jobId           String           @unique
  producerId      String
  denominationId  String
  ruleId          String
  channel         String
  status          SubmissionStatus
  recipient       String?
  sentAt          DateTime?
  externalRef     String?          // SMTP message ID, stored as proof of delivery
  errorMessage    String?
  createdAt       DateTime         @default(now())

  job             SubmissionJob    @relation(fields: [jobId], references: [id])
  producer        User             @relation(fields: [producerId], references: [id])
}

enum SubmissionJobStatus {
  pending
  processing
  done
  failed
  dead
}

enum SubmissionStatus {
  sent
  failed
  manual_pending
}
```

**Design notes:**
- `Submission` is append-only (no updates after creation). Full audit trail.
- `SubmissionJob` and `SubmissionSchedule` are decoupled: a schedule is the intent; jobs are executions.
- `@@unique([producerId, denominationId, ruleId])` on `SubmissionSchedule` prevents duplicate recurring subscriptions.

### 4.2 Service Layer

```
backend/src/services/
├── denominationService.ts      # Config loader and cache
├── submissionService.ts        # Orchestrator
├── jobWorker.ts                # Postgres-backed queue worker
└── channels/
    ├── index.ts                # ChannelRegistry (map of channel → handler)
    ├── pecChannel.ts           # SMTP send via platform PEC
    ├── emailChannel.ts         # SMTP send via platform email (AWS SES)
    └── manualChannel.ts        # No-op, returns instructions string
```

**`SubmissionService.submit(producerId, denominationId, ruleId, payload)`**
1. Loads rule from `DenominationService`
2. If `automation = manual`: writes `Submission(status=manual_pending)`, returns `{ type: 'manual', instructions }`
3. If `automation = automated`: writes `SubmissionJob(runAt=now, status=pending)`, returns `{ type: 'queued', jobId }`

**`SubmissionService.scheduleRecurring(producerId, denominationId, ruleId)`**
1. Validates rule has a `schedule` field
2. Calculates `nextRunAt`: if today < `schedule.due_day` of current month → this month's due date; otherwise → next month's due date. Always at 08:00 local time.
3. Upserts `SubmissionSchedule(active=true)` (unique constraint prevents duplicates)

**`SubmissionService.processJob(job)`** — called by worker only:
1. Loads rule + control body from denomination config
2. Looks up handler in `ChannelRegistry`
3. Calls `handler.send(job, rule, controlBody)`
4. On success: writes `Submission(status=sent, sentAt=now)`, marks job `done`, inserts next job if schedule exists
5. On failure: increments `attempts`; if `attempts < maxAttempts` reschedules with backoff (5min → 30min → 2h); otherwise marks `dead`

**`ChannelHandler` interface:**
```typescript
interface ChannelHandler {
  send(
    job: SubmissionJob,
    rule: SubmissionRule,
    controlBody: ControlBody
  ): Promise<{ success: boolean; recipient: string; error?: string }>
}
```

**`JobWorker`:**
- Polls every 60 seconds: `SELECT ... WHERE status=pending AND runAt<=now LIMIT 10`
- Marks selected rows `processing` atomically (UPDATE ... WHERE status=pending — prevents double-processing)
- Processes each job, writes outcome
- Backoff schedule: attempt 1 → +5min, attempt 2 → +30min, attempt 3 → +2h, then `dead`
- Started in `backend/src/index.ts` alongside the Express server

### 4.3 Channel Handlers

**`PecChannelHandler`** (and `EmailChannelHandler`):
- Uses `nodemailer` with SMTP transport configured via env vars (`PEC_SMTP_HOST`, `PEC_SMTP_PORT`, `PEC_SMTP_USER`, `PEC_SMTP_PASS`, `PEC_FROM_ADDRESS`)
- Attaches document as PDF buffer
- Subject line: `[{denominationName}] {rule.label} — {ISO date}`
- Body: Italian-language template with producer details and submission reference
- Stores recipient PEC/email address in `Submission.recipient`; stores SMTP message ID in `Submission.externalRef` as proof of delivery
- BCCs the producer's own email address (from their user profile) so they have a copy in their inbox

**`ManualChannelHandler`**:
- Returns `{ success: true, recipient: 'manual', error: undefined }`
- Instructions are taken from the denomination config rule, not hardcoded

### 4.4 API Routes

```
POST   /submissions
       Auth: required
       Body: { denominationId: string, ruleId: string, payload: unknown }
       → 201 { type: 'queued', jobId } | { type: 'manual', instructions }

GET    /submissions
       Auth: required
       Query: denominationId?, status?, page?, limit?
       → 200 { submissions: Submission[], total, page }

GET    /submissions/:id
       Auth: required
       → 200 Submission | 404

POST   /submissions/schedules
       Auth: required
       Body: { denominationId: string, ruleId: string }
       → 201 SubmissionSchedule

GET    /submissions/schedules
       Auth: required
       → 200 { schedules: SubmissionSchedule[] }

DELETE /submissions/schedules/:id
       Auth: required
       → 204 (sets active=false, preserves history)
```

All routes: `producerId` comes from JWT payload only — never from request body.

### 4.5 Frontend Integration

- **`DocumentsPage`**: calls `GET /submissions` (replaces localStorage). Shows status badges (sent / manual_pending / failed).
- **`BatchForm`** / document generation screens: "Submit" button calls `POST /submissions`. On `type=manual`, shows the instructions in a modal. On `type=queued`, shows a toast "Invio in corso".
- **`CalendarPage`**: calls `GET /submissions/schedules` to show upcoming recurring submissions alongside batch deadlines.
- All data fetching via TanStack Query. No `useEffect` fetches.

---

## 5. Testing Strategy

### Unit tests (Jest, no DB)
- **`DenominationService`**: load each of the 36 configs, assert Zod passes, assert `channel` and `automation` fields are correctly typed. One test file per denomination.
- **`ChannelRegistry` handlers**: inject a mock `nodemailer` transport. Assert correct `to`, `subject`, `attachments` for a PEC send. Assert `ManualChannelHandler` returns instructions string.
- **`JobWorker`**: inject fake clock + fake Prisma client. Assert retry backoff intervals, `dead` status after `maxAttempts=3`, next-occurrence insertion for recurring jobs after success.

### Integration tests (Supertest + real Postgres)
- `POST /submissions` with `pec` rule → `SubmissionJob` row created, `runAt ≈ now`, correct `channel` and `payload`.
- `POST /submissions` with `web_portal` rule → `Submission` row created with `status=manual_pending`, instructions in response.
- `POST /submissions/schedules` → `SubmissionSchedule` created, `nextRunAt` matches expected due date for the rule.
- `DELETE /submissions/schedules/:id` → `active=false`, existing jobs unaffected.
- Worker integration tick: seed a `SubmissionJob` with `runAt` in the past, run one tick with SMTP mocked, assert `Submission(status=sent)` written.

### PDF attachment test
- Assert PEC submission for a declaration doc type attaches a valid PDF buffer.
- Extracted text must contain denomination name and producer ID.
- Clock injected for deterministic dates.

---

## 6. Env Vars Required

```
# Platform PEC / Email
PEC_SMTP_HOST=
PEC_SMTP_PORT=465
PEC_SMTP_USER=
PEC_SMTP_PASS=
PEC_FROM_ADDRESS=compliance@dopcomply.it

# Platform email fallback (AWS SES)
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=
EMAIL_SMTP_PASS=
EMAIL_FROM_ADDRESS=no-reply@dopcomply.it

# Worker
JOB_WORKER_POLL_INTERVAL_SECONDS=60
JOB_WORKER_BATCH_SIZE=10
```

All loaded through the existing `config/env.ts` Zod validator. Missing required vars → fail-fast at startup.

---

## 7. Out of Scope (Future Plans)

- CSQA portal automation (requires per-producer credentials)
- SIAN integration (requires SPID/CNS authentication)
- Producer's own PEC credentials (upgrade from platform PEC)
- BullMQ / Redis queue (upgrade when volume justifies it — architecture is ready)
- Fax channel (Cipollotto Nocerino only — one product, legacy channel)
- Lab report PDF extraction via Claude API (Plan 2)
