import { describe, it, expect } from 'vitest'
import { gerarCatalogo, resumoCatalogo, campoPorChave, FUNCOES_VIRTUAIS, CASAS_ATIVAS, CASAS_INATIVAS } from '@/lib/laboratorio/schema/catalogo'
import { LIGAS_FPT, LIGAS_FPT_POR_CHAVE, resumoLigasFpt } from '@/lib/laboratorio/schema/ligas-fpt'

describe('catálogo v1', () => {
  const campos = gerarCatalogo()

  it('não tem chaves duplicadas e segue a convenção bloco.qualificadores.medida', () => {
    const chaves = new Set(campos.map((c) => c.key))
    expect(chaves.size).toBe(campos.length)
    for (const c of campos) expect(c.key).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/)
  })

  it('todo campo tem ao menos uma fonte, rótulo e tipo', () => {
    for (const c of campos) {
      expect(c.fontes.length).toBeGreaterThan(0)
      expect(c.label.length).toBeGreaterThan(0)
      expect(c.tipo).toBeTruthy()
    }
  })

  it('resultado do jogo está no bloco match e é goals', () => {
    for (const k of ['match.ft_h', 'match.ft_a', 'match.ht_h', 'match.ht_a']) {
      const c = campoPorChave(k)
      expect(c?.bloco).toBe('match')
      expect(c?.tipo).toBe('goals')
    }
  })

  it('odds: só bet365 e Pinnacle estão ativas (D11); as demais casas não geram campos', () => {
    expect([...CASAS_ATIVAS]).toEqual(['pinnacle', 'bet365'])
    for (const casa of CASAS_ATIVAS) {
      expect(campoPorChave(`odds.${casa}.close.1x2.novig_h`)).toBeDefined()
      expect(campoPorChave(`odds.${casa}.open.1x2.h`)).toBeDefined()
    }
    expect(CASAS_INATIVAS.length).toBe(12)
    for (const casa of CASAS_INATIVAS) {
      expect(campos.some((c) => c.key.startsWith(`odds.${casa}.`))).toBe(false)
    }
    expect(campoPorChave('derived.best_vs_pinnacle.edge_h')).toBeUndefined()
    expect(campoPorChave('derived.pinnacle_vs_bet365.edge_open_h')).toBeDefined()
  })

  it('pinnacle não tem mercados de 1º tempo, CS, EH nem DC (só o núcleo a fornece)', () => {
    expect(campoPorChave('odds.pinnacle.close.ht_1x2.h')).toBeUndefined()
    expect(campoPorChave('odds.pinnacle.close.cs.1_1')).toBeUndefined()
    expect(campoPorChave('odds.pinnacle.close.corners.main_line')?.fontes).toEqual(['core'])
  })

  it('placar exato, handicap europeu e dupla chance só existem no fechamento (FPT)', () => {
    expect(campoPorChave('odds.bet365.close.cs.1_1')?.fontes).toEqual(['fpt'])
    expect(campoPorChave('odds.bet365.open.cs.1_1')).toBeUndefined()
    expect(campoPorChave('odds.bet365.close.eh.h_m1')?.fontes).toEqual(['fpt'])
    expect(campoPorChave('odds.bet365.close.dc.1x')?.fontes).toEqual(['fs', 'fpt'])
  })

  it('mercados de 1º tempo nunca vêm do núcleo', () => {
    for (const c of campos.filter((c) => /\.ht_(1x2|ou|ah)\./.test(c.key))) {
      expect(c.fontes).not.toContain('core')
    }
  })

  it('bloco team cobre 2 lados × 2 escopos × 4 janelas com as mesmas estatísticas', () => {
    const base = campos.filter((c) => c.key.startsWith('home.l10.')).map((c) => c.key.slice('home.l10.'.length))
    expect(base.length).toBeGreaterThan(30)
    for (const lado of ['home', 'away']) {
      for (const prefixo of [`${lado}.l5.`, `${lado}.l20.`, `${lado}.season.`, `${lado}.venue.l5.`, `${lado}.venue.l10.`, `${lado}.venue.l20.`, `${lado}.venue.season.`]) {
        const atual = campos.filter((c) => c.key.startsWith(prefixo)).map((c) => c.key.slice(prefixo.length))
        expect(atual).toEqual(base)
      }
    }
  })

  it('xG na FPT é marcado como disponível só a partir de 2023', () => {
    expect(campoPorChave('home.l10.xg_for')?.desde?.fpt).toBe(2023)
    expect(campoPorChave('home.l10.gf')?.desde?.fpt).toBeUndefined()
  })

  it('ρ de Dixon-Coles está no bloco league e documenta o corte temporal', () => {
    const c = campoPorChave('league.rho')
    expect(c?.bloco).toBe('league')
    expect(c?.descricao).toMatch(/anteriores à data/)
  })

  it('resumo bate com o total e lista as funções virtuais', () => {
    const r = resumoCatalogo()
    expect(r.total).toBe(campos.length)
    expect(Object.values(r.porBloco).reduce((a, b) => a + b, 0)).toBe(campos.length)
    expect(r.funcoesVirtuais).toBe(FUNCOES_VIRTUAIS.length)
    expect(FUNCOES_VIRTUAIS.map((f) => f.nome)).toContain('model')
  })
})

describe('ligas só-FPT', () => {
  it('tem 86 chaves únicas e todas com país, iso e nome', () => {
    expect(LIGAS_FPT.length).toBe(86)
    expect(LIGAS_FPT_POR_CHAVE.size).toBe(86)
    for (const l of LIGAS_FPT) {
      expect(l.pais.length).toBeGreaterThan(0)
      expect(l.iso.length).toBeGreaterThan(0)
      expect(l.nome.length).toBeGreaterThan(0)
    }
  })

  it('femininas e amostras mínimas ficam fora do padrão; UEFA e CONMEBOL de clubes entram', () => {
    for (const l of LIGAS_FPT) {
      if (l.feminino) expect(l.incluidaPorPadrao).toBe(false)
      if (l.jogosRef < 300) expect(l.incluidaPorPadrao).toBe(false)
    }
    expect(LIGAS_FPT_POR_CHAVE.get('EUROPA CHAMPIONS LEAGUE')?.incluidaPorPadrao).toBe(true)
    expect(LIGAS_FPT_POR_CHAVE.get('COPA LIBERTADORES')?.incluidaPorPadrao).toBe(true)
    expect(LIGAS_FPT_POR_CHAVE.get('ITALY 4')?.incluidaPorPadrao).toBe(false)
  })

  it('ligas têm nível; copas e torneios internacionais não', () => {
    for (const l of LIGAS_FPT) {
      if (l.tipo === 'LEAGUE') expect(l.nivel).not.toBeNull()
      else expect(l.nivel).toBeNull()
    }
    const r = resumoLigasFpt()
    expect(r.ligas).toBe(86)
    expect(r.padrao).toBeGreaterThan(30)
  })
})
