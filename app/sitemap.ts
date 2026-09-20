import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = 'https://bigdatabet.com.br'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/sobre`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/planos`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/planilhas`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/artigos`,
      lastModified: new Date(),
      priority: 0.8,
    },
  ]

  try {
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLICADO' },
      select: { slug: true, updatedAt: true },
    })

    const dynamicPages: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${SITE_URL}/artigos/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticPages, ...dynamicPages]
  } catch (error) {
    console.error('[sitemap] Erro ao buscar artigos do banco de dados:', error)
    return staticPages
  }
}
