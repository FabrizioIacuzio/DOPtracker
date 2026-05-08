import request from 'supertest'
import express from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { submissionsRouter } from '../../src/routes/submissions'
import { DenominationService } from '../../src/services/denominationService'
import { SubmissionService } from '../../src/services/submissionService'
import { errorMiddleware } from '../../src/middleware/error'

const prisma = new PrismaClient()
// JWT_SECRET is injected by jest.setup.ts before any module loads
const SECRET = process.env['JWT_SECRET'] ?? 'test-secret-minimum-32-characters-xx'

const cfg = {
  id:'test-igp', name:'Test IGP', type:'IGP',
  control_body:{ name:'CSQA', type:'csqa', pec:'t@pec.csqa.it' },
  submission_rules:[
    { id:'pec-rule', doc_type:'declaration', label:'Dichiarazione', channel:'pec', automation:'automated',
      recipient:'csqa', schedule:null, instructions:null },
    { id:'portal-rule', doc_type:'notification', label:'Mensile', channel:'web_portal', automation:'manual',
      recipient:'csqa', schedule:{ frequency:'monthly', due_day:15 }, instructions:'Vai al portale.' },
  ],
}

let app: express.Express, producerId: string, token: string, dir: string

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'routes-'))
  fs.writeFileSync(path.join(dir, 'test-igp.json'), JSON.stringify(cfg))
  const denom = new DenominationService(dir)
  const svc = new SubmissionService(prisma, denom)
  const user = await prisma.user.create({ data:{ email:`rt-${Date.now()}@t.it`, password:'x', name:'R' } })
  producerId = user.id
  token = jwt.sign({ sub:producerId }, SECRET, { expiresIn:'1h' })
  app = express()
  app.use(express.json())
  app.use('/submissions', submissionsRouter(svc))
  app.use(errorMiddleware)
})

afterAll(async () => {
  await prisma.submission.deleteMany({ where:{ producerId } })
  await prisma.submissionJob.deleteMany({ where:{ producerId } })
  await prisma.submissionSchedule.deleteMany({ where:{ producerId } })
  await prisma.user.delete({ where:{ id:producerId } })
  fs.rmSync(dir, { recursive:true })
  await prisma.$disconnect()
})

test('POST /submissions → 401 without token', async () => {
  expect((await request(app).post('/submissions').send({})).status).toBe(401)
})

test('POST /submissions → 201 queued for automated channel', async () => {
  const r = await request(app).post('/submissions').set('Authorization',`Bearer ${token}`)
    .send({ denominationId:'test-igp', ruleId:'pec-rule', payload:{} })
  expect(r.status).toBe(201)
  expect(r.body.type).toBe('queued')
  expect(typeof r.body.jobId).toBe('string')
})

test('POST /submissions → 201 manual with instructions', async () => {
  const r = await request(app).post('/submissions').set('Authorization',`Bearer ${token}`)
    .send({ denominationId:'test-igp', ruleId:'portal-rule', payload:{} })
  expect(r.status).toBe(201)
  expect(r.body.type).toBe('manual')
  expect(r.body.instructions).toBe('Vai al portale.')
})

test('POST /submissions → 404 for unknown denomination', async () => {
  const r = await request(app).post('/submissions').set('Authorization',`Bearer ${token}`)
    .send({ denominationId:'ghost', ruleId:'any', payload:{} })
  expect(r.status).toBe(404)
})

test('GET /submissions → 401 without token', async () => {
  expect((await request(app).get('/submissions')).status).toBe(401)
})

test('GET /submissions → 200 with submissions array', async () => {
  const r = await request(app).get('/submissions').set('Authorization',`Bearer ${token}`)
  expect(r.status).toBe(200)
  expect(Array.isArray(r.body.submissions)).toBe(true)
})

test('POST /submissions/schedules → 201 creates schedule', async () => {
  const r = await request(app).post('/submissions/schedules').set('Authorization',`Bearer ${token}`)
    .send({ denominationId:'test-igp', ruleId:'portal-rule' })
  expect(r.status).toBe(201)
  expect(r.body.active).toBe(true)
})

test('POST /submissions/schedules → 400 for rule with no schedule', async () => {
  const r = await request(app).post('/submissions/schedules').set('Authorization',`Bearer ${token}`)
    .send({ denominationId:'test-igp', ruleId:'pec-rule' })
  expect(r.status).toBe(400)
})

test('GET /submissions/schedules → 200', async () => {
  const r = await request(app).get('/submissions/schedules').set('Authorization',`Bearer ${token}`)
  expect(r.status).toBe(200)
  expect(Array.isArray(r.body.schedules)).toBe(true)
})

test('DELETE /submissions/schedules/:id → 204 deactivates', async () => {
  // Remove any pre-existing schedule for this triple (created by POST /schedules test above)
  await prisma.submissionSchedule.deleteMany({
    where:{ producerId, denominationId:'test-igp', ruleId:'portal-rule' }
  })
  const s = await prisma.submissionSchedule.create({
    data:{ producerId, denominationId:'test-igp', ruleId:'portal-rule', nextRunAt:new Date(), active:true }
  })
  const r = await request(app).delete(`/submissions/schedules/${s.id}`).set('Authorization',`Bearer ${token}`)
  expect(r.status).toBe(204)
  const updated = await prisma.submissionSchedule.findUniqueOrThrow({ where:{ id:s.id } })
  expect(updated.active).toBe(false)
})

test('DELETE /submissions/schedules/:id → 404 for other producer', async () => {
  const other = await prisma.user.create({ data:{ email:`oth-${Date.now()}@t.it`, password:'x', name:'O' } })
  const s = await prisma.submissionSchedule.create({
    data:{ producerId:other.id, denominationId:'test-igp', ruleId:'portal-rule', nextRunAt:new Date() }
  })
  const r = await request(app).delete(`/submissions/schedules/${s.id}`).set('Authorization',`Bearer ${token}`)
  expect(r.status).toBe(404)
  await prisma.submissionSchedule.delete({ where:{ id:s.id } })
  await prisma.user.delete({ where:{ id:other.id } })
})
