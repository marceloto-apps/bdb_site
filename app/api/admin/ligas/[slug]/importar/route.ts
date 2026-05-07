import { NextRequest, NextResponse } from 'next/server'
import { verificarAdmin } from '@/lib/auth'
import { parseFootballDataCsv, mapCsvRowToPrisma } from '@/lib/ingest/football-data/csv-parser'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const isAdmin = await verificarAdmin(req)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const competition = await prisma.competition.findUnique({
      where: { slug: params.slug }
    })

    if (!competition) {
      return NextResponse.json({ error: 'Liga não encontrada' }, { status: 404 })
    }

    const season = await prisma.season.findFirst({
      where: { competitionId: competition.id, isCurrent: true }
    })

    if (!season) {
      return NextResponse.json({ error: 'Nenhuma Season ativa encontrada para esta Liga' }, { status: 404 })
    }

    const pinnacle = await prisma.bookmaker.findUnique({ where: { slug: 'pinnacle' } })
    const matchOddsMarket = await prisma.market.findUnique({ where: { key: 'match_odds' } })

    if (!pinnacle || !matchOddsMarket) {
      return NextResponse.json({ error: 'Bookmaker ou Market base não encontrados' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseFootballDataCsv(text)
    
    let matchesProcessed = 0
    let matchesCreated = 0

    for (const row of rows) {
      matchesProcessed++
      try {
        const mappedData = mapCsvRowToPrisma(row, season.id, pinnacle.id, matchOddsMarket.id)
        
        // Verifica duplicidade
        const existing = await prisma.match.findFirst({
          where: {
            seasonId: season.id,
            utcDate: mappedData.match.utcDate as Date,
            homeTeam: { name: (mappedData.match.homeTeam?.create as any)?.name }
          }
        })

        if (!existing) {
          const matchCreated = await prisma.match.create({ data: mappedData.match })
          
          if (mappedData.odds.length > 0) {
            const oddsToInsert = mappedData.odds.map(o => ({ ...o, matchId: matchCreated.id }))
            await prisma.matchOdds.createMany({ data: oddsToInsert as any })
          }

          matchesCreated++
        }
      } catch (e) {
        // Logar erro de parsing individual ou skip
        console.error('Erro na linha', row, e)
      }
    }

    return NextResponse.json({ 
      data: { 
        matchesProcessed,
        matchesCreated
      } 
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
