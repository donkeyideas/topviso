'use server'

import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { loggedChatCompletion } from '@/lib/deepseek'
import type {
  SocialPlatform,
  PostStatus,
  ToneType,
  SocialMediaPost,
  AutomationConfig,
} from '@/types/social-posts'
import { CHAR_LIMITS } from '@/types/social-posts'

const PATH = '/admin/social-posts'

// ── CRUD ──

export async function getSocialPosts(filters?: {
  status?: PostStatus | 'ALL'
  platform?: SocialPlatform | 'ALL'
}): Promise<{ data: SocialMediaPost[]; error?: string }> {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('social_media_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'ALL') {
    query = query.eq('status', filters.status)
  }
  if (filters?.platform && filters.platform !== 'ALL') {
    query = query.eq('platform', filters.platform)
  }

  const { data, error } = await query
  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as SocialMediaPost[] }
}

export async function createSocialPost(post: {
  platform: SocialPlatform
  content: string
  status?: PostStatus
  hashtags?: string[]
  image_prompt?: string
  scheduled_at?: string
}): Promise<{ error: string } | { success: true; id: string }> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('social_media_posts')
    .insert({
      platform: post.platform,
      content: post.content,
      status: post.status ?? 'DRAFT',
      hashtags: post.hashtags ?? [],
      image_prompt: post.image_prompt ?? null,
      scheduled_at: post.scheduled_at ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true, id: data.id }
}

export async function updateSocialPost(
  id: string,
  updates: {
    content?: string
    status?: PostStatus
    hashtags?: string[]
    image_prompt?: string
    scheduled_at?: string | null
    published_at?: string | null
  },
): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('social_media_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

export async function deleteSocialPost(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('social_media_posts')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

// ── Bulk ──

export async function bulkApproveDrafts(): Promise<
  { error: string } | { success: true; count: number }
> {
  const supabase = getSupabaseAdmin()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const { data, error } = await supabase
    .from('social_media_posts')
    .update({
      status: 'SCHEDULED',
      scheduled_at: tomorrow.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'DRAFT')
    .select('id')

  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true, count: data?.length ?? 0 }
}

// ── AI Generation ──

export async function generateSocialPosts(params: {
  topic?: string
  tone: ToneType
  platforms: SocialPlatform[]
}): Promise<
  | { error: string }
  | { success: true; posts: SocialMediaPost[]; errors: string[] }
> {
  const supabase = getSupabaseAdmin()
  const results: SocialMediaPost[] = []
  const errors: string[] = []

  for (const platform of params.platforms) {
    try {
      const charLimit = CHAR_LIMITS[platform]
      const topicLine = params.topic
        ? `Topic: "${params.topic}"`
        : 'Topic: App Store Optimization (ASO) tips and mobile growth strategies'

      const result = await loggedChatCompletion(
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a social media expert for Top Viso, an App Store Optimization (ASO) SaaS platform. Create engaging ${platform} posts.`,
            },
            {
              role: 'user',
              content: `Create a ${platform} post with a ${params.tone} tone.
${topicLine}
Character limit: ${charLimit} characters (including hashtags).

Output format:
---CONTENT---
[The post content without hashtags]
---HASHTAGS---
#tag1, #tag2, #tag3 (3-5 relevant hashtags)
---IMAGE_PROMPT---
[A one-sentence description of an ideal image to accompany this post]`,
            },
          ],
          max_tokens: 500,
          temperature: 0.8,
        },
        { action: 'generate-social-post', platform, tone: params.tone },
      )

      const text = result.choices[0]?.message?.content ?? ''

      // Parse
      const contentMatch = text.split('---CONTENT---')[1]?.split('---HASHTAGS---')[0]?.trim() ?? text
      const hashtagsMatch = text.split('---HASHTAGS---')[1]?.split('---IMAGE_PROMPT---')[0]?.trim() ?? ''
      const imagePrompt = text.split('---IMAGE_PROMPT---')[1]?.trim() ?? ''

      const hashtags = hashtagsMatch
        .split(/[,\n]/)
        .map((h) => h.trim())
        .filter((h) => h.startsWith('#'))

      // Clean markdown artifacts
      const cleanContent = contentMatch
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim()

      // Save as draft
      const { data, error } = await supabase
        .from('social_media_posts')
        .insert({
          platform,
          content: cleanContent,
          status: 'DRAFT',
          hashtags,
          image_prompt: imagePrompt || null,
        })
        .select('*')
        .single()

      if (error) {
        errors.push(`${platform}: ${error.message}`)
      } else {
        results.push(data as SocialMediaPost)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`${platform}: ${msg}`)
    }
  }

  if (results.length === 0 && errors.length > 0) {
    return { error: errors.join('; ') }
  }

  revalidatePath(PATH)
  return { success: true, posts: results, errors }
}

// ── Publishing (placeholder) ──

export async function publishPost(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('social_media_posts')
    .update({
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

// ── Automation Config ──

const DEFAULT_AUTOMATION: AutomationConfig = {
  enabled: false,
  platforms: [],
  hour: 9,
  topics: [],
  useDomainContent: false,
  requireApproval: true,
}

export async function getAutomationConfig(): Promise<AutomationConfig> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'social_automation')
    .single()

  if (!data?.value) return DEFAULT_AUTOMATION
  try {
    return JSON.parse(data.value) as AutomationConfig
  } catch {
    return DEFAULT_AUTOMATION
  }
}

export async function saveAutomationConfig(
  config: AutomationConfig,
): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('admin_settings')
    .upsert(
      {
        key: 'social_automation',
        value: JSON.stringify(config),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )

  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

// ── Credentials ─���

export async function getCredentials(): Promise<Record<string, string>> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'social_credentials')
    .single()

  if (!data?.value) return {}
  try {
    return JSON.parse(data.value) as Record<string, string>
  } catch {
    return {}
  }
}

export async function saveCredentials(
  creds: Record<string, string>,
): Promise<{ error: string } | { success: true }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('admin_settings')
    .upsert(
      {
        key: 'social_credentials',
        value: JSON.stringify(creds),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )

  if (error) return { error: error.message }

  return { success: true }
}
