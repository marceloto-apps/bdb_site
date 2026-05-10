import { z } from 'zod'

// GET /api/ligas/[slug]/times — sem params obrigatórios
export const timesQuerySchema = z.object({})

// GET /api/ligas/[slug]/partidas
export const partidasQuerySchema = z.object({
  homeTeamId: z.string().cuid().optional(),
  awayTeamId: z.string().cuid().optional(),
  roundFrom: z.coerce.number().int().min(1).optional(),
  roundTo: z.coerce.number().int().min(1).optional(),
  months: z.string().optional(),           // csv: "1,2,3" → jan, fev, mar
  mando: z.enum(['casa', 'fora', 'ambos']).default('ambos'),
  oddsCasaFaixas: z.string().optional(),   // csv de faixas: "1.21-1.40,3.51-5.00"
  oddsVisFaixas: z.string().optional(),    // csv de faixas: "1.41-1.70,2.01-2.30"
})

// GET /api/ligas/[slug]/previsao
export const previsaoQuerySchema = z.object({
  homeTeamId: z.string().cuid(),
  awayTeamId: z.string().cuid(),
  modelo: z.enum(['POISSON', 'ZIP', 'NB', 'DIXON_COLES']).default('POISSON'),
  lambdaMethod: z.enum(['MEDIA_SIMPLES', 'FORCAS_RELATIVAS', 'XG']).default('MEDIA_SIMPLES'),
  // Filtros opcionais (mesmos do /partidas, usados para filtrar a base do cálculo)
  roundFrom: z.coerce.number().int().min(1).optional(),
  roundTo: z.coerce.number().int().min(1).optional(),
  months: z.string().optional(),
  oddsCasaFaixas: z.string().optional(),   // csv de faixas: "1.21-1.40,3.51-5.00"
  oddsVisFaixas: z.string().optional(),    // csv de faixas: "1.41-1.70,2.01-2.30"
})

// GET /api/ligas/[slug]/info — sem params obrigatórios
export const ligaInfoQuerySchema = z.object({})

// Tipos inferidos para uso nas rotas
export type PartidasQuery = z.infer<typeof partidasQuerySchema>
export type PrevisaoQuery = z.infer<typeof previsaoQuerySchema>
