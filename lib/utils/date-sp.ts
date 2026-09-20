/**
 * Utilitários de data e fuso horário para America/Sao_Paulo (Horário de Brasília)
 */

export const FUSO_SP = 'America/Sao_Paulo'

/**
 * Retorna a string de data no formato YYYY-MM-DD correspondente ao horário de São Paulo.
 */
export function getSaoPauloDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_SP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Retorna o range em UTC [startUtc, endUtc] que corresponde exatamente ao início (00:00:00)
 * e fim (23:59:59.999) daquele dia no horário de Brasília (UTC-3).
 */
export function getSaoPauloDayRange(targetDate: Date = new Date()): {
  startUtc: Date
  endUtc: Date
  dateStr: string
} {
  const dateStr = getSaoPauloDateString(targetDate)
  const [year, month, day] = dateStr.split('-').map(Number)

  // São Paulo está em UTC-3 (sem horário de verão).
  // Meia-noite em SP (00:00:00) equivale a 03:00:00 UTC do mesmo dia.
  const startUtc = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))

  // Fim do dia em SP (23:59:59.999) equivale a 02:59:59.999 UTC do dia seguinte.
  const endUtc = new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999))

  return { startUtc, endUtc, dateStr }
}

/**
 * Formata um horário (Date ou string UTC) para HH:mm no fuso de São Paulo.
 */
export function formatHoraSP(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_SP,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

/**
 * Formata a data completa por extenso no fuso de São Paulo (ex: "domingo, 20 de setembro de 2026").
 */
export function formatDataCompletaSP(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_SP,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
