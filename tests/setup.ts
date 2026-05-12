import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    competition: { findUnique: vi.fn(), findMany: vi.fn() },
    season: { findFirst: vi.fn(), findMany: vi.fn() },
    match: { findMany: vi.fn(), count: vi.fn() },
    team: { findMany: vi.fn() },
    teamSeason: { findMany: vi.fn() },
    matchOdds: { findMany: vi.fn(), createMany: vi.fn() },
    apiQuota: { findFirst: vi.fn(), upsert: vi.fn() },
    syncLog: { create: vi.fn(), update: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'test-user', role: 'ADMIN', email: 'admin@test.com' },
  }),
}))

vi.mock('@/lib/api-football', () => ({
  fetchPartidas: vi.fn(),
  fetchOdds: vi.fn(),
  fetchOddsPreMatch: vi.fn(),
  fetchQuotaStatus: vi.fn(),
}))
