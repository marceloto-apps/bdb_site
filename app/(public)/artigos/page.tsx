import { seo } from '@/lib/seo'
import { prisma } from '@/lib/prisma'
import { FiltroArtigos } from '@/components/shared/filtro-artigos'
import { ArtigoCardPublico } from '@/components/shared/artigo-card-publico'
import { Pagination } from '@/components/shared/pagination'
import { ArticleType } from '@prisma/client'

// Metadata
export const metadata = seo({
  title: 'Artigos',
  description: 'Estudos, análises e artigos sobre futebol e apostas esportivas baseados em dados.',
  path: '/artigos',
})

interface PageProps {
  searchParams: Promise<{
    page?: string
    categoria?: string
    tag?: string
    tipo?: string
  }>
}

export default async function ArtigosPage({ searchParams }: PageProps) {
  // Extrai parâmetros da URL
  const resolvedParams = await searchParams
  const paginaAtual = resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1
  const categoria = resolvedParams.categoria
  const tag = resolvedParams.tag
  const tipo = resolvedParams.tipo
  const take = 9
  const skip = (paginaAtual - 1) * take

  // Filtro de busca do Prisma
  const where = {
    status: 'PUBLICADO' as const,
    ...(tipo ? { type: tipo.toUpperCase() as ArticleType } : {}),
    ...(categoria ? { category: { name: categoria } } : {}),
    ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
  }

  // Executa todas as queries independentes em paralelo
  const [artigos, totalArtigos, categoriasRaw, tagsRaw, tiposRaw] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
      include: {
        author: { select: { name: true, image: true } },
        category: { select: { name: true } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.article.count({ where }),
    prisma.category.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.tag.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.article.findMany({
      where: { status: 'PUBLICADO' },
      select: { type: true },
      distinct: ['type'],
      orderBy: { type: 'asc' },
    }),
  ])

  const categorias = categoriasRaw.map((c) => c.name)
  const tags = tagsRaw.map((t) => t.name)
  const tipos = tiposRaw.map((t) => t.type)

  const totalPaginas = Math.ceil(totalArtigos / take)

  return (
    <section className="container mx-auto px-4 py-12 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2 tracking-tight">Artigos</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Estudos, análises e artigos sobre futebol e apostas esportivas.
      </p>

      <FiltroArtigos
        categorias={categorias}
        tags={tags}
        tipos={tipos}
        baseUrl="/artigos"
        categoriaSelecionada={categoria}
        tagSelecionada={tag}
        tipoSelecionado={tipo}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artigos.map((artigo) => (
          <ArtigoCardPublico
            key={artigo.id}
            slug={artigo.slug}
            titulo={artigo.title}
            resumo={artigo.excerpt || ''}
            imagemCapa={artigo.thumbnail}
            categoria={artigo.category?.name || 'Geral'}
            publicadoEm={artigo.publishedAt || artigo.createdAt}
          />
        ))}
      </div>

      {artigos.length === 0 && (
        <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-border mt-6">
          <p>Nenhum artigo encontrado com os filtros selecionados.</p>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-12">
          <Pagination
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            baseUrl="/artigos"
            searchParams={Object.fromEntries(
              Object.entries({ categoria, tag, tipo }).filter(([, v]) => v !== undefined)
            ) as Record<string, string>}
          />
        </div>
      )}
    </section>
  )
}
