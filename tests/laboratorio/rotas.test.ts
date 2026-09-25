/**
 * Rotas da API do Laboratório com auth, plano e Prisma mockados (sem banco).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { auth, hasBacktestAccess, prisma } = vi.hoisted(() => ({
  auth: vi.fn(),
  hasBacktestAccess: vi.fn(),
  prisma: {
    backtestStrategy: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    backtestRun: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn() },
    backtestIndicator: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    backtestTrialLog: { findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
  },
}))
vi.mock('@/auth', () => ({ auth: () => auth() }))
vi.mock('@/lib/auth/check-access', () => ({ hasBacktestAccess: (id: string) => hasBacktestAccess(id) }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { POST as postEstrategia, GET as getEstrategias } from '@/app/api/laboratorio/estrategias/route'
import { PATCH as patchEstrategia, DELETE as deleteEstrategia } from '@/app/api/laboratorio/estrategias/[id]/route'
import { POST as postRun } from '@/app/api/laboratorio/runs/route'
import { POST as postIndicador } from '@/app/api/laboratorio/indicadores/route'
import { registrarTentativa } from '@/lib/laboratorio/api/runs'

const req = (body: unknown, method = 'POST') => new Request('http://x/api', { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } })
const definicao = { versao: 1, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }], staking: { metodo: 'flat', unidade: 1 }, regra: { formula: 'home.l5.pts_pg > 1.5' } }

beforeEach(() => {
  vi.clearAllMocks()
  auth.mockResolvedValue({ user: { id: 'u1' } })
  hasBacktestAccess.mockResolvedValue(true)
})

describe('gate de acesso', () => {
  it('401 sem sessão, 403 sem plano', async () => {
    auth.mockResolvedValueOnce(null)
    expect((await getEstrategias()).status).toBe(401)
    hasBacktestAccess.mockResolvedValueOnce(false)
    expect((await getEstrategias()).status).toBe(403)
  })
})

describe('POST /api/laboratorio/estrategias', () => {
  it('400 em JSON malformado, 422 em fórmula inválida, 201 quando ok', async () => {
    expect((await postEstrategia(req({ nome: 'x' }))).status).toBe(400)
    const r422 = await postEstrategia(req({ nome: 'x', definicao: { ...definicao, regra: { formula: 'foo > 1' } } }))
    expect(r422.status).toBe(422)
    expect((await r422.json()).erros[0]).toMatch(/foo/)
    prisma.backtestStrategy.create.mockResolvedValueOnce({ id: 's1', nome: 'x' })
    const ok = await postEstrategia(req({ nome: 'x', definicao }))
    expect(ok.status).toBe(201)
    const data = prisma.backtestStrategy.create.mock.calls[0][0].data
    expect(data.userId).toBe('u1'); expect(data.engineVersao).toBeTruthy(); expect(data.catalogoVersao).toBeTruthy()
  })
  it('lista marca as minhas e conta runs', async () => {
    prisma.backtestStrategy.findMany.mockResolvedValueOnce([{ id: 's1', userId: 'u1', _count: { runs: 2 } }, { id: 's2', userId: 'u2', publica: true, _count: { runs: 0 } }])
    const r = await getEstrategias()
    const { data } = await r.json()
    expect(data[0].minha).toBe(true); expect(data[0].runs).toBe(2); expect(data[1].minha).toBe(false)
  })
})

describe('PATCH/DELETE /api/laboratorio/estrategias/[id]', () => {
  it('404 quando não é do usuário; atualiza quando é', async () => {
    prisma.backtestStrategy.findFirst.mockResolvedValueOnce(null)
    expect((await patchEstrategia(req({ nome: 'y' }, 'PATCH'), { params: { id: 's9' } })).status).toBe(404)
    prisma.backtestStrategy.findFirst.mockResolvedValueOnce({ id: 's1' })
    prisma.backtestStrategy.update.mockResolvedValueOnce({ id: 's1', nome: 'y' })
    expect((await patchEstrategia(req({ nome: 'y', definicao }, 'PATCH'), { params: { id: 's1' } })).status).toBe(200)
    expect(prisma.backtestStrategy.update.mock.calls[0][0].data.definicao).toBeTruthy()
    prisma.backtestStrategy.deleteMany.mockResolvedValueOnce({ count: 0 })
    expect((await deleteEstrategia(new Request('http://x', { method: 'DELETE' }), { params: { id: 's1' } })).status).toBe(404)
  })
})

describe('POST /api/laboratorio/runs (run do Worker) e tentativas', () => {
  const resultado = { hash: 'abc', datasetVersao: 'v', catalogoVersao: '1.1.1', engineVersao: '0.1.0', nUniverso: 10, nSelecionados: 5, nApostas: 3, kpis: {}, caminho: { banco: [1, 2, 3] }, clv: {}, inferencia: {}, segmentos: {}, apostas: [{}, {}, {}], avisos: [], camposUsados: [], tempoMs: 1 }
  it('grava o run com resumo e apostas e conta a tentativa', async () => {
    prisma.backtestTrialLog.findFirst.mockResolvedValueOnce(null)
    prisma.backtestTrialLog.create.mockResolvedValueOnce({})
    prisma.backtestTrialLog.count.mockResolvedValueOnce(1)
    prisma.backtestStrategy.findFirst.mockResolvedValueOnce({ id: 's1' })
    prisma.backtestRun.create.mockResolvedValueOnce({ id: 'r1', createdAt: new Date() })
    const r = await postRun(req({ strategyId: 's1', definicao, resultado }))
    expect(r.status).toBe(201)
    expect((await r.json()).data.tentativas).toBe(1)
    const data = prisma.backtestRun.create.mock.calls[0][0].data
    expect(data.origem).toBe('WORKER'); expect(data.hash).toBe('abc'); expect(data.apostas).toHaveLength(3); expect(data.strategyId).toBe('s1')
    expect(prisma.backtestStrategy.updateMany).toHaveBeenCalled()
  })
  it('a mesma regra não conta duas vezes', async () => {
    prisma.backtestTrialLog.findFirst.mockResolvedValueOnce({ id: 't1' })
    prisma.backtestTrialLog.count.mockResolvedValueOnce(3)
    const n = await registrarTentativa('u1', definicao as never, 's1')
    expect(n).toBe(3)
    expect(prisma.backtestTrialLog.create).not.toHaveBeenCalled()
  })
  it('400 quando o resultado não tem a forma esperada', async () => {
    expect((await postRun(req({ definicao, resultado: { hash: 'x' } }))).status).toBe(400)
  })
})

describe('POST /api/laboratorio/indicadores', () => {
  it('422 em fórmula inválida; 201 grava AST e unidade; 409 em nome duplicado', async () => {
    expect((await postIndicador(req({ nome: 'edge', formula: 'implied(odds.pinnacle.close.1x2.novig_h)' }))).status).toBe(422)
    expect((await postIndicador(req({ nome: '1abc', formula: 'x' }))).status).toBe(400)
    prisma.backtestIndicator.create.mockResolvedValueOnce({ id: 'i1' })
    const ok = await postIndicador(req({ nome: 'edge_h', formula: 'odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' }))
    expect(ok.status).toBe(201)
    const data = prisma.backtestIndicator.create.mock.calls[0][0].data
    expect(data.tipo).toBe('ratio'); expect(data.ast.t).toBe('bin')
    prisma.backtestIndicator.create.mockRejectedValueOnce({ code: 'P2002' })
    expect((await postIndicador(req({ nome: 'edge_h', formula: '1 + 1' }))).status).toBe(409)
  })
})
