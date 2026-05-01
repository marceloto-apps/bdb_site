import { prisma } from '@/lib/prisma'
import { seo, gerarMetadataArtigo } from '@/lib/seo'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

import { ArrowLeft, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { auth } from '@/auth'
import { ArticleActions } from '@/components/articles/article-actions'

// Confirmação de formato: o campo content do model Article no schema.prisma é 
// String @db.LongText e os plugins de markdown já estão configurados no package.json.
// Por conta disso, assumiremos que o conteúdo armazenado nele é Markdown.

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params

  const artigo = await prisma.article.findFirst({
    where: { slug, status: 'PUBLICADO' },
    select: { 
      title: true, 
      excerpt: true, 
      thumbnail: true,
      slug: true,
      type: true,
      publishedAt: true,
      author: { select: { name: true } }
    },
  })

  if (!artigo) return seo({ title: 'Artigo não encontrado', path: `/artigos/${slug}` })

  return gerarMetadataArtigo({
    title: artigo.title,
    excerpt: artigo.excerpt,
    slug: artigo.slug,
    thumbnail: artigo.thumbnail,
    type: artigo.type,
    publishedAt: artigo.publishedAt,
    authors: artigo.author?.name ? [artigo.author.name] : undefined,
  })
}

export default async function ArtigoPage({ params }: PageProps) {
  const { slug } = await params

  // Busca o artigo completo com autor, categoria e tags
  const artigo = await prisma.article.findFirst({
    where: { slug, status: 'PUBLICADO' },
    include: {
      author: { select: { name: true, image: true } },
      category: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  })

  if (!artigo) notFound()

  const session = await auth()
  let initialFavorite: { id: string } | null = null
  if (session?.user?.id) {
    try {
      initialFavorite = await prisma.favorite.findUnique({
        where: {
          userId_articleId: {
            userId: session.user.id,
            articleId: artigo.id,
          },
        },
        select: { id: true },
      })
    } catch (e) {
      console.error('Erro ao buscar favorito inicial', e)
    }
  }

  // Data formatada (ex: 30 de abril de 2026)
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(artigo.publishedAt || artigo.createdAt)

  return (
    <article className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Voltar para listagem */}
      <Link
        href="/artigos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para artigos
      </Link>

      {/* Cabeçalho */}
      <header className="mb-8">
        {/* Categoria */}
        {artigo.category && (
          <Badge variant="outline" className="mb-4">
            {artigo.category.name}
          </Badge>
        )}

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {artigo.title}
        </h1>

        {/* Resumo (se existir) */}
        {artigo.excerpt && (
          <p className="text-lg text-muted-foreground mb-6">
            {artigo.excerpt}
          </p>
        )}

        {/* Meta: data */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <time dateTime={(artigo.publishedAt || artigo.createdAt).toISOString()}>
            {dataFormatada}
          </time>
        </div>
      </header>

      {/* Ações do Artigo (Favoritar / Tracking) */}
      <div className="mb-8 border-y border-border py-4 flex justify-end">
        <ArticleActions
          articleId={artigo.id}
          initialIsFavorited={!!initialFavorite}
        />
      </div>

      {/* Imagem de capa */}
      {artigo.thumbnail && (
        <div className="relative aspect-video w-full max-w-[1000px] mx-auto overflow-hidden rounded-lg mb-8">
          <Image
            src={artigo.thumbnail}
            alt={artigo.title}
            fill
            className="object-cover"
            sizes="(max-width: 1000px) 100vw, 1000px"
            priority
          />
        </div>
      )}

      {/* Conteúdo do artigo em Markdown */}
      <div className="prose prose-invert prose-lg max-w-none
        prose-headings:font-bold prose-headings:tracking-tight
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-img:rounded-lg prose-img:mx-auto prose-img:max-w-full lg:prose-img:max-w-[1000px]
        prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:mx-auto prose-pre:w-fit prose-pre:max-w-full
        prose-code:text-primary prose-code:before:content-none prose-code:after:content-none
        prose-blockquote:border-primary prose-blockquote:text-muted-foreground
        prose-strong:text-foreground
        prose-th:text-foreground
        prose-table:mx-auto prose-table:w-auto
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {artigo.content || ''}
        </ReactMarkdown>
      </div>

      {/* Tags */}
      {artigo.tags.length > 0 && (
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {artigo.tags.map((t) => (
              <Link key={t.tag.id} href={`/artigos?tag=${encodeURIComponent(t.tag.name)}`}>
                <Badge variant="secondary" className="hover:bg-primary/10 hover:text-primary transition-colors">
                  {t.tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
