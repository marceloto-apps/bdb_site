// lib/ferramentas/backtest/oddsFilter.ts

export const ODD_RANGES = [
  { id: '1.01-1.20', min: 1.01, max: 1.20 },
  { id: '1.21-1.40', min: 1.21, max: 1.40 },
  { id: '1.41-1.60', min: 1.41, max: 1.60 },
  { id: '1.61-1.80', min: 1.61, max: 1.80 },
  { id: '1.81-2.00', min: 1.81, max: 2.00 },
  { id: '2.01-2.50', min: 2.01, max: 2.50 },
  { id: '2.51-3.00', min: 2.51, max: 3.00 },
  { id: '3.01-4.00', min: 3.01, max: 4.00 },
  { id: '4.01-5.00', min: 4.01, max: 5.00 },
  { id: '5.01-7.00', min: 5.01, max: 7.00 },
  { id: '7.01-10.00', min: 7.01, max: 10.00 },
  { id: '10.01+', min: 10.01, max: 9999.0 },
]

export function matchesOddRanges(odd: number | undefined | null, selectedRangeIds: string[] | null | undefined): boolean {
  if (!selectedRangeIds || selectedRangeIds.length === 0) return true
  if (odd == null) return false
  return selectedRangeIds.some(id => {
    const range = ODD_RANGES.find(r => r.id === id)
    if (!range) return false
    return odd >= range.min && odd <= range.max
  })
}
