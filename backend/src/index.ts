import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { errorMiddleware } from './middleware/error'
import { submissionsRouter } from './routes/submissions'
import { SubmissionService } from './services/submissionService'
import { DenominationService } from './services/denominationService'
import { JobWorker } from './services/jobWorker'
import { getChannelHandler } from './services/channels'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const denomService = new DenominationService()
const submissionService = new SubmissionService(prisma, denomService)
const worker = new JobWorker(prisma, denomService, getChannelHandler, {
  pollIntervalMs: env.JOB_WORKER_POLL_INTERVAL_SECONDS * 1000,
  batchSize: env.JOB_WORKER_BATCH_SIZE,
})

const app = express()
app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json())
app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/submissions', submissionsRouter(submissionService, prisma))
app.use(errorMiddleware)

app.listen(env.PORT, () => {
  console.log(`Server on :${env.PORT}`)
  worker.start()
})

export { app }
