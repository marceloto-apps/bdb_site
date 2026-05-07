import { describe, expect, it } from 'vitest'
import {
  calcularLambdas,
  calcularTodosLambdas,
  montarComposicaoLambdas
} from '@/lib/analytics/lambda-calculators'
import type { MediasTime, ForcasTime } from '@/lib/analytics/forca-time'
import type { MediasLigaCalculadas } from '@/lib/analytics/medias'
import type { LambdaCalculationParams } from '@/lib/analytics/types'

describe('Lambda Calculators', () => {
  const mockParams: LambdaCalculationParams = {
    mediasHome: { mgc: 1.5, mgsc: 1.0, mgv: 1.2, mgsv: 1.1, jogosCasa: 10, jogosFora: 10, dispersaoCasa: { dp: 0.5, cv: 0.3, nivel: 'ALTA' }, freqCasa: {} as any, dispersaoFora: { dp: 0.5, cv: 0.3, nivel: 'ALTA' }, freqFora: {} as any },
    mediasAway: { mgc: 1.4, mgsc: 0.9, mgv: 1.1, mgsv: 1.2, jogosCasa: 10, jogosFora: 10, dispersaoCasa: { dp: 0.4, cv: 0.3, nivel: 'ALTA' }, freqCasa: {} as any, dispersaoFora: { dp: 0.4, cv: 0.3, nivel: 'ALTA' }, freqFora: {} as any },
    forcasHome: { fcAtC: 1.2, fcDfC: 0.8, fcAtV: 1.0, fcDfV: 1.1 },
    forcasAway: { fcAtC: 1.1, fcDfC: 0.9, fcAtV: 0.9, fcDfV: 1.2 },
    ligaMedias: { muH: 1.4, muA: 1.2, totalJogos: 100 },
    
    mediasHomeXG: { xgFC: 1.6, xgSC: 0.9, xgFV: 1.1, xgSV: 1.0, jogosCasa: 10, jogosFora: 10 },
    mediasAwayXG: { xgFC: 1.3, xgSC: 1.0, xgFV: 1.0, xgSV: 1.1, jogosCasa: 10, jogosFora: 10 },
    forcasHomeXG: { fcAtC: 1.3, fcDfC: 0.8, fcAtV: 1.0, fcDfV: 1.1 },
    forcasAwayXG: { fcAtC: 1.1, fcDfC: 0.9, fcAtV: 0.9, fcDfV: 1.2 },
    ligaMediasXG: { muH: 1.5, muA: 1.1, totalJogos: 100 }
  }

  describe('MEDIA_SIMPLES', () => {
    it('calcula a média simples cruzando ataque de um com defesa do outro', () => {
      const result = calcularLambdas('MEDIA_SIMPLES', mockParams)
      
      // lambdaH = (MGC_home + MGSV_away) / 2 = (1.5 + 1.2) / 2 = 1.35
      expect(result.lambdaH).toBeCloseTo(1.35)
      
      // lambdaA = (MGV_away + MGSC_home) / 2 = (1.1 + 1.0) / 2 = 1.05
      expect(result.lambdaA).toBeCloseTo(1.05)
      expect(result.fallback).toBe(false)
    })
  })

  describe('FORCAS_RELATIVAS', () => {
    it('calcula o modelo preditivo clássico normalizado pela média da liga', () => {
      const result = calcularLambdas('FORCAS_RELATIVAS', mockParams)
      
      // lambdaH = fcAtC_home * fcDfV_away * muH = 1.2 * 1.2 * 1.4 = 2.016
      expect(result.lambdaH).toBeCloseTo(2.016)
      
      // lambdaA = fcAtV_away * fcDfC_home * muA = 0.9 * 0.8 * 1.2 = 0.864
      expect(result.lambdaA).toBeCloseTo(0.864)
      expect(result.fallback).toBe(false)
    })
  })

  describe('XG', () => {
    it('calcula lambdas baseados em xG quando disponíveis', () => {
      const result = calcularLambdas('XG', mockParams)
      
      // lambdaH = fcAtCxg_home * fcDfVxg_away * muHxg = 1.3 * 1.2 * 1.5 = 2.34
      expect(result.lambdaH).toBeCloseTo(2.34)
      
      // lambdaA = fcAtVxg_away * fcDfCxg_home * muAxg = 0.9 * 0.8 * 1.1 = 0.792
      expect(result.lambdaA).toBeCloseTo(0.792)
      expect(result.fallback).toBe(false)
    })

    it('faz fallback para FORCAS_RELATIVAS se xG não estiver disponível', () => {
      const paramsSemXG = { ...mockParams, ligaMediasXG: undefined }
      const result = calcularLambdas('XG', paramsSemXG)
      
      // Deve retornar os valores de Forças Relativas
      expect(result.lambdaH).toBeCloseTo(2.016)
      expect(result.lambdaA).toBeCloseTo(0.864)
      expect(result.fallback).toBe(true) // Indica que houve fallback
    })
  })

  describe('calcularTodosLambdas', () => {
    it('retorna os resultados para todos os métodos', () => {
      const todos = calcularTodosLambdas(mockParams)
      expect(todos.mediaSimples).toBeDefined()
      expect(todos.forcasRelativas).toBeDefined()
      expect(todos.xg).toBeDefined()
    })
    
    it('retorna xg: null se dados de xG faltarem', () => {
      const paramsSemXG = { ...mockParams, ligaMediasXG: undefined }
      const todos = calcularTodosLambdas(paramsSemXG)
      expect(todos.xg).toBeNull()
    })
  })

  describe('montarComposicaoLambdas', () => {
    it('monta o payload detalhado para UI do seletor', () => {
      const composicao = montarComposicaoLambdas(mockParams)
      expect(composicao.mediaSimples.home.mgc).toBe(1.5)
      expect(composicao.mediaSimples.home.mgsvAdv).toBe(1.2)
      
      expect(composicao.forcasRelativas.home.fcAtC).toBe(1.2)
      expect(composicao.forcasRelativas.home.fcDfVAdv).toBe(1.2)
      expect(composicao.forcasRelativas.home.muH).toBe(1.4)
      
      expect(composicao.xg?.home.fcAtCxg).toBe(1.3)
      expect(composicao.xg?.home.fcDfVxgAdv).toBe(1.2)
      expect(composicao.xg?.home.muHxg).toBe(1.5)
    })
  })
})
