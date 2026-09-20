import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { previsaoQuerySchema } from '@/lib/validations/liga'
import { FAIXAS_ODDS_PADRAO } from '@/types/liga'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'
import {
  calcularMediasLiga,
  calcularMediasTime,
  calcularMediasTimeDescritivas,
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
  calcularMediasTimeXGDescritivas,
  calcularForcasTimeXG,
  calcularMediasTimeXGComDecay,
  type MediasLigaXG,
  calcularLambdaMercado,
  rankearModelos,
  construirDiagnosticoDispersao,
} from '@/lib/analytics'
import { construirAmostraTime, faixasDisponiveis, temFiltroAtivo } from '@/lib/analytics/amostra'

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

    const { isLeagueAccessible } = await import('@/lib/auth/free-leagues')
    const { hasVipAccess } = await import('@/lib/auth/check-access')
    const hasAccess = await hasVipAccess(session.user.id)
    if (!isLeagueAccessible(slug, hasAccess)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso VIP necessário.' },
        { status: 403 }
      )
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
          include: { market: { select: { key: true } } },
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

    const jogosTypeSafe = todosOsJogos.map((m) => ({ ...m, fthg: m.fthg!, ftag: m.ftag! }))

    // Amostra de cada time sob os Filtros Avançados — mesma função usada em /estatisticas.
    // O λ só usa o mandante EM CASA e o visitante FORA, então é nesse mando que o filtro corta.
    const filtrosAtivos = temFiltroAtivo(query)
    const amostraHome = construirAmostraTime(jogosTypeSafe, query.homeTeamId, 'home', query)
    const amostraAway = construirAmostraTime(jogosTypeSafe, query.awayTeamId, 'away', query)

    const jogosFiltradosHome = [...amostraHome.jogos, ...amostraHome.jogosOutroMando]
    const jogosFiltradosAway = [...amostraAway.jogos, ...amostraAway.jogosOutroMando]

    // Quais faixas de odds têm jogos para os times selecionados (base completa, sem filtro)
    const oddsFaixasDisponiveisCasa = faixasDisponiveis(jogosTypeSafe, query.homeTeamId, 'home', FAIXAS_ODDS_PADRAO)
    const oddsFaixasDisponiveisVisitante = faixasDisponiveis(jogosTypeSafe, query.awayTeamId, 'away', FAIXAS_ODDS_PADRAO)

    const confrontoResumo = confronto ? {
      id: confronto.id,
      round: confronto.round,
      utcDate: confronto.utcDate.toISOString(),
    } : null

    // Amostra que não sustenta a previsão NÃO é erro da requisição: responde 200 sem o modelo,
    // com o que é só descrição (médias, frequências, forma, amostra, confronto), para a tela
    // seguir mostrando estatísticas, odds e jogadores e avisar só no lugar da projeção.
    const respostaSemPrevisao = (motivo: string) => {
      const n = jogosTypeSafe.length
      const media = (soma: number) => (n > 0 ? soma / n : 0)
      const muH = media(jogosTypeSafe.reduce((s, j) => s + j.fthg, 0))
      const muA = media(jogosTypeSafe.reduce((s, j) => s + j.ftag, 0))
      const ligaDescritiva = {
        muH,
        muA,
        varH: media(jogosTypeSafe.reduce((s, j) => s + Math.pow(j.fthg - muH, 2), 0)),
        varA: media(jogosTypeSafe.reduce((s, j) => s + Math.pow(j.ftag - muA, 2), 0)),
        totalJogos: n,
      }

      // Liga sem gols no mando zera o denominador da força: 0 em vez de NaN (que vira null no JSON)
      const finito = (v: number) => (Number.isFinite(v) ? v : 0)
      const forcasSeguras = (m: ReturnType<typeof calcularMediasTimeDescritivas>) => {
        const f = calcularForcasTime(m, ligaDescritiva)
        return { fcAtC: finito(f.fcAtC), fcDfC: finito(f.fcDfC), fcAtV: finito(f.fcAtV), fcDfV: finito(f.fcDfV) }
      }

      const mediasHomeDesc = calcularMediasTimeDescritivas(query.homeTeamId, jogosFiltradosHome as any)
      const mediasAwayDesc = calcularMediasTimeDescritivas(query.awayTeamId, jogosFiltradosAway as any)

      let ligaXG: MediasLigaXG | null = null
      try {
        ligaXG = calcularMediasLigaXG(jogosTypeSafe as any)
      } catch {
        ligaXG = null
      }
      const homeXG = ligaXG ? calcularMediasTimeXGDescritivas(query.homeTeamId, jogosFiltradosHome as any) : null
      const awayXG = ligaXG ? calcularMediasTimeXGDescritivas(query.awayTeamId, jogosFiltradosAway as any) : null

      return NextResponse.json({
        data: {
          previsaoDisponivel: false,
          motivoIndisponivel: motivo,
          modelo: query.modelo,
          medias: { home: mediasHomeDesc, away: mediasAwayDesc, liga: ligaDescritiva },
          forcas: { home: forcasSeguras(mediasHomeDesc), away: forcasSeguras(mediasAwayDesc) },
          xgDisponivel: Boolean(ligaXG && homeXG && awayXG),
          xgJogosDisponiveis: ligaXG?.totalJogos ?? 0,
          mediasHomeXG: homeXG,
          mediasAwayXG: awayXG,
          forcasHomeXG: ligaXG && homeXG ? calcularForcasTimeXG(homeXG, ligaXG) : null,
          forcasAwayXG: ligaXG && awayXG ? calcularForcasTimeXG(awayXG, ligaXG) : null,
          ligaMediasXG: ligaXG,
          oddsFaixasDisponiveisCasa,
          oddsFaixasDisponiveisVisitante,
          amostra: { filtrosAtivos, home: amostraHome.resumo, away: amostraAway.resumo },
          confronto: confrontoResumo,
        },
      })
    }

    if (todosOsJogos.length < 20) {
      return respostaSemPrevisao(`A liga tem só ${todosOsJogos.length} jogos finalizados na temporada (mín. 20).`)
    }

    // Calcular estatísticas globais da liga (NUNCA USAM DECAY)
    const mediasLiga = calcularMediasLiga(jogosTypeSafe as any)
    const piLiga = estimarPiLiga(jogosTypeSafe as any, mediasLiga)
    const varianciaLiga = calcularVarianciaGols(jogosTypeSafe as any, mediasLiga)
    const rhoLiga = estimarRhoEmpirico(jogosTypeSafe as any, mediasLiga)

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
        try {
          mediasHomeXGPoisson = calcularMediasTimeXG(query.homeTeamId, jogosFiltradosHome as any)
          mediasAwayXGPoisson = calcularMediasTimeXG(query.awayTeamId, jogosFiltradosAway as any)
          forcasHomeXGPoisson = calcularForcasTimeXG(mediasHomeXGPoisson, ligaMediasXG!)
          forcasAwayXGPoisson = calcularForcasTimeXG(mediasAwayXGPoisson, ligaMediasXG!)
        } catch (e) {
          // Sem filtro, falta de xG do time continua sendo erro; com filtro, a amostra pode
          // ficar com menos de 4 jogos com xG — segue só com gols em vez de derrubar o cálculo.
          if (!filtrosAtivos) throw e
          xgDisponivel = false
        }
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
        // Modelos avançados usam decay SOBRE A MESMA AMOSTRA FILTRADA do Poisson: o filtro
        // escolhe os jogos, o decay só define o peso de cada um. Parâmetros de liga seguem globais.
        mediasHome = calcularMediasTimeComDecay(query.homeTeamId, jogosFiltradosHome as any, dataReferencia)
        mediasAway = calcularMediasTimeComDecay(query.awayTeamId, jogosFiltradosAway as any, dataReferencia)
        forcasHome = calcularForcasTime(mediasHome, mediasLiga)
        forcasAway = calcularForcasTime(mediasAway, mediasLiga)

        if (xgDisponivel) {
          mediasHomeXG = calcularMediasTimeXGComDecay(query.homeTeamId, jogosFiltradosHome as any, dataReferencia)
          mediasAwayXG = calcularMediasTimeXGComDecay(query.awayTeamId, jogosFiltradosAway as any, dataReferencia)
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
      return respostaSemPrevisao(
        'O modelo exige ao menos 4 jogos em casa e 4 fora de cada time. ' +
        `Mandante: ${amostraHome.resumo.usados} em casa / ${amostraHome.jogosOutroMando.length} fora · ` +
        `Visitante: ${amostraAway.jogosOutroMando.length} em casa / ${amostraAway.resumo.usados} fora.` +
        (filtrosAtivos ? ' Relaxe os filtros para projetar.' : '')
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
        vereditoDispersao = diag.gols.condicional.veredito ?? undefined

        const { ranking, sinais } = rankearModelos(
          jogosTypeSafe as any,
          lambdaH!,
          lambdaA!,
          mediasLiga,
          parametrosExtras,
          diag.gols.condicional.veredito ?? undefined
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
        previsaoDisponivel: true,
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
        amostra: {
          filtrosAtivos,
          home: amostraHome.resumo,
          away: amostraAway.resumo,
        },
        confronto: confrontoResumo,
      },
    })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/previsao]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Nenhum histórico disponível para analisar este confronto no momento.' },
      { status: 500 }
    )
  }
}
