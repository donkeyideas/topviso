import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.topviso.com'

  const staticPages = [
    '',
    '/about',
    '/pricing',
    '/blog',
    '/press',
    '/benchmarks',
    '/careers',
    '/customers',
    '/changelog',
    '/docs',
    '/journal',
    '/product',
    '/product/llm-tracker',
    '/product/attribution',
    '/product/creative-lab',
    '/product/reviews-plus',
    '/product/keywords',
    '/product/api-docs',
    '/terms',
    '/privacy',
    '/security',
    '/dpa',
    '/status',
  ]

  return staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : path.startsWith('/product') ? 0.9 : 0.7,
  }))
}
