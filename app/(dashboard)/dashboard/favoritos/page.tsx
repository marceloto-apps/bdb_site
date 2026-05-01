import { Metadata } from 'next'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { requireAuth } from '@/lib/auth-helpers'
import { listarFavoritosPaginado } from '@/lib/dashboard/favoritos'
import { DashboardArtigoCard } from '@/components/dashboard/DashboardArtigoCard'
import { RemoverFavoritoButton } from '@/components/dashboard/RemoverFavoritoButton'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/shared/pagination'

export const metadata: Metadata = {
  title: 'Meus Favoritos',
}

interface FavoritosPageProps {
  searchParams: { page?: string }
}

export default async function FavoritosPage({ searchParams }: FavoritosPageProps) {
  const user = await requireAuth()

  const currentPage = searchParams.page ? parseInt(searchParams.page, 10) : 1
  const limit = 12

  const { favorites, pagination } = await listarFavoritosPaginado(user.id, currentPage, limit)

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          Meus Favoritos
        </h1>
        <p className="text-muted-foreground">
          Artigos que você salvou para ler depois.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 animate-in fade-in duration-500">
          <div className="bg-muted p-4 rounded-full mb-6">
            <Bookmark className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Nenhum favorito ainda</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Salve artigos para encontrá-los facilmente depois.
          </p>
          <Button asChild className="bg-green-500 text-white hover:bg-green-600">
            <Link href="/artigos">Ver artigos</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Grid com 1 coluna em todos os breakpoints conforme solicitado */}
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <DashboardArtigoCard
                key={favorite.id}
                artigo={{
                  id: favorite.article.id,
                  slug: favorite.article.slug,
                  title: favorite.article.title,
                  thumbnail: favorite.article.thumbnail,
                  type: favorite.article.type,
                  category: favorite.article.category,
                }}
                dateLabel="Salvo em"
                date={favorite.createdAt}
                action={
                  <RemoverFavoritoButton 
                    articleId={favorite.article.id} 
                    articleTitle={favorite.article.title} 
                  />
                }
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                paginaAtual={pagination.page}
                totalPaginas={pagination.totalPages}
                baseUrl="/dashboard/favoritos"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
