/**
 * GET    /api/laboratorio/estrategias/[id] → estratégia (minha ou pública) com definição
 * PATCH  /api/laboratorio/estrategias/[id] → { nome?, descricao?, definicao?, publica?, holdoutAberto?: true } (só a dona; o selo nunca volta a fechar)
 * DELETE /api/laboratorio/estrategias/[id] (só a dona; runs ficam com strategyId nulo)
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'
import { estrategiaPatchSchema } from '@/lib/laboratorio/api/schemas'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { ErroEstrategia, prepararEstrategia } from '@/lib/laboratorio/engine/estrategia'
import { ENGINE_VERSAO, type Estrategia } from '@/lib/laboratorio/engine/tipos'
import { CATALOGO_VERSAO } from '@/lib/laboratorio/schema/catalogo'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
type Ctx = { params: { id: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const s = await prisma.backtestStrategy.findFirst({ where: { id: params.id, OR: [{ userId: u.userId }, { publica: true }] } })
    if (!s) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ data: { ...s, minha: s.userId === u.userId } })
  } catch (e) { return erroInterno('estrategias/id', e) }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  const parsed = estrategiaPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.flatten() }, { status: 400 })
  if (parsed.data.definicao) {
    try { prepararEstrategia(parsed.data.definicao as Estrategia, catalogoPadrao()) } catch (e) {
      if (e instanceof ErroEstrategia) return NextResponse.json({ error: 'ESTRATEGIA_INVALIDA', erros: e.erros }, { status: 422 })
      return erroInterno('estrategias/id', e)
    }
  }
  try {
    const dona = await prisma.backtestStrategy.findFirst({ where: { id: params.id, userId: u.userId }, select: { id: true } })
    if (!dona) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    const { definicao, ...resto } = parsed.data
    const s = await prisma.backtestStrategy.update({
      where: { id: params.id },
      data: { ...resto, ...(definicao ? { definicao: definicao as Prisma.InputJsonValue, engineVersao: ENGINE_VERSAO, catalogoVersao: CATALOGO_VERSAO } : {}) },
    })
    return NextResponse.json({ data: s })
  } catch (e) { return erroInterno('estrategias/id', e) }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const r = await prisma.backtestStrategy.deleteMany({ where: { id: params.id, userId: u.userId } })
    if (r.count === 0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) { return erroInterno('estrategias/id', e) }
}
