/**
 * POST /api/laboratorio/run → executa a estratégia no servidor (mesmo engine do Worker, mesmo hash).
 * Body: { estrategia, salvar?, strategyId?, maxApostas?, bootstrap? }
 * Uso: runs salvos/reproduzíveis e clientes sem Worker. Para a UI interativa o Worker é o caminho.
 */
import { NextResponse } from 'next/server'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'
import { gravarRun, registrarTentativa, type RunSerializado } from '@/lib/laboratorio/api/runs'
import { LIMITE_APOSTAS_SALVAS, runPostSchema } from '@/lib/laboratorio/api/schemas'
import { r2Configurado } from '@/lib/laboratorio/data/r2'
import { executarNoServidor } from '@/lib/laboratorio/data/servidor'
import { ErroEstrategia } from '@/lib/laboratorio/engine/estrategia'
import { serializarRun } from '@/lib/laboratorio/engine/run'
import type { Estrategia } from '@/lib/laboratorio/engine/tipos'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: Request) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  if (!r2Configurado()) return NextResponse.json({ error: 'DATASET_INDISPONIVEL' }, { status: 503 })
  const parsed = runPostSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.flatten() }, { status: 400 })
  const { estrategia, salvar, strategyId, maxApostas, bootstrap } = parsed.data
  try {
    const { resultado, carga } = await executarNoServidor(estrategia as Estrategia, { bootstrap, maxApostas: maxApostas ?? LIMITE_APOSTAS_SALVAS, extras: false })
    const serial = serializarRun(resultado) as RunSerializado
    const tentativas = await registrarTentativa(u.userId, estrategia as Estrategia, strategyId)
    let runId: string | null = null
    if (salvar) runId = (await gravarRun(u.userId, estrategia as Estrategia, serial, 'SERVIDOR', strategyId)).id
    return NextResponse.json({ resultado: serial, carga, tentativas, runId }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    if (e instanceof ErroEstrategia) return NextResponse.json({ error: 'ESTRATEGIA_INVALIDA', erros: e.erros }, { status: 422 })
    return erroInterno('run', e)
  }
}
