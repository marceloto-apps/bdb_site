// tests/ferramentas/backtest/oddsRanges.test.ts
import { describe, it, expect } from "vitest"
import { matchesOddRanges } from "@/lib/ferramentas/backtest/oddsFilter"

describe("Backtest Odds Range Filter Helper", () => {
  it("should return true when no range is selected", () => {
    expect(matchesOddRanges(1.50, null)).toBe(true)
    expect(matchesOddRanges(1.50, undefined)).toBe(true)
    expect(matchesOddRanges(1.50, [])).toBe(true)
  })

  it("should return false when range is selected but odd is missing (null/undefined)", () => {
    expect(matchesOddRanges(null, ["1.21-1.40"])).toBe(false)
    expect(matchesOddRanges(undefined, ["1.21-1.40"])).toBe(false)
  })

  it("should check if the odd falls within a single selected range", () => {
    expect(matchesOddRanges(1.30, ["1.21-1.40"])).toBe(true)
    expect(matchesOddRanges(1.20, ["1.21-1.40"])).toBe(false)
    expect(matchesOddRanges(1.41, ["1.21-1.40"])).toBe(false)
  })

  it("should check if the odd falls within any of the multiple selected ranges (OR check)", () => {
    const selected = ["1.01-1.20", "2.01-2.50"]
    expect(matchesOddRanges(1.10, selected)).toBe(true)
    expect(matchesOddRanges(2.20, selected)).toBe(true)
    expect(matchesOddRanges(1.50, selected)).toBe(false)
  })

  it("should handle the boundary case for 10.01+ infinity range", () => {
    expect(matchesOddRanges(10.01, ["10.01+"])).toBe(true)
    expect(matchesOddRanges(15.50, ["10.01+"])).toBe(true)
    expect(matchesOddRanges(10.00, ["10.01+"])).toBe(false)
  })
})
