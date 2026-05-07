import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Ignora testes do Playwright/E2E se existirem
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
}

export default config
