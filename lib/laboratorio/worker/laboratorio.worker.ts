/// <reference lib="webworker" />
/**
 * Web Worker do Laboratório (D1): mantém uma `Sessao` (manifesto + cache de chunks) e executa as
 * estratégias fora da thread da UI. Criado pelo cliente com `new Worker(new URL('./laboratorio.worker.ts', import.meta.url))`.
 */
import { serializarRun } from '../engine/run'
import { ErroEstrategia } from '../engine/estrategia'
import type { PedidoWorker, RespostaWorker } from './protocolo'
import { buscadorAssinado, cacheApi, Sessao } from './sessao'

const ctx = self as unknown as DedicatedWorkerGlobalScope
let sessao: Sessao | null = null

const responder = (r: RespostaWorker) => ctx.postMessage(r)

ctx.onmessage = async (ev: MessageEvent<PedidoWorker>) => {
  const p = ev.data
  try {
    switch (p.t) {
      case 'preparar': {
        sessao = new Sessao({
          catalogo: p.catalogo, manifest: p.manifest, buscar: buscadorAssinado(p.endpointDataset), cache: cacheApi(),
          aoProgresso: (pr) => responder({ t: 'progresso', id: idAtual, ...pr }),
        })
        responder({ t: 'pronto', id: p.id, versao: sessao.versao })
        return
      }
      case 'validar': {
        if (!sessao) throw new Error('Sessão não preparada')
        responder({ t: 'validacao', id: p.id, ...sessao.validar(p.estrategia) })
        return
      }
      case 'executar': {
        if (!sessao) throw new Error('Sessão não preparada')
        idAtual = p.id
        const { resultado, carga } = await sessao.executar(p.estrategia, p.opcoes)
        responder({ t: 'resultado', id: p.id, resultado: serializarRun(resultado), carga })
        return
      }
      case 'limpar': {
        sessao?.limpar()
        responder({ t: 'pronto', id: p.id, versao: sessao?.versao ?? '' })
        return
      }
    }
  } catch (e) {
    if (e instanceof ErroEstrategia) responder({ t: 'erro', id: p.id, mensagem: 'Estratégia inválida', erros: e.erros })
    else responder({ t: 'erro', id: p.id, mensagem: e instanceof Error ? e.message : String(e) })
  }
}

let idAtual = 0
