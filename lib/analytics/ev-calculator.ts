import { PrismaClient, OddsType } from '@prisma/client'

const prisma = new PrismaClient()

export function calcularOddJusta(probabilidade: number): number {
  if (probabilidade <= 0) return Infinity
  if (probabilidade > 1) return 1.0
  return 1 / probabilidade
}

export function calcularEV(probabilidade: number, oddMercado: number): number {
  if (probabilidade <= 0 || oddMercado <= 1) return -100
  return (probabilidade * oddMercado - 1) * 100
}

export interface EVResult {
  oddJusta: number
  ev: number
  temValor: boolean
}

export function analisarValor(probabilidade: number, oddMercado: number): EVResult {
  const oddJusta = calcularOddJusta(probabilidade)
  const ev = calcularEV(probabilidade, oddMercado)
  return {
    oddJusta,
    ev,
    temValor: ev > 0
  }
}

export type OddsMap = Map<string, number>

// Batch pre-fetch de odds para uma temporada
// Agrupa as odds em um mapa onde a chave é: {matchId}_{bookmakerSlug}_{marketKey}_{selection}
export async function prefetchSeasonOdds(seasonId: string, oddsType: OddsType = 'PREMATCH_CLOSING'): Promise<OddsMap> {
  const oddsMap = new Map<string, number>()
  
  const oddsData = await prisma.matchOdds.findMany({
    where: {
      match: { seasonId },
      oddsType
    },
    include: {
      bookmaker: true,
      market: true
    }
  })

  for (const odd of oddsData) {
    const key = `${odd.matchId}_${odd.bookmaker.slug}_${odd.market.key}_${odd.selection}`
    oddsMap.set(key, odd.odds)
  }

  return oddsMap
}

// Helper para buscar a odd a partir do mapa gerado no pre-fetch
export function getOddFromMap(
  oddsMap: OddsMap,
  matchId: string,
  marketKey: string,
  selection: string,
  bookmakerSlug: string = 'pinnacle'
): number | null {
  const key = `${matchId}_${bookmakerSlug}_${marketKey}_${selection}`
  return oddsMap.get(key) ?? null
}
