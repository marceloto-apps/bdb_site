/**
 * Busca e filtros do catálogo de dados (passo "2. Dados e indicadores"): busca por palavras (todas
 * precisam aparecer, em qualquer ordem, sem diferenciar acento/maiúscula) sobre nome técnico, rótulo,
 * descrição, palavras do grupo e unidade; filtros por grupo e por facetas do grupo (casa, momento, mercado, lado,
 * janela, recorte), com contagens que respeitam a busca e os outros filtros.
 */
import { ROTULO_CASA, rotuloMercado, rotuloTipo } from './rotulos'
import type { CampoUI } from './tipos'

type Campo = Pick<CampoUI, 'key' | 'label' | 'descricao' | 'bloco' | 'tipo'>

/** minúsculas, sem acento; "2,5" = "2.5" */
export const normalizar = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/(\d),(\d)/g, '$1.$2')

export interface OpcaoFaceta { valor: string; rotulo: string; n: number }
export interface Faceta { id: string; rotulo: string; opcoes: OpcaoFaceta[] }
export interface FiltroCatalogo { busca?: string; bloco?: string; facetas?: Record<string, string> }

const JANELAS = ['l5', 'l10', 'l20', 'season']
const CASAS_DERIVADAS = ['pinnacle', 'bet365', 'pinnacle_vs_bet365']

/** Facetas de um campo, tiradas da forma do nome técnico. */
export function facetasDoCampo(c: Pick<Campo, 'key' | 'bloco'>): Record<string, string> {
  const s = c.key.split('.')
  if (c.bloco === 'odds') return { casa: s[1] ?? '', momento: s[2] ?? '', mercado: s[3] ?? '' }
  if (c.bloco === 'team') {
    const venue = s[1] === 'venue'
    const janela = venue ? s[2] : s[1]
    return JANELAS.includes(janela ?? '') ? { lado: s[0], janela: janela as string, recorte: venue ? 'venue' : 'todos' } : { lado: s[0], janela: 'outros' }
  }
  if (c.bloco === 'derived') return { casa: CASAS_DERIVADAS.includes(s[1] ?? '') ? (s[1] as string) : 'outros' }
  return {}
}

/** Facetas de cada grupo, na ordem em que aparecem na tela, com a ordem e o rótulo das opções. */
const DEFINICOES: Record<string, { id: string; rotulo: string; opcoes: [string, string][] | null }[]> = {
  odds: [
    { id: 'casa', rotulo: 'Casa', opcoes: [['bet365', ROTULO_CASA.bet365], ['pinnacle', ROTULO_CASA.pinnacle]] },
    { id: 'momento', rotulo: 'Momento', opcoes: [['close', 'Fechamento'], ['open', 'Abertura']] },
    { id: 'mercado', rotulo: 'Mercado', opcoes: null },
  ],
  team: [
    { id: 'lado', rotulo: 'Time', opcoes: [['home', 'Mandante'], ['away', 'Visitante']] },
    { id: 'janela', rotulo: 'Janela', opcoes: [['l5', 'Últimos 5'], ['l10', 'Últimos 10'], ['l20', 'Últimos 20'], ['season', 'Temporada'], ['outros', 'Forma, tabela, Elo e descanso']] },
    { id: 'recorte', rotulo: 'Jogos', opcoes: [['todos', 'Todos os jogos'], ['venue', 'Só em casa / só fora']] },
  ],
  derived: [
    { id: 'casa', rotulo: 'Casa', opcoes: [['pinnacle', ROTULO_CASA.pinnacle], ['bet365', ROTULO_CASA.bet365], ['pinnacle_vs_bet365', 'Pinnacle × bet365'], ['outros', 'Contagem de casas']] },
  ],
}

/** Palavras do grupo para a busca. Sem nome de casa: o rótulo "Odds (bet365 e Pinnacle)" faria "pinnacle" casar com toda odd. */
const PALAVRAS_GRUPO: Record<string, string> = { match: 'partida', odds: 'odds', derived: 'movimento do mercado', team: 'estatisticas dos times', league: 'medias da liga' }

const palheiros = new WeakMap<object, string>()
function palheiro(c: Campo): string {
  let p = palheiros.get(c)
  if (p === undefined) {
    const f = facetasDoCampo(c)
    const extras = [PALAVRAS_GRUPO[c.bloco] ?? c.bloco, rotuloTipo(c.tipo), f.mercado ? rotuloMercado(f.mercado) : '', f.momento === 'close' ? 'fechamento' : f.momento === 'open' ? 'abertura' : '']
    p = normalizar(`${c.key} ${c.key.replace(/[._]/g, ' ')} ${c.label} ${c.descricao ?? ''} ${extras.join(' ')}`)
    palheiros.set(c, p)
  }
  return p
}

const palavras = (busca: string | undefined): string[] => normalizar(busca ?? '').split(/\s+/).filter(Boolean)
const passaBusca = (c: Campo, ps: string[]) => { if (!ps.length) return true; const p = palheiro(c); return ps.every((x) => p.includes(x)) }
const passaFacetas = (c: Campo, facetas: Record<string, string> | undefined, menos?: string) => {
  if (!facetas) return true
  const f = facetasDoCampo(c)
  for (const [id, valor] of Object.entries(facetas)) if (valor && id !== menos && f[id] !== valor) return false
  return true
}

/** Campos que passam na busca, no grupo e nas facetas (na ordem do catálogo, sem corte). */
export function filtrarCatalogo<T extends Campo>(catalogo: T[], filtro: FiltroCatalogo): T[] {
  const ps = palavras(filtro.busca)
  const facetas = filtro.bloco ? filtro.facetas : undefined
  return catalogo.filter((c) => (!filtro.bloco || c.bloco === filtro.bloco) && passaBusca(c, ps) && passaFacetas(c, facetas))
}

/** Quantos campos cada grupo tem, respeitando a busca. */
export function contagemPorBloco(catalogo: Campo[], busca?: string): Record<string, number> {
  const ps = palavras(busca)
  const n: Record<string, number> = {}
  for (const c of catalogo) if (passaBusca(c, ps)) n[c.bloco] = (n[c.bloco] ?? 0) + 1
  return n
}

/** Facetas do grupo escolhido; `n` de cada opção respeita a busca e as outras facetas marcadas. */
export function facetasDoBloco(catalogo: Campo[], filtro: FiltroCatalogo): Faceta[] {
  const defs = filtro.bloco ? DEFINICOES[filtro.bloco] : undefined
  if (!defs) return []
  const ps = palavras(filtro.busca)
  const base = catalogo.filter((c) => c.bloco === filtro.bloco && passaBusca(c, ps))
  return defs.map((d) => {
    const n = new Map<string, number>()
    for (const c of base) if (passaFacetas(c, filtro.facetas, d.id)) { const v = facetasDoCampo(c)[d.id]; if (v) n.set(v, (n.get(v) ?? 0) + 1) }
    const opcoes: [string, string][] = d.opcoes ?? Array.from(new Set(catalogo.filter((c) => c.bloco === filtro.bloco).map((c) => facetasDoCampo(c)[d.id]).filter(Boolean))).map((v) => [v, rotuloMercado(v)])
    return { id: d.id, rotulo: d.rotulo, opcoes: opcoes.map(([valor, rotulo]) => ({ valor, rotulo, n: n.get(valor) ?? 0 })) }
  })
}
