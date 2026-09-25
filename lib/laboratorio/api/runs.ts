/**
 * Persistência de runs e contador de tentativas (§6.6 do plano).
 *
 * - `gravarRun`: guarda resumo (kpis, caminho resumido, clv, inferência, segmentos, avisos) e até
 *   LIMITE_APOSTAS_SALVAS apostas; o run completo se reproduz pelo hash + versão do dataset.
 * - `registrarTentativa`: cada avaliação com regra/indicadores/entradas diferentes conta uma
 *   tentativa da estratégia (hash da parte "seletiva" da definição, sem staking/universo/seed).
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hash64 } from '../engine/matematica'
import type { Estrategia } from '../engine/tipos'
import { LIMITE_APOSTAS_SALVAS } from './schemas'

export interface RunSerializado {
  hash: string
  datasetVersao: string | null
  catalogoVersao: string | null
  engineVersao: string
  nUniverso: number
  nSelecionados: number
  nApostas: number
  kpis: unknown
  caminho: unknown
  clv: unknown
  inferencia: unknown
  segmentos: unknown
  apostas: unknown[]
  avisos: unknown
  camposUsados: string[]
  tempoMs: number
}

/** Reduz séries longas do caminho/CLV a no máximo `pontos` amostras (para o gráfico salvo). */
export function amostrar(serie: unknown, pontos = 500): unknown {
  if (!Array.isArray(serie) || serie.length <= pontos) return serie
  const passo = serie.length / pontos
  const out: unknown[] = []
  for (let i = 0; i < pontos; i++) out.push(serie[Math.floor(i * passo)])
  out.push(serie[serie.length - 1])
  return out
}

export function resumoParaBanco(r: RunSerializado): Prisma.InputJsonValue {
  const caminho = r.caminho as Record<string, unknown>
  const clv = r.clv as Record<string, unknown>
  return {
    nSelecionados: r.nSelecionados, kpis: r.kpis, inferencia: r.inferencia, segmentos: r.segmentos, avisos: r.avisos, camposUsados: r.camposUsados, tempoMs: r.tempoMs,
    caminho: { ...caminho, banco: amostrar(caminho.banco), cumulativo: amostrar(caminho.cumulativo), underwater: amostrar(caminho.underwater) },
    clv: { ...clv, esperadoCumulativo: amostrar(clv.esperadoCumulativo), clvCumulativo: amostrar(clv.clvCumulativo) },
  } as Prisma.InputJsonValue
}

export async function gravarRun(userId: string, definicao: Estrategia, r: RunSerializado, origem: 'WORKER' | 'SERVIDOR', strategyId?: string) {
  if (strategyId) {
    const dona = await prisma.backtestStrategy.findFirst({ where: { id: strategyId, userId }, select: { id: true } })
    if (!dona) strategyId = undefined
  }
  return prisma.backtestRun.create({
    data: {
      userId, strategyId: strategyId ?? null, origem,
      datasetVersao: r.datasetVersao ?? '', engineVersao: r.engineVersao, catalogoVersao: r.catalogoVersao ?? '', hash: r.hash,
      nUniverso: r.nUniverso, nApostas: r.nApostas,
      resumo: resumoParaBanco(r),
      apostas: r.apostas.slice(0, LIMITE_APOSTAS_SALVAS) as Prisma.InputJsonValue,
      definicao: definicao as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, createdAt: true },
  })
}

/** Hash da parte da definição que "seleciona" apostas (regra, indicadores, entradas, parâmetros, universo). */
export function hashRegra(e: Estrategia): string {
  return hash64(JSON.stringify({ i: e.indicadores ?? [], r: e.regra ?? null, e: e.entradas, p: e.parametros ?? {}, u: e.universo ?? {} }))
}

/** Conta uma tentativa quando a regra ainda não foi avaliada para esta estratégia/usuário. Devolve o total. */
export async function registrarTentativa(userId: string, definicao: Estrategia, strategyId?: string): Promise<number> {
  const h = hashRegra(definicao)
  const existe = await prisma.backtestTrialLog.findFirst({ where: { userId, strategyId: strategyId ?? null, hashRegra: h }, select: { id: true } })
  if (!existe) {
    await prisma.backtestTrialLog.create({ data: { userId, strategyId: strategyId ?? null, hashRegra: h } })
    if (strategyId) await prisma.backtestStrategy.updateMany({ where: { id: strategyId, userId }, data: { tentativas: { increment: 1 } } })
  }
  return prisma.backtestTrialLog.count({ where: { userId, strategyId: strategyId ?? null } })
}
