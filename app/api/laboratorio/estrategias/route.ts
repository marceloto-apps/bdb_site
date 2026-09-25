/**
 * GET  /api/laboratorio/estrategias → estratégias do usuário (+ públicas de outros, marcadas)
 * POST /api/laboratorio/estrategias → cria { nome, descricao?, definicao, publica? }
 * A definição é validada na forma (zod) e na semântica (engine: fórmulas, campos, entradas).
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'
import { estrategiaPostSchema } from '@/lib/laboratorio/api/schemas'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { ErroEstrategia, prepararEstrategia } from '@/lib/laboratorio/engine/estrategia'
import { ENGINE_VERSAO, type Estrategia } from '@/lib/laboratorio/engine/tipos'
import { CATALOGO_VERSAO } from '@/lib/laboratorio/schema/catalogo'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const lista = await prisma.backtestStrategy.findMany({
      where: { OR: [{ userId: u.userId }, { publica: true }] },
      orderBy: { updatedAt: 'desc' }, take: 200,
      select: { id: true, userId: true, nome: true, descricao: true, publica: true, tentativas: true, holdoutAberto: true, engineVersao: true, catalogoVersao: true, createdAt: true, updatedAt: true, _count: { select: { runs: true } } },
    })
    return NextResponse.json({ data: lista.map((s) => ({ ...s, minha: s.userId === u.userId, runs: s._count.runs, _count: undefined })) })
  } catch (e) { return erroInterno('estrategias', e) }
}

export async function POST(req: Request) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  const parsed = estrategiaPostSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.flatten() }, { status: 400 })
  try {
    prepararEstrategia(parsed.data.definicao as Estrategia, catalogoPadrao())
  } catch (e) {
    if (e instanceof ErroEstrategia) return NextResponse.json({ error: 'ESTRATEGIA_INVALIDA', erros: e.erros }, { status: 422 })
    return erroInterno('estrategias', e)
  }
  try {
    const criada = await prisma.backtestStrategy.create({
      data: { userId: u.userId, nome: parsed.data.nome, descricao: parsed.data.descricao ?? null, definicao: parsed.data.definicao as Prisma.InputJsonValue, publica: parsed.data.publica ?? false, engineVersao: ENGINE_VERSAO, catalogoVersao: CATALOGO_VERSAO },
    })
    return NextResponse.json({ data: criada }, { status: 201 })
  } catch (e) { return erroInterno('estrategias', e) }
}
