import { fetchPartidas } from '@/lib/api-football'
import { prisma } from '@/lib/prisma'

export interface SyncResult {
  total: number
  created: number
  updated: number
  errors: string[]
  duration: number
}

export async function sincronizarPartidas(seasonId: string): Promise<SyncResult> {
  const start = Date.now()
  const result: SyncResult = { total: 0, created: 0, updated: 0, errors: [], duration: 0 }

  try {
    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: { competition: true }
    })

    if (!season) throw new Error('Temporada não encontrada')
    if (!season.competition.externalId) throw new Error('Competição sem externalId')

    const apiRes = await fetchPartidas(parseInt(season.competition.externalId), parseInt(season.year))
    if (!apiRes.response) throw new Error('Resposta inválida da API')

    result.total = apiRes.response.length

    for (const fixture of apiRes.response) {
      try {
        const homeTeam = await prisma.team.findUnique({ where: { externalId: String(fixture.teams.home.id) } })
        const awayTeam = await prisma.team.findUnique({ where: { externalId: String(fixture.teams.away.id) } })

        if (!homeTeam || !awayTeam) {
          result.errors.push(`Times não encontrados para fixture ${fixture.fixture.id}`)
          continue
        }

        const round = parsearRodada(fixture.league.round)
        const status = mapearStatus(fixture.fixture.status.short)
        
        // Mapear resultado ftr
        let ftr = null
        if (fixture.goals.home !== null && fixture.goals.away !== null) {
          if (fixture.goals.home > fixture.goals.away) ftr = 'H'
          else if (fixture.goals.away > fixture.goals.home) ftr = 'A'
          else ftr = 'D'
        }

        const matchData = {
          seasonId: season.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          round: round,
          status: status as any,
          utcDate: new Date(fixture.fixture.date),
          fthg: fixture.goals.home,
          ftag: fixture.goals.away,
          ftr: ftr as any,
          refereeName: fixture.fixture.referee,
          dataSource: 'FOOTBALL_DATA' as any,
          syncedAt: new Date()
        }

        const matchExists = await prisma.match.findUnique({ where: { externalId: String(fixture.fixture.id) } })

        if (matchExists) {
          await prisma.match.update({
            where: { id: matchExists.id },
            data: matchData
          })
          result.updated++
        } else {
          await prisma.match.create({
            data: {
              ...matchData,
              externalId: String(fixture.fixture.id)
            }
          })
          result.created++
        }
      } catch (err: any) {
        result.errors.push(`Erro na fixture ${fixture.fixture.id}: ${err.message}`)
      }
    }

  } catch (error: any) {
    result.errors.push(`Erro fatal: ${error.message}`)
  }

  result.duration = Date.now() - start
  return result
}

function parsearRodada(roundStr: string): number | null {
  if (!roundStr) return null
  const match = roundStr.match(/Regular Season\s*-\s*(\d+)/)
  return match ? parseInt(match[1]) : null
}

function mapearStatus(short: string): string {
  const map: Record<string, string> = {
    'FT': 'FINISHED',
    'AET': 'FINISHED',
    'PEN': 'FINISHED',
    'NS': 'SCHEDULED',
    'TBD': 'SCHEDULED',
    '1H': 'LIVE',
    'HT': 'LIVE',
    '2H': 'LIVE',
    'ET': 'LIVE',
    'BT': 'LIVE',
    'P': 'LIVE',
    'PST': 'POSTPONED',
    'CANC': 'CANCELLED',
    'ABD': 'CANCELLED',
    'SUSP': 'SCHEDULED',
    'AWD': 'FINISHED',
    'WO': 'FINISHED'
  }
  return map[short] || 'SCHEDULED'
}
