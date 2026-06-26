import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { previsaoQuerySchema } from '@/lib/validations/liga'
import { FAIXAS_ODDS_PADRAO } from '@/types/liga'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'
import {
  calcularMediasLiga,
  calcularMediasTime,
  calcularMediasTimeComDecay,
  calcularForcasTime,
  matrizPlacaresPoisson,
  matrizPlacaresZIP,
  matrizPlacaresNB,
  matrizPlacaresDixonColes,
  calcularMercados,
  estimarPiLiga,
  calcularVarianciaGols,
  estimarRhoEmpirico,
  calcularEV,
  calcularLambdas,
  calcularTodosLambdas,
  montarComposicaoLambdas,
  calcularMediasLigaXG,
  calcularMediasTimeXG,
  calcularForcasTimeXG,
  calcularMediasTimeXGComDecay,
  type MediasLigaXG,
  calcularLambdaMercado,
  rankearModelos,
  construirDiagnosticoDispersao,
} from '@/lib/analytics'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const { slug } = params

    const { isLeagueFree } = await import('@/lib/auth/free-leagues')
    const isFree = isLeagueFree(slug)
    if (!isFree) {
      const { hasVipAccess } = await import('@/lib/auth/check-access')
      const hasAccess = await hasVipAccess(session.user.id)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Acesso VIP necessário.' },
          { status: 403 }
        )
      }
    }

    const { searchParams } = new URL(req.url)
    const queryResult = previsaoQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'INVALID_QUERY', message: 'Parâmetros inválidos', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const query = queryResult.data

    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: {
        seasons: {
          where: { isCurrent: true },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'LEAGUE_NOT_FOUND', message: 'Liga não encontrada' }, { status: 404 })
    }

    const activeSeason = competition.seasons[0]
    if (!activeSeason) {
      return NextResponse.json({ error: 'NO_ACTIVE_SEASON', message: 'Nenhuma temporada ativa encontrada' }, { status: 404 })
    }

    // Buscar odds para o PRÓXIMO confronto agendado para ter a data de referência
    const confronto = await prisma.match.findFirst({
      where: {
        homeTeamId: query.homeTeamId,
        awayTeamId: query.awayTeamId,
        status: { in: ['SCHEDULED', 'LIVE', 'POSTPONED'] }
      },
      include: {
        odds: {
          where: {
            bookmaker: { name: 'bet365' },
            market: { key: 'match_odds' },
          },
        },
      },
      orderBy: {
        utcDate: 'asc',
      },
    })
    const dataReferencia = confronto ? confronto.utcDate : new Date()

    // Calcular o lambda de mercado (Bet365) para o confronto
    const mercadoResult = await calcularLambdaMercado(confronto?.id || '')

    // Se o usuário escolheu 'MERCADO' mas ele está indisponível, falhar com 400
    if (query.lambdaMethod === 'MERCADO' && !mercadoResult.disponivel) {
      return NextResponse.json(
        { error: 'MARKET_ODDS_UNAVAILABLE', message: mercadoResult.motivo || 'Dados de mercado não disponíveis para este lambda' },
        { status: 400 }
      )
    }

    // Buscar APENAS jogos finalizados da temporada atual
    const todosOsJogos = await prisma.match.findMany({
      where: {
        seasonId: activeSeason.id,
        status: 'FINISHED',
        fthg: { not: null },
        ftag: { not: null },
        utcDate: getSeasonDateFilter(activeSeason.year),
      },
      include: {
        odds: {
          where: {
            bookmaker: { name: 'bet365' },
            market: { key: 'match_odds' },
          },
        },
        stats: {
          select: {
            homeXg: true,
            awayXg: true,
          },
        },
      },
      orderBy: { utcDate: 'asc' },
    })

    if (todosOsJogos.length < 20) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_LEAGUE_DATA', message: 'Dados insuficientes da liga' },
        { status: 400 }
      )
    }

    const jogosTypeSafe = todosOsJogos.map((m) => ({ ...m, fthg: m.fthg!, ftag: m.ftag! }))

    // Calcular estatísticas globais da liga (NUNCA USAM DECAY)
    const mediasLiga = calcularMediasLiga(jogosTypeSafe as any)
    const piLiga = estimarPiLiga(jogosTypeSafe as any, mediasLiga)
    const varianciaLiga = calcularVarianciaGols(jogosTypeSafe as any, mediasLiga)
    const rhoLiga = estimarRhoEmpirico(jogosTypeSafe as any, mediasLiga)

    // Filtrar jogos
    let jogosFiltrados = [...jogosTypeSafe]

    if (query.roundFrom || query.roundTo) {
      jogosFiltrados = jogosFiltrados.filter(j => {
        if (query.roundFrom && j.round != null && j.round < query.roundFrom) return false
        if (query.roundTo && j.round != null && j.round > query.roundTo) return false
        return true
      })
    }

    if (query.months) {
      const allowedMonths = query.months.split(',').map(Number)
      jogosFiltrados = jogosFiltrados.filter(j => {
        const month = new Date(j.utcDate).getMonth() + 1
        return allowedMonths.includes(month)
      })
    }

    // Filtro de odds - suporte a faixas não-contíguas
    const parseFaixas = (csv: string) =>
      csv.split(',').map(f => {
        const [min, max] = f.split('-').map(Number)
        return { min, max }
      })

    const faixasCasa = query.oddsCasaFaixas ? parseFaixas(query.oddsCasaFaixas) : null
    const faixasVis = query.oddsVisFaixas ? parseFaixas(query.oddsVisFaixas) : null

    // Filtrar jogos por odds de forma independente para cada time (mando respectivo)
    const filtrarJogosPorOdds = (teamId: string, jogos: typeof jogosTypeSafe) => {
      if (!faixasCasa && !faixasVis) return jogos

      return jogos.filter(j => {
        const isHome = j.homeTeamId === teamId
        const isAway = j.awayTeamId === teamId

        if (isHome && faixasCasa) {
          const oddCasa = j.odds.find((o: any) => o.selection === 'home')?.odds
          // Sem odd = inclui (não penalizar jogos sem dados de odds)
          if (oddCasa && !faixasCasa.some(f => oddCasa >= f.min && oddCasa <= f.max)) return false
        }
        if (isAway && faixasVis) {
          const oddVis = j.odds.find((o: any) => o.selection === 'away')?.odds
          if (oddVis && !faixasVis.some(f => oddVis >= f.min && oddVis <= f.max)) return false
        }
        return true
      })
    }

    const jogosFiltradosHome = filtrarJogosPorOdds(query.homeTeamId, jogosFiltrados)
    const jogosFiltradosAway = filtrarJogosPorOdds(query.awayTeamId, jogosFiltrados)

    // Computar quais faixas de odds têm jogos para os times selecionados
    const jogosMandante = jogosTypeSafe.filter(j => j.homeTeamId === query.homeTeamId)
    const jogosVisitante = jogosTypeSafe.filter(j => j.awayTeamId === query.awayTeamId)

    const oddsFaixasDisponiveisCasa = FAIXAS_ODDS_PADRAO.map(faixa =>
      jogosMandante.some(j => {
        const odd = j.odds.find((o: any) => o.selection === 'home')?.odds
        return odd != null && odd >= faixa.min && odd <= faixa.max
      })
    )

    const oddsFaixasDisponiveisVisitante = FAIXAS_ODDS_PADRAO.map(faixa =>
      jogosVisitante.some(j => {
        const odd = j.odds.find((o: any) => o.selection === 'away')?.odds
        return odd != null && odd >= faixa.min && odd <= faixa.max
      })
    )

    let mediasHome, mediasAway, forcasHome, forcasAway, lambdaH, lambdaA
    let mediasHomePoisson, mediasAwayPoisson, forcasHomePoisson, forcasAwayPoisson, lambdaHPoisson, lambdaAPoisson
    let mediasHomeXG, mediasAwayXG, forcasHomeXG, forcasAwayXG
    let mediasHomeXGPoisson, mediasAwayXGPoisson, forcasHomeXGPoisson, forcasAwayXGPoisson

    let ligaMediasXG: MediasLigaXG | undefined
    let xgDisponivel = false
    let xgJogosDisponiveis = 0

    let todosLambdas: any
    let composicao: any
    let lambdaFallback = false

    let todosLambdasPoisson: any
    let composicaoPoisson: any
    let lambdaFallbackPoisson = false

    try {
      // 1. Calcular médias XG da liga
      try {
        ligaMediasXG = calcularMediasLigaXG(jogosTypeSafe as any)
        xgDisponivel = true
        xgJogosDisponiveis = ligaMediasXG.totalJogos
      } catch {
        xgDisponivel = false
      }

      // 2. Poisson Simples nunca usa decay
      mediasHomePoisson = calcularMediasTime(query.homeTeamId, jogosFiltradosHome as any)
      mediasAwayPoisson = calcularMediasTime(query.awayTeamId, jogosFiltradosAway as any)
      forcasHomePoisson = calcularForcasTime(mediasHomePoisson, mediasLiga)
      forcasAwayPoisson = calcularForcasTime(mediasAwayPoisson, mediasLiga)

      if (xgDisponivel) {
        mediasHomeXGPoisson = calcularMediasTimeXG(query.homeTeamId, jogosFiltradosHome as any)
        mediasAwayXGPoisson = calcularMediasTimeXG(query.awayTeamId, jogosFiltradosAway as any)
        forcasHomeXGPoisson = calcularForcasTimeXG(mediasHomeXGPoisson, ligaMediasXG!)
        forcasAwayXGPoisson = calcularForcasTimeXG(mediasAwayXGPoisson, ligaMediasXG!)
      }

      const paramsPoisson = {
        mediasHome: mediasHomePoisson,
        mediasAway: mediasAwayPoisson,
        forcasHome: forcasHomePoisson,
        forcasAway: forcasAwayPoisson,
        ligaMedias: mediasLiga,
        lambdaMercado: mercadoResult.disponivel
          ? { lambdaH: mercadoResult.lambdaH, lambdaA: mercadoResult.lambdaA, capturadoEm: mercadoResult.capturadoEm }
          : null,
        ...(xgDisponivel ? {
          mediasHomeXG: mediasHomeXGPoisson,
          mediasAwayXG: mediasAwayXGPoisson,
          forcasHomeXG: forcasHomeXGPoisson,
          forcasAwayXG: forcasAwayXGPoisson,
          ligaMediasXG,
        } : {})
      }

      const lp = calcularLambdas(query.lambdaMethod as any, paramsPoisson as any)
      lambdaHPoisson = lp.lambdaH
      lambdaAPoisson = lp.lambdaA
      lambdaFallbackPoisson = lp.fallback
      todosLambdasPoisson = calcularTodosLambdas(paramsPoisson as any)
      composicaoPoisson = montarComposicaoLambdas(paramsPoisson as any)

      if (query.modelo !== 'POISSON') {
        // Modelos avançados usam decay (E NUNCA SOFREM FILTROS MANUAIS DE RODADA/MÊS)
        mediasHome = calcularMediasTimeComDecay(query.homeTeamId, jogosTypeSafe as any, dataReferencia)
        mediasAway = calcularMediasTimeComDecay(query.awayTeamId, jogosTypeSafe as any, dataReferencia)
        forcasHome = calcularForcasTime(mediasHome, mediasLiga)
        forcasAway = calcularForcasTime(mediasAway, mediasLiga)

        if (xgDisponivel) {
          mediasHomeXG = calcularMediasTimeXGComDecay(query.homeTeamId, jogosTypeSafe as any, dataReferencia)
          mediasAwayXG = calcularMediasTimeXGComDecay(query.awayTeamId, jogosTypeSafe as any, dataReferencia)
          forcasHomeXG = calcularForcasTimeXG(mediasHomeXG, ligaMediasXG!)
          forcasAwayXG = calcularForcasTimeXG(mediasAwayXG, ligaMediasXG!)
        }

        const paramsDecay = {
          mediasHome,
          mediasAway,
          forcasHome,
          forcasAway,
          ligaMedias: mediasLiga,
          lambdaMercado: mercadoResult.disponivel
            ? { lambdaH: mercadoResult.lambdaH, lambdaA: mercadoResult.lambdaA, capturadoEm: mercadoResult.capturadoEm }
            : null,
          ...(xgDisponivel ? {
            mediasHomeXG,
            mediasAwayXG,
            forcasHomeXG,
            forcasAwayXG,
            ligaMediasXG,
          } : {})
        }

        const ld = calcularLambdas(query.lambdaMethod as any, paramsDecay as any)
        lambdaH = ld.lambdaH
        lambdaA = ld.lambdaA
        lambdaFallback = ld.fallback
        todosLambdas = calcularTodosLambdas(paramsDecay as any)
        composicao = montarComposicaoLambdas(paramsDecay as any)
      } else {
        mediasHome = mediasHomePoisson; mediasAway = mediasAwayPoisson
        forcasHome = forcasHomePoisson; forcasAway = forcasAwayPoisson
        mediasHomeXG = mediasHomeXGPoisson; mediasAwayXG = mediasAwayXGPoisson
        forcasHomeXG = forcasHomeXGPoisson; forcasAwayXG = forcasAwayXGPoisson
        lambdaH = lambdaHPoisson; lambdaA = lambdaAPoisson
        lambdaFallback = lambdaFallbackPoisson
        todosLambdas = todosLambdasPoisson
        composicao = composicaoPoisson
      }
    } catch (e: any) {
      // Contar jogos de cada time no dataset filtrado
      const homeCasa = jogosFiltradosHome.filter((j: any) => j.homeTeamId === query.homeTeamId).length
      const homeFora = jogosFiltradosHome.filter((j: any) => j.awayTeamId === query.homeTeamId).length
      const awayCasa = jogosFiltradosAway.filter((j: any) => j.homeTeamId === query.awayTeamId).length
      const awayFora = jogosFiltradosAway.filter((j: any) => j.awayTeamId === query.awayTeamId).length
      const hasFilters = query.roundFrom || query.roundTo || query.months || query.oddsCasaFaixas || query.oddsVisFaixas
      const filterMsg = hasFilters
        ? ` Após filtros — Mandante: ${homeCasa} casa / ${homeFora} fora · Visitante: ${awayCasa} casa / ${awayFora} fora (mín. 4 cada).`
        : ''
      return NextResponse.json(
        { error: 'INSUFFICIENT_TEAM_DATA', message: `Dados insuficientes para o cálculo.${filterMsg}${hasFilters ? ' Tente relaxar os filtros.' : ''}` },
        { status: 400 }
      )
    }

    const warnings: string[] = []
    if (lambdaH > 5.0) warnings.push('Aviso: lambdaH > 5.0')
    if (lambdaA > 5.0) warnings.push('Aviso: lambdaA > 5.0')

    const parametrosExtras = {
      piH: piLiga.piH,
      piA: piLiga.piA,
      varH: varianciaLiga.varCasa,
      varA: varianciaLiga.varFora,
      rho: rhoLiga,
    }
    const modeloSelecionado = query.modelo
    let modeloResolvido: 'POISSON' | 'ZIP' | 'NB' | 'DIXON_COLES' = 'POISSON'
    let rankingModelos: any[] = []
    let vereditoDispersao: string | undefined = undefined
    let selecaoAutomatica = true
    let sinaisTriagem: any = undefined

    if (modeloSelecionado === 'AUTO') {
      try {
        const jogosDispersao = jogosTypeSafe.map(j => ({
          homeTeamId: j.homeTeamId,
          awayTeamId: j.awayTeamId,
          fthg: j.fthg,
          ftag: j.ftag,
          utcDate: j.utcDate,
          homeXg: j.stats?.homeXg ?? null,
          awayXg: j.stats?.awayXg ?? null,
        }))
        const diag = construirDiagnosticoDispersao(jogosDispersao)
        vereditoDispersao = diag.gols.condicional.veredito

        const { ranking, sinais } = rankearModelos(
          jogosTypeSafe as any,
          lambdaH!,
          lambdaA!,
          mediasLiga,
          parametrosExtras,
          diag.gols.condicional.veredito
        )
        rankingModelos = ranking
        modeloResolvido = ranking[0].modelo
        sinaisTriagem = sinais
      } catch (err) {
        console.error('[API previsao AUTO fallback] Erro ao selecionar modelo:', err)
        modeloResolvido = 'DIXON_COLES'
        selecaoAutomatica = false
        sinaisTriagem = {
          zip: 'INDETERMINADO',
          dc: 'INDETERMINADO',
        }
      }
    } else {
      modeloResolvido = modeloSelecionado
      selecaoAutomatica = false
    }

    let matriz: number[][] = []
    let rhoClamped = false
    let nbWarning = null

    if (modeloResolvido === 'POISSON') {
      matriz = matrizPlacaresPoisson(lambdaH!, lambdaA!)
    } else if (modeloResolvido === 'ZIP') {
      matriz = matrizPlacaresZIP(lambdaH!, lambdaA!, parametrosExtras.piH, parametrosExtras.piA)
    } else if (modeloResolvido === 'NB') {
      const resNB = matrizPlacaresNB(lambdaH!, lambdaA!, parametrosExtras.varH, parametrosExtras.varA)
      matriz = resNB.matriz
      nbWarning = resNB.warning
      if (nbWarning) warnings.push(`NB Warning: ${nbWarning}`)
    } else if (modeloResolvido === 'DIXON_COLES') {
      const resDC = matrizPlacaresDixonColes(lambdaH!, lambdaA!, parametrosExtras.rho)
      matriz = resDC.matriz
      rhoClamped = resDC.rhoClamped
    }

    const calc = calcularMercados(matriz)
    const calcOddJusta = (prob: number) => prob > 0 ? 1 / prob : 0

    const mercadosFormatados = {
      casa: { prob: calc.casa, oddJusta: calcOddJusta(calc.casa) },
      empate: { prob: calc.empate, oddJusta: calcOddJusta(calc.empate) },
      visitante: { prob: calc.visit, oddJusta: calcOddJusta(calc.visit) },
      btts: {
        sim: calc.btts,
        nao: calc.bttsNao,
      },
      overUnder: {
        '0.5': { over: calc.over05, under: 1 - calc.over05 },
        '1.5': { over: calc.over15, under: 1 - calc.over15 },
        '2.5': { over: calc.over25, under: 1 - calc.over25 },
        '3.5': { over: calc.over35, under: 1 - calc.over35 },
        '4.5': { over: calc.over45, under: 1 - calc.over45 },
      },
      handicaps: []
    }

    let evPorMercado: Record<string, number> | null = null

    if (confronto && confronto.odds && confronto.odds.length > 0) {
      evPorMercado = {}
      const oddHome = confronto.odds.find((o: any) => o.selection === 'home')?.odds
      const oddDraw = confronto.odds.find((o: any) => o.selection === 'draw')?.odds
      const oddAway = confronto.odds.find((o: any) => o.selection === 'away')?.odds
      if (oddHome) evPorMercado['casa'] = calcularEV(mercadosFormatados.casa.prob, oddHome)
      if (oddDraw) evPorMercado['empate'] = calcularEV(mercadosFormatados.empate.prob, oddDraw)
      if (oddAway) evPorMercado['visitante'] = calcularEV(mercadosFormatados.visitante.prob, oddAway)
    }

    return NextResponse.json({
      data: {
        modelo: modeloSelecionado,
        modeloSelecionado: modeloResolvido,
        rankingModelos,
        vereditoDispersao,
        selecaoAutomatica,
        sinaisTriagem,
        medias: {
          home: mediasHome,
          away: mediasAway,
          liga: { ...mediasLiga, totalJogos: jogosTypeSafe.length },
        },
        forcas: {
          home: forcasHome,
          away: forcasAway,
        },
        lambdas: { home: lambdaH, away: lambdaA },
        matrizPlacares: matriz,
        mercados: mercadosFormatados,
        evPorMercado,
        nbWarning,
        rhoClamped,
        rhoEstimado: parametrosExtras.rho,
        warnings,
        lambdaMethodAtivo: lambdaFallback ? 'FORCAS_RELATIVAS' : query.lambdaMethod,
        lambdaFallback,
        todosLambdas,
        composicao,
        xgDisponivel,
        xgJogosDisponiveis,
        mediasHomeXG,
        mediasAwayXG,
        forcasHomeXG,
        forcasAwayXG,
        ligaMediasXG,
        oddsFaixasDisponiveisCasa,
        oddsFaixasDisponiveisVisitante,
        confronto: confronto ? {
          id: confronto.id,
          round: confronto.round,
          utcDate: confronto.utcDate.toISOString(),
        } : null,
      },
    })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/previsao]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
