// app/(dashboard)/dashboard/backtest/page.tsx
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { hasBacktestAccess } from "@/lib/auth/check-access"
import { BacktestClient } from "./BacktestClient"
import { UpgradeBacktest } from "./UpgradeBacktest"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Backtests Interativos - BDB',
}

export default async function BacktestPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const hasAccess = await hasBacktestAccess(session.user.id)
  
  if (!hasAccess) {
    return <UpgradeBacktest />
  }

  // Buscar competições com partidas finalizadas
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

  // Para cada competição, buscar a faixa de datas (min/max utcDate de partidas FINISHED)
  const serializedCompetitions = await Promise.all(
    competitions.map(async (comp) => {
      const bounds = await prisma.match.aggregate({
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
        minDate: bounds._min.utcDate ? bounds._min.utcDate.toISOString() : null,
        maxDate: bounds._max.utcDate ? bounds._max.utcDate.toISOString() : null,
      }
    })
  )

  // Buscar os backtests salvos do usuário
  const savedBacktests = await prisma.savedBacktest.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const serializedSaved = savedBacktests.map((s) => ({
    id: s.id,
    name: s.name,
    filters: s.filters,
    resultMeta: s.resultMeta,
    createdAt: s.createdAt.toISOString()
  }))

  return (
    <BacktestClient
      initialCompetitions={serializedCompetitions}
      initialSavedBacktests={serializedSaved}
    />
  )
}
