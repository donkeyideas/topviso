'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { loggedChatCompletion } from '@/lib/deepseek'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function getAllPosts(type: 'blog' | 'guide') {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function createPost(formData: {
  type: 'blog' | 'guide'
  title: string
  slug?: string
  excerpt?: string
  content: string
  cover_image?: string
  author_name?: string
  status: 'draft' | 'published'
  tags?: string[]
}): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const slug = formData.slug?.trim() || slugify(formData.title)
  const published_at =
    formData.status === 'published' ? new Date().toISOString() : null

  const { error } = await supabase.from('posts').insert({
    type: formData.type,
    title: formData.title,
    slug,
    excerpt: formData.excerpt || null,
    content: formData.content,
    cover_image: formData.cover_image || null,
    author_name: formData.author_name || null,
    status: formData.status,
    tags: formData.tags || [],
    published_at,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function updatePost(
  id: string,
  formData: {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    cover_image?: string
    author_name?: string
    status?: 'draft' | 'published'
    tags?: string[]
  },
): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const updateData: {
    title?: string
    slug?: string
    excerpt?: string | null
    content?: string
    cover_image?: string | null
    author_name?: string | null
    status?: string
    tags?: string[]
    published_at?: string | null
    updated_at?: string
  } = { updated_at: new Date().toISOString() }

  if (formData.title !== undefined) updateData.title = formData.title
  if (formData.slug !== undefined) updateData.slug = formData.slug
  if (formData.excerpt !== undefined) updateData.excerpt = formData.excerpt || null
  if (formData.content !== undefined) updateData.content = formData.content
  if (formData.cover_image !== undefined) updateData.cover_image = formData.cover_image || null
  if (formData.author_name !== undefined) updateData.author_name = formData.author_name || null
  if (formData.status !== undefined) updateData.status = formData.status
  if (formData.tags !== undefined) updateData.tags = formData.tags
  if (formData.status === 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function deletePost(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function generateBlogWithAI(
  title: string,
  type: 'blog' | 'guide' = 'blog',
  backlink?: string,
): Promise<
  { error: string } | { content: string; excerpt: string; tags: string[] }
> {
  try {
    const backlinkInstruction = backlink
      ? `Include a natural dofollow link to ${backlink} within the content.`
      : ''

    const result = await loggedChatCompletion(
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert content writer specializing in App Store Optimization (ASO), mobile growth, and app marketing. Write in clean HTML (no markdown). Output SEO-optimized content.`,
          },
          {
            role: 'user',
            content: `Write a ${type === 'guide' ? 'comprehensive guide' : 'blog post'} titled "${title}".

Requirements:
- Output clean HTML only (use <h2>, <h3>, <p>, <ul>, <li>, <blockquote>, <strong>, <em> tags)
- 1500-2500 words
- Optimize for SEO, AEO (answer engine optimization), and readability
- Include 3-5 internal links to relevant ASO topics (use placeholder hrefs like /blog/keyword-research, /blog/app-store-optimization-guide, etc.)
- Include 2-3 external links to authoritative sources
${backlinkInstruction}
- Structure with clear H2 and H3 headings
- Include a compelling introduction and conclusion

After the HTML content, on a new line write:
---EXCERPT---
A 1-2 sentence SEO-optimized excerpt/meta description (plain text, no HTML)
---TAGS---
comma-separated relevant tags (5-8 tags)`,
          },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      },
      { action: 'generate-blog', type },
    )

    const text = result.choices[0]?.message?.content ?? ''

    // Parse sections
    const excerptMatch = text.split('---EXCERPT---')
    const mainContent = excerptMatch[0]?.trim() ?? text
    const afterExcerpt = excerptMatch[1] ?? ''

    const tagsSplit = afterExcerpt.split('---TAGS---')
    const excerpt = tagsSplit[0]?.trim() ?? ''
    const tagsRaw = tagsSplit[1]?.trim() ?? ''
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    return { content: mainContent, excerpt, tags }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return { error: message }
  }
}
