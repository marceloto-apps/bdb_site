/**
 * Tipos do lado da UI: o RunResult chega serializado do Worker/servidor (Float64Array → number[],
 * NaN → null, Infinity → 'Infinity'), e o catálogo/manifesto vêm de /api/laboratorio/catalogo.
 */
import type { Aposta, Aviso, Drawdown, Kpis, Segmento, ValidacaoResult } from '../engine/tipos'

type Serial<T> = { [K in keyof T]: T[K] extends Float64Array ? number[] : T[K] extends number ? number | null : T[K] extends [number, number] | null ? [number, number] | null : T[K] }

export type KpisUI = Serial<Kpis>
export interface CaminhoUI {
  banco: number[]; cumulativo: number[]; underwater: number[]
  mdd: number | null; mddPct: number | null; mddDuracao: number; mddRecuperacao: number | null
  drawdowns: Drawdown[]; maiorSequenciaDerrotas: number; maiorSemNovoMaximo: number
  sharpe: number | null; sortino: number | null; calmar: number | null
}
export interface ClvUI {
  nComRef: number; evMedio: number | null; yieldEsperado: number | null; lucroEsperado: number | null
  esperadoCumulativo: number[]; clvBrutoMedio: number | null; clvNovigMedio: number | null; clvPontosMedio: number | null
  beatRate: number | null; clvCumulativo: number[]; tClv: number | null; refSoft: number | null
}
export interface InferenciaUI {
  margemMedia: number | null; tYield: number | null; pValor: number | null; zBuchdahl: number | null; nMinimo: number | 'Infinity' | null
  ic95Yield: [number, number] | null; ic95Mdd: [number, number] | null; ic95Clv: [number, number] | null; reamostras: number; amostraPequena: boolean
}
export type ApostaUI = Serial<Omit<Aposta, 'extras'>> & { extras?: Record<string, number | string | null> }

/** Serialização profunda: todo number pode chegar como null (NaN no engine). */
type Nulo<T> = T extends number ? number | null : T extends (infer U)[] ? Nulo<U>[] : T extends object ? { [K in keyof T]: Nulo<T[K]> } : T
export type ValidacaoUI = Nulo<ValidacaoResult>

export interface RunUI {
  hash: string
  datasetVersao: string | null
  catalogoVersao: string | null
  engineVersao: string
  nUniverso: number
  nSelecionados: number
  nApostas: number
  kpis: KpisUI
  caminho: CaminhoUI
  clv: ClvUI
  inferencia: InferenciaUI
  segmentos: Record<string, Segmento[]>
  apostas: ApostaUI[]
  avisos: Aviso[]
  camposUsados: string[]
  tempoMs: number
  validacao?: ValidacaoUI
}

export interface CampoUI { key: string; label: string; tipo: string; bloco: string; descricao: string; fontes: string[]; cobertura?: Record<string, number>; virtual?: boolean }
export interface FuncaoUI { nome: string; assinatura: string; retorno: string; descricao: string }

export interface TemporadaUI { key: string; label: string; de: string; ate: string; linhas: number }
export interface CompeticaoUI { key: string; nome: string; pais: string; nivel: number | null; tipo: string; soFpt: boolean; feminino: boolean; incluidaPorPadrao: boolean; linhas: number; temporadas: TemporadaUI[] }
export interface ResumoUI { versao: string; geradoEm: string; catalogoVersao: string; builderVersao: string; totalLinhas: number; aliases: Record<string, string>; competicoes: CompeticaoUI[] }

export interface EstrategiaSalvaUI { id: string; userId: string; nome: string; descricao: string | null; publica: boolean; tentativas: number; holdoutAberto: boolean; engineVersao: string; catalogoVersao: string; createdAt: string; updatedAt: string; minha: boolean; runs: number }
export interface IndicadorSalvoUI { id: string; userId: string; nome: string; descricao: string | null; formula: string; tipo: string; publico: boolean; meu: boolean; updatedAt: string }
export interface RunSalvoUI { id: string; strategyId: string | null; origem: string; datasetVersao: string; engineVersao: string; hash: string; nUniverso: number; nApostas: number; resumo: { kpis: KpisUI; inferencia: InferenciaUI }; createdAt: string }

/** Resultado guardado para comparação lado a lado (até 5). */
export interface RunComparado { rotulo: string; run: RunUI; cor: string }
