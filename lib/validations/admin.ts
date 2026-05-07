import { z } from 'zod'

export const syncPartidasSchema = z.object({
  seasonId: z.string().cuid(),
})

export const syncOddsSchema = z.object({
  seasonId: z.string().cuid(),
  maxPartidas: z.coerce.number().int().min(1).max(30).default(10),
})

export const syncStatusQuerySchema = z.object({
  seasonId: z.string().cuid(),
})
