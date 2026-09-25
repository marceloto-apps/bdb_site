/**
 * PATCH  /api/laboratorio/indicadores/[id] → { nome?, descricao?, formula?, publico? } (só o dono)
 * DELETE /api/laboratorio/indicadores/[id]
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'
import { compilarIndicador } from '@/lib/laboratorio/api/indicadores'
import { indicadorPatchSchema } from '@/lib/laboratorio/api/schemas'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
type Ctx = { params: { id: string } }

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  const parsed = indicadorPatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.flatten() }, { status: 400 })
  let extra: { ast: Prisma.InputJsonValue; tipo: string } | undefined
  if (parsed.data.formula !== undefined) {
    const c = compilarIndicador(parsed.data.formula)
    if ('erros' in c) return NextResponse.json({ error: 'FORMULA_INVALIDA', erros: c.erros }, { status: 422 })
    extra = { ast: c.ast as unknown as Prisma.InputJsonValue, tipo: c.tipo }
  }
  try {
    const dono = await prisma.backtestIndicator.findFirst({ where: { id: params.id, userId: u.userId }, select: { id: true } })
    if (!dono) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    const i = await prisma.backtestIndicator.update({ where: { id: params.id }, data: { ...parsed.data, ...(extra ?? {}) } })
    return NextResponse.json({ data: i })
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return NextResponse.json({ error: 'NOME_DUPLICADO' }, { status: 409 })
    return erroInterno('indicadores/id', e)
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const r = await prisma.backtestIndicator.deleteMany({ where: { id: params.id, userId: u.userId } })
    if (r.count === 0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) { return erroInterno('indicadores/id', e) }
}
