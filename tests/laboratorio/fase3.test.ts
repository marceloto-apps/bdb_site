import { describe, it, expect, vi } from 'vitest'
import { Sessao, buscadorAssinado, type CacheBytes } from '@/lib/laboratorio/worker/sessao'
import { executar } from '@/lib/laboratorio/engine/run'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { gerarCatalogo, CATALOGO_VERSAO } from '@/lib/laboratorio/schema/catalogo'
import { grupoDoCampo } from '@/lib/laboratorio/data/chunk'
import type { Manifest, ManifestChunk } from '@/lib/laboratorio/data/dataset'
import type { Dataset, Estrategia } from '@/lib/laboratorio/engine/tipos'
import { estrategiaSchema, runPostSchema, salvarRunSchema } from '@/lib/laboratorio/api/schemas'
import { amostrar, hashRegra } from '@/lib/laboratorio/api/runs'
import { datasetSintetico } from './sintetico'
import { codificar } from './codificar'

/** Converte o dataset sintético em chunks (um por temporada) + manifesto, como o builder faria. */
function empacotar(ds: Dataset): { manifest: Manifest; arquivos: Map<string, Uint8Array> } {
  const cat = gerarCatalogo()
  const tipo = new Map(cat.map((c) => [c.key, c.tipo]))
  const season = ds.textos.get('match.season')!
  const comp = ds.textos.get('match.competition')!
  const data = ds.numericas.get('match.utc_date')!
  const grupos = new Map<string, number[]>()
  for (let i = 0; i < ds.n; i++) { const k = `${comp[i]}|${season[i]}`; let a = grupos.get(k); if (!a) { a = []; grupos.set(k, a) } a.push(i) }
  const arquivos = new Map<string, Uint8Array>()
  const chunks: ManifestChunk[] = []
  const versao = 'sint-1'
  for (const [k, idx] of Array.from(grupos)) {
    const [c, s] = k.split('|')
    const dir = `${c}/${s}`
    const porGrupo = new Map<string, { nome: string; tipo: string; valores: (number | string | null)[] }[]>()
    const add = (nome: string, t: string, valores: (number | string | null)[]) => { const g = grupoDoCampo(nome); let a = porGrupo.get(g); if (!a) { a = []; porGrupo.set(g, a) } a.push({ nome, tipo: t, valores }) }
    for (const [nome, col] of Array.from(ds.numericas)) add(nome, tipo.get(nome) ?? 'ratio', idx.map((i) => (Number.isNaN(col[i]) ? null : tipo.get(nome) === 'date' ? new Date(col[i]).toISOString() : col[i])))
    for (const [nome, col] of Array.from(ds.textos)) add(nome, tipo.get(nome) ?? 'text', idx.map((i) => col[i]))
    const entry: ManifestChunk = { competitionKey: c, seasonKey: s, seasonLabel: ds.textos.get('match.season_label')![idx[0]] as string, dir, linhas: idx.length, de: new Date(data[idx[0]]).toISOString(), ate: new Date(data[idx[idx.length - 1]]).toISOString(), grupos: {} }
    for (const [g, cols] of Array.from(porGrupo)) {
      const buf = codificar(g, cols)
      arquivos.set(`${versao}/${dir}/${g}.bin`, buf)
      entry.grupos[g] = { arquivo: `${g}.bin`, bytes: buf.length, hash: 'x', colunas: cols.length }
    }
    chunks.push(entry)
  }
  const manifest: Manifest = { versao, formato: 1, catalogoVersao: CATALOGO_VERSAO, builderVersao: '0.1.0', geradoEm: '', aliases: {}, times: { t1: 'Time 1' }, totalLinhas: ds.n, chunks, competicoes: [
    { key: 'comp-a', nome: 'Comp A', pais: 'X', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorPadrao: true, feminino: false, linhas: ds.n / 2 },
    { key: 'comp-b', nome: 'Comp B', pais: 'X', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorPadrao: true, feminino: false, linhas: ds.n / 2 },
  ] }
  return { manifest, arquivos }
}

const ds = datasetSintetico({ n: 200 })
const { manifest, arquivos } = empacotar(ds)
const catalogoJson = { versao: CATALOGO_VERSAO, campos: gerarCatalogo().map((c) => ({ key: c.key, tipo: c.tipo })) }
const estrategia: Estrategia = { versao: 1, universo: { competicoes: ['comp-a'] }, indicadores: [{ nome: 'edge_h', expressao: { formula: 'odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } }], regra: { formula: 'edge_h > -0.06' }, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }], staking: { metodo: 'flat', unidade: 1 }, bootstrap: 50, seed: 3 }

describe('Sessao (núcleo do Worker)', () => {
  it('run pelo Worker reproduz o run direto sobre o dataset (mesmo hash e KPIs)', async () => {
    const pedidos: string[] = []
    const s = new Sessao({ catalogo: catalogoJson, manifest, buscar: async (k) => { pedidos.push(k); const b = arquivos.get(k); if (!b) throw new Error(k); return b } })
    const w = await s.executar(estrategia)
    // direto: mesmo dataset, mas versão do manifesto (o hash inclui a versão)
    const direto = executar(estrategia, { ...ds, versao: manifest.versao }, { catalogo: catalogoPadrao(), nomesCompeticoes: new Map([['comp-a', 'Comp A']]) })
    expect(w.resultado.hash).toBe(direto.hash)
    expect(w.resultado.kpis).toEqual(direto.kpis)
    expect(w.resultado.nApostas).toBe(direto.nApostas)
    expect(w.resultado.inferencia.ic95Yield).toEqual(direto.inferencia.ic95Yield)
    // só baixou os grupos referenciados e só dos chunks de comp-a
    expect(pedidos.every((k) => k.includes('/comp-a/'))).toBe(true)
    expect(pedidos.some((k) => k.endsWith('/odds.bet365.close.bin'))).toBe(true)
    expect(pedidos.some((k) => k.endsWith('/team.home.l10.bin'))).toBe(false)
    expect(w.carga.doCache).toBe(0)
  })
  it('segundo run reaproveita o cache em memória; cache persistente é consultado antes da rede', async () => {
    const gravados = new Map<string, Uint8Array>()
    const cache: CacheBytes = { ler: async (k) => gravados.get(k) ?? null, gravar: async (k, b) => { gravados.set(k, b) } }
    let rede = 0
    const s = new Sessao({ catalogo: catalogoJson, manifest, buscar: async (k) => { rede++; return arquivos.get(k) as Uint8Array }, cache })
    const a = await s.executar(estrategia)
    const b = await s.executar(estrategia)
    expect(a.resultado.hash).toBe(b.resultado.hash)
    expect(b.carga.doCache).toBe(b.carga.chunks * 0 + a.carga.doCache + rede) // tudo veio da memória
    const redeAntes = rede
    s.limpar()
    const c = await s.executar(estrategia)
    expect(rede).toBe(redeAntes) // veio do cache persistente
    expect(c.carga.doCache).toBeGreaterThan(0)
  })
  it('validar devolve erros sem executar e campos/indicadores quando ok', () => {
    const s = new Sessao({ catalogo: catalogoJson, manifest, buscar: async () => { throw new Error('não deve buscar') } })
    const ruim = s.validar({ ...estrategia, regra: { formula: 'foo > 1' } })
    expect(ruim.ok).toBe(false); expect(ruim.erros[0]).toMatch(/foo/)
    const ok = s.validar(estrategia)
    expect(ok.ok).toBe(true); expect(ok.indicadores).toEqual([{ nome: 'edge_h', tipo: 'ratio' }]); expect(ok.camposUsados).toContain('odds.bet365.close.1x2.h')
  })
  it('progresso é reportado durante o download', async () => {
    const fases: string[] = []
    const s = new Sessao({ catalogo: catalogoJson, manifest, buscar: async (k) => arquivos.get(k) as Uint8Array, aoProgresso: (p) => fases.push(p.fase) })
    await s.executar(estrategia)
    expect(fases).toContain('baixando'); expect(fases[fases.length - 1]).toBe('executando')
  })
})

describe('buscadorAssinado', () => {
  it('agrupa pedidos simultâneos numa chamada de URLs e baixa cada chunk', async () => {
    const chamadas: string[] = []
    const fetchFn = vi.fn(async (url: string) => {
      chamadas.push(url)
      if (url.startsWith('/api/dataset?chaves=')) {
        const chaves = decodeURIComponent(url.split('chaves=')[1]).split(',')
        return new Response(JSON.stringify({ urls: Object.fromEntries(chaves.map((c) => [c, `https://r2/${c}`])) }))
      }
      return new Response(new Uint8Array([1, 2, 3]))
    }) as unknown as typeof fetch
    const buscar = buscadorAssinado('/api/dataset', fetchFn)
    const [a, b] = await Promise.all([buscar('v/x/s/match.bin'), buscar('v/x/s/derived.bin')])
    expect(Array.from(a)).toEqual([1, 2, 3]); expect(Array.from(b)).toEqual([1, 2, 3])
    expect(chamadas.filter((u) => u.startsWith('/api/dataset')).length).toBe(1)
    expect(chamadas.filter((u) => u.startsWith('https://r2/')).length).toBe(2)
  })
  it('propaga erro HTTP', async () => {
    const fetchFn = (async () => new Response('x', { status: 403 })) as unknown as typeof fetch
    await expect(buscadorAssinado('/api/dataset', fetchFn)('v/x/s/match.bin')).rejects.toThrow(/403/)
  })
})

describe('schemas da API', () => {
  it('aceita a estratégia de exemplo e rejeita formas inválidas', () => {
    expect(estrategiaSchema.safeParse(estrategia).success).toBe(true)
    expect(estrategiaSchema.safeParse({ ...estrategia, entradas: [] }).success).toBe(false)
    expect(estrategiaSchema.safeParse({ ...estrategia, staking: { metodo: 'kelly', fracao: 2, prob: { formula: 'x' } } }).success).toBe(false)
    expect(estrategiaSchema.safeParse({ ...estrategia, regra: {} }).success).toBe(false)
    expect(estrategiaSchema.safeParse({ ...estrategia, entradas: [{ mercado: 'xx', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }] }).success).toBe(false)
    expect(runPostSchema.safeParse({ estrategia, salvar: true, maxApostas: 100 }).success).toBe(true)
  })
  it('salvarRunSchema exige o resultado serializado', () => {
    const r = executar(estrategia, ds, { catalogo: catalogoPadrao() })
    const serial = JSON.parse(JSON.stringify(r, (_k, v) => (v instanceof Float64Array ? Array.from(v) : typeof v === 'number' && Number.isNaN(v) ? null : v)))
    expect(salvarRunSchema.safeParse({ definicao: estrategia, resultado: serial }).success).toBe(true)
    expect(salvarRunSchema.safeParse({ definicao: estrategia, resultado: { hash: 'x' } }).success).toBe(false)
  })
})

describe('persistência de runs (helpers puros)', () => {
  it('hashRegra ignora staking, banco e seed; muda com a regra', () => {
    const a = hashRegra(estrategia)
    expect(hashRegra({ ...estrategia, staking: { metodo: 'flat', unidade: 5 }, bancoInicial: 9, seed: 1 })).toBe(a)
    expect(hashRegra({ ...estrategia, regra: { formula: 'edge_h > 0' } })).not.toBe(a)
    expect(hashRegra({ ...estrategia, parametros: { p1: 1 } })).not.toBe(a)
  })
  it('amostrar reduz séries longas mantendo o último ponto', () => {
    const serie = Array.from({ length: 5000 }, (_, i) => i)
    const s = amostrar(serie, 100) as number[]
    expect(s.length).toBe(101); expect(s[0]).toBe(0); expect(s[s.length - 1]).toBe(4999)
    expect(amostrar([1, 2, 3], 100)).toEqual([1, 2, 3])
  })
})
