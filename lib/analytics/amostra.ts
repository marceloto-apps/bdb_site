/**
 * Amostra de jogos de um time sob os Filtros Avançados (rodadas, meses, faixas de odds).
 *
 * Fonte ÚNICA da amostra: /previsao e /estatisticas montam os jogos por aqui, para que o
 * mesmo filtro produza os mesmos jogos em todas as abas do dashboard da liga.
 *
 * Odd de referência do filtro: 1x2 (`match_odds`) de FECHAMENTO, caindo para a de abertura
 * quando o jogo não tem fechamento. Não depende do toggle "Odds: Abertura/Fechamento" da aba
 * de Profit — aquele toggle escolhe a odd do cálculo de lucro, não os jogos da amostra.
 */

export type ContextoMando = 'CASA_VISITANTE' | 'GERAL'
export type LadoConfronto = 'home' | 'away'

export interface OddAmostra {
  selection: string
  odds: number
  oddsType: string
  market?: { key: string } | null
}

export interface JogoAmostra {
  id: string
  homeTeamId: string
  awayTeamId: string
  round: number | null
  utcDate: Date
  odds: OddAmostra[]
}

export interface FiltrosAmostra {
  roundFrom?: number
  roundTo?: number
  months?: string           // csv: "1,2,3"
  oddsCasaFaixas?: string   // csv: "1.21-1.40,3.51-5.00"
  oddsVisFaixas?: string
}

export interface FaixaOdds {
  min: number
  max: number
}

export interface ResumoAmostra {
  teamId: string
  total: number           // jogos do time no contexto, antes dos filtros
  usados: number          // jogos que sobraram
  foraPeriodo: number     // cortados por rodada/mês
  foraFaixaOdds: number   // cortados por faixa de odds
  semOdd: number          // cortados por não ter odd de referência (só com filtro de odds ativo)
  matchIds: string[]      // ids dos jogos usados
}

export interface AmostraTime<T> {
  /** Jogos usados: no contexto CASA_VISITANTE, só os do mando do time no confronto. */
  jogos: T[]
  /**
   * Só em CASA_VISITANTE: jogos do time no OUTRO mando, sem filtro nenhum. Nada exibido nem
   * o λ dependem deles; existem porque `calcularMediasTime` exige 4 jogos em cada mando, e
   * filtrar esse lado só serviria para derrubar o cálculo por "dados insuficientes".
   */
  jogosOutroMando: T[]
  resumo: ResumoAmostra
}

export function parseFaixas(csv?: string): FaixaOdds[] | null {
  if (!csv) return null
  const faixas = csv.split(',').map(f => {
    const [min, max] = f.split('-').map(Number)
    return { min, max }
  }).filter(f => Number.isFinite(f.min) && Number.isFinite(f.max))
  return faixas.length > 0 ? faixas : null
}

export function temFiltroAtivo(filtros: FiltrosAmostra): boolean {
  return Boolean(
    filtros.roundFrom || filtros.roundTo || filtros.months ||
    filtros.oddsCasaFaixas || filtros.oddsVisFaixas
  )
}

/** Odd 1x2 de referência do jogo para a seleção: fechamento, senão abertura. */
export function oddReferencia(jogo: JogoAmostra, selection: 'home' | 'away'): number | null {
  const candidatas = jogo.odds.filter(o => o.market?.key === 'match_odds' && o.selection === selection)
  const odd =
    candidatas.find(o => o.oddsType === 'PREMATCH_CLOSING') ??
    candidatas.find(o => o.oddsType === 'PREMATCH_OPENING')
  return odd ? odd.odds : null
}

export function oddNaFaixa(odd: number, faixas: FaixaOdds[]): boolean {
  // As faixas têm 2 casas (1.21-1.40, 1.41-1.70…): arredondar evita o buraco entre 1.40 e 1.41
  const valor = Math.round(odd * 100) / 100
  return faixas.some(f => valor >= f.min && valor <= f.max)
}

function dentroDoPeriodo(jogo: JogoAmostra, filtros: FiltrosAmostra, meses: number[] | null): boolean {
  if (filtros.roundFrom && jogo.round != null && jogo.round < filtros.roundFrom) return false
  if (filtros.roundTo && jogo.round != null && jogo.round > filtros.roundTo) return false
  if (meses && !meses.includes(new Date(jogo.utcDate).getMonth() + 1)) return false
  return true
}

/**
 * Monta a amostra de um time.
 *
 * Faixas de odds valem sempre para a odd DO PRÓPRIO TIME no mando do jogo: "Odds Casa" corta
 * os jogos dele como mandante, "Odds Visitante" os jogos dele como visitante. Com filtro de
 * odds ativo, jogo sem odd de referência sai da amostra (não dá para saber se atende à faixa)
 * e entra na contagem `semOdd`.
 */
export function construirAmostraTime<T extends JogoAmostra>(
  jogos: T[],
  teamId: string,
  lado: LadoConfronto,
  filtros: FiltrosAmostra,
  contexto: ContextoMando = 'CASA_VISITANTE'
): AmostraTime<T> {
  const meses = filtros.months ? filtros.months.split(',').map(Number) : null
  const faixasCasa = parseFaixas(filtros.oddsCasaFaixas)
  const faixasVis = parseFaixas(filtros.oddsVisFaixas)

  const jogosDoTime = jogos.filter(j => j.homeTeamId === teamId || j.awayTeamId === teamId)
  const noMandoDoConfronto = (j: T) => (lado === 'home' ? j.homeTeamId === teamId : j.awayTeamId === teamId)

  const candidatos = contexto === 'GERAL' ? jogosDoTime : jogosDoTime.filter(noMandoDoConfronto)
  const jogosOutroMando = contexto === 'GERAL' ? [] : jogosDoTime.filter(j => !noMandoDoConfronto(j))

  let foraPeriodo = 0
  let foraFaixaOdds = 0
  let semOdd = 0

  const usados = candidatos.filter(j => {
    if (!dentroDoPeriodo(j, filtros, meses)) {
      foraPeriodo++
      return false
    }

    const ehMandante = j.homeTeamId === teamId
    const faixas = ehMandante ? faixasCasa : faixasVis
    if (!faixas) return true

    const odd = oddReferencia(j, ehMandante ? 'home' : 'away')
    if (odd == null) {
      semOdd++
      return false
    }
    if (!oddNaFaixa(odd, faixas)) {
      foraFaixaOdds++
      return false
    }
    return true
  })

  return {
    jogos: usados,
    jogosOutroMando,
    resumo: {
      teamId,
      total: candidatos.length,
      usados: usados.length,
      foraPeriodo,
      foraFaixaOdds,
      semOdd,
      matchIds: usados.map(j => j.id),
    },
  }
}

/** Para cada faixa padrão: o time tem algum jogo, no mando do confronto, com odd nela? */
export function faixasDisponiveis(
  jogos: JogoAmostra[],
  teamId: string,
  lado: LadoConfronto,
  faixasPadrao: FaixaOdds[]
): boolean[] {
  const odds = jogos
    .filter(j => (lado === 'home' ? j.homeTeamId === teamId : j.awayTeamId === teamId))
    .map(j => oddReferencia(j, lado))
    .filter((o): o is number => o != null)

  return faixasPadrao.map(faixa => odds.some(o => oddNaFaixa(o, [faixa])))
}
