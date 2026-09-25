/**
 * GET    /api/laboratorio/runs/[id] → run completo (resumo + apostas salvas + definição)
 * DELETE /api/laboratorio/runs/[id]
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'

export const dynamic = 'force-dynamic'
type Ctx = { params: { id: string } }

export async function GET(_req: Request, { params }: Ctx) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const run = await prisma.backtestRun.findFirst({ where: { id: params.id, userId: u.userId } })
    if (!run) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ data: run })
  } catch (e) { return erroInterno('runs/id', e) }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  try {
    const r = await prisma.backtestRun.deleteMany({ where: { id: params.id, userId: u.userId } })
    if (r.count === 0) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) { return erroInterno('runs/id', e) }
}
