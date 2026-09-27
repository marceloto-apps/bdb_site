import { describe, expect, it } from 'vitest'
import { aplicarUniverso, casasDasEntradas, ehComplemento, universoEfetivo } from '@/lib/laboratorio/engine/universo'
import { filtroDoUniverso, type Manifest } from '@/lib/laboratorio/data/dataset'
import { explorar, prepararExploracao, type ApostaBasica } from '@/lib/laboratorio/engine/explorar'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import type { Entrada } from '@/lib/laboratorio/engine/tipos'
import { datasetSintetico } from './sintetico'

const bet: Entrada = { id: 'b', mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }
const pin: Entrada = { id: 'p', mercado: '1x2', selecao: 'home', preco: { casa: 'pinnacle', snapshot: 'close' } }
const pinLiqBet: Entrada = { ...pin, liquidacao: { casa: 'bet365', snapshot: 'close' } }

describe('fontes: BDB principal + complemento FPT condicionado à bet365', () => {
  it('casas das entradas, modo complemento e universo efetivo', () => {
    expect(Array.from(casasDasEntradas([pin]))).toEqual(['pinnacle'])
    expect(Array.from(casasDasEntradas([pinLiqBet])).sort()).toEqual(['bet365', 'pinnacle'])
    expect(ehComplemento(undefined)).toBe(true)
    expect(ehComplemento({ fontes: ['core', 'fpt'] })).toBe(true)
    expect(ehComplemento({ fontes: ['core'] })).toBe(false)
    expect(ehComplemento({ fontes: ['fpt'] })).toBe(false)
    const soPin = universoEfetivo({ tipos: ['LEAGUE'] }, casasDasEntradas([pin]))
    expect(soPin.universo).toEqual({ tipos: ['LEAGUE'], fontes: ['core'] })
    expect(soPin.aviso?.mensagem).toMatch(/Complemento FutPythonTrader ignorado/)
    expect(universoEfetivo({ tipos: ['LEAGUE'] }, casasDasEntradas([bet])).aviso).toBeNull()
    expect(universoEfetivo({ tipos: ['LEAGUE'] }, casasDasEntradas([pinLiqBet])).aviso).toBeNull()
    expect(universoEfetivo({ fontes: ['fpt'] }, casasDasEntradas([pin]))).toEqual({ universo: { fontes: ['fpt'] }, aviso: null })
    expect(universoEfetivo(undefined, undefined).aviso).toBeNull()
  })
  it('máscara: só Pinnacle em modo complemento exclui as linhas só-FPT, com aviso', () => {
    const ds = datasetSintetico({ n: 200 }) // 1 em 5 linhas é só-FPT
    const tudo = aplicarUniverso(ds, undefined, undefined, casasDasEntradas([bet]))
    expect(tudo.n).toBe(200); expect(tudo.avisos).toEqual([])
    const soPin = aplicarUniverso(ds, undefined, undefined, casasDasEntradas([pin]))
    expect(soPin.n).toBe(160)
    expect(soPin.avisos.some((a) => /Complemento FutPythonTrader ignorado/.test(a.mensagem))).toBe(true)
    const explicito = aplicarUniverso(ds, { fontes: ['fpt'] }, undefined, casasDasEntradas([pin]))
    expect(explicito.n).toBe(40); expect(explicito.avisos).toEqual([])
  })

  const chunk = (competitionKey: string, seasonLabel: string) => ({ competitionKey, seasonKey: `${competitionKey}-${seasonLabel}`, seasonLabel, dir: `${competitionKey}/${seasonLabel}`, linhas: 10, de: '2024-08-01', ate: '2025-05-01', grupos: {} })
  const manifest: Manifest = {
    versao: 'v', formato: 1, catalogoVersao: '1', builderVersao: '1', geradoEm: '', aliases: {}, times: {}, totalLinhas: 0,
    competicoes: [
      { key: 'A', nome: 'BDB', pais: 'BR', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorPadrao: true, feminino: false, linhas: 10 },
      { key: 'fpt:X', nome: 'Extra', pais: 'XX', nivel: 1, tipo: 'LEAGUE', soFpt: true, incluidaPorPadrao: true, feminino: false, linhas: 10 },
    ],
    chunks: [chunk('A', '24/25'), chunk('fpt:X', '24/25')],
  }
  it('chunks de competições só-FPT não são baixados quando a fonte FPT não entra', () => {
    const keys = (u: Parameters<typeof filtroDoUniverso>[0], casas?: Set<'bet365' | 'pinnacle'>) => manifest.chunks.filter(filtroDoUniverso(u, manifest, casas)).map((c) => c.competitionKey)
    expect(keys(undefined)).toEqual(['A', 'fpt:X'])
    expect(keys({ fontes: ['core'] })).toEqual(['A'])
    expect(keys(undefined, casasDasEntradas([pin]))).toEqual(['A'])
    expect(keys(undefined, casasDasEntradas([bet]))).toEqual(['A', 'fpt:X'])
    expect(keys({ fontes: ['fpt'] }, casasDasEntradas([pin]))).toEqual(['A', 'fpt:X']) // explícito: chunks do BDB podem ter linhas só-FPT
  })
  it('Explorar devolve o aviso e conta só os jogos do BDB quando a cesta é só Pinnacle', () => {
    const cat = catalogoPadrao()
    const ds = datasetSintetico({ n: 200 })
    const a = (casa: 'bet365' | 'pinnacle'): ApostaBasica => ({ rotulo: `Mandante · ${casa}`, mercado: '1x2', selecao: 'home', preco: { casa, snapshot: 'close' } })
    const soPin = explorar(prepararExploracao({ apostas: [a('pinnacle')] }, cat), ds)
    expect(soPin.nUniverso).toBe(160)
    expect(soPin.avisos.some((m) => /Complemento FutPythonTrader ignorado/.test(m))).toBe(true)
    const comBet = explorar(prepararExploracao({ apostas: [a('pinnacle'), a('bet365')] }, cat), ds)
    expect(comBet.nUniverso).toBe(200); expect(comBet.avisos).toEqual([])
  })
})
