/**
 * Execução do engine no servidor (rota POST /api/laboratorio/run e runs salvos): manifesto do R2
 * com cache curto, dataset carregado só com os grupos da estratégia, mesmo `executar()` do Worker.
 */
import { catalogoPadrao } from '../engine/catalogo'
import { prepararEstrategia, type EstrategiaCompilada } from '../engine/estrategia'
import { executarCompilada } from '../engine/run'
import type { Estrategia, RunResult } from '../engine/tipos'
import { carregarDataset, filtroDoUniverso, infoCompeticoes, resolverAliases, type Manifest } from './dataset'
import { buscadorR2, lerJson, lerLatest } from './r2'

const TTL_MANIFEST_MS = 60_000
let cache: { versao: string; manifest: Manifest; em: number } | null = null

/** Manifesto da versão mais recente (ou de uma versão específica), com cache de 60 s. */
export async function lerManifest(versao?: string): Promise<Manifest> {
  const alvo = versao ?? (await lerLatest()).versao
  if (cache && cache.versao === alvo && Date.now() - cache.em < TTL_MANIFEST_MS) return cache.manifest
  const manifest = await lerJson<Manifest>(`${alvo}/manifest.json`)
  cache = { versao: alvo, manifest, em: Date.now() }
  return manifest
}

export interface ResultadoServidor {
  resultado: RunResult
  compilada: EstrategiaCompilada
  manifest: Manifest
  carga: { chunks: number; bytes: number; ms: number }
}

export async function executarNoServidor(estrategia: Estrategia, op: { versao?: string; bootstrap?: number; maxApostas?: number; extras?: boolean } = {}): Promise<ResultadoServidor> {
  const cat = catalogoPadrao()
  const compilada = prepararEstrategia(estrategia, cat)
  const manifest = await lerManifest(op.versao)
  const universo = resolverAliases(estrategia.universo, manifest)
  const t0 = Date.now()
  const carga = await carregarDataset({ manifest, campos: compilada.camposUsados, filtro: filtroDoUniverso(universo, manifest), buscar: buscadorR2, paralelo: 16 })
  const { info, nomes } = infoCompeticoes(manifest)
  const resultado = executarCompilada({ ...compilada, estrategia: { ...estrategia, universo } }, carga.dataset, {
    catalogo: cat, competicoesInfo: info, nomesCompeticoes: nomes, nomesTimes: new Map(Object.entries(manifest.times ?? {})),
    bootstrap: op.bootstrap, maxApostas: op.maxApostas, extras: op.extras ?? false,
  })
  return { resultado, compilada, manifest, carga: { chunks: carga.chunks, bytes: carga.bytes, ms: Date.now() - t0 } }
}

/** Resumo do manifesto para a UI (competições e temporadas disponíveis). */
export function resumoManifest(m: Manifest) {
  const temporadas = new Map<string, { key: string; label: string; de: string; ate: string; linhas: number }[]>()
  for (const c of m.chunks) {
    let a = temporadas.get(c.competitionKey); if (!a) { a = []; temporadas.set(c.competitionKey, a) }
    a.push({ key: c.seasonKey, label: c.seasonLabel, de: c.de, ate: c.ate, linhas: c.linhas })
  }
  return {
    versao: m.versao, geradoEm: m.geradoEm, catalogoVersao: m.catalogoVersao, builderVersao: m.builderVersao, totalLinhas: m.totalLinhas,
    aliases: m.aliases ?? {},
    competicoes: m.competicoes.map((c) => ({ key: c.key, nome: c.nome, pais: c.pais, nivel: c.nivel, tipo: c.tipo, soFpt: c.soFpt, feminino: c.feminino, incluidaPorPadrao: c.incluidaPorPadrao, linhas: c.linhas, temporadas: (temporadas.get(c.key) ?? []).sort((a, b) => a.de.localeCompare(b.de)) })),
  }
}
