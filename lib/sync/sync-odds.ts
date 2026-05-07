import { fetchOddsPreMatch } from '@/lib/api-football'
import { prisma } from '@/lib/prisma'

export interface SyncOddsResult {
  total: number
  withOdds: number
  created: number
  errors: string[]
  duration: number
  requestsUsed: number
}

const BOOKMAKER_IDS = {
  PINNACLE: 4,
  BET365: 8,
  BETFAIR: 15,
}

const MARKET_MAP: Record<string, string> = {
  'Match Winner': 'match_odds',
  'Goals Over/Under': 'over_under',
  'Both Teams Score': 'btts',
  'Asian Handicap': 'asian_handicap',
}

export async function sincronizarOdds(
  seasonId: string,
  maxPartidas: number = 10
): Promise<SyncOddsResult> {
  const start = Date.now()
  const result: SyncOddsResult = { total: 0, withOdds: 0, created: 0, errors: [], duration: 0, requestsUsed: 0 }

  try {
    // Buscar partidas da temporada que não têm odds no banco
    const partidasSemOdds = await prisma.match.findMany({
      where: {
        seasonId: seasonId,
        odds: { none: {} }
      },
      take: maxPartidas,
      orderBy: { utcDate: 'desc' }
    })

    result.total = partidasSemOdds.length

    for (const match of partidasSemOdds) {
      try {
        const fixtureId = parseInt(match.externalId)
        // Busca com bookmaker pinnacle primeiro, para simplificar e gastar menos quota. 
        // O MVP pede apenas bookmaker específico ou sem filtro.
        const apiRes = await fetchOddsPreMatch(fixtureId, BOOKMAKER_IDS.PINNACLE)
        result.requestsUsed++

        if (!apiRes.response || apiRes.response.length === 0) {
          continue
        }

        result.withOdds++

        const responseData = apiRes.response[0]
        
        for (const bookmakerData of responseData.bookmakers) {
          // Achar ou criar bookmaker
          let bookmaker = await prisma.bookmaker.findUnique({ where: { name: bookmakerData.name } })
          if (!bookmaker) {
            bookmaker = await prisma.bookmaker.create({
              data: {
                name: bookmakerData.name,
                slug: bookmakerData.name.toLowerCase().replace(/\s+/g, '-'),
                isSharp: bookmakerData.id === BOOKMAKER_IDS.PINNACLE
              }
            })
          }

          for (const bet of bookmakerData.bets) {
            const marketKey = MARKET_MAP[bet.name]
            if (!marketKey) continue // Ignora mercados não mapeados

            let market = await prisma.market.findUnique({ where: { key: marketKey } })
            if (!market) {
              market = await prisma.market.create({
                data: {
                  key: marketKey,
                  name: bet.name,
                  category: 'Geral'
                }
              })
            }

            for (const val of bet.values) {
              const { selection, line } = parsearSelecao(bet.name, String(val.value))
              if (!selection) continue

              const oddValue = parseFloat(String(val.odd))
              if (isNaN(oddValue)) continue

              try {
                await prisma.matchOdds.create({
                  data: {
                    matchId: match.id,
                    bookmakerId: bookmaker.id,
                    marketId: market.id,
                    selection: selection,
                    line: line,
                    oddsType: 'PREMATCH_CLOSING' as any,
                    odds: oddValue
                  }
                })
                result.created++
              } catch (e: any) {
                // Ignore unique constraint errors silently
                if (e.code !== 'P2002') {
                   result.errors.push(`Erro inserindo odd ${selection} para ${match.id}: ${e.message}`)
                }
              }
            }
          }
        }
        
        // Marcar que a partida tem odds disponiveis
        await prisma.match.update({
          where: { id: match.id },
          data: { oddsAvailable: true }
        })

      } catch (err: any) {
        result.errors.push(`Erro na partida ${match.id}: ${err.message}`)
      }
    }

  } catch (error: any) {
    result.errors.push(`Erro fatal: ${error.message}`)
  }

  result.duration = Date.now() - start
  return result
}

function parsearSelecao(marketName: string, value: string): { selection: string; line: number | null } {
  const valLower = value.toLowerCase()
  if (marketName === 'Match Winner') {
    if (valLower === 'home') return { selection: 'home', line: null }
    if (valLower === 'draw') return { selection: 'draw', line: null }
    if (valLower === 'away') return { selection: 'away', line: null }
  }
  
  if (marketName === 'Goals Over/Under') {
    const matchOver = valLower.match(/over\s*([0-9.]+)/)
    if (matchOver) return { selection: 'over', line: parseFloat(matchOver[1]) }
    const matchUnder = valLower.match(/under\s*([0-9.]+)/)
    if (matchUnder) return { selection: 'under', line: parseFloat(matchUnder[1]) }
  }

  if (marketName === 'Both Teams Score') {
    if (valLower === 'yes') return { selection: 'yes', line: null }
    if (valLower === 'no') return { selection: 'no', line: null }
  }

  if (marketName === 'Asian Handicap') {
    const isHome = valLower.includes('home')
    const matchNum = valLower.match(/([+-]?[0-9.]+)/)
    if (matchNum) {
      return { 
        selection: isHome ? 'home' : 'away', 
        line: parseFloat(matchNum[1]) 
      }
    }
  }

  // Fallback
  return { selection: value, line: null }
}
