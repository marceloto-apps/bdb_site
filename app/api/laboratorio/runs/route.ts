/**
 * GET  /api/laboratorio/runs[?strategyId=]  → runs do usuário (resumo, sem apostas)
 * POST /api/laboratorio/runs                 → salva um run executado no Worker
 *   Body: { strategyId?, definicao, resultado (RunResult serializado) }
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'
import { gravarRun, registrarTentativa, type RunSerializado } from '@/lib/laboratorio/api/runs'
import { salvarRunSchema } from '@/lib/laboratorio/api/schemas'
import type { Estrategia } from '@/lib/laboratorio/engine/tipos'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const strategyId = new URL(req.url).searchParams.get('strategyId') ?? undefined
    const runs = await prisma.backtestRun.findMany({
      where: { userId: u.userId, ...(strategyId ? { strategyId } : {}) },
      orderBy: { createdAt: 'desc' }, take: 100,
      select: { id: true, strategyId: true, origem: true, datasetVersao: true, engineVersao: true, catalogoVersao: true, hash: true, nUniverso: true, nApostas: true, resumo: true, createdAt: true },
    })
    return NextResponse.json({ data: runs })
  } catch (e) { return erroInterno('runs', e) }
}

export async function POST(req: Request) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  const parsed = salvarRunSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.flatten() }, { status: 400 })
  try {
    const { strategyId, definicao, resultado } = parsed.data
    const tentativas = await registrarTentativa(u.userId, definicao as Estrategia, strategyId)
    const run = await gravarRun(u.userId, definicao as Estrategia, resultado as RunSerializado, 'WORKER', strategyId)
    return NextResponse.json({ data: { id: run.id, createdAt: run.createdAt, tentativas } }, { status: 201 })
  } catch (e) { return erroInterno('runs', e) }
}
