import { NextRequest } from 'next/server'
import { GET } from '../../app/api/ligas/[slug]/previsao/route'
import { prisma } from '../../lib/prisma'
import * as analytics from '../../lib/analytics'

import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'user_123', email: 'test@example.com' },
  }),
}))

// Mock do prisma para não bater no banco real
vi.mock('../../lib/prisma', () => ({
  prisma: {
    competition: {
      findUnique: vi.fn()
    },
    match: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user_123',
        role: 'MEMBRO',
        plan: 'VIP_PRO',
        legacyAccess: null,
      }),
    },
    legacyAccess: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }
}))

describe('GET /api/ligas/[slug]/previsao', () => {
  const baseUrl = 'http://localhost/api/ligas/brazil-serie-a/previsao'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar 400 se homeTeamId ou awayTeamId estiverem ausentes', async () => {
    // Apenas awayTeamId presente
    const req = new NextRequest(`${baseUrl}?awayTeamId=cm2a2q0o0000008ld2x201xyz`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('INVALID_QUERY')
    expect(json.message).toContain('Parâmetros inválidos')
  })

  it('deve retornar 400 se modelo for invalido', async () => {
    const req = new NextRequest(`${baseUrl}?homeTeamId=cm2a2q0o0000108ld2x202xyz&awayTeamId=cm2a2q0o0000008ld2x201xyz&modelo=MODELO_FALSO`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('INVALID_QUERY')
    expect(json.message).toBe('Parâmetros inválidos')
  })

  it('deve retornar 200 com estrutura correta para params validos', async () => {
    ;(prisma.competition.findUnique as any).mockResolvedValue({ 
      id: 'c1',
      seasons: [{ id: 's1', year: 2026 }] 
    })
    
    // Mock do confronto (jogo futuro)
    ;(prisma.match.findFirst as any).mockResolvedValue({
      utcDate: new Date('2026-10-10T20:00:00Z'),
      odds: []
    })
    
    // Mock dos jogos históricos para calcularMediasLiga (precisa de >= 20) e calcularMediasTime (>=5 casa e >=5 fora por time)
    const mockGames = Array.from({ length: 40 }).map((_, i) => {
      let home = 'tx', away = 'ty';
      if (i < 10) { home = 'cm2a2q0o0000108ld2x202xyz'; away = 'cm2a2q0o0000308ld2x204xyz'; } // t1 home
      else if (i < 20) { home = 'cm2a2q0o0000308ld2x204xyz'; away = 'cm2a2q0o0000108ld2x202xyz'; } // t1 away
      else if (i < 30) { home = 'cm2a2q0o0000008ld2x201xyz'; away = 'cm2a2q0o0000408ld2x205xyz'; } // t2 home
      else { home = 'cm2a2q0o0000408ld2x205xyz'; away = 'cm2a2q0o0000008ld2x201xyz'; } // t2 away
      
      return {
        fthg: i % 3,
        ftag: i % 2,
        homeTeamId: home,
        awayTeamId: away,
        utcDate: new Date(`2026-05-${(i % 28) + 1}T20:00:00Z`),
        round: i + 1,
        odds: []
      }
    })
    ;(prisma.match.findMany as any).mockResolvedValue(mockGames)

    const req = new NextRequest(`${baseUrl}?homeTeamId=cm2a2q0o0000108ld2x202xyz&awayTeamId=cm2a2q0o0000008ld2x201xyz&modelo=POISSON`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(json.data.modelo).toBe('POISSON')
    expect(json.data.medias).toBeDefined()
    expect(json.data.forcas).toBeDefined()
    expect(json.data.lambdas).toBeDefined()
    expect(json.data.matrizPlacares).toBeDefined()
    expect(json.data.mercados).toBeDefined()
  })

  it('deve retornar modeloSelecionado e rankingModelos no modo AUTO', async () => {
    ;(prisma.competition.findUnique as any).mockResolvedValue({ 
      id: 'c1',
      seasons: [{ id: 's1', year: 2026 }] 
    })
    ;(prisma.match.findFirst as any).mockResolvedValue({
      utcDate: new Date('2026-10-10T20:00:00Z'),
      odds: []
    })
    const mockGames = Array.from({ length: 40 }).map((_, i) => {
      let home = 'tx', away = 'ty';
      if (i < 10) { home = 'cm2a2q0o0000108ld2x202xyz'; away = 'cm2a2q0o0000308ld2x204xyz'; }
      else if (i < 20) { home = 'cm2a2q0o0000308ld2x204xyz'; away = 'cm2a2q0o0000108ld2x202xyz'; }
      else if (i < 30) { home = 'cm2a2q0o0000008ld2x201xyz'; away = 'cm2a2q0o0000408ld2x205xyz'; }
      else { home = 'cm2a2q0o0000408ld2x205xyz'; away = 'cm2a2q0o0000008ld2x201xyz'; }
      return {
        fthg: i % 3,
        ftag: i % 2,
        homeTeamId: home,
        awayTeamId: away,
        utcDate: new Date(`2026-05-${(i % 28) + 1}T20:00:00Z`),
        round: i + 1,
        odds: []
      }
    })
    ;(prisma.match.findMany as any).mockResolvedValue(mockGames)

    const req = new NextRequest(`${baseUrl}?homeTeamId=cm2a2q0o0000108ld2x202xyz&awayTeamId=cm2a2q0o0000008ld2x201xyz&modelo=AUTO`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.modelo).toBe('AUTO')
    expect(json.data.modeloSelecionado).toBeDefined()
    expect(['POISSON', 'DIXON_COLES', 'ZIP', 'NB']).toContain(json.data.modeloSelecionado)
    expect(json.data.rankingModelos).toBeDefined()
    expect(json.data.rankingModelos.length).toBe(4)
    expect(json.data.selecaoAutomatica).toBe(true)
    expect(json.data.sinaisTriagem).toEqual({
      zip: 'INDETERMINADO',
      dc: 'INDETERMINADO'
    })
  })

  it('deve usar fallback Dixon-Coles e selecaoAutomatica=false se houver erro no diagnostico (ex: < 10 jogos)', async () => {
    ;(prisma.competition.findUnique as any).mockResolvedValue({ 
      id: 'c1',
      seasons: [{ id: 's1', year: 2026 }] 
    })
    ;(prisma.match.findFirst as any).mockResolvedValue({
      utcDate: new Date('2026-10-10T20:00:00Z'),
      odds: []
    })
    
    // 40 jogos para passar no check inicial de 20
    const mockGames = Array.from({ length: 40 }).map((_, i) => {
      let home = 'tx', away = 'ty';
      if (i < 10) { home = 'cm2a2q0o0000108ld2x202xyz'; away = 'cm2a2q0o0000308ld2x204xyz'; }
      else if (i < 20) { home = 'cm2a2q0o0000308ld2x204xyz'; away = 'cm2a2q0o0000108ld2x202xyz'; }
      else if (i < 30) { home = 'cm2a2q0o0000008ld2x201xyz'; away = 'cm2a2q0o0000408ld2x205xyz'; }
      else { home = 'cm2a2q0o0000408ld2x205xyz'; away = 'cm2a2q0o0000008ld2x201xyz'; }
      return {
        fthg: i % 3,
        ftag: i % 2,
        homeTeamId: home,
        awayTeamId: away,
        utcDate: new Date(`2026-05-${(i % 28) + 1}T20:00:00Z`),
        round: i + 1,
        odds: []
      }
    })
    ;(prisma.match.findMany as any).mockResolvedValue(mockGames)

    // Mockar construirDiagnosticoDispersao para lancar erro
    const spy = vi.spyOn(analytics, 'construirDiagnosticoDispersao').mockImplementationOnce(() => {
      throw new Error('INSUFFICIENT_LEAGUE_DATA: minimo de 10 jogos para diagnostico')
    })

    const req = new NextRequest(`${baseUrl}?homeTeamId=cm2a2q0o0000108ld2x202xyz&awayTeamId=cm2a2q0o0000008ld2x201xyz&modelo=AUTO`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.modelo).toBe('AUTO')
    expect(json.data.modeloSelecionado).toBe('DIXON_COLES')
    expect(json.data.selecaoAutomatica).toBe(false)
    
    spy.mockRestore()
  })

  describe('Filtros Avançados e amostra insuficiente', () => {
    const T1 = 'cm2a2q0o0000108ld2x202xyz'
    const T2 = 'cm2a2q0o0000008ld2x201xyz'

    // 40 jogos: T1 em casa nas rodadas 1-10 e fora nas 11-20; T2 em casa nas 21-30 e fora nas 31-40
    const montarJogos = (total = 40) => Array.from({ length: total }).map((_, i) => {
      let home = 'tx', away = 'ty'
      if (i < 10) { home = T1; away = 'cm2a2q0o0000308ld2x204xyz' }
      else if (i < 20) { home = 'cm2a2q0o0000308ld2x204xyz'; away = T1 }
      else if (i < 30) { home = T2; away = 'cm2a2q0o0000408ld2x205xyz' }
      else { home = 'cm2a2q0o0000408ld2x205xyz'; away = T2 }
      return {
        id: `m${i}`,
        fthg: i % 3,
        ftag: i % 2,
        homeTeamId: home,
        awayTeamId: away,
        utcDate: new Date(`2026-05-${(i % 28) + 1}T20:00:00Z`),
        round: i + 1,
        odds: [],
      }
    })

    const chamar = async (qs: string, jogos = montarJogos()) => {
      ;(prisma.competition.findUnique as any).mockResolvedValue({ id: 'c1', seasons: [{ id: 's1', year: 2026 }] })
      ;(prisma.match.findFirst as any).mockResolvedValue(null)
      ;(prisma.match.findMany as any).mockResolvedValue(jogos)
      const req = new NextRequest(`${baseUrl}?homeTeamId=${T1}&awayTeamId=${T2}&${qs}`)
      const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
      return { res, json: await res.json() }
    }

    it('modelos com decay também respeitam o filtro de rodadas', async () => {
      const { res, json } = await chamar('modelo=DIXON_COLES&roundFrom=4')

      expect(res.status).toBe(200)
      expect(json.data.previsaoDisponivel).toBe(true)
      expect(json.data.medias.home.jogosCasa).toBe(7)
      expect(json.data.amostra.home).toMatchObject({ total: 10, usados: 7, foraPeriodo: 3 })
      expect(json.data.amostra.filtrosAtivos).toBe(true)
    })

    it('filtro apertado demais devolve 200 sem projeção, com a parte descritiva', async () => {
      const { res, json } = await chamar('modelo=AUTO&roundFrom=9')

      expect(res.status).toBe(200)
      expect(json.data.previsaoDisponivel).toBe(false)
      expect(json.data.motivoIndisponivel).toContain('Relaxe os filtros')
      expect(json.data.medias.home.jogosCasa).toBe(2)
      expect(json.data.forcas.home).toBeDefined()
      expect(json.data.oddsFaixasDisponiveisCasa).toHaveLength(9)
      expect(json.data.matrizPlacares).toBeUndefined()
      expect(json.data.mercados).toBeUndefined()
    })

    it('liga com menos de 20 jogos devolve 200 sem projeção', async () => {
      const { res, json } = await chamar('modelo=AUTO', montarJogos(12))

      expect(res.status).toBe(200)
      expect(json.data.previsaoDisponivel).toBe(false)
      expect(json.data.medias.home.jogosCasa).toBe(10)
      // visitante sem jogo nenhum: médias 0, nunca NaN/null
      expect(json.data.medias.away.mgv).toBe(0)
      expect(json.data.forcas.away.fcAtV).toBe(0)
    })
  })
})
