import { describe, expect, it } from 'vitest'
import {
  calcularMediasLigaXG,
  calcularMediasTimeXG,
  calcularForcasTimeXG
} from '@/lib/analytics/medias'

describe('Medias e Forças xG', () => {
  const mockJogosComXG = [
    // t1 casa (5 jogos)
    { homeTeamId: 't1', awayTeamId: 't2', fthg: 1, ftag: 0, utcDate: new Date(), stats: { homeXg: 1.5, awayXg: 0.5 } },
    { homeTeamId: 't1', awayTeamId: 't3', fthg: 3, ftag: 1, utcDate: new Date(), stats: { homeXg: 2.5, awayXg: 1.0 } },
    { homeTeamId: 't1', awayTeamId: 't4', fthg: 1, ftag: 0, utcDate: new Date(), stats: { homeXg: 1.0, awayXg: 0.5 } },
    { homeTeamId: 't1', awayTeamId: 't5', fthg: 2, ftag: 1, utcDate: new Date(), stats: { homeXg: 2.0, awayXg: 0.8 } },
    { homeTeamId: 't1', awayTeamId: 't6', fthg: 1, ftag: 1, utcDate: new Date(), stats: { homeXg: 1.2, awayXg: 1.2 } },
    
    // t1 fora (5 jogos)
    { homeTeamId: 't2', awayTeamId: 't1', fthg: 0, ftag: 2, utcDate: new Date(), stats: { homeXg: 0.8, awayXg: 2.1 } },
    { homeTeamId: 't3', awayTeamId: 't1', fthg: 1, ftag: 1, utcDate: new Date(), stats: { homeXg: 1.2, awayXg: 1.1 } },
    { homeTeamId: 't4', awayTeamId: 't1', fthg: 0, ftag: 1, utcDate: new Date(), stats: { homeXg: 0.5, awayXg: 1.5 } },
    { homeTeamId: 't5', awayTeamId: 't1', fthg: 2, ftag: 0, utcDate: new Date(), stats: { homeXg: 1.8, awayXg: 0.9 } },
    { homeTeamId: 't6', awayTeamId: 't1', fthg: 1, ftag: 3, utcDate: new Date(), stats: { homeXg: 0.9, awayXg: 2.4 } },

    // Adicionando padding até 20+ jogos
    ...Array.from({ length: 12 }).map(() => ({
      homeTeamId: 't4', awayTeamId: 't5', fthg: 1, ftag: 1, utcDate: new Date(), stats: { homeXg: 1.0, awayXg: 1.0 }
    }))
  ]

  const mockJogosInsuficientes = mockJogosComXG.slice(0, 5) // Menos de 20 jogos

  describe('calcularMediasLigaXG', () => {
    it('calcula médias corretas da liga considerando apenas jogos com xG', () => {
      // 22 jogos totais.
      // xG casa total: 1.5 + 2.5 + 1.0 + 2.0 + 1.2 + 0.8 + 1.2 + 0.5 + 1.8 + 0.9 + 12*1.0 = 25.4
      // muH = 25.4 / 22 = 1.1545
      // xG fora total: 0.5 + 1.0 + 0.5 + 0.8 + 1.2 + 2.1 + 1.1 + 1.5 + 0.9 + 2.4 + 12*1.0 = 24.0
      // muA = 24.0 / 22 = 1.0909
      
      const ligaMedias = calcularMediasLigaXG(mockJogosComXG)
      
      expect(ligaMedias.totalJogos).toBe(22)
      expect(ligaMedias.muH).toBeCloseTo(25.4 / 22)
      expect(ligaMedias.muA).toBeCloseTo(24.0 / 22)
    })

    it('lança erro se não houver jogos suficientes (>20) com dados de xG', () => {
      expect(() => calcularMediasLigaXG(mockJogosInsuficientes)).toThrowError(/Liga com apenas \d+ jogos com xG/)
    })
  })

  describe('calcularMediasTimeXG', () => {
    it('calcula as médias de xG de um time específico', () => {
      // time t1
      // Casa: j1 (1.5 criado, 0.5 concedido), j3 (2.5 criado, 1.0 concedido)
      // Fora: j2 (2.1 criado, 0.8 concedido), j4 (1.1 criado, 1.2 concedido)
      
      const mediasT1 = calcularMediasTimeXG('t1', mockJogosComXG)
      
      expect(mediasT1.jogosCasa).toBe(5)
      expect(mediasT1.jogosFora).toBe(5)
      
      expect(mediasT1.xgFC).toBeCloseTo((1.5 + 2.5 + 1.0 + 2.0 + 1.2) / 5) // 1.64
      expect(mediasT1.xgSC).toBeCloseTo((0.5 + 1.0 + 0.5 + 0.8 + 1.2) / 5) // 0.8
      
      expect(mediasT1.xgFV).toBeCloseTo((2.1 + 1.1 + 1.5 + 0.9 + 2.4) / 5) // 1.6
      expect(mediasT1.xgSV).toBeCloseTo((0.8 + 1.2 + 0.5 + 1.8 + 0.9) / 5) // 1.04
    })

    it('lança erro se o time não tem o mínimo de 5 jogos como mandante e visitante', () => {
      const jogosPoucos = mockJogosComXG.slice(0, 3) // Apenas os 3 primeiros
      expect(() => calcularMediasTimeXG('t1', jogosPoucos)).toThrowError(/poucos jogos com xG/)
    })
  })

  describe('calcularForcasTimeXG', () => {
    it('normaliza as médias do time pelas médias da liga', () => {
      const mediasT1 = calcularMediasTimeXG('t1', mockJogosComXG)
      const ligaMedias = calcularMediasLigaXG(mockJogosComXG)
      
      const forcas = calcularForcasTimeXG(mediasT1, ligaMedias)
      
      // fcAtC = medias.xgFC / liga.muH
      // fcDfC = medias.xgSC / liga.muA
      // fcAtV = medias.xgFV / liga.muA
      // fcDfV = medias.xgSV / liga.muH
      
      expect(forcas.fcAtC).toBeCloseTo(mediasT1.xgFC / ligaMedias.muH)
      expect(forcas.fcDfC).toBeCloseTo(mediasT1.xgSC / ligaMedias.muA)
      expect(forcas.fcAtV).toBeCloseTo(mediasT1.xgFV / ligaMedias.muA)
      expect(forcas.fcDfV).toBeCloseTo(mediasT1.xgSV / ligaMedias.muH)
    })

    it('lida graciosamente com ligas onde a média de xG foi 0', () => {
      const medias = { xgFC: 1, xgSC: 1, xgFV: 1, xgSV: 1, jogosCasa: 1, jogosFora: 1, dispersaoCasa: { dp: 0.5, cv: 0.3, nivel: 'ALTA' as const }, dispersaoFora: { dp: 0.5, cv: 0.3, nivel: 'ALTA' as const } }
      const ligaMediasZeros = { muH: 0, muA: 0, totalJogos: 20, varH: 0, varA: 0 }
      
      // O código real provavelmente não cai nesse edge case se min 20 jogos é exigido
      // mas vamos garantir testando a divisão segura.
      const forcas = calcularForcasTimeXG(medias, ligaMediasZeros)
      
      expect(forcas.fcAtC).toBe(1)
      expect(forcas.fcDfC).toBe(1)
      expect(forcas.fcAtV).toBe(1)
      expect(forcas.fcDfV).toBe(1)
    })
  })
})
