import { describe, expect, it } from 'vitest'
import { ANO_MINIMO_TEMPORADA, inicioTemporada, ordemTemporada, temporadaPermitida } from '@/lib/laboratorio/engine/temporadas'
import { aplicarUniverso } from '@/lib/laboratorio/engine/universo'
import { filtroDoUniverso, resumoManifest, type Manifest } from '@/lib/laboratorio/data/dataset'
import { datasetSintetico } from './sintetico'

describe('corte temporal (2022 e 22/23)', () => {
  it('lê o ano de início pelo rótulo', () => {
    expect(inicioTemporada('2024')).toBe(2024)
    expect(inicioTemporada('24/25')).toBe(2024.5)
    expect(inicioTemporada('2024/2025')).toBe(2024.5)
    expect(inicioTemporada('abc')).toBeNaN()
  })
  it('aceita 2022 e 22/23 em diante; rejeita 2021 e 21/22', () => {
    expect(ANO_MINIMO_TEMPORADA).toBe(2022)
    for (const l of ['2022', '22/23', '2023', '23/24', '2026', '26/27']) expect(temporadaPermitida(l)).toBe(true)
    for (const l of ['2021', '21/22', '2000', '18/19', '2021/2022']) expect(temporadaPermitida(l)).toBe(false)
  })
  it('rótulo desconhecido cai na data do primeiro jogo; sem nada, aceita', () => {
    expect(temporadaPermitida('x', '2021-08-01T00:00:00.000Z')).toBe(false)
    expect(temporadaPermitida('x', '2022-01-15T00:00:00.000Z')).toBe(true)
    expect(temporadaPermitida(null, null)).toBe(true)
  })
  it('ordem de temporadas segue a data de início', () => {
    expect(['25/26', '2024', '2025', '24/25', '2026', '2024/2025'].sort(ordemTemporada)).toEqual(['2024', '2024/2025', '24/25', '2025', '25/26', '2026'])
  })

  const chunk = (competitionKey: string, seasonLabel: string, de: string, ate: string, linhas: number) => ({ competitionKey, seasonKey: `${competitionKey}-${seasonLabel}`, seasonLabel, dir: `${competitionKey}/${seasonLabel}`, linhas, de, ate, grupos: {} })
  const manifest: Manifest = {
    versao: 'v', formato: 1, catalogoVersao: '1', builderVersao: '1', geradoEm: '', aliases: {}, times: {}, totalLinhas: 0,
    competicoes: [
      { key: 'A', nome: 'Liga A', pais: 'BR', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorPadrao: true, feminino: false, linhas: 300 },
      { key: 'B', nome: 'Liga B', pais: 'EN', nivel: 1, tipo: 'LEAGUE', soFpt: true, incluidaPorPadrao: false, feminino: false, linhas: 150 },
      { key: 'C', nome: 'Liga antiga', pais: 'XX', nivel: 2, tipo: 'LEAGUE', soFpt: true, incluidaPorPadrao: false, feminino: false, linhas: 40 },
    ],
    chunks: [
      chunk('A', '2021', '2021-04-01', '2021-12-01', 100), chunk('A', '2022', '2022-04-01', '2022-12-01', 100), chunk('A', '2023', '2023-04-01', '2023-12-01', 100),
      chunk('B', '21/22', '2021-08-01', '2022-05-01', 50), chunk('B', '22/23', '2022-08-01', '2023-05-01', 50), chunk('B', '23/24', '2023-08-01', '2024-05-01', 50),
      chunk('C', '19/20', '2019-08-01', '2020-05-01', 40),
    ],
  }
  it('filtro de chunks nunca deixa passar temporadas antes do corte, mesmo pedidas', () => {
    const todos = manifest.chunks.filter(filtroDoUniverso(undefined, manifest)).map((c) => c.seasonKey)
    expect(todos).toEqual(['A-2022', 'A-2023', 'B-22/23', 'B-23/24'])
    const pedidas = manifest.chunks.filter(filtroDoUniverso({ temporadasLabel: ['2021', '21/22', '2022'] }, manifest)).map((c) => c.seasonKey)
    expect(pedidas).toEqual(['A-2022'])
    const porData = manifest.chunks.filter(filtroDoUniverso({ de: '2019-01-01', ate: '2022-12-31' }, manifest)).map((c) => c.seasonKey)
    expect(porData).toEqual(['A-2022', 'B-22/23'])
  })
  it('resumo do manifesto só lista temporadas do corte, reconta linhas e some com ligas sem temporada', () => {
    const r = resumoManifest(manifest)
    expect(r.competicoes.map((c) => c.key)).toEqual(['A', 'B'])
    expect(r.competicoes[0].temporadas.map((t) => t.label)).toEqual(['2022', '2023'])
    expect(r.competicoes[0].linhas).toBe(200)
    expect(r.competicoes[1].temporadas.map((t) => t.label)).toEqual(['22/23', '23/24'])
    expect(r.totalLinhas).toBe(300)
  })
  it('máscara do engine exclui linhas antigas e avisa sobre rótulos pedidos antes do corte', () => {
    const ds = datasetSintetico({ n: 200 })
    const labels = ds.textos.get('match.season_label')!
    // rebatiza a primeira temporada como 2021: metade das linhas fica fora
    for (let i = 0; i < ds.n; i++) if (labels[i] === '2024') labels[i] = '2021'
    const semUniverso = aplicarUniverso(ds, undefined)
    expect(semUniverso.n).toBe(100)
    for (let i = 0; i < ds.n; i++) expect(semUniverso.mascara[i]).toBe(labels[i] === '2025' ? 1 : 0)
    const pedindo = aplicarUniverso(ds, { temporadasLabel: ['2021', '2025'] })
    expect(pedindo.n).toBe(100)
    expect(pedindo.avisos.some((a) => a.tipo === 'universo' && /2021/.test(a.mensagem) && /2022 e 22\/23/.test(a.mensagem))).toBe(true)
    const soAntiga = aplicarUniverso(ds, { temporadasLabel: ['2021'] })
    expect(soAntiga.n).toBe(0)
  })
})
