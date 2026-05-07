import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/app/', '/focused/', '/settings/', '/onboarding/', '/admin/'],
      },
    ],
    sitemap: 'https://www.topviso.com/sitemap.xml',
  }
}
