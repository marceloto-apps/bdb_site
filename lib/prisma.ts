import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function getDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  // Garante limite conservador de conexões por instância para não exceder
  // max_user_connections no MySQL compartilhado (ex: Vercel serverless / build workers)
  if (!url.includes('connection_limit=')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}connection_limit=3&pool_timeout=20`
  }
  return url
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatasourceUrl(),
      },
    },
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

// Salva sempre no globalThis para reaproveitar a conexão dentro do mesmo runtime
globalForPrisma.prisma = prisma
