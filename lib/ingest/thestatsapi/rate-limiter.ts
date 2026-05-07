export class RateLimiter {
  private tokens: number
  private maxTokens: number
  private refillRateMs: number
  private lastRefill: number

  constructor(maxTokens = 30, refillRateMs = 2000) {
    this.maxTokens = maxTokens
    this.tokens = maxTokens
    this.refillRateMs = refillRateMs
    this.lastRefill = Date.now()
  }

  private refill() {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    if (elapsed > this.refillRateMs) {
      const tokensToAdd = Math.floor(elapsed / this.refillRateMs)
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }

  async acquire(): Promise<void> {
    this.refill()
    if (this.tokens > 0) {
      this.tokens--
      return
    }

    const waitTime = this.refillRateMs - (Date.now() - this.lastRefill)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    return this.acquire()
  }

  getAvailableTokens(): number {
    this.refill()
    return this.tokens
  }
}
