export interface FaixaOdds {
  label: string
  min: number
  max: number
}

export interface ResultadoFaixa {
  faixa: FaixaOdds
  totalApostas: number
  acertos: number
  roi: number
  lucroPerda: number
}

export const FAIXAS_ODDS: FaixaOdds[] = [
  { label: '1.21-1.40', min: 1.21, max: 1.40 },
  { label: '1.41-1.70', min: 1.41, max: 1.70 },
  { label: '1.71-2.00', min: 1.71, max: 2.00 },
  { label: '2.01-2.30', min: 2.01, max: 2.30 },
  { label: '2.31-2.70', min: 2.31, max: 2.70 },
  { label: '2.71-3.50', min: 2.71, max: 3.50 },
  { label: '3.51-5.00', min: 3.51, max: 5.00 },
  { label: '5.01-9.00', min: 5.01, max: 9.00 },
  { label: '9.01-16.00', min: 9.01, max: 16.00 },
]

export function calcularMapaValor(
  jogos: Array<{
    fthg: number
    ftag: number
    ftr: 'H' | 'D' | 'A'
    oddHome: number | null
    oddDraw: number | null
    oddAway: number | null
  }>
): {
  casa: ResultadoFaixa[]
  empate: ResultadoFaixa[]
  visitante: ResultadoFaixa[]
} {
  const initFaixas = () =>
    FAIXAS_ODDS.map((faixa) => ({
      faixa,
      totalApostas: 0,
      acertos: 0,
      roi: 0,
      lucroPerda: 0,
    }))

  const resultadosCasa = initFaixas()
  const resultadosEmpate = initFaixas()
  const resultadosVisitante = initFaixas()

  for (const jogo of jogos) {
    // Processar Casa
    if (jogo.oddHome) {
      const idx = FAIXAS_ODDS.findIndex((f) => jogo.oddHome! >= f.min && jogo.oddHome! <= f.max)
      if (idx !== -1) {
        resultadosCasa[idx].totalApostas += 1
        if (jogo.ftr === 'H') {
          resultadosCasa[idx].acertos += 1
          resultadosCasa[idx].lucroPerda += jogo.oddHome - 1
        } else {
          resultadosCasa[idx].lucroPerda -= 1
        }
      }
    }

    // Processar Empate
    if (jogo.oddDraw) {
      const idx = FAIXAS_ODDS.findIndex((f) => jogo.oddDraw! >= f.min && jogo.oddDraw! <= f.max)
      if (idx !== -1) {
        resultadosEmpate[idx].totalApostas += 1
        if (jogo.ftr === 'D') {
          resultadosEmpate[idx].acertos += 1
          resultadosEmpate[idx].lucroPerda += jogo.oddDraw - 1
        } else {
          resultadosEmpate[idx].lucroPerda -= 1
        }
      }
    }

    // Processar Visitante
    if (jogo.oddAway) {
      const idx = FAIXAS_ODDS.findIndex((f) => jogo.oddAway! >= f.min && jogo.oddAway! <= f.max)
      if (idx !== -1) {
        resultadosVisitante[idx].totalApostas += 1
        if (jogo.ftr === 'A') {
          resultadosVisitante[idx].acertos += 1
          resultadosVisitante[idx].lucroPerda += jogo.oddAway - 1
        } else {
          resultadosVisitante[idx].lucroPerda -= 1
        }
      }
    }
  }

  // Calcular ROI para cada faixa
  const calcularRoi = (resultado: ResultadoFaixa) => {
    if (resultado.totalApostas > 0) {
      resultado.roi = (resultado.lucroPerda / resultado.totalApostas) * 100
    }
  }

  resultadosCasa.forEach(calcularRoi)
  resultadosEmpate.forEach(calcularRoi)
  resultadosVisitante.forEach(calcularRoi)

  return {
    casa: resultadosCasa,
    empate: resultadosEmpate,
    visitante: resultadosVisitante,
  }
}
