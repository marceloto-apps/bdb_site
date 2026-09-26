/**
 * Protocolo tipado entre a UI e o Worker do Laboratório (postMessage). Cada pedido leva um `id`;
 * o Worker responde com `progresso` (0..n vezes) e um `resultado` ou `erro` com o mesmo id.
 */
import type { Estrategia } from '../engine/tipos'
import type { Manifest } from '../data/dataset'

export interface CatalogoJson { versao: string; campos: { key: string; tipo: string }[] }

export type PedidoWorker =
  | { t: 'preparar'; id: number; catalogo: CatalogoJson; manifest: Manifest; endpointDataset: string }
  | { t: 'executar'; id: number; estrategia: Estrategia; opcoes?: { bootstrap?: number; maxApostas?: number; extras?: boolean; validacao?: boolean; tentativasPrevias?: number } }
  | { t: 'validar'; id: number; estrategia: Estrategia }
  | { t: 'limpar'; id: number }

export type RespostaWorker =
  | { t: 'progresso'; id: number; fase: 'baixando' | 'decodificando' | 'executando' | 'validando' | 'varrendo'; feitos: number; total: number }
  | { t: 'resultado'; id: number; resultado: unknown; carga?: { chunks: number; bytes: number; ms: number; doCache: number } }
  | { t: 'validacao'; id: number; ok: boolean; erros: string[]; avisos: string[]; camposUsados: string[]; indicadores: { nome: string; tipo: string }[] }
  | { t: 'pronto'; id: number; versao: string }
  | { t: 'erro'; id: number; mensagem: string; erros?: string[] }
