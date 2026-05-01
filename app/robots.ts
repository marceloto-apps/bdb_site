import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cms/', '/dashboard/', '/api/'],
    },
    sitemap: 'https://bigdatabet.com.br/sitemap.xml',
  }
}
