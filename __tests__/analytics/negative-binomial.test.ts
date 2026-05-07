import { matrizPlacaresNB, nbPmf, estimarParametrosNB } from '../../lib/analytics/negative-binomial'

describe('Negative Binomial', () => {
  it('estimarParametrosNB deve ativar fallback se variância <= lambda * tolerância', () => {
    const lambda = 1.5
    const res1 = estimarParametrosNB(lambda, lambda * 1.005)
    expect(res1.fallbackParaPoisson).toBe(true)
    expect(res1.r).toBe(Infinity)

    const res2 = estimarParametrosNB(lambda, lambda * 1.1)
    expect(res2.fallbackParaPoisson).toBe(false)
    expect(res2.r).toBeLessThan(Infinity)
  })

  it('nbPmf deve calcular probabilidade correta e rejeitar r=Infinity', () => {
    // Para r=5, p=0.5, x=3
    // Fórmula teórica: Gamma(3+5)/(Gamma(3+1)*Gamma(5)) * (1-0.5)^3 * 0.5^5
    // = 7!/(3!*4!) * 0.125 * 0.03125
    // = 35 * 0.00390625 = 0.13671875
    expect(nbPmf(3, 5, 0.5)).toBeCloseTo(0.1367, 4)

    expect(() => nbPmf(2, Infinity, 0.5)).toThrow('NB_INVALID_PARAMS')
  })

  it('matrizPlacaresNB deve lidar com fallback parcial e total', () => {
    // Total fallback
    const { warning: warnTotal } = matrizPlacaresNB(1.5, 1.0, 1.5, 1.0)
    expect(warnTotal).toBe('FALLBACK_TOTAL')

    // Parcial Home
    const { warning: warnHome } = matrizPlacaresNB(1.5, 1.0, 1.5, 2.0)
    expect(warnHome).toBe('FALLBACK_PARCIAL_HOME')

    // Parcial Away
    const { warning: warnAway } = matrizPlacaresNB(1.5, 1.0, 2.0, 1.0)
    expect(warnAway).toBe('FALLBACK_PARCIAL_AWAY')

    // Sem fallback
    const { warning: warnNone } = matrizPlacaresNB(1.5, 1.0, 2.0, 2.0)
    expect(warnNone).toBeNull()
  })

  it('matrizPlacaresNB deve normalizar a matriz', () => {
    const { matriz } = matrizPlacaresNB(1.5, 1.0, 2.0, 2.0, 10)
    const soma = matriz.flat().reduce((acc, v) => acc + v, 0)
    expect(soma).toBeCloseTo(1.0, 2)
  })
})
