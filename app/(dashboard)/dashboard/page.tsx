import { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, BookOpen, ChevronRight, Clock, Bookmark } from 'lucide-react'
import { requireAuth } from '@/lib/auth-helpers'
import { carregarVisaoGeral } from '@/lib/dashboard/visao-geral'
import { carregarJogosDoDia } from '@/lib/dashboard/jogos-do-dia'
import { DashboardJogosDoDia } from '@/components/dashboard/DashboardJogosDoDia'
import { DashboardAcessosRapidos } from '@/components/dashboard/DashboardAcessosRapidos'
import { DashboardArtigoCard } from '@/components/dashboard/DashboardArtigoCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Visão Geral - BDB',
}

export default async function DashboardPage() {
  const user = await requireAuth()

  // Carregar jogos do dia e dados do perfil/artigos em paralelo
  const [dadosArtigos, dadosJogos] = await Promise.all([
    carregarVisaoGeral(user.id),
    carregarJogosDoDia(user.id),
  ])

  const { usuario, ultimasLeituras, favoritosRecentes } = dadosArtigos
  const { partidas, ligas, estatisticas, dataReferencia, isVip } = dadosJogos

  // Saudação dinâmica com fuso horário de São Paulo
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

  const userFirstName = usuario.name?.split(' ')[0] || 'Membro'

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      {/* Bloco 1 — Header & Saudação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              {saudacao}, {userFirstName}! 👋
            </h1>
            <Badge
              variant="outline"
              className={
                isVip
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 text-xs px-2.5 py-0.5 font-semibold'
                  : 'bg-primary/10 text-primary border-primary/30 text-xs px-2.5 py-0.5 font-medium'
              }
            >
              {isVip ? 'VIP BDB' : 'Plano Gratuito'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {estatisticas.total > 0
              ? `Você tem ${estatisticas.total} ${
                  estatisticas.total === 1 ? 'jogo' : 'jogos'
                } programados para hoje nas suas ligas.`
              : 'Acompanhe as análises, ferramentas e novidades do BigDataBet.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs bg-surface border-border">
            <Link href="/dashboard/ligas">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              Catálogo de Ligas
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs bg-primary hover:bg-primary-dark text-black font-semibold">
            <Link href="/dashboard/ferramentas">
              Explorar Ferramentas
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Bloco 2 — Central de Jogos do Dia (Destaque Principal) */}
      <DashboardJogosDoDia
        initialPartidas={partidas}
        ligas={ligas}
        estatisticas={estatisticas}
        dataReferencia={dataReferencia}
      />

      {/* Bloco 3 — Hub de Acessos Rápidos (Cursos e Ferramentas) */}
      <DashboardAcessosRapidos />

      {/* Bloco 4 — Histórico e Leituras Recentes (Rodapé Compacto) */}
      {(ultimasLeituras.length > 0 || favoritosRecentes.length > 0) && (
        <section className="pt-6 border-t border-border/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-base text-text-secondary">
                Conteúdo & Leituras
              </h3>
            </div>
            <Link
              href="/dashboard/historico"
              className="text-xs text-primary hover:underline font-medium"
            >
              Ver histórico completo →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Últimas leituras */}
            {ultimasLeituras.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Continue Lendo
                </span>
                <div className="space-y-2">
                  {ultimasLeituras.slice(0, 2).map((history) => (
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
              </div>
            )}

            {/* Favoritos */}
            {favoritosRecentes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3 h-3 text-data-blue" />
                  Favoritos Salvos
                </span>
                <div className="space-y-2">
                  {favoritosRecentes.slice(0, 2).map((fav) => (
                    <DashboardArtigoCard
                      key={fav.id}
                      variant="compact"
                      artigo={{
                        id: fav.article.id,
                        slug: fav.article.slug,
                        title: fav.article.title,
                        thumbnail: fav.article.thumbnail,
                        type: fav.article.type,
                        category: fav.article.category,
                      }}
                      dateLabel="Salvo em"
                      date={fav.createdAt}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
