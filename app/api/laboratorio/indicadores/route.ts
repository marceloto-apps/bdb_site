/**
 * GET  /api/laboratorio/indicadores → meus indicadores + públicos
 * POST /api/laboratorio/indicadores → { nome, descricao?, formula, publico? }
 * A fórmula é parseada e validada contra o catálogo; o AST e a unidade ficam gravados.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'
import { indicadorPostSchema } from '@/lib/laboratorio/api/schemas'
import { compilarIndicador } from '@/lib/laboratorio/api/indicadores'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const lista = await prisma.backtestIndicator.findMany({ where: { OR: [{ userId: u.userId }, { publico: true }] }, orderBy: { updatedAt: 'desc' }, take: 500 })
    return NextResponse.json({ data: lista.map((i) => ({ ...i, meu: i.userId === u.userId })) })
  } catch (e) { return erroInterno('indicadores', e) }
}

export async function POST(req: Request) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  const parsed = indicadorPostSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.flatten() }, { status: 400 })
  const c = compilarIndicador(parsed.data.formula)
  if ('erros' in c) return NextResponse.json({ error: 'FORMULA_INVALIDA', erros: c.erros }, { status: 422 })
  try {
    const criado = await prisma.backtestIndicator.create({ data: { userId: u.userId, nome: parsed.data.nome, descricao: parsed.data.descricao ?? null, formula: parsed.data.formula, ast: c.ast as unknown as Prisma.InputJsonValue, tipo: c.tipo, publico: parsed.data.publico ?? false } })
    return NextResponse.json({ data: criado }, { status: 201 })
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return NextResponse.json({ error: 'NOME_DUPLICADO' }, { status: 409 })
    return erroInterno('indicadores', e)
  }
}
