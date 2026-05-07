import { prisma } from '@/lib/prisma'

interface QuotaLogParams {
  endpoint: string
  statusCode: number
}

export async function logApiCall({ endpoint, statusCode }: QuotaLogParams) {
  try {
    const month = new Date().toISOString().slice(0, 7) // e.g. "2026-05"
    await prisma.apiQuotaLog.create({
      data: {
        endpoint,
        responseStatus: statusCode,
        month,
        createdAt: new Date(),
      },
    })
  } catch (e) {
    // Não falhar a ingestão por causa de log
    console.error('[QuotaLogger] Falha ao registrar:', e)
  }
}
