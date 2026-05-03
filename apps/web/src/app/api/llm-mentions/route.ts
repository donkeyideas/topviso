import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Use untyped client — llm_mentions table isn't in generated Database types yet
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface LlmMention {
  surface: string
  prompt: string
  mentioned: boolean
  position: string | null
  response_excerpt: string | null
  polled_at: string
}

// GET /api/llm-mentions?appId=...
// Returns aggregated LLM mention data from real poll history
export async function GET(req: NextRequest) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appId = req.nextUrl.searchParams.get('appId')
  if (!appId) {
    return NextResponse.json({ error: 'appId required' }, { status: 400 })
  }

  // Fetch all mentions for this app, ordered by most recent
  const { data, error } = await supabase
    .from('llm_mentions')
    .select('surface, prompt, mentioned, position, response_excerpt, polled_at')
    .eq('app_id', appId)
    .order('polled_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const mentions = (data ?? []) as LlmMention[]

  if (mentions.length === 0) {
    return NextResponse.json({
      shareOfVoice: 0,
      totalPolls: 0,
      mentionedCount: 0,
      surfaces: [],
      recentMentions: [],
    })
  }

  // Aggregate by surface
  const surfaceMap = new Map<string, { total: number; mentioned: number }>()
  for (const m of mentions) {
    const s = surfaceMap.get(m.surface) ?? { total: 0, mentioned: 0 }
    s.total++
    if (m.mentioned) s.mentioned++
    surfaceMap.set(m.surface, s)
  }

  const totalPolls = mentions.length
  const mentionedCount = mentions.filter(m => m.mentioned).length
  const shareOfVoice = totalPolls > 0 ? Math.round((mentionedCount / totalPolls) * 100) : 0

  const surfaces = Array.from(surfaceMap.entries()).map(([surface, stats]) => ({
    surface,
    totalPolls: stats.total,
    mentionedCount: stats.mentioned,
    shareOfVoice: stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0,
  }))

  // Recent mentions with excerpts
  const recentMentions = mentions
    .filter(m => m.mentioned)
    .slice(0, 10)
    .map(m => ({
      surface: m.surface,
      prompt: m.prompt,
      excerpt: m.response_excerpt,
      polledAt: m.polled_at,
    }))

  return NextResponse.json({
    shareOfVoice,
    totalPolls,
    mentionedCount,
    surfaces,
    recentMentions,
  })
}
