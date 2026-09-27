/**
 * Corte temporal do Laboratório (Explorar e Estratégia): só entram temporadas iniciadas em 2022 ou
 * depois — "2022" (anual) e "22/23" (europeia) são as primeiras. Motivo: antes disso a cobertura de
 * odds e estatísticas da FPT é irregular (§1.5 do plano) e as ligas do núcleo começam em 2023; as
 * temporadas 2022 e 22/23 ficam como histórico para as janelas móveis.
 *
 * O corte é aplicado em três lugares, com a mesma função: filtro de chunks (`filtroDoUniverso`),
 * resumo do manifesto para a UI (`resumoManifest`) e máscara do engine (`aplicarUniverso`).
 */

/** Primeiro ano de início de temporada aceito. */
export const ANO_MINIMO_TEMPORADA = 2022
/** Rótulos da primeira temporada aceita, para textos da UI. */
export const ROTULO_CORTE_TEMPORADA = '2022 e 22/23'

/**
 * Ano (fracionário) de início de uma temporada pelo rótulo: "2024" → 2024; "24/25" → 2024,5;
 * "2024/2025" → 2024,5. NaN quando o rótulo não é reconhecido.
 */
export function inicioTemporada(rotulo: string): number {
  const s = rotulo.trim()
  let m = s.match(/^(\d{2})\/(\d{2})$/)
  if (m) return 2000 + Number(m[1]) + 0.5
  m = s.match(/^(\d{4})\/(\d{4})$/)
  if (m) return Number(m[1]) + 0.5
  m = s.match(/^(\d{4})$/)
  if (m) return Number(m[1])
  return NaN
}

/**
 * Se a temporada passa no corte. Usa o rótulo; quando ele não é reconhecido, cai na data do
 * primeiro jogo (`de`, ISO); sem nenhum dos dois, aceita (não esconde o que não sabe classificar).
 */
export function temporadaPermitida(rotulo: string | null | undefined, de?: string | null): boolean {
  const ini = inicioTemporada(rotulo ?? '')
  if (!Number.isNaN(ini)) return ini >= ANO_MINIMO_TEMPORADA
  if (de) { const ano = new Date(de).getUTCFullYear(); if (Number.isFinite(ano)) return ano >= ANO_MINIMO_TEMPORADA }
  return true
}

/** "2024" < "24/25" < "2025" < "25/26" pela data de início. */
export function ordemTemporada(a: string, b: string): number {
  const ini = (s: string) => { const v = inicioTemporada(s); return Number.isNaN(v) ? 0 : v }
  return ini(a) - ini(b) || a.localeCompare(b)
}
