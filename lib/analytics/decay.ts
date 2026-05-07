export const XI_DEFAULT = 0.0065 // unidade: meia-semana (~3.5 dias)

export function pesoTemporal(
  dataJogo: Date,
  dataReferencia: Date,
  xi: number = XI_DEFAULT
): number {
  const msPorMeiaSemana = 1000 * 60 * 60 * 24 * 3.5
  const meiasSemanasAtras = (dataReferencia.getTime() - dataJogo.getTime()) / msPorMeiaSemana
  return Math.exp(-xi * Math.max(0, meiasSemanasAtras))
}
