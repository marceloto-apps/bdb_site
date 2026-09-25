/**
 * Cliente do Worker para a UI (Fase 4): API em Promises sobre o protocolo tipado.
 *
 *   const lab = criarLaboratorio()
 *   await lab.preparar()                       // busca catálogo + manifesto em /api/laboratorio/catalogo
 *   const v = await lab.validar(estrategia)
 *   const r = await lab.executar(estrategia, { aoProgresso })
 *   lab.encerrar()
 */
import type { Estrategia } from '../engine/tipos'
import type { PedidoWorker, RespostaWorker } from './protocolo'
import type { Manifest } from '../data/dataset'

type SemId<T> = T extends unknown ? Omit<T, 'id'> : never

export interface ProgressoUI { fase: 'baixando' | 'decodificando' | 'executando'; feitos: number; total: number }

export interface ClienteLaboratorio {
  preparar: (opcoes?: { versao?: string }) => Promise<{ versao: string; resumo: unknown; catalogo: unknown }>
  validar: (estrategia: Estrategia) => Promise<Extract<RespostaWorker, { t: 'validacao' }>>
  executar: (estrategia: Estrategia, opcoes?: { bootstrap?: number; maxApostas?: number; extras?: boolean; aoProgresso?: (p: ProgressoUI) => void }) => Promise<{ resultado: unknown; carga?: { chunks: number; bytes: number; ms: number; doCache: number } }>
  limpar: () => Promise<void>
  encerrar: () => void
}

export class ErroLaboratorio extends Error {
  constructor(mensagem: string, public erros: string[] = []) { super(mensagem); this.name = 'ErroLaboratorio' }
}

export function criarLaboratorio(endpoints = { catalogo: '/api/laboratorio/catalogo', dataset: '/api/laboratorio/dataset' }): ClienteLaboratorio {
  const worker = new Worker(new URL('./laboratorio.worker.ts', import.meta.url))
  let proximoId = 1
  const pendentes = new Map<number, { resolve: (r: RespostaWorker) => void; reject: (e: Error) => void; aoProgresso?: (p: ProgressoUI) => void }>()

  worker.onmessage = (ev: MessageEvent<RespostaWorker>) => {
    const r = ev.data
    const p = pendentes.get(r.id)
    if (!p) return
    if (r.t === 'progresso') { p.aoProgresso?.({ fase: r.fase, feitos: r.feitos, total: r.total }); return }
    pendentes.delete(r.id)
    if (r.t === 'erro') p.reject(new ErroLaboratorio(r.mensagem, r.erros)); else p.resolve(r)
  }
  worker.onerror = (e) => { for (const p of Array.from(pendentes.values())) p.reject(new ErroLaboratorio(e.message)); pendentes.clear() }

  const enviar = (pedido: SemId<PedidoWorker>, aoProgresso?: (p: ProgressoUI) => void) => new Promise<RespostaWorker>((resolve, reject) => {
    const id = proximoId++
    pendentes.set(id, { resolve, reject, aoProgresso })
    worker.postMessage({ ...pedido, id } as PedidoWorker)
  })

  return {
    async preparar(opcoes) {
      const r = await fetch(`${endpoints.catalogo}${opcoes?.versao ? `?versao=${encodeURIComponent(opcoes.versao)}` : ''}`, { credentials: 'same-origin' })
      if (!r.ok) throw new ErroLaboratorio(`Catálogo/manifesto: HTTP ${r.status}`)
      const { catalogo, manifest, resumo } = (await r.json()) as { catalogo: { versao: string; campos: { key: string; tipo: string }[] }; manifest: Manifest; resumo: unknown }
      const resp = await enviar({ t: 'preparar', catalogo, manifest, endpointDataset: endpoints.dataset })
      return { versao: (resp as { versao: string }).versao, resumo, catalogo }
    },
    async validar(estrategia) { return (await enviar({ t: 'validar', estrategia })) as Extract<RespostaWorker, { t: 'validacao' }> },
    async executar(estrategia, opcoes) {
      const { aoProgresso, ...resto } = opcoes ?? {}
      const r = (await enviar({ t: 'executar', estrategia, opcoes: resto }, aoProgresso)) as Extract<RespostaWorker, { t: 'resultado' }>
      return { resultado: r.resultado, carga: r.carga }
    },
    async limpar() { await enviar({ t: 'limpar' }) },
    encerrar() { worker.terminate(); pendentes.clear() },
  }
}
