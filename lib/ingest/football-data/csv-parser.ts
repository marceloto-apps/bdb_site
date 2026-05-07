import { Prisma } from '@prisma/client'
import { normalizeTeamName } from '../team-normalizer'

export interface CsvRow {
  Date: string
  HomeTeam: string
  AwayTeam: string
  FTHG: string
  FTAG: string
  PSH?: string
  PSD?: string
  PSA?: string
}

export function parseFootballDataCsv(csvContent: string): CsvRow[] {
  const lines = csvContent.split('\n').filter(l => l.trim().length > 0)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    rows.push(row as CsvRow)
  }

  return rows
}

export interface CsvMappedData {
  match: Prisma.MatchCreateInput
  odds: Omit<Prisma.MatchOddsCreateManyInput, 'matchId'>[]
}

export function mapCsvRowToPrisma(row: CsvRow, seasonId: string, bookmakerId: string, marketId: string): CsvMappedData {
  // Football-data Date format: DD/MM/YYYY
  const [day, month, year] = row.Date.split('/')
  const dateStr = `${year}-${month}-${day}T12:00:00Z` // Assume meio-dia UTC
  
  const match: Prisma.MatchCreateInput = {
    externalId: `csv_${row.Date}_${row.HomeTeam}_${row.AwayTeam}`,
    utcDate: new Date(dateStr),
    
    homeTeam: {
      connectOrCreate: {
        where: { externalId: `csv_${normalizeTeamName(row.HomeTeam)}` },
        create: {
          externalId: `csv_${normalizeTeamName(row.HomeTeam)}`,
          name: normalizeTeamName(row.HomeTeam),
        }
      }
    },
    awayTeam: {
      connectOrCreate: {
        where: { externalId: `csv_${normalizeTeamName(row.AwayTeam)}` },
        create: {
          externalId: `csv_${normalizeTeamName(row.AwayTeam)}`,
          name: normalizeTeamName(row.AwayTeam),
        }
      }
    },
    
    season: { connect: { id: seasonId } },
    
    fthg: parseInt(row.FTHG),
    ftag: parseInt(row.FTAG),
    dataSource: 'FOOTBALL_DATA_CSV' as any,
  }

  const odds: Omit<Prisma.MatchOddsCreateManyInput, 'matchId'>[] = []
  if (row.PSH) odds.push({ bookmakerId, marketId, selection: 'home', oddsType: 'PREMATCH_CLOSING', odds: parseFloat(row.PSH) })
  if (row.PSD) odds.push({ bookmakerId, marketId, selection: 'draw', oddsType: 'PREMATCH_CLOSING', odds: parseFloat(row.PSD) })
  if (row.PSA) odds.push({ bookmakerId, marketId, selection: 'away', oddsType: 'PREMATCH_CLOSING', odds: parseFloat(row.PSA) })

  return { match, odds }
}
