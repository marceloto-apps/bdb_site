import { describe, it, expect } from 'vitest'
import { astParaBuilder, builderParaAst, builderParaFormula, formulaParaBuilder, novaCondicao } from '@/lib/laboratorio/ui/builder'
import { parseExpressao } from '@/lib/laboratorio/engine/parser'
import { csvApostas } from '@/lib/laboratorio/ui/csv'
import { corSinal, num, pct, sinal } from '@/lib/laboratorio/ui/formato'
import { continenteDe } from '@/lib/laboratorio/ui/continentes'

describe('builder visual ↔ fórmula', () => {
  it('builder gera a mesma fórmula/AST que o parser', () => {
    const b = { combinador: 'and' as const, condicoes: [
      novaCondicao({ esq: { t: 'ref', nome: 'edge_h' }, op: '>', dir: { t: 'num', v: 0.03 } }),
      novaCondicao({ esq: { t: 'ref', nome: 'home.l5.pts_pg' }, op: '>=', dir: { t: 'num', v: 1.8 } }),
      novaCondicao({ esq: { t: 'ref', nome: 'derived.pinnacle.fav_side' }, op: '==', dir: { t: 'sel', v: 'home' } }),
    ] }
    const f = builderParaFormula(b)
    expect(f).toBe('edge_h > 0.03 and home.l5.pts_pg >= 1.8 and derived.pinnacle.fav_side == home')
    expect(builderParaAst(b)).toEqual(parseExpressao(f))
  })
  it('fórmula plana volta para o builder (and/or, negação, número negativo, campo × campo)', () => {
    const b = formulaParaBuilder('odds.pinnacle.close.ah.main_line <= -0.75 or not (home.l10.gf > away.l10.gf)')
    expect(b).not.toBeNull()
    expect(b!.combinador).toBe('or')
    expect(b!.condicoes).toHaveLength(2)
    expect(b!.condicoes[0].dir).toEqual({ t: 'num', v: -0.75 })
    expect(b!.condicoes[1].negar).toBe(true)
    expect(b!.condicoes[1].dir).toEqual({ t: 'ref', nome: 'away.l10.gf' })
    expect(builderParaFormula(b!)).toBe('odds.pinnacle.close.ah.main_line <= -0.75 or not home.l10.gf > away.l10.gf')
  })
  it('fórmulas fora do formato plano não cabem no builder', () => {
    expect(formulaParaBuilder('a > 1 and (b > 2 or c > 3)')).toBeNull()
    expect(formulaParaBuilder('implied(odds.bet365.close.ou.over_2_5) < 0.55')).toBeNull()
    expect(formulaParaBuilder('model(DC, FORCAS, l10).p_h > 0.5')).toBeNull()
    expect(formulaParaBuilder('a + 1 > 2')).toBeNull()
    expect(formulaParaBuilder('2 > a')).toBeNull()
  })
  it('vazio e inválido', () => {
    expect(formulaParaBuilder('')).toEqual({ combinador: 'and', condicoes: [] })
    expect(formulaParaBuilder('a >')).toBeNull()
    expect(builderParaAst({ combinador: 'and', condicoes: [novaCondicao()] })).toBeNull() // campo vazio é ignorado
    expect(astParaBuilder(parseExpressao('x == 1'))!.condicoes[0].op).toBe('==')
  })
})

describe('csv e formatação', () => {
  it('csv com BOM, ponto e vírgula, decimais com vírgula e extras', () => {
    const csv = csvApostas([{ data: Date.UTC(2025, 0, 2, 15, 30), competicao: 'A', temporada: '2025', home: 'X; Y', away: 'Z', entradaId: 'e1', mercado: '1x2', selecao: 'home', linha: null, odd: 1.85, oddLiquidacao: 1.85, stake: 1, resultado: 'WIN', pnl: 0.85, banco: 100.85, qRef: 0.5, oddRef: 1.9, refSrc: 'pinnacle', ev: -0.075, clvBruto: null, clvNovig: -0.075, clvPontos: null, extras: { edge_h: 0.1 } }])
    const linhas = csv.split('\n')
    expect(linhas[0].startsWith('﻿data;competicao')).toBe(true)
    expect(linhas[0].endsWith(';edge_h')).toBe(true)
    expect(linhas[1]).toContain('"X; Y"')
    expect(linhas[1]).toContain('1,85')
    expect(linhas[1]).toContain('2025-01-02 15:30')
    expect(linhas[1].endsWith('0,1')).toBe(true)
  })
  it('formatadores pt-BR e cor de sinal', () => {
    expect(pct(0.1234)).toBe('12,34%'); expect(pct(null)).toBe('—'); expect(pct(NaN)).toBe('—')
    expect(num(1234.5)).toBe('1.234,50'); expect(num(Infinity)).toBe('∞')
    expect(sinal(2)).toBe('+2,00'); expect(sinal(-2)).toBe('-2,00')
    expect(corSinal(1)).toBe('text-primary'); expect(corSinal(-1)).toBe('text-data-red'); expect(corSinal(0)).toBe('text-muted-foreground')
  })
  it('continente por país', () => {
    expect(continenteDe('Brasil')).toBe('América do Sul'); expect(continenteDe('England')).toBe('Europa'); expect(continenteDe('Japan')).toBe('Ásia & Oceania'); expect(continenteDe('Marte')).toBe('Internacional / Outros')
  })
})
