import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Re-query published posts at most once an hour so newly published
// content shows up in the sitemap without a full rebuild.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.topviso.com'

  const staticPages = [
    '',
    '/about',
    '/pricing',
    '/blog',
    '/glossary',
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

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1.0 : path.startsWith('/product') ? 0.9 : 0.7,
  }))

  // Enumerate every published post so Google can crawl them. Blog posts live
  // under /blog/{slug}; guides (the ASO glossary) live under /glossary/{slug}.
  // Mirrors the query shape in (marketing)/blog/page.tsx.
  let postEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await supabase
      .from('posts')
      .select('slug, type, published_at, updated_at')
      .eq('status', 'published')
      .in('type', ['blog', 'guide'])

    postEntries = (data ?? []).map((post) => ({
      url: `${base}/${post.type === 'guide' ? 'glossary' : 'blog'}/${post.slug}`,
      lastModified: post.updated_at
        ? new Date(post.updated_at)
        : post.published_at
          ? new Date(post.published_at)
          : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch {
    // If Supabase is unreachable at build/revalidate time, still emit the
    // static pages rather than failing the whole sitemap.
  }

  return [...staticEntries, ...postEntries]
}
