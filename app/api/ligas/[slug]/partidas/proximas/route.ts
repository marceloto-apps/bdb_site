import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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

    // Encontrar a menor rodada com status SCHEDULED
    const menorRodada = await prisma.match.findFirst({
      where: {
        season: {
          competition: { slug },
          isCurrent: true
        },
        status: 'SCHEDULED',
        round: { not: null }
      },
      orderBy: { round: 'asc' },
      select: { round: true }
    })

    if (!menorRodada || menorRodada.round === null) {
      return NextResponse.json({
        data: {
          partidas: [],
          rodadaAtual: null
        }
      })
    }

    // Buscar as partidas no intervalo de rodadas
    const partidas = await prisma.match.findMany({
      where: {
        season: {
          competition: { slug },
          isCurrent: true
        },
        status: 'SCHEDULED',
        round: {
          gte: menorRodada.round,
          lte: menorRodada.round + (rodadas - 1)
        }
      },
      orderBy: [
        { round: 'asc' },
        { utcDate: 'asc' }
      ],
      select: {
        id: true,
        round: true,
        utcDate: true,
        homeTeam: {
          select: { id: true, name: true, shortName: true, logoUrl: true }
        },
        awayTeam: {
          select: { id: true, name: true, shortName: true, logoUrl: true }
        }
      }
    })

    // Retorna o resultado mapeado
    const partidasFormatadas = partidas.map(p => ({
      id: p.id,
      round: p.round?.toString() || '',
      date: p.utcDate.toISOString(),
      homeTeam: {
        id: p.homeTeam.id,
        name: p.homeTeam.name,
        shortName: p.homeTeam.shortName,
        logo: p.homeTeam.logoUrl
      },
      awayTeam: {
        id: p.awayTeam.id,
        name: p.awayTeam.name,
        shortName: p.awayTeam.shortName,
        logo: p.awayTeam.logoUrl
      }
    }))

    return NextResponse.json({
      data: {
        partidas: partidasFormatadas,
        rodadaAtual: menorRodada.round.toString()
      }
    })

  } catch (error) {
    console.error('[API_PROXIMAS_PARTIDAS_ERROR]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
