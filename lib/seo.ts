import { Metadata } from 'next'

// ===================================================
// Configuração base de SEO do site
// ===================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bigdatabet.com.br'
const SITE_NAME = 'Big Data Bet'
const DEFAULT_DESCRIPTION =
  'Plataforma brasileira de análise esportiva baseada em dados. Estatísticas avançadas, planilhas, backtests e conteúdo exclusivo para o mercado de apostas esportivas.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/fallback.png`

export const metadataBase = new URL(SITE_URL)

interface SeoParams {
  title: string
  description?: string
  path?: string // Ex: '/planilhas', '/estudos/meu-artigo'
  ogImage?: string
  noIndex?: boolean
  keywords?: string[]
  type?: 'website' | 'article'
  publishedTime?: string // ISO date — apenas para artigos
  authors?: string[] // Nomes dos autores — apenas para artigos
}

/**
 * Gera metadata padrão para qualquer página do site.
 * Uso: export const metadata = seo({ title: '...', path: '/...' })
 */
export function seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  keywords = [],
  type = 'website',
  publishedTime,
  authors,
}: SeoParams): Metadata {
  const url = `${SITE_URL}${path}`
  const fullTitle = title.includes(SITE_NAME) 
    ? title 
    : `${title} | ${SITE_NAME}`

  // Keywords base + específicas da página
  const baseKeywords = [
    'apostas esportivas',
    'análise esportiva',
    'estatísticas futebol',
    'big data bet',
    'planilhas apostas',
    'backtest apostas',
  ]
  const allKeywords = Array.from(new Set([...baseKeywords, ...keywords]))

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: authors?.map((name) => ({ name })),
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'pt_BR',
      type: type === 'article' ? 'article' : 'website',
      ...(type === 'article' && publishedTime
        ? { publishedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

export interface ArtigoMetadataParams {
  title: string
  excerpt?: string | null
  slug: string
  thumbnail?: string | null
  type?: string
  publishedAt?: Date | string | null
  authors?: string[]
}

export function gerarMetadataArtigo(artigo: ArtigoMetadataParams): Metadata {
  const url = `${SITE_URL}/artigos/${artigo.slug}`
  const ogImage = artigo.thumbnail ? (artigo.thumbnail.startsWith('http') ? artigo.thumbnail : `${SITE_URL}${artigo.thumbnail}`) : `${SITE_URL}/images/fallback.png`
  const description = artigo.excerpt || artigo.title

  return {
    title: `${artigo.title} | ${SITE_NAME}`,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${artigo.title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: artigo.title,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
      ...(artigo.publishedAt && { publishedTime: new Date(artigo.publishedAt).toISOString() }),
      ...(artigo.authors && { authors: artigo.authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${artigo.title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  }
}

// Exporta constantes para uso em outros arquivos (sitemap, etc.)
export { SITE_URL, SITE_NAME }
