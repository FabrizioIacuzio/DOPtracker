import { Request, Response, NextFunction } from 'express'
import { DomainError } from '../errors'

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    const status = ['DENOMINATION_NOT_FOUND', 'RULE_NOT_FOUND', 'NOT_FOUND'].includes(err.code) ? 404 : 400
    res.status(status).json(err.toResponse())
    return
  }
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } })
}
