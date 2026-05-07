import { pesoTemporal, XI_DEFAULT } from '../../lib/analytics/decay'

describe('Decay Temporal', () => {
  it('pesoTemporal para o dia de hoje deve ser 1', () => {
    const hoje = new Date()
    expect(pesoTemporal(hoje, hoje)).toBeCloseTo(1, 5)
  })

  it('pesoTemporal para data futura deve ser 1 (limitado pelo max(0))', () => {
    const hoje = new Date()
    const futuro = new Date(hoje.getTime() + 1000 * 60 * 60 * 24 * 7) // 1 semana no futuro
    expect(pesoTemporal(futuro, hoje)).toBeCloseTo(1, 5)
  })

  it('pesoTemporal para data no passado deve cair exponencialmente', () => {
    const dataRef = new Date('2026-05-01T12:00:00Z')
    const dataJogo = new Date('2025-05-01T12:00:00Z') // 1 ano antes
    
    // 365 dias atrás = 365 / 3.5 = 104.2857 meias-semanas
    // Math.exp(-0.0065 * 104.2857) = Math.exp(-0.677857) ≈ 0.5077
    const peso = pesoTemporal(dataJogo, dataRef, XI_DEFAULT)
    
    expect(peso).toBeLessThan(1)
    expect(peso).toBeGreaterThan(0)
    expect(peso).toBeCloseTo(0.5077, 3)
  })
})
