module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['./jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './',
        strict: true,
        noUncheckedIndexedAccess: true,
        exactOptionalPropertyTypes: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        skipLibCheck: true
      }
    }]
  }
}
