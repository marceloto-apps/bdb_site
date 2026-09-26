/**
 * Validação (zod) dos payloads da API do Laboratório. O engine valida a semântica das fórmulas
 * (prepararEstrategia); aqui só a forma do JSON e limites de tamanho.
 */
import { z } from 'zod'

const expressao = z.object({ formula: z.string().max(4000).optional(), ast: z.unknown().optional() }).refine((e) => e.formula !== undefined || e.ast !== undefined, 'fórmula ou AST')
const casa = z.enum(['bet365', 'pinnacle'])
const snapshot = z.enum(['open', 'close'])
const preco = z.object({ casa, snapshot })

export const mercadoSchema = z.enum(['1x2', 'btts', 'ou', 'ah', 'corners', 'ht_1x2', 'ht_ou', 'ht_ah', 'dc', 'eh', 'cs'])

export const entradaSchema = z.object({
  id: z.string().max(40).optional(),
  mercado: mercadoSchema,
  selecao: z.union([z.string().max(20), expressao]),
  linha: z.union([z.literal('main'), z.number(), expressao]).optional(),
  preco,
  liquidacao: preco.optional(),
  condicao: expressao.optional(),
  oddMin: z.number().min(1).optional(),
  oddMax: z.number().min(1).optional(),
  slippage: z.number().min(0).max(0.5).optional(),
  stakeMult: z.number().positive().max(100).optional(),
})

export const stakingSchema = z.discriminatedUnion('metodo', [
  z.object({ metodo: z.literal('flat'), unidade: z.number().positive() }),
  z.object({ metodo: z.literal('pct_banco'), pct: z.number().positive().max(1), minimo: z.number().nonnegative().optional(), maximo: z.number().positive().optional() }),
  z.object({ metodo: z.literal('kelly'), fracao: z.number().positive().max(1), prob: expressao, cap: z.number().positive().max(1).optional(), minimo: z.number().nonnegative().optional() }),
  z.object({ metodo: z.literal('to_win'), alvo: z.number().positive(), maximo: z.number().positive().optional() }),
])

export const universoSchema = z.object({
  competicoes: z.array(z.string().max(120)).max(500).optional(),
  temporadas: z.array(z.string().max(120)).max(2000).optional(),
  temporadasLabel: z.array(z.string().max(20)).max(50).optional(),
  de: z.string().max(30).optional(),
  ate: z.string().max(30).optional(),
  fontes: z.array(z.enum(['core', 'fpt'])).max(2).optional(),
  tipos: z.array(z.enum(['LEAGUE', 'CUP', 'INTERNATIONAL_CLUBS', 'NATIONAL_TEAMS'])).max(4).optional(),
  excluirRodadasIniciais: z.number().int().min(0).max(38).optional(),
  coberturaMinima: z.array(z.string().max(80)).max(50).optional(),
  temporadasExcluidas: z.array(z.string().max(120)).max(2000).optional(),
})

export const validacaoSchema = z.object({
  holdout: z.enum(['selado', 'aberto']).optional(),
  folds: z.enum(['temporada', 'ano']).optional(),
  walkForward: z.object({ janelas: z.number().int().min(2).max(8), expandindo: z.boolean().optional() }).optional(),
  varredura: z.record(z.string().max(30), z.object({ de: z.number(), ate: z.number(), passo: z.number().positive() })).optional(),
  monteCarlo: z.object({ caminhos: z.number().int().min(100).max(10000).optional(), ruinaPct: z.number().gt(0).lte(1).optional() }).optional(),
  calibracao: z.object({ prob: expressao }).optional(),
})

export const estrategiaSchema = z.object({
  versao: z.literal(1),
  nome: z.string().max(120).optional(),
  universo: universoSchema.optional(),
  parametros: z.record(z.string().max(30), z.number()).optional(),
  indicadores: z.array(z.object({ nome: z.string().min(1).max(40), expressao })).max(50).optional(),
  regra: expressao.optional(),
  entradas: z.array(entradaSchema).min(1).max(10),
  staking: stakingSchema,
  bancoInicial: z.number().nonnegative().optional(),
  exposicaoMaxDia: z.number().positive().optional(),
  stopDrawdown: z.number().gt(0).lt(1).optional(),
  referencia: preco.optional(),
  seed: z.number().int().optional(),
  bootstrap: z.number().int().min(0).max(5000).optional(),
  validacao: validacaoSchema.optional(),
})

export type EstrategiaJson = z.infer<typeof estrategiaSchema>

export const runPostSchema = z.object({
  estrategia: estrategiaSchema,
  /** grava um BacktestRun */
  salvar: z.boolean().optional(),
  strategyId: z.string().max(40).optional(),
  maxApostas: z.number().int().min(0).max(5000).optional(),
  bootstrap: z.number().int().min(0).max(5000).optional(),
  /** anexa a validação avançada (Fase 5) */
  validacao: z.boolean().optional(),
  tentativasPrevias: z.number().int().min(0).max(100000).optional(),
})

export const salvarRunSchema = z.object({
  strategyId: z.string().max(40).optional(),
  definicao: estrategiaSchema,
  resultado: z.object({
    hash: z.string().max(32),
    datasetVersao: z.string().max(20).nullable(),
    catalogoVersao: z.string().max(20).nullable(),
    engineVersao: z.string().max(20),
    nUniverso: z.number().int(),
    nSelecionados: z.number().int(),
    nApostas: z.number().int(),
    kpis: z.record(z.unknown()),
    caminho: z.record(z.unknown()),
    clv: z.record(z.unknown()),
    inferencia: z.record(z.unknown()),
    segmentos: z.record(z.unknown()),
    apostas: z.array(z.record(z.unknown())).max(5000),
    avisos: z.array(z.record(z.unknown())),
    camposUsados: z.array(z.string()),
    tempoMs: z.number(),
    validacao: z.record(z.unknown()).optional(),
  }),
})

export const estrategiaPostSchema = z.object({
  nome: z.string().min(1).max(120),
  descricao: z.string().max(4000).optional(),
  definicao: estrategiaSchema,
  publica: z.boolean().optional(),
})
export const estrategiaPatchSchema = estrategiaPostSchema.partial().extend({ holdoutAberto: z.literal(true).optional() })

export const indicadorPostSchema = z.object({
  nome: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'nome de identificador').max(40),
  descricao: z.string().max(2000).optional(),
  formula: z.string().min(1).max(4000),
  publico: z.boolean().optional(),
})
export const indicadorPatchSchema = indicadorPostSchema.partial()

export const LIMITE_APOSTAS_SALVAS = 2000
