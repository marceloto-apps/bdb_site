/**
 * Universo (§5.1 item 1): máscara dos jogos elegíveis por competição, temporada, datas, fontes,
 * tipo de competição, rodadas iniciais e cobertura mínima de campos.
 */
import type { Aviso, Dataset, Universo } from './tipos'

export interface ResultadoUniverso {
  mascara: Uint8Array
  n: number
  avisos: Aviso[]
}

export function aplicarUniverso(ds: Dataset, u: Universo | undefined, competicoesInfo?: Map<string, { tipo?: string; feminino?: boolean }>): ResultadoUniverso {
  const n = ds.n
  const mascara = new Uint8Array(n).fill(1)
  const avisos: Aviso[] = []
  if (!u) return { mascara, n, avisos }

  const comp = ds.textos.get('match.competition')
  const season = ds.textos.get('match.season')
  const seasonLabel = ds.textos.get('match.season_label')
  const data = ds.numericas.get('match.utc_date')
  const srcCore = ds.numericas.get('match.src_core')
  const srcFpt = ds.numericas.get('match.src_fpt')
  const tipo = ds.textos.get('match.competition_type')
  const round = ds.numericas.get('match.round')

  const comps = u.competicoes?.length ? new Set(u.competicoes) : null
  const seasons = u.temporadas?.length ? new Set(u.temporadas) : null
  const labels = u.temporadasLabel?.length ? new Set(u.temporadasLabel) : null
  const de = u.de ? Date.parse(u.de) : NaN
  const ate = u.ate ? Date.parse(u.ate.length <= 10 ? `${u.ate}T23:59:59.999Z` : u.ate) : NaN
  const fontes = u.fontes?.length ? new Set(u.fontes) : null
  const tipos = u.tipos?.length ? new Set(u.tipos) : null
  const rodadas = u.excluirRodadasIniciais ?? 0
  const cobertura = (u.coberturaMinima ?? []).map((k) => ({ k, num: ds.numericas.get(k), txt: ds.textos.get(k) }))
  for (const c of cobertura) if (!c.num && !c.txt) avisos.push({ tipo: 'cobertura', mensagem: `Campo de cobertura mínima ausente no dataset: ${c.k} (nenhum jogo passa)`, campo: c.k })

  if (comps && !comp) avisos.push({ tipo: 'universo', mensagem: 'Dataset sem match.competition; filtro de competições ignorado' })
  if (rodadas > 0 && !round) avisos.push({ tipo: 'universo', mensagem: 'Dataset sem match.round; exclusão de rodadas iniciais ignorada' })

  let total = 0
  for (let i = 0; i < n; i++) {
    let ok = true
    if (comps && comp) ok = comps.has(comp[i] ?? '')
    if (ok && seasons && season) ok = seasons.has(season[i] ?? '')
    if (ok && labels && seasonLabel) ok = labels.has(seasonLabel[i] ?? '')
    if (ok && data) {
      const d = data[i]
      if (!Number.isNaN(de) && !(d >= de)) ok = false
      if (ok && !Number.isNaN(ate) && !(d <= ate)) ok = false
    }
    if (ok && fontes) {
      const core = srcCore ? srcCore[i] === 1 : false
      const fpt = srcFpt ? srcFpt[i] === 1 : false
      // jogo do núcleo = src_core; só-FPT = src_fpt sem núcleo
      ok = (fontes.has('core') && core) || (fontes.has('fpt') && fpt && !core)
    }
    if (ok && tipos && tipo) ok = tipos.has((tipo[i] ?? '') as never)
    if (ok && competicoesInfo && comp) {
      const info = competicoesInfo.get(comp[i] ?? '')
      if (info?.feminino) ok = false
    }
    if (ok && rodadas > 0 && round) { const r = round[i]; if (!Number.isNaN(r) && r <= rodadas) ok = false }
    if (ok && cobertura.length) {
      for (const c of cobertura) {
        if (c.num) { if (Number.isNaN(c.num[i])) { ok = false; break } }
        else if (c.txt) { if (c.txt[i] === null) { ok = false; break } }
        else { ok = false; break }
      }
    }
    mascara[i] = ok ? 1 : 0
    if (ok) total++
  }
  if (total === 0) avisos.push({ tipo: 'universo', mensagem: 'Nenhum jogo no universo escolhido' })
  return { mascara, n: total, avisos }
}
