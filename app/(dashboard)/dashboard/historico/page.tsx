import { Metadata } from 'next'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { limparHistoricoExcedente } from '@/lib/dashboard/historico'
import { DashboardArtigoCard } from '@/components/dashboard/DashboardArtigoCard'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Histórico de Leitura',
}

export default async function HistoricoPage() {
  const user = await requireAuth()

  // Lazy cleanup: mantém apenas os últimos 30 registros
  await limparHistoricoExcedente(user.id)

  // Busca o histórico após o cleanup
  const readHistory = await prisma.readHistory.findMany({
    where: {
      userId: user.id,
      article: { status: 'PUBLICADO' },
    },
    include: {
      article: {
        include: { category: true },
      },
    },
    orderBy: { readAt: 'desc' },
  })

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          Histórico de Leitura
        </h1>
        <p className="text-muted-foreground">
          Os últimos 30 artigos que você leu.
        </p>
      </div>

      {readHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 animate-in fade-in duration-500">
          <div className="bg-muted p-4 rounded-full mb-6">
            <Clock className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Nenhuma leitura ainda</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Comece a explorar nossos estudos e análises.
          </p>
          <Button asChild className="bg-green-500 text-white hover:bg-green-600">
            <Link href="/artigos">Ver artigos</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {readHistory.map((history) => (
            <DashboardArtigoCard
              key={history.id}
              artigo={{
                id: history.article.id,
                slug: history.article.slug,
                title: history.article.title,
                thumbnail: history.article.thumbnail,
                type: history.article.type,
                category: history.article.category,
              }}
              dateLabel="Lido em"
              date={history.readAt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
