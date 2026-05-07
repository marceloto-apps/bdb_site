export const GROUND_TRUTH_BRA1_2026 = {
  totalJogos: 117,
  muH: 1.57,        // μ_h liga (Média de FTHG)
  muA: 1.05,        // μ_a liga (Média de FTAG)
  dpFthg: 1.15,
  dpFtag: 0.95,
} as const

export const CASOS_GROUND_TRUTH = [
  {
    nome: 'Flamengo RJ vs Vasco',
    home: 'Flamengo RJ', away: 'Vasco',
    expected: { lambdaH: 1.93, lambdaA: 0.78 }, // tolerância: ver 10.3
    mercados: { casa: 0.6447, empate: 0.2111, visit: 0.1441, btts: 0.4645, over25: 0.5104 },
  },
  {
    nome: 'Athletico-PR vs Grêmio',
    home: 'Athletico-PR', away: 'Gremio',
    expected: { lambdaH: 1.86, lambdaA: 0.64 },
    mercados: { casa: 0.6648, empate: 0.2135, visit: 0.1217, btts: 0.4002, over25: 0.4562 },
  },
  {
    nome: 'Cruzeiro vs Atlético-MG',
    home: 'Cruzeiro', away: 'Atletico-MG',
    expected: { lambdaH: 0.96, lambdaA: 0.81 },
    mercados: { casa: 0.3761, empate: 0.3301, visit: 0.2938, btts: 0.3443, over25: 0.2632 },
  },
  {
    nome: 'São Paulo vs Bahia',
    home: 'Sao Paulo', away: 'Bahia',
    expected: { lambdaH: 1.02, lambdaA: 0.79 },
    mercados: { casa: 0.3987, empate: 0.3248, visit: 0.2765, btts: 0.3493, over25: 0.2719 },
  },
  {
    nome: 'Chapecoense-SC vs Bragantino',
    home: 'Chapecoense-SC', away: 'Bragantino',
    expected: { lambdaH: 0.83, lambdaA: 1.33 },
    mercados: { casa: 0.2342, empate: 0.2821, visit: 0.4837, btts: 0.4162, over25: 0.3680 },
  },
] as const
