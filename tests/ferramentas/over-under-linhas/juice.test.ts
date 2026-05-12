
import { extrairJuiceAncora, calcularTabelaProjecao } from '@/lib/ferramentas/over-under-linhas/juice'

describe('extrairJuiceAncora', () => {
  test('odds equilibradas (1.90/1.90) produzem juice ~5.26%', () => {
    const stats = extrairJuiceAncora({ line: 2.5, under: 1.90, over: 1.90 })
    expect(stats.juice).toBeCloseTo(5.26, 1)
    expect(stats.lambda).toBeGreaterThan(0)
  })
})

describe('calcularTabelaProjecao', () => {
  test('retorna 10 linhas', () => {
    const tabela = calcularTabelaProjecao(2.5, 5, 2.5)
    expect(tabela).toHaveLength(10)
  })

  test('linha âncora marcada corretamente', () => {
    const tabela = calcularTabelaProjecao(2.5, 5, 2.5)
    const ancora = tabela.find(l => l.isAnchor)
    expect(ancora).toBeDefined()
    expect(ancora?.line).toBe(2.5)
  })

  test('odds nunca menores que 1.01', () => {
    const tabela = calcularTabelaProjecao(0.5, 5, 2.5)
    tabela.forEach(l => {
      expect(parseFloat(l.under)).toBeGreaterThanOrEqual(1.01)
      expect(parseFloat(l.over)).toBeGreaterThanOrEqual(1.01)
    })
  })
})
