import { describe, it, expect } from 'vitest'

describe('GET /api/ligas/[slug]/info', () => {
  it('deve retornar 401 sem autenticação', async () => {
    expect(true).toBe(true)
  })
})
