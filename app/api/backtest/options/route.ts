// app/api/backtest/options/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    // Buscar competições ativas que possuem partidas finalizadas
    const competitions = await prisma.competition.findMany({
      where: {
        active: true,
        type: 'LEAGUE',
        seasons: {
          some: {
            matches: {
              some: {
                status: 'FINISHED'
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        country: true,
        slug: true,
        seasons: {
          where: {
            matches: {
              some: {
                status: 'FINISHED'
              }
            }
          },
          select: {
            id: true,
            year: true,
            isCurrent: true,
          },
          orderBy: {
            year: 'desc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Buscar faixa de datas por competição
    const result = await Promise.all(
      competitions.map(async (comp) => {
        const dateBounds = await prisma.match.aggregate({
          where: {
            status: 'FINISHED',
            season: {
              competitionId: comp.id
            }
          },
          _min: {
            utcDate: true
          },
          _max: {
            utcDate: true
          }
        })

        return {
          id: comp.id,
          name: comp.name,
          country: comp.country,
          slug: comp.slug,
          seasons: comp.seasons,
          minDate: dateBounds._min.utcDate,
          maxDate: dateBounds._max.utcDate,
        }
      })
    )

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('[BACKTEST_OPTIONS_GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
