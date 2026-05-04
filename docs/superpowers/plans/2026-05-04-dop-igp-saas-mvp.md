# DOP/IGP Compliance SaaS — Phase 1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core compliance workflow for Aceto Balsamico di Modena IGP producers — batch logging with real-time rule validation, aging calendar tracking, and automated CSQA declaration PDF generation.

**Architecture:** Node.js/Express backend with PostgreSQL (via Prisma) exposes a REST API consumed by a React SPA. A denomination config system (JSON per denomination) drives all validation logic and form field rendering, keeping the rule engine purely data-driven. PDF generation uses PDFKit. Denominations beyond ABM IGP are added by dropping a new JSON file — no code changes required.

**Tech Stack:** Node.js 20, Express, TypeScript, Prisma ORM, PostgreSQL 16, React 18, Vite, Tailwind CSS 3, PDFKit, JSON Web Tokens, Jest + Supertest (backend), Vitest (frontend), Docker Compose

---

## Out of Scope (Separate Plans)

- Lab report PDF extraction via Claude API — Plan 2
- Aging calendar push/email reminders — Plan 3
- React Native mobile app — Plan 4
- Stripe + Nexi payments — Plan 5
- SPID Italian national auth — Plan 6

---

## File Structure

```
dop-compliance/
├── docker-compose.yml                   # Postgres + backend + frontend
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── prisma/
│   │   └── schema.prisma                # All DB models
│   ├── src/
│   │   ├── index.ts                     # Express app bootstrap
│   │   ├── config/
│   │   │   └── env.ts                   # Typed env vars with defaults
│   │   ├── denominations/
│   │   │   ├── types.ts                 # DenominationConfig + FieldConfig types
│   │   │   ├── loader.ts                # Loads JSON config by denomination ID
│   │   │   └── configs/
│   │   │       └── abm-igp.json         # ABM IGP denomination config
│   │   ├── engine/
│   │   │   └── validator.ts             # Rule engine: validate batch fields against config
│   │   ├── middleware/
│   │   │   └── auth.ts                  # JWT auth middleware + AuthRequest type
│   │   ├── routes/
│   │   │   ├── auth.ts                  # POST /auth/register, POST /auth/login
│   │   │   ├── batches.ts               # CRUD /batches, includes aging entry creation
│   │   │   ├── denominations.ts         # GET /denominations/:id (config for frontend)
│   │   │   └── declarations.ts          # POST /declarations/generate (returns PDF)
│   │   └── services/
│   │       ├── pdfGenerator.ts          # Generates CSQA declaration PDF buffer
│   │       └── submissionChecklist.ts   # Generates one-page portal upload instructions
│   └── tests/
│       ├── engine/
│       │   └── validator.test.ts
│       ├── routes/
│       │   ├── auth.test.ts
│       │   └── batches.test.ts
│       └── services/
│           └── pdfGenerator.test.ts
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx                      # React Router routes
        ├── api/
        │   └── client.ts                # Axios instance + typed API calls
        ├── context/
        │   └── AuthContext.tsx          # JWT storage, user context, logout
        ├── components/
        │   ├── ProtectedRoute.tsx        # Redirects unauthenticated users
        │   ├── BatchForm.tsx            # Dynamic form rendered from denomination config
        │   └── ValidationAlert.tsx      # Displays rule violations inline
        └── pages/
            ├── Login.tsx
            ├── Dashboard.tsx            # Batch list + pending aging calendar tasks
            ├── NewBatch.tsx             # Hosts BatchForm, submits to API
            └── Declarations.tsx         # Generate + download declaration PDF
```

---

## Task 1: Docker Compose + Project Scaffolding

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/jest.config.js`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`

- [ ] **Step 1: Create root docker-compose.yml**

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dop
      POSTGRES_PASSWORD: dop_secret
      POSTGRES_DB: dop_compliance
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'dop']
      interval: 5s
      timeout: 5s
      retries: 5
volumes:
  postgres_data:
```

- [ ] **Step 2: Create backend/package.json**

```json
{
  "name": "dop-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --runInBand",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.14.0",
    "bcrypt": "^5.1.1",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pdfkit": "^0.15.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "@types/pdfkit": "^0.13.4",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "nodemon": "^3.1.4",
    "prisma": "^5.14.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.1.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Create backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create backend/jest.config.js**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testPathPattern: '\\.test\\.ts$',
  setupFilesAfterFramework: [],
  globals: {
    'ts-jest': {
      tsconfig: {
        resolveJsonModule: true
      }
    }
  }
}
```

- [ ] **Step 5: Create frontend/package.json**

```json
{
  "name": "dop-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 6: Create frontend/vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

- [ ] **Step 7: Create frontend/tailwind.config.js**

```js
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: []
}
```

- [ ] **Step 8: Install dependencies and start Postgres**

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
docker-compose up -d postgres
```

Expected: Postgres container running on port 5432.

- [ ] **Step 9: Commit**

```bash
git add docker-compose.yml backend/package.json backend/tsconfig.json backend/jest.config.js frontend/package.json frontend/vite.config.ts frontend/tailwind.config.js
git commit -m "chore: project scaffolding — backend Express/TS, frontend React/Vite, Postgres docker-compose"
```

---

## Task 2: Database Schema (Prisma)

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/config/env.ts`

- [ ] **Step 1: Write failing test to verify DB connection**

Create `backend/tests/db.test.ts`:
```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://dop:dop_secret@localhost:5432/dop_compliance' } }
})

describe('database connection', () => {
  afterAll(() => prisma.$disconnect())

  it('connects to postgres', async () => {
    const result = await prisma.$queryRaw<[{ one: number }]>`SELECT 1 AS one`
    expect(result[0].one).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails (no schema yet)**

```bash
cd backend && npx ts-node -e "require('@prisma/client')" 2>&1 || true
npm test -- tests/db.test.ts
```

Expected: Error — `@prisma/client` did not initialize (no schema generated yet).

- [ ] **Step 3: Create backend/prisma/schema.prisma**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Producer {
  id           String        @id @default(cuid())
  name         String
  vatCode      String        @unique
  denomination String
  users        User[]
  batches      Batch[]
  declarations Declaration[]
  createdAt    DateTime      @default(now())
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  producerId   String
  producer     Producer @relation(fields: [producerId], references: [id])
  createdAt    DateTime @default(now())
}

model Batch {
  id           String       @id @default(cuid())
  batchCode    String
  producerId   String
  producer     Producer     @relation(fields: [producerId], references: [id])
  denomination String
  fields       Json
  violations   Json
  status       BatchStatus  @default(PENDING)
  agingEntries AgingEntry[]
  createdAt    DateTime     @default(now())
}

enum BatchStatus {
  PENDING
  VALIDATED
  FLAGGED
  DECLARED
}

model AgingEntry {
  id          String    @id @default(cuid())
  batchId     String
  batch       Batch     @relation(fields: [batchId], references: [id])
  dueDate     DateTime
  taskLabel   String
  completedAt DateTime?
  createdAt   DateTime  @default(now())
}

model Declaration {
  id         String   @id @default(cuid())
  producerId String
  producer   Producer @relation(fields: [producerId], references: [id])
  period     String
  batchIds   Json
  status     String   @default("draft")
  createdAt  DateTime @default(now())
}
```

- [ ] **Step 4: Create backend/src/config/env.ts**

```ts
export const env = {
  DATABASE_URL: process.env.DATABASE_URL
    ?? 'postgresql://dop:dop_secret@localhost:5432/dop_compliance',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  PORT: Number(process.env.PORT ?? 3000)
}
```

- [ ] **Step 5: Run migrations and generate Prisma client**

```bash
cd backend
DATABASE_URL=postgresql://dop:dop_secret@localhost:5432/dop_compliance npx prisma migrate dev --name init
npx prisma generate
```

Expected: Migration applied, `@prisma/client` generated with all models.

- [ ] **Step 6: Run DB connection test — expect PASS**

```bash
npm test -- tests/db.test.ts
```

Expected: PASS — `connects to postgres`.

- [ ] **Step 7: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/config/env.ts backend/prisma/migrations backend/tests/db.test.ts
git commit -m "feat: prisma schema — Producer, User, Batch, AgingEntry, Declaration models"
```

---

## Task 3: Auth Backend (Register + Login + JWT Middleware)

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/routes/auth.ts`
- Create: `backend/src/index.ts`
- Create: `backend/tests/routes/auth.test.ts`

- [ ] **Step 1: Write failing auth tests**

Create `backend/tests/routes/auth.test.ts`:
```ts
import request from 'supertest'
import { app } from '../../src/index'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@test-auth.com' } } })
  await prisma.producer.deleteMany({ where: { vatCode: { startsWith: 'IT-TEST-AUTH' } } })
  await prisma.$disconnect()
})

describe('POST /auth/register', () => {
  it('creates a producer+user and returns a JWT', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'admin@test-auth.com',
      password: 'password123',
      producerName: 'Acetaia Test SRL',
      vatCode: 'IT-TEST-AUTH-001',
      denomination: 'abm-igp'
    })
    expect(res.status).toBe(201)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.token.split('.').length).toBe(3) // valid JWT structure
  })

  it('rejects duplicate email', async () => {
    await request(app).post('/auth/register').send({
      email: 'dup@test-auth.com',
      password: 'password123',
      producerName: 'Dup SRL',
      vatCode: 'IT-TEST-AUTH-DUP',
      denomination: 'abm-igp'
    })
    const res = await request(app).post('/auth/register').send({
      email: 'dup@test-auth.com',
      password: 'other',
      producerName: 'Dup 2',
      vatCode: 'IT-TEST-AUTH-DUP2',
      denomination: 'abm-igp'
    })
    expect(res.status).toBe(409)
  })
})

describe('POST /auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/auth/register').send({
      email: 'login@test-auth.com',
      password: 'correctpassword',
      producerName: 'Login Test SRL',
      vatCode: 'IT-TEST-AUTH-LOGIN',
      denomination: 'abm-igp'
    })
  })

  it('returns JWT for valid credentials', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@test-auth.com',
      password: 'correctpassword'
    })
    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'login@test-auth.com',
      password: 'wrongpassword'
    })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- tests/routes/auth.test.ts
```

Expected: FAIL — `app` not found.

- [ ] **Step 3: Create backend/src/middleware/auth.ts**

```ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthRequest extends Request {
  userId?: string
  producerId?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const token = header.split(' ')[1]
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      userId: string
      producerId: string
    }
    req.userId = payload.userId
    req.producerId = payload.producerId
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
```

- [ ] **Step 4: Create backend/src/routes/auth.ts**

```ts
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

const router = Router()
const prisma = new PrismaClient()

router.post('/register', async (req, res) => {
  const { email, password, producerName, vatCode, denomination } = req.body

  if (!email || !password || !producerName || !vatCode || !denomination) {
    return res.status(400).json({ error: 'All fields required' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'Email already registered' })

  const passwordHash = await bcrypt.hash(password, 10)

  const producer = await prisma.producer.create({
    data: { name: producerName, vatCode, denomination }
  })

  const user = await prisma.user.create({
    data: { email, passwordHash, producerId: producer.id }
  })

  const token = jwt.sign(
    { userId: user.id, producerId: producer.id },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return res.status(201).json({ token })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { userId: user.id, producerId: user.producerId },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  return res.json({ token })
})

export default router
```

- [ ] **Step 5: Create backend/src/index.ts**

```ts
import express from 'express'
import authRoutes from './routes/auth'
import batchRoutes from './routes/batches'
import denominationRoutes from './routes/denominations'
import declarationRoutes from './routes/declarations'
import { env } from './config/env'

export const app = express()

app.use(express.json())

app.use('/auth', authRoutes)
app.use('/batches', batchRoutes)
app.use('/denominations', denominationRoutes)
app.use('/declarations', declarationRoutes)

if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`DOP Compliance API listening on port ${env.PORT}`)
  })
}
```

- [ ] **Step 6: Run auth tests — expect PASS**

```bash
npm test -- tests/routes/auth.test.ts
```

Expected: PASS — all 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/middleware/auth.ts backend/src/routes/auth.ts backend/src/index.ts backend/tests/routes/auth.test.ts
git commit -m "feat: auth — JWT register/login, requireAuth middleware"
```

---

## Task 4: Denomination Config Types + ABM IGP JSON

**Files:**
- Create: `backend/src/denominations/types.ts`
- Create: `backend/src/denominations/loader.ts`
- Create: `backend/src/denominations/configs/abm-igp.json`
- Create: `backend/src/routes/denominations.ts`

- [ ] **Step 1: Create backend/src/denominations/types.ts**

```ts
export interface FieldThreshold {
  min?: number
  max?: number
  errorMessage: string
}

export interface FieldConfig {
  id: string
  label: string
  labelIt: string
  unit: string
  type: 'number' | 'text' | 'date' | 'select'
  required: boolean
  min?: number
  options?: string[]
  threshold?: FieldThreshold
}

export interface AgingTask {
  dayOffset: number
  label: string
  labelIt: string
}

export interface SubmissionPortal {
  name: string
  url: string
  instructions: string[]
}

export interface DenominationConfig {
  id: string
  name: string
  nameIt: string
  controlBody: string
  reportingFrequency: 'monthly' | 'quarterly'
  submissionPortal: SubmissionPortal
  batchFields: FieldConfig[]
  agingTasks: AgingTask[]
}
```

- [ ] **Step 2: Create backend/src/denominations/configs/abm-igp.json**

```json
{
  "id": "abm-igp",
  "name": "Aceto Balsamico di Modena IGP",
  "nameIt": "Aceto Balsamico di Modena IGP",
  "controlBody": "CSQA",
  "reportingFrequency": "monthly",
  "submissionPortal": {
    "name": "CSQA Client Portal",
    "url": "https://www.csqa.it/it-it/accedi",
    "instructions": [
      "1. Accedi al portale CSQA con le tue credenziali aziendali su csqa.it/it-it/accedi",
      "2. Naviga su 'Documentazione' > 'Dichiarazioni Periodiche'.",
      "3. Clicca 'Nuova Dichiarazione' e seleziona la denominazione 'Aceto Balsamico di Modena IGP'.",
      "4. Carica il file PDF generato dal sistema. Il nome del file è indicato nel documento.",
      "5. Compila il campo 'Periodo di riferimento' con il mese e anno indicati nel documento.",
      "6. Clicca 'Invia' per completare la trasmissione. Conserva la ricevuta di invio."
    ]
  },
  "batchFields": [
    {
      "id": "supplierId",
      "label": "Supplier ID",
      "labelIt": "Codice fornitore",
      "unit": "",
      "type": "text",
      "required": true
    },
    {
      "id": "grapeVariety",
      "label": "Grape variety",
      "labelIt": "Varietà di uva",
      "unit": "",
      "type": "select",
      "required": true,
      "options": [
        "Lambrusco",
        "Sangiovese",
        "Trebbiano",
        "Albana",
        "Ancellotta",
        "Fortana",
        "Montuni"
      ]
    },
    {
      "id": "mustVolumeLiters",
      "label": "Cooked must volume",
      "labelIt": "Volume di mosto cotto (L)",
      "unit": "L",
      "type": "number",
      "required": true,
      "min": 1
    },
    {
      "id": "initialAcidity",
      "label": "Initial total acidity",
      "labelIt": "Acidità totale iniziale",
      "unit": "g/100ml",
      "type": "number",
      "required": true,
      "threshold": {
        "min": 6.0,
        "errorMessage": "L'acidità totale deve essere ≥ 6.0 g/100ml (disciplinare ABM IGP, art. 6)"
      }
    },
    {
      "id": "sugarContent",
      "label": "Sugar content",
      "labelIt": "Contenuto zuccherino",
      "unit": "g/L",
      "type": "number",
      "required": true,
      "threshold": {
        "min": 105,
        "errorMessage": "Il contenuto zuccherino deve essere ≥ 105 g/L (disciplinare ABM IGP, art. 6)"
      }
    },
    {
      "id": "agingMonths",
      "label": "Planned aging (months)",
      "labelIt": "Mesi di invecchiamento previsti",
      "unit": "mesi",
      "type": "number",
      "required": true,
      "threshold": {
        "min": 2,
        "errorMessage": "L'invecchiamento minimo è 2 mesi per ABM IGP (disciplinare art. 5)"
      }
    },
    {
      "id": "barrelWoodType",
      "label": "Barrel wood type",
      "labelIt": "Tipo di legno della botte",
      "unit": "",
      "type": "select",
      "required": true,
      "options": [
        "Quercia (Oak)",
        "Castagno (Chestnut)",
        "Gelso (Mulberry)",
        "Frassino (Ash)",
        "Ciliegio (Cherry)",
        "Robinia (Acacia)",
        "Ginepro (Juniper)"
      ]
    },
    {
      "id": "startDate",
      "label": "Production start date",
      "labelIt": "Data inizio produzione",
      "unit": "",
      "type": "date",
      "required": true
    }
  ],
  "agingTasks": [
    {
      "dayOffset": 30,
      "label": "30-day barrel inspection",
      "labelIt": "Controllo botte 30 giorni"
    },
    {
      "dayOffset": 60,
      "label": "60-day volume verification",
      "labelIt": "Verifica volume 60 giorni"
    }
  ]
}
```

- [ ] **Step 3: Create backend/src/denominations/loader.ts**

```ts
import { DenominationConfig } from './types'
import abmIgp from './configs/abm-igp.json'

const configs: Record<string, DenominationConfig> = {
  'abm-igp': abmIgp as DenominationConfig
}

export function loadDenomination(id: string): DenominationConfig {
  const config = configs[id]
  if (!config) throw new Error(`Unknown denomination: ${id}`)
  return config
}

export function listDenominations(): Pick<DenominationConfig, 'id' | 'name' | 'nameIt' | 'controlBody'>[] {
  return Object.values(configs).map(({ id, name, nameIt, controlBody }) => ({
    id, name, nameIt, controlBody
  }))
}
```

- [ ] **Step 4: Create backend/src/routes/denominations.ts**

```ts
import { Router } from 'express'
import { loadDenomination, listDenominations } from '../denominations/loader'

const router = Router()

router.get('/', (_req, res) => {
  res.json(listDenominations())
})

router.get('/:id', (req, res) => {
  try {
    const config = loadDenomination(req.params.id)
    res.json(config)
  } catch {
    res.status(404).json({ error: `Denomination '${req.params.id}' not found` })
  }
})

export default router
```

- [ ] **Step 5: Verify denomination endpoint manually**

```bash
cd backend && npm run dev &
curl http://localhost:3000/denominations/abm-igp | jq '.batchFields | length'
```

Expected output: `8` (eight configured fields).

- [ ] **Step 6: Commit**

```bash
git add backend/src/denominations/ backend/src/routes/denominations.ts
git commit -m "feat: denomination config system — ABM IGP JSON config + loader + GET /denominations endpoint"
```

---

## Task 5: Rule Engine Validator

**Files:**
- Create: `backend/src/engine/validator.ts`
- Create: `backend/tests/engine/validator.test.ts`

- [ ] **Step 1: Write failing validator tests**

Create `backend/tests/engine/validator.test.ts`:
```ts
import { validateBatch } from '../../src/engine/validator'
import { DenominationConfig } from '../../src/denominations/types'
import abmConfig from '../../src/denominations/configs/abm-igp.json'

const config = abmConfig as DenominationConfig

const validFields = {
  supplierId: 'SUPPLIER-001',
  grapeVariety: 'Trebbiano',
  mustVolumeLiters: 500,
  initialAcidity: 6.5,
  sugarContent: 120,
  agingMonths: 3,
  barrelWoodType: 'Quercia (Oak)',
  startDate: '2026-04-01'
}

describe('validateBatch — ABM IGP', () => {
  it('returns valid for a fully compliant batch', () => {
    const result = validateBatch(validFields, config)
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('flags acidity below 6.0 g/100ml minimum', () => {
    const fields = { ...validFields, initialAcidity: 5.8 }
    const result = validateBatch(fields, config)
    expect(result.valid).toBe(false)
    const v = result.violations.find(v => v.fieldId === 'initialAcidity')
    expect(v).toBeDefined()
    expect(v!.message).toContain('6.0')
  })

  it('flags sugar content below 105 g/L minimum', () => {
    const fields = { ...validFields, sugarContent: 95 }
    const result = validateBatch(fields, config)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.fieldId === 'sugarContent')).toBe(true)
  })

  it('flags aging months below 2 month minimum', () => {
    const fields = { ...validFields, agingMonths: 1 }
    const result = validateBatch(fields, config)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.fieldId === 'agingMonths')).toBe(true)
  })

  it('flags missing required supplierId', () => {
    const { supplierId: _omit, ...fields } = validFields
    const result = validateBatch(fields, config)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.fieldId === 'supplierId')).toBe(true)
  })

  it('flags invalid grape variety not in allowed options', () => {
    const fields = { ...validFields, grapeVariety: 'Chardonnay' }
    const result = validateBatch(fields, config)
    expect(result.valid).toBe(false)
    expect(result.violations.some(v => v.fieldId === 'grapeVariety')).toBe(true)
  })

  it('accumulates multiple violations', () => {
    const fields = { ...validFields, initialAcidity: 5.0, sugarContent: 80, agingMonths: 1 }
    const result = validateBatch(fields, config)
    expect(result.valid).toBe(false)
    expect(result.violations.length).toBeGreaterThanOrEqual(3)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- tests/engine/validator.test.ts
```

Expected: FAIL — `validateBatch` not found.

- [ ] **Step 3: Create backend/src/engine/validator.ts**

```ts
import { DenominationConfig } from '../denominations/types'

export interface ValidationViolation {
  fieldId: string
  fieldLabel: string
  value: unknown
  message: string
}

export interface ValidationResult {
  valid: boolean
  violations: ValidationViolation[]
}

export function validateBatch(
  fields: Record<string, unknown>,
  config: DenominationConfig
): ValidationResult {
  const violations: ValidationViolation[] = []

  for (const field of config.batchFields) {
    const value = fields[field.id]
    const isEmpty = value === undefined || value === null || value === ''

    if (field.required && isEmpty) {
      violations.push({
        fieldId: field.id,
        fieldLabel: field.labelIt,
        value: '',
        message: `Il campo "${field.labelIt}" è obbligatorio`
      })
      continue
    }

    if (isEmpty) continue

    if (field.type === 'number' && field.threshold) {
      const num = Number(value)
      const { min, max, errorMessage } = field.threshold
      if ((min !== undefined && num < min) || (max !== undefined && num > max)) {
        violations.push({ fieldId: field.id, fieldLabel: field.labelIt, value: num, message: errorMessage })
      }
    }

    if (field.type === 'select' && field.options) {
      if (!field.options.includes(String(value))) {
        violations.push({
          fieldId: field.id,
          fieldLabel: field.labelIt,
          value: String(value),
          message: `Valore non valido per "${field.labelIt}". Valori accettati: ${field.options.join(', ')}`
        })
      }
    }
  }

  return { valid: violations.length === 0, violations }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/engine/validator.test.ts
```

Expected: PASS — all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/engine/validator.ts backend/tests/engine/validator.test.ts
git commit -m "feat: rule engine validator — validates batch fields against denomination config thresholds"
```

---

## Task 6: Batches API

**Files:**
- Create: `backend/src/routes/batches.ts`
- Create: `backend/tests/routes/batches.test.ts`

- [ ] **Step 1: Write failing batch route tests**

Create `backend/tests/routes/batches.test.ts`:
```ts
import request from 'supertest'
import { app } from '../../src/index'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
let authToken: string
let producerId: string

beforeAll(async () => {
  const res = await request(app).post('/auth/register').send({
    email: 'batch@test-batches.com',
    password: 'pass123',
    producerName: 'Acetaia Batch Test',
    vatCode: 'IT-TEST-BATCH-001',
    denomination: 'abm-igp'
  })
  authToken = res.body.token
  const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString())
  producerId = payload.producerId
})

afterAll(async () => {
  await prisma.agingEntry.deleteMany({ where: { batch: { producerId } } })
  await prisma.batch.deleteMany({ where: { producerId } })
  await prisma.user.deleteMany({ where: { email: 'batch@test-batches.com' } })
  await prisma.producer.deleteMany({ where: { id: producerId } })
  await prisma.$disconnect()
})

const validBatch = {
  batchCode: 'ABM-2026-001',
  fields: {
    supplierId: 'SUP-001',
    grapeVariety: 'Trebbiano',
    mustVolumeLiters: 300,
    initialAcidity: 6.2,
    sugarContent: 110,
    agingMonths: 3,
    barrelWoodType: 'Quercia (Oak)',
    startDate: '2026-04-01'
  }
}

describe('POST /batches', () => {
  it('creates a validated batch for a compliant submission', async () => {
    const res = await request(app)
      .post('/batches')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validBatch)
    expect(res.status).toBe(201)
    expect(res.body.batch.status).toBe('VALIDATED')
    expect(res.body.violations).toHaveLength(0)
  })

  it('creates a FLAGGED batch and returns violations for non-compliant submission', async () => {
    const res = await request(app)
      .post('/batches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        batchCode: 'ABM-2026-BAD',
        fields: { ...validBatch.fields, initialAcidity: 3.0 }
      })
    expect(res.status).toBe(201)
    expect(res.body.batch.status).toBe('FLAGGED')
    expect(res.body.violations.length).toBeGreaterThan(0)
    expect(res.body.violations[0].fieldId).toBe('initialAcidity')
  })

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/batches').send(validBatch)
    expect(res.status).toBe(401)
  })
})

describe('GET /batches', () => {
  it('lists batches for the authenticated producer', async () => {
    const res = await request(app)
      .get('/batches')
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })
})

describe('GET /batches/:id', () => {
  it('returns batch with aging entries', async () => {
    const create = await request(app)
      .post('/batches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ batchCode: 'ABM-AGING-TEST', fields: validBatch.fields })
    const id = create.body.batch.id

    const res = await request(app)
      .get(`/batches/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    expect(res.body.agingEntries).toHaveLength(2) // 2 aging tasks in ABM config
    expect(res.body.agingEntries[0].taskLabel).toContain('30')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- tests/routes/batches.test.ts
```

Expected: FAIL — routes not defined.

- [ ] **Step 3: Create backend/src/routes/batches.ts**

```ts
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { loadDenomination } from '../denominations/loader'
import { validateBatch } from '../engine/validator'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

router.post('/', async (req: AuthRequest, res) => {
  const { batchCode, fields } = req.body
  const producerId = req.producerId!

  if (!batchCode || !fields) {
    return res.status(400).json({ error: 'batchCode and fields required' })
  }

  const producer = await prisma.producer.findUnique({ where: { id: producerId } })
  if (!producer) return res.status(404).json({ error: 'Producer not found' })

  const config = loadDenomination(producer.denomination)
  const { valid, violations } = validateBatch(fields, config)

  const batch = await prisma.batch.create({
    data: {
      batchCode,
      producerId,
      denomination: producer.denomination,
      fields,
      violations,
      status: valid ? 'VALIDATED' : 'FLAGGED'
    }
  })

  if (config.agingTasks.length > 0 && fields.startDate) {
    const startDate = new Date(fields.startDate as string)
    await prisma.agingEntry.createMany({
      data: config.agingTasks.map(task => ({
        batchId: batch.id,
        dueDate: new Date(startDate.getTime() + task.dayOffset * 86_400_000),
        taskLabel: task.labelIt
      }))
    })
  }

  return res.status(201).json({ batch, violations })
})

router.get('/', async (req: AuthRequest, res) => {
  const batches = await prisma.batch.findMany({
    where: { producerId: req.producerId },
    orderBy: { createdAt: 'desc' }
  })
  return res.json(batches)
})

router.get('/:id', async (req: AuthRequest, res) => {
  const batch = await prisma.batch.findFirst({
    where: { id: req.params.id, producerId: req.producerId },
    include: { agingEntries: { orderBy: { dueDate: 'asc' } } }
  })
  if (!batch) return res.status(404).json({ error: 'Batch not found' })
  return res.json(batch)
})

router.patch('/:id/aging/:agingId/complete', async (req: AuthRequest, res) => {
  const batch = await prisma.batch.findFirst({
    where: { id: req.params.id, producerId: req.producerId }
  })
  if (!batch) return res.status(404).json({ error: 'Batch not found' })

  const entry = await prisma.agingEntry.update({
    where: { id: req.params.agingId },
    data: { completedAt: new Date() }
  })
  return res.json(entry)
})

export default router
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/routes/batches.test.ts
```

Expected: PASS — all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/batches.ts backend/tests/routes/batches.test.ts
git commit -m "feat: batches API — create with rule validation, list, detail with aging entries, complete aging task"
```

---

## Task 7: Declaration PDF Generator Service

**Files:**
- Create: `backend/src/services/pdfGenerator.ts`
- Create: `backend/src/services/submissionChecklist.ts`
- Create: `backend/tests/services/pdfGenerator.test.ts`

- [ ] **Step 1: Write failing PDF generator tests**

Create `backend/tests/services/pdfGenerator.test.ts`:
```ts
import { generateCsqaDeclaration } from '../../src/services/pdfGenerator'
import { generateSubmissionChecklist } from '../../src/services/submissionChecklist'
import { Producer, Batch } from '@prisma/client'

const mockProducer: Producer = {
  id: 'prod-1',
  name: 'Acetaia Test SRL',
  vatCode: 'IT01234567890',
  denomination: 'abm-igp',
  createdAt: new Date()
}

const mockBatch: Batch = {
  id: 'batch-1',
  batchCode: 'ABM-2026-001',
  producerId: 'prod-1',
  denomination: 'abm-igp',
  fields: {
    supplierId: 'SUP-001',
    grapeVariety: 'Trebbiano',
    mustVolumeLiters: 300,
    initialAcidity: 6.2,
    sugarContent: 110,
    agingMonths: 3,
    barrelWoodType: 'Quercia (Oak)',
    startDate: '2026-04-01'
  },
  violations: [],
  status: 'VALIDATED',
  createdAt: new Date('2026-04-15')
}

describe('generateCsqaDeclaration', () => {
  it('returns a non-empty PDF buffer', async () => {
    const buf = await generateCsqaDeclaration(mockProducer, [mockBatch], '2026-04')
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(500)
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  })

  it('generates a PDF for an empty batch list', async () => {
    const buf = await generateCsqaDeclaration(mockProducer, [], '2026-04')
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  })
})

describe('generateSubmissionChecklist', () => {
  it('returns a non-empty PDF buffer', async () => {
    const buf = await generateSubmissionChecklist(mockProducer, '2026-04', 'abm-igp')
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.slice(0, 4).toString()).toBe('%PDF')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npm test -- tests/services/pdfGenerator.test.ts
```

Expected: FAIL — service files not found.

- [ ] **Step 3: Create backend/src/services/pdfGenerator.ts**

```ts
import PDFDocument from 'pdfkit'
import { Producer, Batch } from '@prisma/client'

export function generateCsqaDeclaration(
  producer: Producer,
  batches: Batch[],
  period: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Header
    doc.fontSize(13).font('Helvetica-Bold')
       .text('DICHIARAZIONE PERIODICA DI PRODUZIONE', { align: 'center' })
    doc.fontSize(10).font('Helvetica')
       .text('Aceto Balsamico di Modena IGP — Reg. CE n. 583/2009', { align: 'center' })
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown()

    // Metadata block
    doc.fontSize(9)
    doc.text(`Ente di controllo: CSQA Certificazioni Srl`)
    doc.text(`Periodo di riferimento: ${period}`)
    doc.text(`Data di compilazione: ${new Date().toLocaleDateString('it-IT')}`)
    doc.moveDown()

    // Producer block
    doc.font('Helvetica-Bold').text('PRODUTTORE')
    doc.font('Helvetica')
       .text(`Ragione sociale: ${producer.name}`)
       .text(`P.IVA / Codice fiscale: ${producer.vatCode}`)
    doc.moveDown()

    // Batch table
    doc.font('Helvetica-Bold').text('RIEPILOGO LOTTI DI PRODUZIONE')
    doc.moveDown(0.3)

    const colX = { code: 50, date: 150, vol: 235, acidity: 310, sugar: 385, aging: 460 }
    const tableHeaderY = doc.y

    doc.fontSize(8).font('Helvetica-Bold')
    doc.text('Cod. Lotto',   colX.code,    tableHeaderY)
    doc.text('Data prod.',   colX.date,    tableHeaderY)
    doc.text('Vol. (L)',     colX.vol,     tableHeaderY)
    doc.text('Acid. g/100ml', colX.acidity, tableHeaderY)
    doc.text('Zucc. g/L',   colX.sugar,   tableHeaderY)
    doc.text('Inv. mesi',   colX.aging,   tableHeaderY)
    doc.moveDown(0.3)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.3)

    doc.font('Helvetica').fontSize(8)
    let totalVolume = 0

    for (const batch of batches) {
      const f = batch.fields as Record<string, unknown>
      const rowY = doc.y
      const vol = Number(f.mustVolumeLiters ?? 0)
      totalVolume += vol

      doc.text(String(batch.batchCode),                          colX.code,    rowY, { width: 95 })
      doc.text(new Date(String(f.startDate)).toLocaleDateString('it-IT'), colX.date, rowY, { width: 80 })
      doc.text(String(vol),                                      colX.vol,     rowY, { width: 70 })
      doc.text(String(f.initialAcidity ?? '—'),                  colX.acidity, rowY, { width: 70 })
      doc.text(String(f.sugarContent ?? '—'),                    colX.sugar,   rowY, { width: 70 })
      doc.text(String(f.agingMonths ?? '—'),                     colX.aging,   rowY, { width: 60 })
      doc.moveDown(0.8)
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.4)
    doc.font('Helvetica-Bold').fontSize(9)
       .text(`Totale lotti: ${batches.length}     Volume totale mosto: ${totalVolume} L`, 50)

    // Signature
    doc.moveDown(3)
    doc.font('Helvetica').fontSize(10)
       .text('Il/La sottoscritto/a dichiara che le informazioni riportate sono veritiere e complete.')
    doc.moveDown(2)
    doc.text('Luogo e data: _______________________________')
    doc.moveDown(1.5)
    doc.text('Firma e timbro del produttore: _______________________________')

    doc.end()
  })
}
```

- [ ] **Step 4: Create backend/src/services/submissionChecklist.ts**

```ts
import PDFDocument from 'pdfkit'
import { Producer } from '@prisma/client'
import { loadDenomination } from '../denominations/loader'

export function generateSubmissionChecklist(
  producer: Producer,
  period: string,
  denominationId: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const config = loadDenomination(denominationId)
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(14).font('Helvetica-Bold')
       .text('ISTRUZIONI PER LA TRASMISSIONE AL PORTALE', { align: 'center' })
    doc.fontSize(10).font('Helvetica')
       .text(`${config.nameIt} — ${config.controlBody}`, { align: 'center' })
    doc.moveDown()
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown()

    doc.fontSize(9)
    doc.text(`Produttore: ${producer.name}  |  P.IVA: ${producer.vatCode}`)
    doc.text(`Periodo: ${period}`)
    doc.text(`File da caricare: dichiarazione-${period}-${producer.vatCode}.pdf`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text(`Portale: ${config.submissionPortal.name}`)
    doc.font('Helvetica').text(`URL: ${config.submissionPortal.url}`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('PASSI DA SEGUIRE:')
    doc.font('Helvetica')
    for (const instruction of config.submissionPortal.instructions) {
      doc.moveDown(0.3)
      doc.text(instruction, { indent: 10 })
    }

    doc.moveDown(2)
    doc.fontSize(8).fillColor('grey')
       .text('Questo documento è generato automaticamente da DOP Compliance SaaS. Conserva la ricevuta di invio dal portale per ogni dichiarazione trasmessa.')

    doc.end()
  })
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test -- tests/services/pdfGenerator.test.ts
```

Expected: PASS — all 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/pdfGenerator.ts backend/src/services/submissionChecklist.ts backend/tests/services/pdfGenerator.test.ts
git commit -m "feat: PDF services — CSQA declaration generator and submission checklist generator"
```

---

## Task 8: Declarations API

**Files:**
- Create: `backend/src/routes/declarations.ts`

- [ ] **Step 1: Create backend/src/routes/declarations.ts**

```ts
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { generateCsqaDeclaration } from '../services/pdfGenerator'
import { generateSubmissionChecklist } from '../services/submissionChecklist'

const router = Router()
const prisma = new PrismaClient()

router.use(requireAuth)

router.post('/generate', async (req: AuthRequest, res) => {
  const { period } = req.body
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({ error: 'period must be YYYY-MM format' })
  }

  const producerId = req.producerId!
  const [year, month] = period.split('-').map(Number)
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

  const producer = await prisma.producer.findUnique({ where: { id: producerId } })
  if (!producer) return res.status(404).json({ error: 'Producer not found' })

  const batches = await prisma.batch.findMany({
    where: {
      producerId,
      createdAt: { gte: startOfMonth, lte: endOfMonth }
    }
  })

  const pdfBuffer = await generateCsqaDeclaration(producer, batches, period)
  const filename = `dichiarazione-${period}-${producer.vatCode}.pdf`

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.send(pdfBuffer)
})

router.post('/checklist', async (req: AuthRequest, res) => {
  const { period } = req.body
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({ error: 'period must be YYYY-MM format' })
  }

  const producerId = req.producerId!
  const producer = await prisma.producer.findUnique({ where: { id: producerId } })
  if (!producer) return res.status(404).json({ error: 'Producer not found' })

  const pdfBuffer = await generateSubmissionChecklist(producer, period, producer.denomination)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="checklist-${period}.pdf"`)
  return res.send(pdfBuffer)
})

export default router
```

- [ ] **Step 2: Test declaration endpoint manually**

```bash
# With server running on port 3000
# First register and get a token, then:
TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"pdf@test.com","password":"test123","producerName":"Test SRL","vatCode":"IT999","denomination":"abm-igp"}' \
  | jq -r '.token')

curl -X POST http://localhost:3000/declarations/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"period":"2026-04"}' \
  --output /tmp/test-declaration.pdf

file /tmp/test-declaration.pdf
```

Expected: `PDF document, version 1.x`

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/declarations.ts
git commit -m "feat: declarations API — generate CSQA declaration PDF and submission checklist PDF"
```

---

## Task 9: Frontend Bootstrap + Auth Context

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DOP Compliance</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create frontend/src/main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

- [ ] **Step 3: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create frontend/src/api/client.ts**

```ts
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export type Batch = {
  id: string
  batchCode: string
  denomination: string
  fields: Record<string, unknown>
  violations: Violation[]
  status: 'PENDING' | 'VALIDATED' | 'FLAGGED' | 'DECLARED'
  agingEntries?: AgingEntry[]
  createdAt: string
}

export type Violation = {
  fieldId: string
  fieldLabel: string
  value: unknown
  message: string
}

export type AgingEntry = {
  id: string
  batchId: string
  dueDate: string
  taskLabel: string
  completedAt: string | null
}

export type DenominationConfig = {
  id: string
  name: string
  nameIt: string
  controlBody: string
  reportingFrequency: string
  batchFields: FieldConfig[]
  agingTasks: { dayOffset: number; labelIt: string }[]
}

export type FieldConfig = {
  id: string
  label: string
  labelIt: string
  unit: string
  type: 'number' | 'text' | 'date' | 'select'
  required: boolean
  options?: string[]
  threshold?: { min?: number; max?: number; errorMessage: string }
}

export const authApi = {
  register: (data: { email: string; password: string; producerName: string; vatCode: string; denomination: string }) =>
    api.post<{ token: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string }>('/auth/login', data)
}

export const batchApi = {
  list: () => api.get<Batch[]>('/batches'),
  get: (id: string) => api.get<Batch>(`/batches/${id}`),
  create: (data: { batchCode: string; fields: Record<string, unknown> }) =>
    api.post<{ batch: Batch; violations: Violation[] }>('/batches', data),
  completeAging: (batchId: string, agingId: string) =>
    api.patch(`/batches/${batchId}/aging/${agingId}/complete`)
}

export const denominationApi = {
  get: (id: string) => api.get<DenominationConfig>(`/denominations/${id}`)
}

export const declarationApi = {
  generate: (period: string) =>
    api.post('/declarations/generate', { period }, { responseType: 'blob' }),
  checklist: (period: string) =>
    api.post('/declarations/checklist', { period }, { responseType: 'blob' })
}

export default api
```

- [ ] **Step 5: Create frontend/src/context/AuthContext.tsx**

```tsx
import React, { createContext, useContext, useState, ReactNode } from 'react'
import { authApi } from '../api/client'

type AuthContextType = {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; producerName: string; vatCode: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    localStorage.setItem('token', res.data.token)
    setToken(res.data.token)
  }

  async function register(data: { email: string; password: string; producerName: string; vatCode: string }) {
    const res = await authApi.register({ ...data, denomination: 'abm-igp' })
    localStorage.setItem('token', res.data.token)
    setToken(res.data.token)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 6: Create frontend/src/components/ProtectedRoute.tsx**

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 7: Create frontend/src/App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewBatch from './pages/NewBatch'
import Declarations from './pages/Declarations'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/batches/new" element={<ProtectedRoute><NewBatch /></ProtectedRoute>} />
        <Route path="/declarations" element={<ProtectedRoute><Declarations /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/index.html frontend/src/
git commit -m "feat: frontend bootstrap — Vite/React/Tailwind, auth context, API client, routing"
```

---

## Task 10: Login Page

**Files:**
- Create: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Create frontend/src/pages/Login.tsx**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Credenziali non valide. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-stone-800 mb-1">DOP Compliance</h1>
        <p className="text-sm text-stone-500 mb-8">Accedi al tuo account produttore</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify login page renders**

```bash
cd frontend && npm run dev
# Open http://localhost:5173/login in a browser
```

Expected: Login form visible, Italian labels, green button.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat: login page with Italian labels"
```

---

## Task 11: BatchForm Component + ValidationAlert

**Files:**
- Create: `frontend/src/components/ValidationAlert.tsx`
- Create: `frontend/src/components/BatchForm.tsx`

- [ ] **Step 1: Create frontend/src/components/ValidationAlert.tsx**

```tsx
import { Violation } from '../api/client'

type Props = { violations: Violation[] }

export default function ValidationAlert({ violations }: Props) {
  if (violations.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-amber-800 mb-2">
        Attenzione: {violations.length} problema/i rilevato/i
      </h3>
      <ul className="space-y-1">
        {violations.map(v => (
          <li key={v.fieldId} className="text-sm text-amber-700 flex items-start gap-2">
            <span className="mt-0.5">⚠</span>
            <span>{v.message}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-600 mt-2">
        Il lotto è stato salvato ma risulta non conforme. Correggere prima della dichiarazione.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/components/BatchForm.tsx**

```tsx
import { useState, useEffect } from 'react'
import { DenominationConfig, FieldConfig, Violation, denominationApi } from '../api/client'

type Props = {
  denominationId: string
  onSubmit: (batchCode: string, fields: Record<string, unknown>) => Promise<void>
  violations: Violation[]
}

export default function BatchForm({ denominationId, onSubmit, violations }: Props) {
  const [config, setConfig] = useState<DenominationConfig | null>(null)
  const [batchCode, setBatchCode] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    denominationApi.get(denominationId).then(res => {
      setConfig(res.data)
      const defaults: Record<string, string> = {}
      res.data.batchFields.forEach(f => { defaults[f.id] = '' })
      setFields(defaults)
    })
  }, [denominationId])

  function setField(id: string, value: string) {
    setFields(prev => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!batchCode.trim()) return
    setLoading(true)

    const parsedFields: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(fields)) {
      const fieldCfg = config?.batchFields.find(f => f.id === k)
      parsedFields[k] = fieldCfg?.type === 'number' ? parseFloat(v) || v : v
    }

    try {
      await onSubmit(batchCode, parsedFields)
    } finally {
      setLoading(false)
    }
  }

  if (!config) return <div className="text-sm text-stone-500">Caricamento configurazione...</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Codice lotto *</label>
        <input
          type="text"
          value={batchCode}
          onChange={e => setBatchCode(e.target.value)}
          placeholder="Es. ABM-2026-001"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      {config.batchFields.map(field => (
        <FieldInput
          key={field.id}
          field={field}
          value={fields[field.id] ?? ''}
          onChange={v => setField(field.id, v)}
        />
      ))}

      {violations.length > 0 && (
        <div className="mt-2">
          {/* Violations shown after submission via parent */}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Salvataggio...' : 'Registra Lotto'}
      </button>
    </form>
  )
}

function FieldInput({ field, value, onChange }: { field: FieldConfig; value: string; onChange: (v: string) => void }) {
  const label = (
    <label className="block text-sm font-medium text-stone-700 mb-1">
      {field.labelIt} {field.unit ? `(${field.unit})` : ''} {field.required ? '*' : ''}
    </label>
  )

  if (field.type === 'select' && field.options) {
    return (
      <div>
        {label}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          required={field.required}
        >
          <option value="">Seleziona...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  return (
    <div>
      {label}
      <input
        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
        step={field.type === 'number' ? '0.01' : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        required={field.required}
      />
      {field.threshold?.min !== undefined && (
        <p className="text-xs text-stone-400 mt-1">Minimo: {field.threshold.min} {field.unit}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ValidationAlert.tsx frontend/src/components/BatchForm.tsx
git commit -m "feat: BatchForm component — denomination-aware dynamic form with threshold hints; ValidationAlert"
```

---

## Task 12: New Batch Page + Dashboard

**Files:**
- Create: `frontend/src/pages/NewBatch.tsx`
- Create: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create frontend/src/pages/NewBatch.tsx**

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { batchApi, Violation } from '../api/client'
import BatchForm from '../components/BatchForm'
import ValidationAlert from '../components/ValidationAlert'

export default function NewBatch() {
  const navigate = useNavigate()
  const [violations, setViolations] = useState<Violation[]>([])
  const [saved, setSaved] = useState(false)

  async function handleSubmit(batchCode: string, fields: Record<string, unknown>) {
    const res = await batchApi.create({ batchCode, fields })
    setViolations(res.data.violations)
    setSaved(true)
    if (res.data.violations.length === 0) {
      setTimeout(() => navigate('/'), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-700">← Dashboard</Link>
        <h1 className="text-lg font-semibold text-stone-800">Registra Nuovo Lotto</h1>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-sm text-stone-500 mb-6">
          Aceto Balsamico di Modena IGP — Ente di controllo: CSQA
        </p>

        {saved && violations.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-700">
            Lotto salvato e convalidato con successo. Reindirizzamento...
          </div>
        )}

        {saved && violations.length > 0 && (
          <div className="mb-6">
            <ValidationAlert violations={violations} />
          </div>
        )}

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <BatchForm
            denominationId="abm-igp"
            onSubmit={handleSubmit}
            violations={violations}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create frontend/src/pages/Dashboard.tsx**

```tsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { batchApi, Batch } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    batchApi.list()
      .then(res => setBatches(res.data))
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const pendingAging = batches.flatMap(b =>
    (b.agingEntries ?? []).filter(e => !e.completedAt && new Date(e.dueDate) <= new Date())
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-800">DOP Compliance</h1>
        <div className="flex items-center gap-4">
          <Link to="/declarations" className="text-sm text-stone-600 hover:text-stone-800">
            Dichiarazioni
          </Link>
          <button onClick={handleLogout} className="text-sm text-stone-400 hover:text-stone-600">
            Esci
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {pendingAging.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-amber-800 mb-1">
              {pendingAging.length} attività di invecchiamento in scadenza
            </h2>
            <ul className="space-y-1">
              {pendingAging.map(e => (
                <li key={e.id} className="text-sm text-amber-700">
                  {e.taskLabel} — scaduta il {new Date(e.dueDate).toLocaleDateString('it-IT')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-stone-800">Lotti di Produzione</h2>
          <Link
            to="/batches/new"
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800"
          >
            + Nuovo Lotto
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-stone-400">Caricamento...</p>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <p className="text-stone-400 text-sm mb-4">Nessun lotto registrato</p>
            <Link to="/batches/new" className="text-green-700 text-sm font-medium hover:underline">
              Registra il primo lotto →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {batches.map(batch => (
              <div key={batch.id} className="bg-white rounded-lg border border-stone-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-stone-800">{batch.batchCode}</span>
                  <span className="ml-3 text-xs text-stone-400">
                    {new Date(batch.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  batch.status === 'VALIDATED' ? 'bg-green-100 text-green-700' :
                  batch.status === 'FLAGGED'   ? 'bg-amber-100 text-amber-700' :
                  batch.status === 'DECLARED'  ? 'bg-blue-100 text-blue-700' :
                  'bg-stone-100 text-stone-600'
                }`}>
                  {batch.status === 'VALIDATED' ? 'Conforme' :
                   batch.status === 'FLAGGED'   ? 'Non conforme' :
                   batch.status === 'DECLARED'  ? 'Dichiarato' : 'In attesa'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Test full batch-logging flow in browser**

```bash
# With backend running on port 3000 and frontend on port 5173
# 1. Open http://localhost:5173/login
# 2. Register a new account
# 3. Click "Nuovo Lotto"
# 4. Fill in all fields with valid values (acidity >= 6.0, sugar >= 105, aging >= 2)
# 5. Submit — expect green confirmation, redirect to dashboard
# 6. Create another batch with acidity = 3.0 — expect amber violation alert
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/NewBatch.tsx frontend/src/pages/Dashboard.tsx
git commit -m "feat: NewBatch and Dashboard pages — batch list with compliance status badges, aging alerts"
```

---

## Task 13: Declarations Page

**Files:**
- Create: `frontend/src/pages/Declarations.tsx`

- [ ] **Step 1: Create frontend/src/pages/Declarations.tsx**

```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { declarationApi } from '../api/client'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Declarations() {
  const currentPeriod = new Date().toISOString().slice(0, 7) // e.g. "2026-04"
  const [period, setPeriod] = useState(currentPeriod)
  const [loading, setLoading] = useState<'declaration' | 'checklist' | null>(null)
  const [error, setError] = useState('')

  async function handleGenerateDeclaration() {
    setError('')
    setLoading('declaration')
    try {
      const res = await declarationApi.generate(period)
      downloadBlob(res.data as Blob, `dichiarazione-${period}.pdf`)
    } catch {
      setError('Errore nella generazione del documento. Riprova.')
    } finally {
      setLoading(null)
    }
  }

  async function handleGenerateChecklist() {
    setError('')
    setLoading('checklist')
    try {
      const res = await declarationApi.checklist(period)
      downloadBlob(res.data as Blob, `checklist-invio-${period}.pdf`)
    } catch {
      setError('Errore nella generazione del documento. Riprova.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-700">← Dashboard</Link>
        <h1 className="text-lg font-semibold text-stone-800">Dichiarazioni Periodiche</h1>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Periodo di riferimento
            </label>
            <input
              type="month"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGenerateDeclaration}
              disabled={loading !== null}
              className="w-full flex items-center justify-between bg-green-700 text-white px-5 py-3 rounded-lg hover:bg-green-800 disabled:opacity-50"
            >
              <div className="text-left">
                <div className="text-sm font-medium">Scarica Dichiarazione CSQA</div>
                <div className="text-xs text-green-200 mt-0.5">
                  PDF precompilato con tutti i lotti del periodo
                </div>
              </div>
              {loading === 'declaration' ? (
                <span className="text-sm">Generazione...</span>
              ) : (
                <span className="text-lg">↓</span>
              )}
            </button>

            <button
              onClick={handleGenerateChecklist}
              disabled={loading !== null}
              className="w-full flex items-center justify-between bg-stone-700 text-white px-5 py-3 rounded-lg hover:bg-stone-800 disabled:opacity-50"
            >
              <div className="text-left">
                <div className="text-sm font-medium">Scarica Istruzioni di Invio</div>
                <div className="text-xs text-stone-300 mt-0.5">
                  Guida passo-passo per caricare sul portale CSQA
                </div>
              </div>
              {loading === 'checklist' ? (
                <span className="text-sm">Generazione...</span>
              ) : (
                <span className="text-lg">↓</span>
              )}
            </button>
          </div>

          <div className="bg-stone-50 rounded-lg p-4 text-xs text-stone-500">
            <p className="font-medium text-stone-600 mb-1">Come funziona</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Seleziona il mese di riferimento</li>
              <li>Scarica la dichiarazione PDF precompilata</li>
              <li>Scarica le istruzioni di invio per il portale CSQA</li>
              <li>Carica il PDF sul portale CSQA seguendo le istruzioni (5 min)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test declaration download in browser**

```bash
# With backend + frontend running:
# 1. Log in
# 2. Navigate to /declarations
# 3. Select a month that has batches logged
# 4. Click "Scarica Dichiarazione CSQA"
# Expected: PDF downloads with Italian header and batch table
# 5. Click "Scarica Istruzioni di Invio"
# Expected: PDF downloads with CSQA portal instructions
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Declarations.tsx
git commit -m "feat: declarations page — generate CSQA declaration PDF and submission checklist PDF download"
```

---

## Task 14: Run Full Test Suite + Production Readiness Check

**Files:** No new files. Verification pass.

- [ ] **Step 1: Run the full backend test suite**

```bash
cd backend && npm test
```

Expected output (all pass):
```
PASS tests/db.test.ts
PASS tests/engine/validator.test.ts
PASS tests/routes/auth.test.ts
PASS tests/routes/batches.test.ts
PASS tests/services/pdfGenerator.test.ts

Test Suites: 5 passed, 5 total
Tests:       17 passed, 17 total
```

- [ ] **Step 2: Build frontend for production**

```bash
cd frontend && npm run build
```

Expected: `dist/` directory created, no TypeScript errors.

- [ ] **Step 3: Verify the end-to-end flow manually**

Walk through this flow in the browser:
1. Register a new producer account (ABM IGP denomination)
2. Log a compliant batch — verify VALIDATED status badge appears
3. Log a non-compliant batch (acidity 3.0) — verify FLAGGED badge and violation message appears
4. Navigate to Declarations, select current month
5. Download the declaration PDF — verify it opens and contains the batch table
6. Download the submission checklist — verify it contains CSQA portal URL and step-by-step instructions

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 MVP complete — ABM IGP batch logging, rule engine, CSQA declaration PDF, submission checklist"
```

---

## Self-Review Against Spec

| Spec requirement | Covered in task |
|---|---|
| Producer logs data on mobile form | Task 11–12 (BatchForm renders denomination-aware fields) |
| System validates in real time against disciplinare | Task 5 (validator), Task 6 (called on batch create) |
| Flags non-conformities before ICQRF problem | Task 6 (FLAGGED status + violations returned immediately) |
| Compiles declaration PDF at end of period | Task 7 + 8 (generateCsqaDeclaration) |
| Submission checklist for producer upload | Task 7 + 8 (generateSubmissionChecklist) |
| ABM IGP denomination config | Task 4 (abm-igp.json with all 8 fields + thresholds) |
| Aging calendar entries auto-created | Task 6 (agingEntry.createMany on batch create) |
| Mark aging tasks complete | Task 6 (PATCH /batches/:id/aging/:agingId/complete) |
| Dashboard shows pending aging tasks | Task 12 (pendingAging filter on dashboard) |
| No submission on producer's behalf (legal reason) | Submission checklist approach — Task 7/8/13 |

**Out of scope (intentional):** lab report PDF extraction, push notifications, mobile app, payments, SPID auth. These are separate plans.
