import { describe, expect, it } from 'vitest'
import { gerarCatalogo } from '@/lib/laboratorio/schema/catalogo'
import { contagemPorBloco, facetasDoBloco, facetasDoCampo, filtrarCatalogo, normalizar } from '@/lib/laboratorio/ui/catalogo'

const cat = gerarCatalogo()
const chaves = (f: Parameters<typeof filtrarCatalogo>[1]) => filtrarCatalogo(cat, f).map((c) => c.key)

describe('catálogo de dados: busca e filtros', () => {
  it('normaliza acento, caixa e vírgula decimal', () => {
    expect(normalizar('Média de GOLS 2,5')).toBe('media de gols 2.5')
  })
  it('sem filtro devolve tudo, na ordem do catálogo', () => {
    expect(filtrarCatalogo(cat, {})).toHaveLength(cat.length)
    expect(chaves({})[0]).toBe(cat[0].key)
  })
  it('busca por palavras em qualquer ordem, sem acento, no rótulo e no nome técnico', () => {
    const over = chaves({ busca: 'bet365 fechamento over 2.5' })
    expect(over).toContain('odds.bet365.close.ou.over_2_5')
    expect(over.every((k) => k.includes('bet365'))).toBe(true)
    expect(chaves({ busca: 'over 2,5 FECHAMENTO bet365' })).toEqual(over)
    expect(chaves({ busca: 'media gols liga' })).toContain('league.avg_goals')
    expect(chaves({ busca: 'xg mandante ultimos 10' })).toContain('home.l10.xg_for')
    expect(chaves({ busca: 'home l10 xg_for' })).toContain('home.l10.xg_for')
    expect(chaves({ busca: 'odds.pinnacle.close.1x2.d' })).toEqual(['odds.pinnacle.close.1x2.d'])
    expect(chaves({ busca: 'palavra_que_nao_existe' })).toEqual([])
  })
  it('a busca antiga por frase exata falhava; a nova acha (regressão do relato)', () => {
    const frase = 'pinnacle fechamento empate'
    expect(cat.some((c) => c.label.toLowerCase().includes(frase) || c.key.includes(frase))).toBe(false)
    expect(chaves({ busca: frase })).toContain('odds.pinnacle.close.1x2.d')
  })
  it('grupo e facetas: odds por casa, momento e mercado', () => {
    expect(chaves({ bloco: 'odds' })).toHaveLength(cat.filter((c) => c.bloco === 'odds').length)
    const pinClose = chaves({ bloco: 'odds', facetas: { casa: 'pinnacle', momento: 'close' } })
    expect(pinClose.length).toBeGreaterThan(0)
    expect(pinClose.every((k) => k.startsWith('odds.pinnacle.close.'))).toBe(true)
    const x12 = chaves({ bloco: 'odds', facetas: { casa: 'bet365', momento: 'close', mercado: '1x2' } })
    expect(x12).toEqual(expect.arrayContaining(['odds.bet365.close.1x2.h', 'odds.bet365.close.1x2.d', 'odds.bet365.close.1x2.a']))
    expect(x12.every((k) => k.startsWith('odds.bet365.close.1x2.'))).toBe(true)
    // facetas só valem com grupo escolhido
    expect(chaves({ facetas: { casa: 'pinnacle' } })).toHaveLength(cat.length)
  })
  it('grupo e facetas: times por lado, janela e recorte', () => {
    expect(facetasDoCampo({ key: 'home.l10.xg_for', bloco: 'team' })).toEqual({ lado: 'home', janela: 'l10', recorte: 'todos' })
    expect(facetasDoCampo({ key: 'away.venue.l5.gf', bloco: 'team' })).toEqual({ lado: 'away', janela: 'l5', recorte: 'venue' })
    expect(facetasDoCampo({ key: 'home.elo', bloco: 'team' })).toEqual({ lado: 'home', janela: 'outros' })
    const l10 = chaves({ bloco: 'team', facetas: { lado: 'home', janela: 'l10', recorte: 'todos' } })
    expect(l10.length).toBeGreaterThan(10)
    expect(l10.every((k) => k.startsWith('home.l10.'))).toBe(true)
    const venue = chaves({ bloco: 'team', facetas: { lado: 'away', janela: 'l10', recorte: 'venue' } })
    expect(venue.every((k) => k.startsWith('away.venue.l10.'))).toBe(true)
    expect(chaves({ bloco: 'team', facetas: { lado: 'home', janela: 'outros' } })).toContain('home.elo')
    // todo campo de time além dos 60 primeiros é alcançável (o corte antigo escondia away.* e season)
    expect(chaves({ bloco: 'team', facetas: { lado: 'away', janela: 'season' } }).length).toBeGreaterThan(10)
  })
  it('contagens: por grupo respeitam a busca; por faceta respeitam busca e as outras facetas', () => {
    const tudo = contagemPorBloco(cat)
    expect(Object.values(tudo).reduce((s, n) => s + n, 0)).toBe(cat.length)
    const soPin = contagemPorBloco(cat, 'pinnacle')
    expect(soPin.odds).toBeLessThan(tudo.odds); expect(soPin.odds).toBeGreaterThan(0)
    const fs = facetasDoBloco(cat, { bloco: 'odds', facetas: { casa: 'pinnacle' } })
    expect(fs.map((f) => f.id)).toEqual(['casa', 'momento', 'mercado'])
    const casa = fs[0].opcoes, mercado = fs[2].opcoes
    // a própria faceta não se filtra: bet365 continua com contagem
    expect(casa.find((o) => o.valor === 'bet365')?.n).toBeGreaterThan(0)
    // placar exato só existe na bet365: com Pinnacle marcada, fica com 0 (chip desativado)
    expect(mercado.find((o) => o.valor === 'cs')?.n).toBe(0)
    expect(mercado.find((o) => o.valor === '1x2')?.n).toBeGreaterThan(0)
    expect(mercado.find((o) => o.valor === 'cs')?.rotulo).toBe('Placar exato')
    const soma = fs[1].opcoes.reduce((s, o) => s + o.n, 0)
    expect(soma).toBe(chaves({ bloco: 'odds', facetas: { casa: 'pinnacle' } }).length)
    expect(facetasDoBloco(cat, { bloco: 'match' })).toEqual([])
    expect(facetasDoBloco(cat, {})).toEqual([])
  })
})
