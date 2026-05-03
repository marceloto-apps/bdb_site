import { describe, test, expect } from 'vitest'
import { extrairJuice25, calcularLinhas25 } from '@/lib/ferramentas/over-under-25/juice'

describe('extrairJuice25', () => {
  test('extrai juice e lambda corretos', () => {
    const stats = extrairJuice25({ under: 3.30, over: 1.33 })
    expect(stats.juice).toBeGreaterThan(0)
    expect(stats.lambda).toBeGreaterThan(0)
    expect(stats.fairProbUnder).toBeLessThan(0.5)
  })
})

describe('calcularLinhas25', () => {
  test('gera 10 linhas corretamente', () => {
    const linhas = calcularLinhas25(2.5, 5)
    expect(linhas.length).toBe(10)
    const baseLines = linhas.filter(l => l.isBase)
    expect(baseLines.length).toBe(1)
    expect(baseLines[0]).toBeDefined()
  })

  test('odds nunca são menores que 1.01', () => {
    const linhas = calcularLinhas25(0.5, 5) // probabilidade de under é quase 1
    linhas.forEach(l => {
      expect(parseFloat(l.under)).toBeGreaterThanOrEqual(1.01)
      expect(parseFloat(l.over)).toBeGreaterThanOrEqual(1.01)
    })
  })
})
