/**
 * Liquidação de apostas (§5.1 item 6): estende `lib/ferramentas/backtest/settlement.ts`
 * (mesma aritmética ×4 para linhas de quarto) com escanteios, mercados de 1º tempo, dupla
 * chance, handicap europeu e placar exato. Jogo sem o placar necessário → VOID (pnl 0).
 *
 * Linha do handicap asiático é sempre o handicap do MANDANTE (ex.: −0.75), inclusive para
 * apostas no visitante — convenção do settlement atual e do catálogo (`ah.main_line`).
 */
import type { Mercado, Resultado } from './tipos'

export interface Placar {
  ftH: number
  ftA: number
  htH?: number
  htA?: number
  cornersH?: number
  cornersA?: number
}

export interface Liquidacao { resultado: Resultado; pnl: number }

const ok = (v: number | undefined): v is number => v !== undefined && Number.isFinite(v)

function pnlDe(resultado: Resultado, stake: number, odd: number): number {
  switch (resultado) {
    case 'WIN': return stake * (odd - 1)
    case 'HALF_WIN': return (stake * (odd - 1)) / 2
    case 'HALF_LOSS': return -stake / 2
    case 'LOSS': return -stake
    default: return 0
  }
}

/** 1X2 sobre uma diferença de gols (já com handicap aplicado, se houver). */
function resultado1x2(diff: number, sel: string): Resultado {
  switch (sel) {
    case 'home': case 'h': return diff > 0 ? 'WIN' : 'LOSS'
    case 'draw': case 'd': return diff === 0 ? 'WIN' : 'LOSS'
    case 'away': case 'a': return diff < 0 ? 'WIN' : 'LOSS'
    case '1x': case 'dc_1x': return diff >= 0 ? 'WIN' : 'LOSS'
    case 'x2': case 'dc_x2': return diff <= 0 ? 'WIN' : 'LOSS'
    case '12': case 'dc_12': return diff !== 0 ? 'WIN' : 'LOSS'
  }
  return 'VOID'
}

/** Total (gols/escanteios) contra uma linha, com quartos. */
function resultadoTotal(total: number, linha: number, sel: string): Resultado {
  const over = sel === 'over'
  if (sel !== 'over' && sel !== 'under') return 'VOID'
  const t4 = Math.round(total * 4), l4 = Math.round(linha * 4)
  if (l4 % 2 === 0) { // inteira ou meia
    if (t4 === l4) return 'REFUND'
    return (over ? t4 > l4 : t4 < l4) ? 'WIN' : 'LOSS'
  }
  const l1 = l4 - 1, l2 = l4 + 1 // duas metades
  if (over) {
    if (t4 > l2) return 'WIN'
    if (t4 === l2) return 'HALF_WIN'
    if (t4 === l1) return 'HALF_LOSS'
    return 'LOSS'
  }
  if (t4 < l1) return 'WIN'
  if (t4 === l1) return 'HALF_WIN'
  if (t4 === l2) return 'HALF_LOSS'
  return 'LOSS'
}

/** Handicap asiático: margem efetiva ×4 = diff×4 + linha×4 (mandante) ou o oposto (visitante). */
function resultadoAh(diff: number, linha: number, sel: string): Resultado {
  if (sel !== 'home' && sel !== 'away') return 'VOID'
  const m = sel === 'home' ? diff * 4 + Math.round(linha * 4) : -(diff * 4) - Math.round(linha * 4)
  if (m >= 2) return 'WIN'
  if (m === 1) return 'HALF_WIN'
  if (m === 0) return 'REFUND'
  if (m === -1) return 'HALF_LOSS'
  return 'LOSS'
}

export function liquidar(mercado: Mercado, selecao: string, linha: number | null, odd: number, stake: number, p: Placar): Liquidacao {
  const r = resultadoDe(mercado, selecao, linha, p)
  return { resultado: r, pnl: r === 'VOID' ? 0 : pnlDe(r, stake, odd) }
}

export function resultadoDe(mercado: Mercado, selecao: string, linha: number | null, p: Placar): Resultado {
  const sel = selecao.toLowerCase()
  switch (mercado) {
    case '1x2':
      if (!ok(p.ftH) || !ok(p.ftA)) return 'VOID'
      return resultado1x2(p.ftH - p.ftA, sel)
    case 'dc':
      if (!ok(p.ftH) || !ok(p.ftA)) return 'VOID'
      return resultado1x2(p.ftH - p.ftA, sel)
    case 'btts': {
      if (!ok(p.ftH) || !ok(p.ftA)) return 'VOID'
      const ambos = p.ftH > 0 && p.ftA > 0
      if (sel === 'yes') return ambos ? 'WIN' : 'LOSS'
      if (sel === 'no') return ambos ? 'LOSS' : 'WIN'
      return 'VOID'
    }
    case 'ou':
      if (!ok(p.ftH) || !ok(p.ftA) || linha === null || !Number.isFinite(linha)) return 'VOID'
      return resultadoTotal(p.ftH + p.ftA, linha, sel)
    case 'ah':
      if (!ok(p.ftH) || !ok(p.ftA) || linha === null || !Number.isFinite(linha)) return 'VOID'
      return resultadoAh(p.ftH - p.ftA, linha, sel)
    case 'corners':
      if (!ok(p.cornersH) || !ok(p.cornersA) || linha === null || !Number.isFinite(linha)) return 'VOID'
      return resultadoTotal(p.cornersH + p.cornersA, linha, sel)
    case 'ht_1x2':
      if (!ok(p.htH) || !ok(p.htA)) return 'VOID'
      return resultado1x2(p.htH - p.htA, sel)
    case 'ht_ou':
      if (!ok(p.htH) || !ok(p.htA) || linha === null || !Number.isFinite(linha)) return 'VOID'
      return resultadoTotal(p.htH + p.htA, linha, sel)
    case 'ht_ah':
      if (!ok(p.htH) || !ok(p.htA) || linha === null || !Number.isFinite(linha)) return 'VOID'
      return resultadoAh(p.htH - p.htA, linha, sel)
    case 'eh': {
      // handicap europeu: inteiro aplicado ao mandante, depois 1X2 (sem devolução)
      if (!ok(p.ftH) || !ok(p.ftA) || linha === null || !Number.isInteger(linha)) return 'VOID'
      return resultado1x2(p.ftH - p.ftA + linha, sel)
    }
    case 'cs': {
      if (!ok(p.ftH) || !ok(p.ftA)) return 'VOID'
      if (sel === 'other') return p.ftH > 3 || p.ftA > 3 ? 'WIN' : 'LOSS'
      const m = /^(\d+)_(\d+)$/.exec(sel)
      if (!m) return 'VOID'
      return p.ftH === Number(m[1]) && p.ftA === Number(m[2]) ? 'WIN' : 'LOSS'
    }
  }
  return 'VOID'
}
