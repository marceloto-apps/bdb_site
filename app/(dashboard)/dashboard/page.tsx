import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Bookmark, Clock } from 'lucide-react'
import { requireAuth } from '@/lib/auth-helpers'
import { carregarVisaoGeral } from '@/lib/dashboard/visao-geral'
import { DashboardArtigoCard } from '@/components/dashboard/DashboardArtigoCard'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Visão Geral',
}

export default async function DashboardPage() {
  const user = await requireAuth()
  const dados = await carregarVisaoGeral(user.id)

  const { usuario, ultimasLeituras, favoritosRecentes, estatisticas } = dados

  // Saudação dinâmica com fuso horário de SP
  const horaSP = parseInt(
    new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).format(new Date())
  )

  const saudacao =
    horaSP < 12 ? 'Bom dia' :
    horaSP < 18 ? 'Boa tarde' :
    'Boa noite'

  const userFirstName = usuario.name?.split(' ')[0] || 'Visitante'

  // Data formatada com fuso horário de SP
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())

  // Pluralização
  const labelLeituras = estatisticas.totalLeituras === 1 ? 'Artigo lido' : 'Artigos lidos'
  const labelFavoritos = estatisticas.totalFavoritos === 1 ? 'Favorito salvo' : 'Favoritos salvos'

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Bloco 1 — Saudação */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {saudacao}, {userFirstName}! 👋
        </h1>
        <p className="text-muted-foreground capitalize">
          {dataFormatada}
        </p>
      </div>

      {/* Bloco 2 — Stats grid 2 cols */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">{labelLeituras}</span>
          </div>
          <div className="mt-2">
            <span className="font-display text-3xl font-bold">{estatisticas.totalLeituras}</span>
          </div>
        </div>
        
        {/* Card 2 */}
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-data-blue/10 p-2 rounded-full">
              <Bookmark className="h-5 w-5 text-data-blue" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">{labelFavoritos}</span>
          </div>
          <div className="mt-2">
            <span className="font-display text-3xl font-bold">{estatisticas.totalFavoritos}</span>
          </div>
        </div>
      </div>

      {/* Bloco 3 — Continue lendo */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Continue lendo</h2>
          <Link 
            href="/dashboard/historico" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver tudo →
          </Link>
        </div>
        
        {ultimasLeituras.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-lg bg-surface/50">
            <div className="bg-muted p-3 rounded-full mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              Você ainda não leu nenhum artigo.
            </p>
            <Button asChild size="sm" className="bg-green-500 text-white hover:bg-green-600">
              <Link href="/artigos">Explorar artigos →</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {ultimasLeituras.map((history) => (
              <DashboardArtigoCard
                key={history.id}
                variant="compact"
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
      </section>

      {/* Bloco 4 — Seus favoritos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Seus favoritos</h2>
          <Link 
            href="/dashboard/favoritos" 
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver tudo →
          </Link>
        </div>

        {favoritosRecentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-lg bg-surface/50">
            <div className="bg-muted p-3 rounded-full mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              Nenhum favorito salvo ainda.
            </p>
            <Button asChild size="sm" className="bg-green-500 text-white hover:bg-green-600">
              <Link href="/artigos">Explorar artigos →</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {favoritosRecentes.map((favorite) => (
              <DashboardArtigoCard
                key={favorite.id}
                variant="compact"
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
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
