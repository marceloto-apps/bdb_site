import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { nomeExibicao } from '@/lib/utils/team-name'

const querySchema = z.object({
  rodadas: z.coerce.number().int().min(1).max(3).default(2)
})

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    if (!slug) {
      return NextResponse.json({ error: 'Slug da liga é obrigatório' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const queryValidation = querySchema.safeParse(Object.fromEntries(searchParams))
    
    if (!queryValidation.success) {
      return NextResponse.json({ error: 'Parâmetros inválidos', details: queryValidation.error.format() }, { status: 400 })
    }

    const { rodadas } = queryValidation.data

    // Buscar a liga para garantir que existe
    const competition = await prisma.competition.findUnique({
      where: { slug }
    })

    if (!competition) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 })
    }

    // Buscar partidas agendadas ainda não iniciadas, em ordem cronológica.
    // O critério é a DATA (mesmo do dashboard "Jogos do Dia"), e não o número da
    // rodada: jogos adiados e remarcados ficam presos em rodadas antigas e, se
    // escolhêssemos as menores rodadas, a rodada corrente nunca apareceria.
    const now = new Date()
    const agendadas = await prisma.match.findMany({
      where: {
        season: {
          competition: { slug },
          isCurrent: true
        },
        status: 'SCHEDULED',
        round: { not: null },
        utcDate: { gte: now }
      },
      orderBy: { utcDate: 'asc' },
      select: {
        id: true,
        round: true,
        utcDate: true,
        homeTeam: {
          select: { id: true, name: true, shortName: true, nameReviewedAt: true, logoUrl: true }
        },
        awayTeam: {
          select: { id: true, name: true, shortName: true, nameReviewedAt: true, logoUrl: true }
        }
      }
    })

    // As N primeiras rodadas na ordem em que aparecem cronologicamente
    const rodadasIds: number[] = []
    for (const p of agendadas) {
      if (p.round === null || rodadasIds.includes(p.round)) continue
      rodadasIds.push(p.round)
      if (rodadasIds.length >= rodadas) break
    }

    if (rodadasIds.length === 0) {
      return NextResponse.json({
        data: {
          partidas: [],
          rodadaAtual: null
        }
      })
    }

    const partidas = agendadas.filter(p => p.round !== null && rodadasIds.includes(p.round))

    // Retorna o resultado mapeado
    const partidasFormatadas = partidas.map(p => ({
      id: p.id,
      round: p.round?.toString() || '',
      date: p.utcDate.toISOString(),
      homeTeam: {
        id: p.homeTeam.id,
        name: p.homeTeam.name,
        shortName: p.homeTeam.shortName,
        displayName: nomeExibicao(p.homeTeam),
        logo: p.homeTeam.logoUrl
      },
      awayTeam: {
        id: p.awayTeam.id,
        name: p.awayTeam.name,
        shortName: p.awayTeam.shortName,
        displayName: nomeExibicao(p.awayTeam),
        logo: p.awayTeam.logoUrl
      }
    }))

    return NextResponse.json({
      data: {
        partidas: partidasFormatadas,
        rodadaAtual: rodadasIds[0].toString()
      }
    })

  } catch (error) {
    console.error('[API_PROXIMAS_PARTIDAS_ERROR]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
