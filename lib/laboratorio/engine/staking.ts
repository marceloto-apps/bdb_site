/**
 * Staking (§5.1 item 5): flat, % do banco, Kelly fracionário (com cap e mínimo), to-win.
 * Exposição máxima por dia e stop de drawdown são aplicados pelo run, em ordem cronológica.
 */
import type { Estrategia, Staking } from './tipos'

export interface EstadoBanco {
  banco: number
  pico: number
  /** exposição já comprometida no dia corrente (chave = dia UTC) */
  dia: number
  expostoNoDia: number
  parado: boolean
}

export function estadoInicial(e: Estrategia): EstadoBanco {
  const b = e.bancoInicial ?? 0
  return { banco: b, pico: b, dia: -1, expostoNoDia: 0, parado: false }
}

/** Stake bruto pelo método (antes dos limites de exposição/stop). NaN = não aposta. */
export function stakeBase(s: Staking, banco: number, odd: number, prob: number, mult = 1): number {
  let v: number
  switch (s.metodo) {
    case 'flat': v = s.unidade; break
    case 'pct_banco': {
      v = banco * s.pct
      if (s.minimo !== undefined) v = Math.max(v, s.minimo)
      if (s.maximo !== undefined) v = Math.min(v, s.maximo)
      break
    }
    case 'to_win': {
      v = odd > 1 ? s.alvo / (odd - 1) : NaN
      if (s.maximo !== undefined) v = Math.min(v, s.maximo)
      break
    }
    case 'kelly': {
      if (!(prob > 0 && prob < 1) || !(odd > 1)) return NaN
      const f = Math.max(0, (prob * odd - 1) / (odd - 1)) * s.fracao
      const fCap = s.cap !== undefined ? Math.min(f, s.cap) : f
      v = banco * fCap
      if (s.minimo !== undefined && v > 0) v = Math.max(v, s.minimo)
      if (!(v > 0)) return NaN
      break
    }
  }
  v *= mult
  return v > 0 && Number.isFinite(v) ? v : NaN
}

/** A "unidade" de referência para o lucro a stake flat (comparabilidade entre métodos). */
export function unidadeFlat(e: Estrategia): number {
  const s = e.staking
  if (s.metodo === 'flat') return s.unidade
  if (s.metodo === 'pct_banco') return (e.bancoInicial ?? 0) * s.pct || 1
  if (s.metodo === 'to_win') return s.alvo
  return (e.bancoInicial ?? 0) * 0.01 || 1
}

export const dependeDoBanco = (s: Staking): boolean => s.metodo === 'pct_banco' || s.metodo === 'kelly'
