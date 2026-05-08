export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'DomainError'
  }

  toResponse(): { error: { code: string; message: string } } {
    return { error: { code: this.code, message: this.message } }
  }
}
