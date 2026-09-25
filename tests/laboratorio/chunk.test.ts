import { describe, it, expect } from 'vitest'
import { decodificarGrupo, grupoDoCampo, gruposDosCampos, lerHeader } from '@/lib/laboratorio/data/chunk'
import { codificar } from './codificar'
import { carregarDataset, filtroDoUniverso, resolverAliases, type Manifest } from '@/lib/laboratorio/data/dataset'

describe('leitor de chunk', () => {
  const buf = codificar('match', [
    { nome: 'match.id', tipo: 'id', valores: ['a', 'b', 'a', null] },
    { nome: 'match.utc_date', tipo: 'date', valores: ['2025-01-01T12:00:00.000Z', null, '2025-01-02T00:30:00.000Z', '2025-01-03T00:00:00.000Z'] },
    { nome: 'odds.bet365.close.1x2.h', tipo: 'odd', valores: [1.85, null, 2.1, 3.333] },
    { nome: 'match.round', tipo: 'int', valores: [1, 2, 3, 4] },
    { nome: 'home.l5.gf', tipo: 'goals', valores: [null, null, null, null] },
  ])
  it('header e decodificação por tipo (dicionário, data, escala, nulos)', async () => {
    const { header } = lerHeader(buf)
    expect(header.formato).toBe(1); expect(header.linhas).toBe(4); expect(header.colunas.map((c) => c.nome)).not.toContain('home.l5.gf')
    const { colunas } = await decodificarGrupo(buf)
    expect(colunas.get('match.id')).toEqual({ tipo: 'txt', valores: ['a', 'b', 'a', null] })
    const d = colunas.get('match.utc_date')!.valores as Float64Array
    expect(d[0]).toBe(Date.UTC(2025, 0, 1, 12)); expect(d[1]).toBeNaN()
    const o = colunas.get('odds.bet365.close.1x2.h')!.valores as Float64Array
    expect(o[0]).toBe(1.85); expect(o[1]).toBeNaN(); expect(o[3]).toBe(3.333)
    expect(Array.from(colunas.get('match.round')!.valores as Float64Array)).toEqual([1, 2, 3, 4])
  })
  it('só descomprime as colunas pedidas e ignora as inexistentes', async () => {
    const { colunas } = await decodificarGrupo(buf, ['match.round', 'nao.existe'])
    expect(Array.from(colunas.keys())).toEqual(['match.round'])
  })
  it('rejeita formato desconhecido e buffer truncado', () => {
    const b = Buffer.from(buf); b.writeUInt32LE(9999, 0)
    expect(() => lerHeader(new Uint8Array(b))).toThrow(/truncado/)
    expect(() => lerHeader(new Uint8Array([1, 0]))).toThrow(/truncado/)
  })
  it('grupo do campo segue a convenção do builder', () => {
    expect(grupoDoCampo('league.rho')).toBe('match')
    expect(grupoDoCampo('odds.pinnacle.open.ou.main_line')).toBe('odds.pinnacle.open')
    expect(grupoDoCampo('home.venue.l10.xg_for')).toBe('team.home.venue.l10')
    expect(grupoDoCampo('away.season.gf')).toBe('team.away.season')
    expect(grupoDoCampo('home.extra.elo')).toBe('team.home.extra')
    expect(() => grupoDoCampo('foo.bar')).toThrow()
    expect(Array.from(gruposDosCampos(['match.id', 'league.rho', 'odds.bet365.close.1x2.h']).keys())).toEqual(['match', 'odds.bet365.close'])
  })
})

describe('montagem do dataset', () => {
  const c1 = { match: codificar('match', [{ nome: 'match.id', tipo: 'id', valores: ['a', 'b'] }, { nome: 'match.round', tipo: 'int', valores: [1, 2] }]), 'odds.bet365.close': codificar('odds.bet365.close', [{ nome: 'odds.bet365.close.1x2.h', tipo: 'odd', valores: [1.5, 2.5] }]) }
  const c2 = { match: codificar('match', [{ nome: 'match.id', tipo: 'id', valores: ['c', 'd', 'e'] }, { nome: 'match.round', tipo: 'int', valores: [3, 4, 5] }]) }
  const manifest: Manifest = {
    versao: 'v1', formato: 1, catalogoVersao: '1.1.1', builderVersao: '0.1.0', geradoEm: '', aliases: { 'fpt:X': 'compX' }, times: {}, totalLinhas: 5,
    competicoes: [{ key: 'compX', nome: 'X', pais: '', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorDefault: true, feminino: false, linhas: 5 } as never, { key: 'fem', nome: 'F', pais: '', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorPadrao: true, feminino: true, linhas: 0 }],
    chunks: [
      { competitionKey: 'compX', seasonKey: 's1', seasonLabel: '2024', dir: 'x/s1', linhas: 2, de: '2024-08-01T00:00:00.000Z', ate: '2024-12-01T00:00:00.000Z', grupos: { match: { arquivo: 'match.bin', bytes: 0, hash: '', colunas: 2 }, 'odds.bet365.close': { arquivo: 'odds.bet365.close.bin', bytes: 0, hash: '', colunas: 1 } } },
      { competitionKey: 'compX', seasonKey: 's2', seasonLabel: '2025', dir: 'x/s2', linhas: 3, de: '2025-08-01T00:00:00.000Z', ate: '2025-12-01T00:00:00.000Z', grupos: { match: { arquivo: 'match.bin', bytes: 0, hash: '', colunas: 2 } } },
    ],
  }
  const arquivos: Record<string, Uint8Array> = { 'v1/x/s1/match.bin': c1.match, 'v1/x/s1/odds.bet365.close.bin': c1['odds.bet365.close'], 'v1/x/s2/match.bin': c2.match }
  const buscar = async (k: string) => { const b = arquivos[k]; if (!b) throw new Error(`sem ${k}`); return b }

  it('concatena chunks na ordem do manifesto e preenche colunas ausentes com NaN', async () => {
    const pedidos: string[] = []
    const r = await carregarDataset({ manifest, campos: ['match.id', 'match.round', 'odds.bet365.close.1x2.h', 'home.l5.gf'], buscar: async (k) => { pedidos.push(k); return buscar(k) } })
    expect(r.dataset.n).toBe(5)
    expect(r.dataset.textos.get('match.id')).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(Array.from(r.dataset.numericas.get('match.round')!)).toEqual([1, 2, 3, 4, 5])
    const o = r.dataset.numericas.get('odds.bet365.close.1x2.h')!
    expect(o[0]).toBe(1.5); expect(o[2]).toBeNaN()
    expect(r.camposAusentes).toEqual(['home.l5.gf'])
    expect(r.gruposAusentes).toBe(1 + 2) // s2 sem odds; team.home.l5 em nenhum
    expect(pedidos.sort()).toEqual(Object.keys(arquivos).sort())
    expect(r.dataset.versao).toBe('v1')
  })
  it('filtro do universo por competição/temporada/datas e aliases', async () => {
    const f = filtroDoUniverso({ competicoes: ['fpt:X'], temporadasLabel: ['2025'] }, manifest)
    expect(manifest.chunks.filter(f).map((c) => c.seasonKey)).toEqual(['s2'])
    const g = filtroDoUniverso({ de: '2024-01-01', ate: '2024-12-31' }, manifest)
    expect(manifest.chunks.filter(g).map((c) => c.seasonKey)).toEqual(['s1'])
    expect(resolverAliases({ competicoes: ['fpt:X', 'y'] }, manifest)!.competicoes).toEqual(['compX', 'y'])
    expect(resolverAliases({ competicoes: ['slug-x'] }, { aliases: {}, competicoes: [{ ...manifest.competicoes[0], slug: 'slug-x' }] })!.competicoes).toEqual(['compX'])
    const r = await carregarDataset({ manifest, campos: ['match.id'], filtro: f, buscar })
    expect(r.dataset.n).toBe(3)
  })
  it('linhas divergentes do manifesto são erro', async () => {
    const m2 = { ...manifest, chunks: [{ ...manifest.chunks[0], linhas: 9 }] }
    await expect(carregarDataset({ manifest: m2, campos: ['match.id'], buscar })).rejects.toThrow(/linhas/)
  })
})
