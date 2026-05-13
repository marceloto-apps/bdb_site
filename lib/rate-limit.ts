export interface RateLimitOptions {
  limit: number
  windowMs: number
}

// In-memory store para os limites de requisição.
// Nota: Em Serverless (Vercel), isso resetará a cada "Cold Start"
// e não será compartilhado entre instâncias simultâneas.
// Para proteção robusta em produção, recomenda-se Upstash Redis.
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>()

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 5, windowMs: 60000 }
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record) {
    const expiresAt = now + options.windowMs
    rateLimitMap.set(identifier, { count: 1, expiresAt })
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: expiresAt,
    }
  }

  // Se a janela de tempo já expirou, reseta
  if (now > record.expiresAt) {
    const expiresAt = now + options.windowMs
    rateLimitMap.set(identifier, { count: 1, expiresAt })
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: expiresAt,
    }
  }

  // Se ainda estiver na janela de tempo
  if (record.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: record.expiresAt,
    }
  }

  // Incrementa a contagem
  record.count += 1
  rateLimitMap.set(identifier, record)

  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    reset: record.expiresAt,
  }
}

// Limpeza periódica (opcional) para evitar memory leak em processos longos (ex: server local)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    rateLimitMap.forEach((value, key) => {
      if (now > value.expiresAt) {
        rateLimitMap.delete(key)
      }
    })
  }, 60000)
}
