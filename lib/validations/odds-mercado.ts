import { z } from "zod"

export const oddsMercadoQuerySchema = z.object({
  homeTeamId: z.string().min(1, "homeTeamId é obrigatório"),
  awayTeamId: z.string().min(1, "awayTeamId é obrigatório"),
  bookmaker: z.string().optional().default("bet365"),
  oddsType: z.enum(["opening", "current"]).optional().default("current"),
})

const oddSchema = z.number().nullable()

const overUnderSchema = z.record(
  z.string(),
  z.object({
    over: oddSchema,
    under: oddSchema,
  })
)

export const oddsMercadoDataSchema = z.object({
  fonte: z.enum(["bet365", "betano", "pinnacle", "betfair-exchange", "kambi", "manual"]),
  matchId: z.string().optional(),
  x1x2: z.object({
    home: oddSchema,
    draw: oddSchema,
    away: oddSchema,
  }),
  btts: z.object({
    yes: oddSchema,
    no: oddSchema,
  }),
  overUnder: overUnderSchema,
})

export type OddsMercadoQuery = z.infer<typeof oddsMercadoQuerySchema>
export type OddsMercado = z.infer<typeof oddsMercadoDataSchema>
