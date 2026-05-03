import { z } from 'zod'

export const validacaoRiscoSchema = z.object({
  banca: z.number().positive('Banca deve ser positiva'),
  oddsMedia: z.number().min(1.01, 'Odd mínima: 1.01'),
  roiEsperado: z.number().min(-100).max(100),
  numBets: z.number().int().min(10, 'Mínimo 10 apostas'),
  tempoMeses: z.number().int().min(1, 'Mínimo 1 mês'),
  limiteDrawdown: z.number().min(5).max(95),
  stakeEscolhida: z.number().min(0.1).max(100),
  simulacoesCount: z.number().int().min(100).max(10000),
})

export const overUnderLinhasSchema = z.object({
  line: z.number().min(1.5).max(5.5),
  under: z.number().min(1.01, 'Odd mínima: 1.01'),
  over: z.number().min(1.01, 'Odd mínima: 1.01'),
})

export const overUnder25Schema = z.object({
  under: z.number().min(1.01, 'Odd mínima: 1.01'),
  over: z.number().min(1.01, 'Odd mínima: 1.01'),
})

export const distribuicaoSchema = z.object({
  baseMean: z.number().min(-4).max(4),
  stdDev: z.number().min(0.6).max(2.5),
  skewness: z.number().min(-2).max(2),
  kurtosis: z.number().min(1.5).max(6),
})

export type ValidacaoRiscoInput = z.infer<typeof validacaoRiscoSchema>
export type OverUnderLinhasInput = z.infer<typeof overUnderLinhasSchema>
export type OverUnder25Input = z.infer<typeof overUnder25Schema>
export type DistribuicaoInput = z.infer<typeof distribuicaoSchema>
