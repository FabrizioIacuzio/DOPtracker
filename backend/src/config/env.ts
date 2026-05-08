import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  PEC_SMTP_HOST: z.string().default(''),
  PEC_SMTP_PORT: z.coerce.number().default(465),
  PEC_SMTP_USER: z.string().default(''),
  PEC_SMTP_PASS: z.string().default(''),
  PEC_FROM_ADDRESS: z.string().default(''),
  EMAIL_SMTP_HOST: z.string().default(''),
  EMAIL_SMTP_PORT: z.coerce.number().default(587),
  EMAIL_SMTP_USER: z.string().default(''),
  EMAIL_SMTP_PASS: z.string().default(''),
  EMAIL_FROM_ADDRESS: z.string().default(''),
  JOB_WORKER_POLL_INTERVAL_SECONDS: z.coerce.number().default(60),
  JOB_WORKER_BATCH_SIZE: z.coerce.number().default(10),
})

const result = EnvSchema.safeParse(process.env)
if (!result.success) {
  console.error('❌ Invalid environment variables:')
  console.error(JSON.stringify(result.error.flatten().fieldErrors, null, 2))
  throw new Error('Invalid environment configuration')
}

export const env = result.data
export type Env = typeof env
