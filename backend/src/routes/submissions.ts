import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { SubmissionService } from '../services/submissionService'

const prisma = new PrismaClient()

const SubmitBody = z.object({ denominationId: z.string(), ruleId: z.string(), payload: z.unknown().default({}) })
const ScheduleBody = z.object({ denominationId: z.string(), ruleId: z.string() })

export function submissionsRouter(svc: SubmissionService): Router {
  const r = Router()
  r.use(requireAuth)

  r.post('/', async (req, res, next) => {
    try {
      const b = SubmitBody.parse(req.body)
      const result = await svc.submit((req as AuthRequest).user.id, b.denominationId, b.ruleId, b.payload)
      res.status(201).json(result)
    } catch (e) { next(e) }
  })

  r.get('/', async (req, res, next) => {
    try {
      const pid = (req as AuthRequest).user.id
      const page = Math.max(1, Number(req.query['page'] ?? 1))
      const limit = Math.min(50, Math.max(1, Number(req.query['limit'] ?? 20)))
      const where = {
        producerId: pid,
        ...(req.query['denominationId'] ? { denominationId: String(req.query['denominationId']) } : {}),
      }
      const [submissions, total] = await Promise.all([
        prisma.submission.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.submission.count({ where }),
      ])
      res.json({ submissions, total, page })
    } catch (e) { next(e) }
  })

  // NOTE: GET /schedules must be registered BEFORE GET /:id to avoid param route shadowing
  r.get('/schedules', async (req, res, next) => {
    try {
      const schedules = await prisma.submissionSchedule.findMany({
        where: { producerId: (req as AuthRequest).user.id, active: true },
        orderBy: { nextRunAt: 'asc' },
      })
      res.json({ schedules })
    } catch (e) { next(e) }
  })

  r.post('/schedules', async (req, res, next) => {
    try {
      const b = ScheduleBody.parse(req.body)
      const s = await svc.scheduleRecurring((req as AuthRequest).user.id, b.denominationId, b.ruleId)
      res.status(201).json(s)
    } catch (e) { next(e) }
  })

  r.delete('/schedules/:id', async (req, res, next) => {
    try {
      const { count } = await prisma.submissionSchedule.updateMany({
        where: { id: req.params['id'], producerId: (req as unknown as AuthRequest).user.id },
        data: { active: false },
      })
      if (count === 0) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } }); return }
      res.status(204).send()
    } catch (e) { next(e) }
  })

  r.get('/:id', async (req, res, next) => {
    try {
      const sub = await prisma.submission.findFirst({
        where: { id: req.params['id'], producerId: (req as unknown as AuthRequest).user.id },
      })
      if (!sub) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } }); return }
      res.json(sub)
    } catch (e) { next(e) }
  })

  return r
}
