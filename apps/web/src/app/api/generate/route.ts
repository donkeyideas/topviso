import { NextRequest, NextResponse } from 'next/server'
import { getDeepSeekClient, loggedChatCompletion } from '@/lib/deepseek'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { checkKeywordLimit } from '@/lib/plan-limits'

// Sync can take a while (keyword ranking checks are sequential with delays)
export const maxDuration = 300

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

type GenerateAction =
  | 'sync'
  | 'overview'
  | 'keywords'
  | 'optimize-title'
  | 'optimize-subtitle'
  | 'optimize-description'
  | 'optimize-keywords-field'
  | 'strategy'
  | 'recommendations'
  | 'localization'
  | 'intent-map'
  | 'llm-track'
  | 'competitors'
  | 'reviews-analysis'
  | 'store-intel'
  | 'visibility'
  | 'update-impact'
  | 'discovery-map'
  | 'creative-lab'
  | 'ad-intel'
  | 'market-intel'
  | 'growth-insights'
  | 'reviews-plus'
  | 'keyword-audiences'
  | 'agent-ready'
  | 'conversion'
  | 'feature-image-score'

interface GenerateRequest {
  action: GenerateAction
  appId: string
  locale?: string
  prompt?: string
  goal?: string
  imageUrl?: string
}

export async function POST(req: NextRequest) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as GenerateRequest
    const { action, appId, locale, prompt: userPrompt, goal } = body

    // Fetch app details
    const { data: app, error: appErr } = await supabaseAdmin
      .from('apps')
      .select('*')
      .eq('id', appId)
      .single()

    if (appErr || !app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    // Fetch existing keywords for context (include id to avoid N+1 queries)
    const { data: keywords } = await supabaseAdmin
      .from('keywords')
      .select('id, text, country')
      .eq('app_id', appId)
      .limit(50)

    // Fetch latest metadata snapshot (maybeSingle — may not exist yet)
    const { data: snapshot } = await supabaseAdmin
      .from('app_metadata_snapshots')
      .select('*')
      .eq('app_id', appId)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const appContext = await buildAppContext(supabaseAdmin, app, keywords ?? [], snapshot)
    const deepseek = getDeepSeekClient()

    // Handle sync action — real data pipeline + AI enrichment for all overview-2 sections
    if (action === 'sync') {
      const { runFullSync } = await import('@/lib/sync-pipeline')
      const syncResult = await runFullSync(supabaseAdmin, app as { id: string; organization_id: string; platform: 'ios' | 'android'; store_id: string; name: string })

      // After real data sync, generate AI-dependent analyses in parallel
      // These populate overview-2 sections that need AI: recommendations, llm-track, store-intel AI fields
      const aiTasks: Promise<void>[] = []

      // 1. Generate recommendations (§ 06 on overview-2)
      aiTasks.push((async () => {
        try {
          const recsCompletion = await loggedChatCompletion({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are an ASO expert generating actionable recommendations. Return ONLY a JSON array.' },
              { role: 'user', content: `Generate 8 prioritized ASO recommendations for this app.\n\n${appContext}\n\nEach recommendation should be specific and actionable.\n\nReturn a JSON array: [{"title": "...", "description": "detailed action", "impact": "high" | "medium" | "low", "effort": "high" | "medium" | "low", "category": "keywords" | "metadata" | "creatives" | "ratings" | "competitors" | "llm", "lift": "estimated lift", "owner": "suggested owner"}]\nOnly return the JSON array, no other text.` },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }, { action: 'sync-recommendations' })
          const raw = recsCompletion.choices[0]?.message?.content ?? '[]'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const recsResult = JSON.parse(cleaned)
          await supabaseAdmin.from('analysis_results').upsert(
            { app_id: appId, organization_id: app.organization_id, analysis_type: 'recommendations', result: recsResult, updated_at: new Date().toISOString() },
            { onConflict: 'app_id,analysis_type' },
          )
        } catch { /* recommendations AI failed, skip */ }
      })())

      // 2. Generate llm-track (§ 07 on overview-2)
      aiTasks.push((async () => {
        try {
          const llmCompletion = await loggedChatCompletion({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You simulate how different LLM-powered assistants would respond to user queries about mobile apps. Return ONLY a JSON object.' },
              { role: 'user', content: `A user asks "best ${app.category ?? 'app'} app" to 5 different assistants.\n\nThe app being tracked:\n${appContext}\n\nFor each surface, simulate whether the app would likely be recommended:\n1. ChatGPT\n2. Claude\n3. Gemini\n4. Perplexity\n5. Copilot\n\nAlso generate:\n- 3-5 citation sources that LLMs would reference\n- A prompt matrix: 4-6 common user prompts tested across all 5 engines, with a mention score (0-100) per engine and an overall winner\n\nReturn a JSON object:\n{\n  "results": [{"surface": "ChatGPT", "mentioned": true/false, "response": "brief simulated excerpt", "position": "1st" | "2nd" | "3rd" | "not listed"}],\n  "citations": [{"source": "site or article name", "quote": "relevant excerpt", "meta": "context"}],\n  "promptMatrix": [{"prompt": "user query", "engines": {"ChatGPT": 85, "Claude": 72, "Gemini": 60, "Perplexity": 90, "Copilot": 45}, "winner": "engine name"}]\n}\nOnly return the JSON object, no other text.` },
            ],
            temperature: 0.7,
            max_tokens: 2500,
          }, { action: 'sync-llm-track' })
          const raw = llmCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const llmResult = JSON.parse(cleaned)
          await supabaseAdmin.from('analysis_results').upsert(
            { app_id: appId, organization_id: app.organization_id, analysis_type: 'llm-track', result: llmResult, updated_at: new Date().toISOString() },
            { onConflict: 'app_id,analysis_type' },
          )
        } catch { /* llm-track AI failed, skip */ }
      })())

      // 3. Enrich store-intel with AI fields if missing (§ 05 keyword opportunities on overview-2)
      aiTasks.push((async () => {
        try {
          const { data: existingIntel } = await supabaseAdmin
            .from('analysis_results')
            .select('result')
            .eq('app_id', appId)
            .eq('analysis_type', 'store-intel')
            .maybeSingle()
          const intel = (existingIntel?.result ?? {}) as Record<string, unknown>
          const hasAiFields = Array.isArray(intel.keywordOpportunities) && (intel.keywordOpportunities as unknown[]).length > 0
          if (!hasAiFields) {
            const intelCompletion = await loggedChatCompletion({
              model: 'deepseek-chat',
              messages: [
                { role: 'system', content: 'You are an app store intelligence analyst. Return ONLY a JSON object.' },
                { role: 'user', content: `Provide qualitative market analysis for this app.\n\n${appContext}\n\nGenerate:\n1. CATEGORY TRENDS: 3-5 emerging trends in this app's category.\n2. FEATURING TIPS: 3-5 tips for getting featured by ${app.platform === 'ios' ? 'Apple' : 'Google'}.\n3. KEYWORD OPPORTUNITIES: 8-12 keyword phrases this app should target but currently doesn't.\n\nReturn a JSON object:\n{\n  "categoryTrends": [{"trend": "...", "impact": "high|medium|low", "action": "..."}],\n  "featuringTips": ["tip1", "tip2"],\n  "keywordOpportunities": [{"keyword": "...", "description": "why this is an opportunity", "volume": "high|medium|low", "competition": "high|medium|low", "score": 85}]\n}\nOnly return the JSON object, no other text.` },
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }, { action: 'sync-store-intel-enrichment' })
            const raw = intelCompletion.choices[0]?.message?.content ?? '{}'
            const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            const aiFields = JSON.parse(cleaned)
            // Merge AI fields into existing store-intel
            const merged = {
              ...intel,
              categoryTrends: Array.isArray(aiFields.categoryTrends) ? aiFields.categoryTrends : [],
              featuringTips: Array.isArray(aiFields.featuringTips) ? aiFields.featuringTips : [],
              keywordOpportunities: Array.isArray(aiFields.keywordOpportunities) ? aiFields.keywordOpportunities : [],
            }
            await supabaseAdmin.from('analysis_results').upsert(
              { app_id: appId, organization_id: app.organization_id, analysis_type: 'store-intel', result: merged, updated_at: new Date().toISOString() },
              { onConflict: 'app_id,analysis_type' },
            )
          }
        } catch { /* store-intel AI enrichment failed, skip */ }
      })())

      await Promise.all(aiTasks)
      return NextResponse.json({ result: syncResult })
    }

    let prompt: string
    let systemPrompt: string

    switch (action) {
      case 'keywords': {
        // Real data pipeline: AI suggests keyword TEXT only, then we check real ranks
        const { batchCheckKeywordRankings, batchCheckKeywordRankingsIOS } = await import('@/lib/store-scraper')
        const { estimateKeywordMetrics } = await import('@/lib/keyword-enrichment')

        // 1. Fetch existing real keyword data (don't overwrite it)
        const { data: existingKwAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'keywords')
          .maybeSingle()

        const existingKeywords = Array.isArray(existingKwAnalysis?.result) ? existingKwAnalysis.result : []
        const existingSet = new Set(existingKeywords.map((k: Record<string, unknown>) => String(k.keyword ?? '').toLowerCase()))

        // 2. Ask AI for keyword TEXT suggestions only (not metrics)
        const kwCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an ASO keyword expert. Return ONLY a JSON array of 20 keyword strings (1-3 words each) that users would search to find this app. No explanations, no objects — just an array of strings.',
            },
            { role: 'user', content: appContext },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }, { action: 'keywords' })

        let aiSuggestions: string[] = []
        try {
          const rawKw = kwCompletion.choices[0]?.message?.content ?? '[]'
          const cleanedKw = rawKw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
          aiSuggestions = JSON.parse(cleanedKw) as string[]
        } catch { /* use empty */ }

        // 3. Filter to only NEW keywords not already tracked
        const newKeywords = aiSuggestions.filter(kw => !existingSet.has(kw.toLowerCase()))

        // 4. Run REAL rank checks on new keywords via store search API
        let newEnriched: Array<Record<string, unknown>> = []
        if (newKeywords.length > 0) {
          const newRankings = app.platform === 'ios'
            ? await batchCheckKeywordRankingsIOS(newKeywords.slice(0, 15), app.store_id as string, 'us', 400)
            : await batchCheckKeywordRankings(newKeywords.slice(0, 15), app.store_id as string, 'us', 300)

          // Enforce keyword limit: only persist up to the remaining allowance
          const kwLimit = await checkKeywordLimit(app.organization_id as string)
          const allowedNew = Math.max(0, kwLimit.limit - kwLimit.current)
          const cappedRankings = newRankings.slice(0, allowedNew)

          // Persist new keywords to the keywords table + keyword_ranks_daily
          for (const r of cappedRankings) {
            const { data: kw } = await supabaseAdmin
              .from('keywords')
              .upsert(
                {
                  app_id: appId,
                  organization_id: app.organization_id as string,
                  text: r.keyword,
                  country: r.country.toUpperCase(),
                  is_tracked: true,
                },
                { onConflict: 'app_id,text,country' },
              )
              .select('id')
              .single()

            if (kw) {
              await supabaseAdmin.from('keyword_ranks_daily').upsert(
                {
                  keyword_id: kw.id,
                  date: new Date().toISOString().split('T')[0],
                  rank: r.position,
                },
                { onConflict: 'keyword_id,date' },
              )
            }
          }

          // Enrich with heuristic estimates (clearly flagged)
          newEnriched = newRankings.map(r => {
            const metrics = estimateKeywordMetrics(r.keyword)
            const keiScore = Math.round(metrics.volume / Math.max(metrics.difficulty, 1))
            return {
              keyword: r.keyword,
              intent: metrics.intent,
              difficulty: metrics.difficulty,
              relevance: r.position ? Math.max(10, 100 - r.position) : 30,
              volume: metrics.volume,
              cpc: metrics.cpc,
              rank: r.position,
              country: r.country,
              delta7d: 0,
              kei: String(keiScore),
              topCompetitor: r.topCompetitor ?? null,
              isEstimate: { volume: true, cpc: true, difficulty: true },
            }
          })
        }

        // 5. Backfill KEI + topCompetitor for existing keywords that don't have them
        const { checkKeywordRanking: backfillCheckAndroid, checkKeywordRankingIOS: backfillCheckIOS } = await import('@/lib/store-scraper')
        const backfillCheck = app.platform === 'ios' ? backfillCheckIOS : backfillCheckAndroid
        for (const kw of existingKeywords as Array<Record<string, unknown>>) {
          // Always compute KEI from current volume/difficulty
          if (kw.volume && kw.difficulty) {
            kw.kei = String(Math.round(Number(kw.volume) / Math.max(Number(kw.difficulty), 1)))
          }
          // Fetch topCompetitor if missing (first 10 only to limit API calls)
          if (!kw.topCompetitor && kw.keyword) {
            try {
              const check = await backfillCheck(String(kw.keyword), app.store_id as string, 'us')
              if (check.topCompetitor) kw.topCompetitor = check.topCompetitor
              // Also refresh rank while we're at it
              if (check.position != null) kw.rank = check.position
              await new Promise(r => setTimeout(r, 200))
            } catch { /* skip */ }
          }
        }

        // 6. Merge: existing real data + new AI-discovered keywords with real ranks
        const mergedKeywords = [...existingKeywords, ...newEnriched]
        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id as string,
            analysis_type: 'keywords',
            result: mergedKeywords,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )
        return NextResponse.json({ result: mergedKeywords })
      }

      case 'optimize-title':
        systemPrompt = 'You are an expert ASO copywriter. You write compelling, keyword-rich app titles optimized for app store search. You ALWAYS generate fresh, unique options that differ from any previous suggestions. Return ONLY a JSON object.'
        prompt = `Generate 5 optimized ${app.platform === 'ios' ? 'iOS App Store' : 'Google Play'} titles for this app.

${appContext}

${buildGoalDirective(goal, 'title', app.platform)}

${LLM_OPTIMIZATION_DIRECTIVE}
${buildAppleComplianceDirective(app.platform as string)}${buildGooglePlayComplianceDirective(app.platform as string)}
CHARACTER LIMIT (STRICT — THIS IS THE MOST IMPORTANT RULE):
- Each title MUST be EXACTLY 30 characters or fewer. Not 31, not 35. MAXIMUM 30.
- Count EVERY character including spaces, punctuation, and symbols BEFORE returning.
- If a title is over 30 characters, shorten it. Do NOT return any title that exceeds 30 characters.

STORE POLICY COMPLIANCE (MANDATORY — violations cause rejection/warning):
- NEVER use trademarked names of other apps or companies (e.g., Netflix, Disney+, YouTube, Hulu, etc.)
- NEVER use third-party sports league names (NBA, NFL, NHL, MLB, FIFA, NCAA, etc.) or team/player names unless you own the rights
- BANNED performance keywords: "best", "#1", "top", "leading", "popular", "award-winning" (unless verifiable)
- BANNED promotional/price keywords: "free", "ad-free", "no ads", "ad free", "discount", "sale", "deal", "offer", "cashback", "limited time"
- BANNED call-to-actions: "download now", "install now", "play now", "try now", "update now", "get it now"
- BANNED store ranking claims: "App of the Year", "Editor's Choice", "Best of Play", "million downloads"
- Do NOT use ALL CAPS (unless it is the brand name)
- Do NOT use emojis, emoticons, or repeated special characters
- Do NOT include unattributed user testimonials or reviews
- Follow ${app.platform === 'ios' ? 'Apple App Store Review Guidelines §2.3.7' : 'Google Play Developer Policy on Store Listing and Promotion'} strictly

QUALITY:
- Front-load the most important keyword in each title
- Each of the 5 titles MUST use a different primary keyword and creative approach
- Balance search optimization with human appeal
- Maximize keyword density within the 30-char limit

Return a JSON object: {"titles": [{"title": "...", "charCount": N, "reasoning": "why this title works and which keyword it targets"}]}
Only return the JSON object, no other text.`
        break

      case 'optimize-subtitle': {
        const subLimit = app.platform === 'ios' ? 30 : 80
        const subLabel = app.platform === 'ios' ? 'subtitle' : 'short description'
        systemPrompt = `You are an expert ASO copywriter. You write compelling ${subLabel}s for ${app.platform === 'ios' ? 'the iOS App Store' : 'Google Play'}. You ALWAYS generate fresh, unique options. Return ONLY a JSON object.`
        prompt = `Generate 5 optimized ${subLabel}s for this app.

${appContext}

${buildGoalDirective(goal, 'subtitle', app.platform)}

${LLM_OPTIMIZATION_DIRECTIVE}
${buildAppleComplianceDirective(app.platform as string)}${buildGooglePlayComplianceDirective(app.platform as string)}
CHARACTER LIMIT (STRICT — THIS IS THE MOST IMPORTANT RULE):
- Each ${subLabel} MUST be EXACTLY ${subLimit} characters or fewer. Not ${subLimit + 1}, not ${subLimit + 5}. MAXIMUM ${subLimit}.
- Count EVERY character including spaces, punctuation, and symbols BEFORE returning.
- If a ${subLabel} is over ${subLimit} characters, shorten it. Do NOT return any ${subLabel} that exceeds ${subLimit} characters.

STORE POLICY COMPLIANCE (MANDATORY — violations cause rejection/warning):
- NEVER use trademarked names of competing apps or companies
- NEVER use third-party sports league names (NBA, NFL, NHL, MLB, FIFA, NCAA, etc.) or team/player names unless you own the rights
- BANNED performance keywords: "best", "#1", "top", "leading", "popular", "award-winning" (unless verifiable)
- BANNED promotional/price keywords: "free", "ad-free", "no ads", "ad free", "discount", "sale", "deal", "offer", "cashback", "limited time"
- BANNED call-to-actions: "download now", "install now", "play now", "try now", "update now", "get it now"
- BANNED store ranking claims: "App of the Year", "Editor's Choice", "million downloads"
- Do NOT use ALL CAPS (unless it is the brand name)
- Do NOT use emojis, emoticons, or repeated special characters
- Do NOT include unattributed user testimonials or data comparisons
- Follow ${app.platform === 'ios' ? 'Apple App Store Review Guidelines' : 'Google Play Developer Policy on Store Listing and Promotion'} strictly

QUALITY:
- Include secondary keywords NOT already in the title
- Communicate the core value proposition clearly
- Each of the 5 options MUST take a different angle or highlight different features
${app.platform === 'ios'
  ? `- iOS subtitle = ONLY 30 characters. Every single character must earn its place.
- Lead with the strongest keyword phrase (2-3 words max)
- Use "&" or "|" separators to squeeze in a second keyword if possible
- Drop articles (a, the), prepositions (for, with), and filler words unless essential for meaning
- Front-load the highest-volume keyword — Apple weights the beginning of the subtitle
- Think compact keyword phrases: "Live Scores & Stats" not "Get Live Scores and Statistics"
- Prefer short, punchy words over long ones — "Chat & Meet" beats "Communication Platform"
- If a keyword doesn't fit, save it for the keywords field instead — don't sacrifice readability`
  : '- Use the full 80 characters to describe key features and benefits with natural keyword inclusion'}

Return a JSON object: {"subtitles": [{"subtitle": "...", "charCount": N, "reasoning": "why this ${subLabel} works"}]}
Only return the JSON object, no other text.`
        break
      }

      case 'optimize-description':
        systemPrompt = 'You are an expert ASO copywriter. You write compelling, keyword-rich app descriptions that convert browsers into downloaders. You ALWAYS generate fresh content. Return ONLY a JSON object.'
        prompt = `Generate an optimized app store description for this app.

${appContext}

${buildGoalDirective(goal, 'description', app.platform)}

${LLM_OPTIMIZATION_DIRECTIVE}
${buildAppleComplianceDirective(app.platform as string)}${buildGooglePlayComplianceDirective(app.platform as string)}
PLATFORM: ${app.platform === 'ios' ? 'iOS App Store' : 'Google Play Store'}

CHARACTER LIMITS (STRICT):
- ${app.platform === 'ios' ? 'Promotional text: max 170 characters (shown above the fold, can be updated without a new build)' : 'Short description: max 80 characters'}
- Full description: max 4,000 characters

STORE POLICY COMPLIANCE (MANDATORY — violations cause rejection/warning):
- NEVER mention competing apps by name or use trademarked names
- NEVER use third-party sports league names (NBA, NFL, NHL, MLB, FIFA, NCAA, etc.) or team/player names unless you own the rights
- BANNED performance keywords: "best", "#1", "top", "leading", "popular", "award-winning" (unless verifiable)
- BANNED promotional/price keywords: "free", "ad-free", "no ads", "ad free", "discount", "sale", "deal", "offer", "cashback", "limited time"
- BANNED call-to-actions in description: "download now", "install now", "play now", "try now"
- BANNED store ranking claims: "App of the Year", "Editor's Choice", "million downloads"
- Do NOT include unattributed or anonymous user testimonials
- Do NOT use excessive keyword repetition (keyword stuffing will get the listing penalized)
- Do NOT use emojis, emoticons, or excessive special characters
- Do NOT use ALL CAPS for emphasis (headings are OK)
- Follow ${app.platform === 'ios' ? 'Apple App Store Review Guidelines' : 'Google Play Developer Policy on Store Listing and Promotion'} strictly

QUALITY:
- First 3 lines are critical — they appear before "Read More"
- Naturally weave tracked keywords throughout (aim for 3-5% keyword density)
- Use short paragraphs, feature bullets with clear benefits, and social proof
- Write for HUMANS first, algorithms second
${app.platform === 'ios' ? `
iOS-SPECIFIC STRATEGY:
- Apple does NOT index the description for search — so focus on CONVERSION and LLM DISCOVERABILITY, not keyword stuffing
- The promotional text (170 chars) IS updateable without a new app version — make it timely, seasonal, or event-driven
- Lead the promotional text with your strongest hook: a new feature, a seasonal angle, or a compelling stat
- In the full description, write entity-rich sentences that AI assistants (ChatGPT, Siri, etc.) can quote when recommending apps
- Structure the description so each paragraph covers one clear feature/benefit — LLMs excerpt by paragraph` : ''}

Return a JSON object: {"shortDescription": "${app.platform === 'ios' ? 'promotional text, max 170 chars' : 'short description, max 80 chars'}", "fullDescription": "full description, max 4000 chars", "keywordsUsed": ["keywords", "naturally", "included"]}
Only return the JSON object, no other text.`
        break

      case 'optimize-keywords-field':
        systemPrompt = 'You are an expert ASO analyst specializing in the iOS keyword field. You ALWAYS generate fresh, unique keyword combinations. Return ONLY a JSON object.'
        prompt = `Generate an optimized iOS keyword field for this app.

${appContext}

${buildGoalDirective(goal, 'keywords', app.platform)}
${buildAppleComplianceDirective(app.platform as string)}
CHARACTER LIMIT (STRICT — Apple enforced):
- EXACTLY 100 characters or fewer. Count every character including commas. This is a HARD limit.
- Comma-separated, NO spaces after commas

STORE POLICY COMPLIANCE (MANDATORY — violations cause rejection/warning):
- NEVER include trademarked competitor app names or brand names
- NEVER include third-party sports league names (NBA, NFL, NHL, MLB, FIFA, NCAA, UFC, WWE, etc.) or team/player names — Apple WILL reject for Guideline 4.1(a) Copycats
- Do NOT include the app's own name (Apple indexes it automatically)
- Do NOT include category names (Apple indexes them automatically)
- BANNED keywords: "app", "free", "ad-free", "no ads", "new", "best", "#1", "top", "popular", "discount", "sale", "deal"
- Do NOT use common stop words (wasted characters)
- Use GENERIC sport/activity terms instead of league names: "basketball", "football", "soccer", "hockey" NOT "nba", "nfl", "fifa", "nhl"

OPTIMIZATION:
- Use singular forms only (Apple matches plurals automatically)
- Do NOT duplicate any word already in the app title or subtitle — Apple combines words across title, subtitle, and keywords field automatically
- Prioritize high-volume, low-competition terms

COMPOUND MATCHING STRATEGY (THIS IS THE KEY TO iOS KEYWORD OPTIMIZATION):
Apple's algorithm creates compound phrases by combining adjacent keywords separated by commas.
Example: "score,live,basketball,stat,tracker" matches searches for "live score", "basketball score", "live basketball", "stat tracker", etc.
- Place keywords that form natural 2-3 word search phrases ADJACENT to each other
- Think about what users actually type in App Store search and reverse-engineer the word order
- A single well-ordered keyword list can match 20-40+ search phrases through compounding
- Put your highest-priority compound pairs next to each other
- Test adjacency: for each comma-separated pair, ask "would someone search for these two words together?"

COVERAGE:
- Include common misspellings and alternate spellings if space allows (e.g., "color" and "colour")
- Include both abbreviated and full forms if relevant (e.g., "stats" alongside longer terms)
- Cover related concepts users might search for (synonyms, adjacent features)
- Every character is precious — fill as close to 100 as possible without going over

Return a JSON object: {"keywordField": "comma,separated,keywords,no,spaces", "charCount": N, "reasoning": "keyword strategy explanation"}
Only return the JSON object, no other text.`
        break

      case 'strategy':
        systemPrompt = 'You are a senior ASO strategist. You create quarterly ASO roadmaps. Return ONLY a JSON object.'
        prompt = `Create a quarterly ASO strategy for this app.

${appContext}

Generate a 90-day roadmap with:
- 3-4 strategic goals
- Weekly milestones
- Specific actions for each week
- Expected outcomes
- 5 "Do" best practices (things the team should always do)
- 5 "Don't" anti-patterns (things the team should avoid)

Return a JSON object:
{
  "quarter": "Q2 2026",
  "goals": [{"goal": "...", "metric": "...", "target": "..."}],
  "weeks": [{"week": 1, "focus": "...", "actions": ["action1", "action2"], "expectedOutcome": "..."}],
  "dos": ["best practice 1", "best practice 2", "best practice 3", "best practice 4", "best practice 5"],
  "donts": ["anti-pattern 1", "anti-pattern 2", "anti-pattern 3", "anti-pattern 4", "anti-pattern 5"],
  "summary": "2-3 sentence executive summary"
}
Only return the JSON object, no other text.`
        break

      case 'recommendations':
        systemPrompt = 'You are an ASO expert generating actionable recommendations. Return ONLY a JSON array.'
        prompt = `Generate 8 prioritized ASO recommendations for this app.

${appContext}

Each recommendation should be specific and actionable.

Return a JSON array: [{"title": "...", "description": "detailed action", "impact": "high" | "medium" | "low", "effort": "high" | "medium" | "low", "category": "keywords" | "metadata" | "creatives" | "ratings" | "competitors" | "llm", "lift": "estimated lift (e.g. +890/mo, +11pt SoV, −0.3 ★ risk, −$18K/mo waste)", "owner": "suggested owner (e.g. @engineer, @growth, AUTO, @support)"}]
Only return the JSON array, no other text.`
        break

      case 'localization':
        systemPrompt = 'You are an ASO localization expert. You generate culturally-aware translations and market analysis. Return ONLY a JSON object. CRITICAL: generate data specific to the given app — do NOT reuse example values.'
        prompt = `Generate a complete localization analysis for this SPECIFIC app covering ${locale || 'Spanish (ES), French (FR), German (DE), Japanese (JA), Portuguese (BR)'}.

${appContext}

IMPORTANT: All translations, scores, and metrics must be tailored to THIS app's category and brand. Do NOT copy example values.

Generate ALL of the following:

1. LOCALIZATIONS — For each locale generate:
- Localized title (max 30 chars) — must be a real translation of THIS app's value proposition
- Localized subtitle (max 30 chars)
- Localized short description (170 chars)
- 5 locale-specific keywords relevant to THIS app

2. MARKET OPPORTUNITIES — Analyze 10-15 global markets. For each market:
- Market name and locale code
- Market size for this app's category: "very large" | "large" | "medium" | "small"
- Category fit score (0-100): realistic for THIS app's category in that market
- Competition level: "high" | "medium" | "low"
- Overall opportunity score (0-100)
- Brief recommendation (1 sentence)
- Localization status: "localized" | "ai-draft" | "not-localized" | "english-ok"
- Completeness percentage (0-100): how complete the localization is

3. MARKET PERFORMANCE — For the locales with localizations above, estimate:
- Estimated monthly downloads (realistic for THIS app's scale)
- Keywords covered, conversion rate, rating, and status

Return JSON matching this structure (field names must match exactly, but ALL values must be unique to this app):
{
  "localizations": [{"locale": "<code>", "title": "<translated>", "subtitle": "<translated>", "shortDescription": "<translated>", "keywords": ["<k1>","<k2>","<k3>","<k4>","<k5>"]}],
  "marketOpportunities": [{"market": "<country>", "locale": "<code>", "marketSize": "<size>", "categoryFit": <0-100>, "competition": "<level>", "opportunityScore": <0-100>, "recommendation": "<sentence>", "status": "<localized|ai-draft|not-localized|english-ok>", "completeness": <0-100>}],
  "marketPerformance": [{"locale": "<code>", "market": "<country>", "estimatedDownloads": "<number>", "keywordsCovered": <number>, "conversionRate": "<pct>", "rating": <number or null>, "status": "<status>"}]
}
Only return the JSON object, no other text.`
        break

      case 'intent-map':
        systemPrompt = 'You are a search intent analysis expert. You cluster keywords by user intent. Return ONLY a JSON object.'
        prompt = `Cluster these keywords by user intent for ASO optimization.

${appContext}

Classify each keyword into intent categories:
- navigational: user looking for a specific app
- informational: user researching/comparing
- transactional: user ready to download

Also suggest new keywords for underrepresented intents.

For each cluster, include a coveragePct (0-100) indicating how well the app currently covers that intent.
For keywords, return objects with state information: {"kw": "keyword", "state": "ours" | "win" | "miss"} where:
- "ours" = app currently ranks for this keyword
- "win" = app could easily win this keyword
- "miss" = app is missing this keyword opportunity

Return a JSON object:
{
  "clusters": [
    {"intent": "navigational", "keywords": [{"kw": "app name", "state": "ours"}, {"kw": "competitor name", "state": "miss"}], "optimization": "tip for this intent", "coveragePct": 75},
    {"intent": "informational", "keywords": [{"kw": "how to X", "state": "win"}], "optimization": "tip", "coveragePct": 40},
    {"intent": "transactional", "keywords": [{"kw": "best X app", "state": "ours"}], "optimization": "tip", "coveragePct": 60}
  ],
  "gaps": [{"intent": "...", "suggestedKeywords": ["kw1", "kw2"], "reasoning": "..."}]
}
Only return the JSON object, no other text.`
        break

      case 'llm-track':
        systemPrompt = 'You simulate how different LLM-powered assistants would respond to user queries about mobile apps. For each surface (ChatGPT, Claude, Gemini, Perplexity, Copilot), determine if the app would be mentioned/recommended. Return ONLY a JSON object.'
        prompt = `A user asks the following question to 5 different assistants: "${userPrompt || 'best app in this category'}"

The app being tracked:
${appContext}

For each of these 5 surfaces, simulate whether the app would likely be recommended:
1. ChatGPT
2. Claude
3. Gemini
4. Perplexity
5. Copilot

Also generate:
- 3-5 citation sources that LLMs would reference when recommending apps in this category (review sites, comparison articles, etc.)
- A prompt matrix: 4-6 common user prompts tested across all 5 engines, with a mention score (0-100) per engine and an overall winner
- 5-8 actionable optimization tips specifically for improving LLM discoverability. Each tip should have a title, a detailed explanation, and a priority level. Focus on concrete actions the developer can take to get recommended more by AI assistants (e.g., metadata structuring, entity naming, schema markup, content patterns, review optimization, external presence).

Return a JSON object:
{
  "results": [{"surface": "ChatGPT", "mentioned": true/false, "response": "brief simulated excerpt", "position": "1st" | "2nd" | "3rd" | "not listed"}],
  "citations": [{"source": "site or article name", "quote": "relevant excerpt that mentions this app", "meta": "publication date or context"}],
  "promptMatrix": [{"prompt": "user query", "engines": {"ChatGPT": 85, "Claude": 72, "Gemini": 60, "Perplexity": 90, "Copilot": 45}, "winner": "engine name"}],
  "optimizationTips": [{"title": "short action title", "detail": "specific explanation of what to do and why it helps LLM visibility", "priority": "high" | "medium" | "low"}]
}
Only return the JSON object, no other text.`
        break

      case 'competitors': {
        // Real data pipeline: discover competitors via keyword overlap + fetch real store data
        const { searchApps: searchAppsForComp, searchAppsIOS: searchAppsIOSForComp, fetchSimilarApps: fetchSimilarForComp, fetchSimilarAppsIOS: fetchSimilarIOSForComp, fetchGooglePlayData: fetchGPlayComp, fetchAppleAppData: fetchAppleComp } = await import('@/lib/store-scraper')
        const searchComp = app.platform === 'ios' ? searchAppsIOSForComp : searchAppsForComp
        const similarComp = app.platform === 'ios' ? fetchSimilarIOSForComp : fetchSimilarForComp

        // 1. Get existing tracked keywords for this app
        const { data: trackedKw } = await supabaseAdmin
          .from('keywords')
          .select('id, text, country')
          .eq('app_id', appId)
          .eq('is_tracked', true)
          .limit(30)

        // 2. Search for top-ranking keywords to find real competitors
        const compFrequency = new Map<string, { title: string; score: number; count: number; keywords: string[] }>()
        const kwToSearch = (trackedKw ?? []).slice(0, 5)

        for (const kw of kwToSearch) {
          try {
            const results = await searchComp(kw.text, 20)
            for (const r of results) {
              if (r.appId === app.store_id) continue
              const existing = compFrequency.get(r.appId)
              if (existing) { existing.count++; existing.keywords.push(kw.text) }
              else compFrequency.set(r.appId, { title: r.title, score: r.score, count: 1, keywords: [kw.text] })
            }
          } catch { /* skip failed searches */ }
          await new Promise(r => setTimeout(r, 300))
        }

        // Fallback to similar apps if no keyword-based competitors
        if (compFrequency.size === 0) {
          try {
            const similar = await similarComp(app.store_id as string)
            for (const s of similar.slice(0, 10)) {
              compFrequency.set(s.appId, { title: s.title, score: s.score, count: 1, keywords: [] })
            }
          } catch { /* ignore */ }
        }

        // 3. Fetch REAL store data for each discovered competitor
        const topComps = Array.from(compFrequency.entries())
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10)

        const competitorsResult = await Promise.all(topComps.map(async ([compAppId, data]) => {
          let storeInfo: { score?: number | null; installs?: string | null; developer?: string | null; version?: string | null } = {}
          try {
            const fetched = (app.platform === 'android')
              ? await fetchGPlayComp(compAppId)
              : await fetchAppleComp(compAppId)
            if (fetched) storeInfo = fetched
          } catch { /* use basic data */ }

          return {
            name: data.title,
            storeId: compAppId,
            reason: `Appears in ${data.count} keyword search${data.count > 1 ? 'es' : ''}`,
            overlapCount: data.count,
            rating: storeInfo.score ?? data.score ?? null,
            installs: storeInfo.installs ?? null,
            developer: storeInfo.developer ?? null,
            strengths: [`Rating: ${(storeInfo.score ?? data.score ?? 0).toFixed(1)}`] as string[],
            weaknesses: [] as string[],
            threatLevel: data.count >= 3 ? 'high' as const : data.count >= 2 ? 'medium' as const : 'low' as const,
            // Real data only — no fabricated fields
            monthlyDownloads: storeInfo.installs ?? null,
            estimatedMRR: null,
            activeAds: null,
            llmSov: null,
            trend30d: null,
            keywordGaps: [] as string[],
            sharedKeywords: data.keywords ?? [],
          }
        }))

        // 4. Use AI for strengths/weaknesses + keyword gap analysis
        // Limit to top 5 competitors for AI call to avoid token truncation
        const topCompsForAI = competitorsResult.slice(0, 5)
        const trackedKwNames = (trackedKw ?? []).map(k => k.text).join(', ')
        let alerts: Array<Record<string, unknown>> = []
        try {
          const compAnalysis = await loggedChatCompletion({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You analyze competitor strengths, weaknesses, and keyword gaps for ASO. Return ONLY valid JSON, no markdown.' },
              { role: 'user', content: `App: ${app.name} (${app.platform})\nApp\'s tracked keywords: ${trackedKwNames || 'none yet'}\nCompetitors found via keyword overlap:\n${topCompsForAI.map(c => `- "${c.name}"`).join('\n')}\n\nFor each competitor:\n1. Suggest 2-3 strengths and 2-3 weaknesses\n2. Suggest 3-5 keyword gaps (keywords they likely rank for that "${app.name}" does NOT currently track). These should be real, relevant search terms for the ${app.category || 'app'} category.\n\nAlso generate 2-3 competitive alerts.\n\nIMPORTANT: Use the EXACT competitor names as provided above as JSON keys.\n\nReturn JSON: {"analysis": {"Exact Competitor Name": {"strengths": [...], "weaknesses": [...], "keywordGaps": ["keyword1", "keyword2", ...]}}, "alerts": [{"type": "opportunity" | "competitor-move" | "keyword-shift", "competitor": "Name", "timeAgo": "recent", "text": "...", "action": "..."}]}` },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }, { action: 'competitors' })
          const rawComp = compAnalysis.choices[0]?.message?.content ?? '{}'
          const cleanedComp = rawComp.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
          // Try direct parse first, then extract first { ... } block
          let parsed: { analysis?: Record<string, { strengths?: string[]; weaknesses?: string[]; keywordGaps?: string[] }>; alerts?: Array<Record<string, unknown>> }
          try {
            parsed = JSON.parse(cleanedComp)
          } catch {
            const jsonMatch = cleanedComp.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error('No JSON object found in AI response')
            parsed = JSON.parse(jsonMatch[0])
          }
          if (parsed.analysis) {
            const aiKeys = Object.keys(parsed.analysis)
            for (const comp of competitorsResult) {
              // Try exact match first, then case-insensitive, then partial/fuzzy
              let ai = parsed.analysis[comp.name]
              if (!ai) {
                const compLower = comp.name.toLowerCase().trim()
                const fuzzyKey = aiKeys.find(k => {
                  const kLower = k.toLowerCase().trim()
                  return kLower === compLower
                    || kLower.includes(compLower)
                    || compLower.includes(kLower)
                    || kLower.split(/[\s\-–:]+/).slice(0, 2).join(' ') === compLower.split(/[\s\-–:]+/).slice(0, 2).join(' ')
                })
                if (fuzzyKey) ai = parsed.analysis[fuzzyKey]
              }
              if (ai) {
                if (ai.strengths) comp.strengths = ai.strengths
                if (ai.weaknesses) comp.weaknesses = ai.weaknesses
                if (ai.keywordGaps?.length) comp.keywordGaps = ai.keywordGaps
              }
            }
          }
          if (parsed.alerts) alerts = parsed.alerts
        } catch (err) {
          console.error('[competitors] AI enrichment failed:', err instanceof Error ? err.message : err)
        }

        const finalResult = { competitors: competitorsResult, alerts }
        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id as string,
            analysis_type: 'competitors',
            result: finalResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )
        return NextResponse.json({ result: finalResult })
      }

      case 'reviews-analysis': {
        // Real data pipeline: feed real reviews from DB to AI for theme extraction
        // AI is legitimate here — analyzing real review text for themes

        // 1. Fetch real reviews from DB
        const { data: dbReviews } = await supabaseAdmin
          .from('reviews')
          .select('user_name, text, score, date, version')
          .eq('app_id', appId)
          .order('date', { ascending: false })
          .limit(100)

        let realReviews = (dbReviews ?? []).map(r => ({
          user_name: r.user_name,
          text: r.text,
          score: r.score,
          date: r.date,
          version: r.version,
        }))

        // If no reviews in DB, fetch live from the store
        if (realReviews.length === 0) {
          try {
            if (app.platform === 'android') {
              const { fetchGooglePlayReviews } = await import('@/lib/store-scraper')
              const liveReviews = await fetchGooglePlayReviews(app.store_id, 100)
              realReviews = liveReviews.map(r => ({
                user_name: r.userName,
                text: r.text,
                score: r.score,
                date: r.date,
                version: r.version ?? null,
              }))
            } else {
              const { fetchAppleAppReviews } = await import('@/lib/store-scraper')
              const liveReviews = await fetchAppleAppReviews(app.store_id, 'us')
              realReviews = liveReviews.map(r => ({
                user_name: r.userName,
                text: r.text,
                score: r.score,
                date: r.date,
                version: r.version ?? null,
              }))
            }
          } catch { /* no reviews available */ }
        }

        if (realReviews.length === 0) {
          // No reviews anywhere — return empty state
          const emptyResult = {
            sentimentSummary: 'No reviews found for this app. The app may not have any user reviews yet.',
            praiseThemes: [],
            complaintThemes: [],
            replyTemplates: [],
            keywordsFromReviews: [],
            realReviewCount: 0,
            averageRating: null,
          }
          await supabaseAdmin.from('analysis_results').upsert(
            {
              app_id: appId,
              organization_id: app.organization_id,
              analysis_type: 'reviews-analysis',
              result: emptyResult,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'app_id,analysis_type' },
          )
          return NextResponse.json({ result: emptyResult })
        }

        // 2. Compute real stats
        const realAvgRating = realReviews.reduce((s, r) => s + (r.score ?? 0), 0) / realReviews.length

        // 3. Feed REAL review text to AI for theme extraction (legitimate AI use)
        const reviewSample = realReviews.slice(0, 50).map(r =>
          `[${r.score}★] ${r.text?.slice(0, 200) ?? '(no text)'}`
        ).join('\n')

        const reviewCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a review analyst. Analyze the REAL user reviews provided and extract themes. Do NOT invent reviews or examples — use only what is in the provided review text. Return ONLY a JSON object.',
            },
            {
              role: 'user',
              content: `Analyze these ${realReviews.length} real user reviews and extract themes.

REAL REVIEWS:
${reviewSample}

Extract:
1. Common praise themes (things users love)
2. Common complaint themes (things users dislike)
3. Suggested reply templates for negative reviews
4. Keywords frequently mentioned

IMPORTANT: Use ONLY quotes and themes from the actual reviews above. Do not invent examples.

Return a JSON object:
{
  "sentimentSummary": "brief assessment based on the real reviews",
  "praiseThemes": [{"theme": "...", "frequency": "high|medium|low", "example": "actual quote from reviews"}],
  "complaintThemes": [{"theme": "...", "frequency": "high|medium|low", "example": "actual quote from reviews", "suggestedFix": "..."}],
  "replyTemplates": [{"scenario": "...", "reply": "..."}],
  "keywordsFromReviews": ["keyword1", "keyword2"]
}
Only return the JSON object, no other text.`,
            },
          ],
          temperature: 0.5,
          max_tokens: 3000,
        }, { action: 'reviews-analysis' })

        let reviewAnalysis: Record<string, unknown> = {}
        try {
          const raw = reviewCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          reviewAnalysis = JSON.parse(cleaned)
        } catch { /* parse failed */ }

        // 4. Merge real stats + AI theme analysis
        const reviewResult = {
          sentimentSummary: reviewAnalysis.sentimentSummary ?? `Based on ${realReviews.length} real reviews. Average rating: ${realAvgRating.toFixed(1)}/5.`,
          praiseThemes: Array.isArray(reviewAnalysis.praiseThemes) ? reviewAnalysis.praiseThemes : [],
          complaintThemes: Array.isArray(reviewAnalysis.complaintThemes) ? reviewAnalysis.complaintThemes : [],
          replyTemplates: Array.isArray(reviewAnalysis.replyTemplates) ? reviewAnalysis.replyTemplates : [],
          keywordsFromReviews: Array.isArray(reviewAnalysis.keywordsFromReviews) ? reviewAnalysis.keywordsFromReviews : [],
          realReviewCount: realReviews.length,
          averageRating: realAvgRating,
          realData: true,
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'reviews-analysis',
            result: reviewResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: reviewResult })
      }

      case 'store-intel': {
        // Real data pipeline: leaderboard + algorithm factors from real store data
        // AI only for qualitative analysis (trends, tips, opportunities)
        const { fetchCategoryTopApps, fetchAppleCategoryTopApps, fetchGooglePlayData, fetchAppleAppData } = await import('@/lib/store-scraper')

        // 1. Fetch existing real store-intel data (preserve real metrics)
        const { data: existingIntel } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'store-intel')
          .maybeSingle()

        const existing = (existingIntel?.result ?? {}) as Record<string, unknown>

        // 2. Get real store data (from snapshot metadata, or fetch live)
        const snapshotMeta = snapshot?.metadata as Record<string, unknown> | null
        let realStoreData: Record<string, unknown> | null = (snapshotMeta && typeof snapshotMeta === 'object' && 'score' in snapshotMeta)
          ? snapshotMeta
          : null
        if (!realStoreData) {
          try {
            const fetched = app.platform === 'android'
              ? await fetchGooglePlayData(app.store_id)
              : await fetchAppleAppData(app.store_id)
            if (fetched) realStoreData = fetched as unknown as Record<string, unknown>
          } catch { /* no data */ }
        }

        // 3. Fetch REAL category leaderboard from store
        const genreId = String(realStoreData?.genreId ?? realStoreData?.genre ?? app.category ?? '')
        let categoryLeaderboard: Array<{ rank: number; appId: string; name: string; developer: string; rating: number; iconUrl: string }> = (existing.categoryLeaderboard as typeof categoryLeaderboard) ?? []
        if (genreId) {
          try {
            const realLeaderboard = app.platform === 'android'
              ? await fetchCategoryTopApps(String(genreId), 12)
              : await fetchAppleCategoryTopApps(String(genreId), 12)
            if (realLeaderboard.length > 0) {
              categoryLeaderboard = realLeaderboard
            }
          } catch { /* keep existing */ }
        }

        const algorithmFactors = []
        if (realStoreData) {
          const score = Number(realStoreData.score ?? 0)
          const ratings = Number(realStoreData.ratings ?? 0)
          const installs = String(realStoreData.installs ?? '0')
          const updated = Number(realStoreData.updated ?? Date.now())
          const daysSinceUpdate = Math.round((Date.now() - updated) / (1000 * 60 * 60 * 24))
          const descLen = String(realStoreData.description ?? '').length
          const screenshotCount = Array.isArray(realStoreData.screenshots) ? realStoreData.screenshots.length : 0

          algorithmFactors.push(
            { factor: 'Rating', weight: 'high', currentStatus: `${score.toFixed(1)}/5 (${ratings.toLocaleString()} ratings)` },
            { factor: 'Install Volume', weight: 'high', currentStatus: installs },
            { factor: 'Ratings Count', weight: 'high', currentStatus: `${ratings.toLocaleString()} total ratings` },
            { factor: 'Update Recency', weight: 'medium', currentStatus: daysSinceUpdate <= 30 ? `${daysSinceUpdate}d ago (good)` : `${daysSinceUpdate}d ago (stale)` },
            { factor: 'Description Length', weight: 'medium', currentStatus: descLen > 2000 ? `${descLen} chars (good)` : descLen > 500 ? `${descLen} chars (ok)` : `${descLen} chars (short)` },
            { factor: 'Screenshots', weight: 'medium', currentStatus: screenshotCount >= 8 ? `${screenshotCount} (good)` : screenshotCount >= 4 ? `${screenshotCount} (ok)` : `${screenshotCount} (needs more)` },
          )

          // Add keyword ranking factor from DB
          const { data: trackedKws } = await supabaseAdmin
            .from('keywords')
            .select('id')
            .eq('app_id', appId)
            .eq('is_tracked', true)

          const kwCount = trackedKws?.length ?? 0
          if (kwCount > 0) {
            const today = new Date().toISOString().split('T')[0]
            const { count: rankedCount } = await supabaseAdmin
              .from('keyword_ranks_daily')
              .select('*', { count: 'exact', head: true })
              .in('keyword_id', trackedKws!.map(k => k.id))
              .eq('date', today)
              .not('rank', 'is', null)

            algorithmFactors.push({
              factor: 'Keyword Relevance',
              weight: 'high',
              currentStatus: `${rankedCount ?? 0}/${kwCount} keywords ranking`,
            })
          }
        } else {
          // Use existing factors if we can't fetch fresh data
          algorithmFactors.push(...(Array.isArray(existing.algorithmFactors) ? existing.algorithmFactors as Array<{factor: string; weight: string; currentStatus: string}> : []))
        }

        // 4. Competitive density from real competitor count
        const { count: compCount } = await supabaseAdmin
          .from('analysis_results')
          .select('*', { count: 'exact', head: true })
          .eq('app_id', appId)
          .eq('analysis_type', 'competitors')

        const competitiveDensity = (compCount ?? 0) > 8 ? 'high' : (compCount ?? 0) > 4 ? 'medium' : 'low'

        // 5. Ask AI ONLY for qualitative analysis (trends, tips, keyword opportunities)
        systemPrompt = 'You are an app store intelligence analyst. You provide qualitative trend analysis and strategic tips. Return ONLY a JSON object.'
        prompt = `Provide qualitative market analysis for this app. Do NOT fabricate any metrics, rankings, or numbers.

${appContext}

Generate ONLY the following qualitative analysis:

1. CATEGORY TRENDS: 3-5 emerging trends in this app's category with seasonal patterns and actionable advice.
2. MARKET TRENDS: 3-5 broader industry trends affecting this app's vertical. For each, indicate direction (up/down/stable) and relevance.
3. FEATURING TIPS: 3-5 specific, actionable tips for getting featured by ${app.platform === 'ios' ? 'Apple' : 'Google'}.
4. KEYWORD OPPORTUNITIES: 8-12 keyword phrases this app should target but currently doesn't. For each, explain WHY it's an opportunity.

Return a JSON object:
{
  "categoryTrends": [{"trend": "...", "impact": "high|medium|low", "action": "..."}],
  "marketTrends": [{"trend": "...", "detail": "explanation", "direction": "up|down|stable", "relevance": "high|medium|low"}],
  "featuringTips": ["tip1", "tip2"],
  "keywordOpportunities": [{"keyword": "...", "description": "why this is an opportunity", "volume": "high|medium|low", "competition": "high|medium|low", "score": 85}]
}
Only return the JSON object, no other text.`

        // We'll post-process after AI call to merge real + AI data
        const storeIntelCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }, { action: 'store-intel' })

        let aiAnalysis: Record<string, unknown> = {}
        try {
          const raw = storeIntelCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          aiAnalysis = JSON.parse(cleaned)
        } catch { /* AI parse failed, use empty */ }

        // 6. Build real summary from actual data
        const genre = realStoreData?.genre ?? snapshot?.metadata?.genre ?? 'Unknown'
        const ratingVal = Number(realStoreData?.score ?? 0)
        const ratingsVal = Number(realStoreData?.ratings ?? 0)
        const installsVal = String(realStoreData?.installs ?? '0')
        const appInLeaderboard = categoryLeaderboard.findIndex(
          (a) => String(a.appId) === app.store_id || String(a.name).toLowerCase() === app.name.toLowerCase()
        )
        const summary = `${genre} category. ${ratingVal.toFixed(1)}/5 rating across ${ratingsVal.toLocaleString()} reviews. ${installsVal} installs.${appInLeaderboard >= 0 ? ` Ranked #${appInLeaderboard + 1} in category.` : ''}`

        // 7. Merge: real data + AI qualitative analysis
        const mergedResult = {
          // REAL DATA
          algorithmFactors,
          categoryLeaderboard,
          competitiveDensity,
          summary,
          realData: true,
          // AI QUALITATIVE ANALYSIS
          categoryTrends: Array.isArray(aiAnalysis.categoryTrends) ? aiAnalysis.categoryTrends : [],
          marketTrends: Array.isArray(aiAnalysis.marketTrends) ? aiAnalysis.marketTrends : [],
          featuringTips: Array.isArray(aiAnalysis.featuringTips) ? aiAnalysis.featuringTips : [],
          keywordOpportunities: Array.isArray(aiAnalysis.keywordOpportunities) ? aiAnalysis.keywordOpportunities : [],
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'store-intel',
            result: mergedResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: mergedResult })
      }

      case 'visibility': {
        // Real data pipeline: compute visibility from actual keyword ranks
        const { calculateVisibilityScore, getPositionWeight, computeVisibilityTrend: visComputeTrend, scoresToSvgPath: visScoresToSvg } = await import('@/lib/aso-scoring')
        const { estimateKeywordMetrics: visEstimate } = await import('@/lib/keyword-enrichment')
        const { fetchCategoryTopApps: visFetchCatApps, fetchGooglePlayData: visFetchGP, fetchAppleAppData: visFetchApple } = await import('@/lib/store-scraper')

        // 1. Fetch tracked keywords + latest ranks (REAL)
        const { data: visKwRows } = await supabaseAdmin
          .from('keywords')
          .select('id, text, country')
          .eq('app_id', appId)
          .eq('is_tracked', true)

        const visKwList = visKwRows ?? []
        const visKwIds = visKwList.map(k => k.id)

        let visRankMap = new Map<string, number>()
        if (visKwIds.length > 0) {
          const { data: visRanks } = await supabaseAdmin
            .from('keyword_ranks_daily')
            .select('keyword_id, rank, date')
            .in('keyword_id', visKwIds)
            .order('date', { ascending: false })
          if (visRanks) {
            for (const r of visRanks) {
              if (!visRankMap.has(r.keyword_id)) {
                visRankMap.set(r.keyword_id, r.rank)
              }
            }
          }
        }

        // Build rankings array for score calculation
        const visRankings = visKwList.map(k => {
          const rank = visRankMap.get(k.id) ?? null
          const metrics = visEstimate(k.text)
          return { keyword: k.text, position: rank, volume: metrics.volume, searchVolume: metrics.volume }
        })

        // 2. Compute visibility score (REAL)
        const visScore = calculateVisibilityScore(visRankings.map(r => ({ position: r.position, searchVolume: r.searchVolume })))

        // 3. Ranking distribution (REAL)
        const visTop3 = visRankings.filter(r => r.position != null && r.position <= 3).length
        const visTop10 = visRankings.filter(r => r.position != null && r.position <= 10).length
        const visTop25 = visRankings.filter(r => r.position != null && r.position <= 25).length
        const visTop50 = visRankings.filter(r => r.position != null && r.position <= 50).length
        const visNotRanked = visRankings.filter(r => r.position == null).length

        // 4. Keyword breakdown with contribution % (REAL)
        const visBreakdown = visRankings.map(r => {
          const weight = r.position ? getPositionWeight(r.position) : 0
          return { keyword: r.keyword, position: r.position, volume: r.volume, weight, contribution: weight * r.volume }
        })
        const visTotalContrib = visBreakdown.reduce((s, k) => s + k.contribution, 0)
        const visKeywordBreakdown = visBreakdown
          .map(k => ({
            keyword: k.keyword,
            position: k.position,
            volume: k.volume,
            weight: k.weight,
            contributionPct: visTotalContrib > 0 ? Math.round((k.contribution / visTotalContrib) * 1000) / 10 : 0,
          }))
          .sort((a, b) => b.contributionPct - a.contributionPct)

        // 5. Platform scores (REAL)
        const visIsAndroid = app.platform === 'android'
        const visIsIos = app.platform === 'ios'
        // For single-platform, set that platform's score; for dual set both
        const visPlatformScore = visScore
        const visIosScore = (visIsIos || (!visIsAndroid && !visIsIos)) ? visPlatformScore : null
        const visAndroidScore = (visIsAndroid || (!visIsAndroid && !visIsIos)) ? visPlatformScore : null

        // 6. Category rank (REAL — fetch top apps in genre)
        let visCategoryRank: string | null = null
        let visCategoryPercentile: string | null = null
        try {
          const visGenreId = String(snapshot?.metadata && typeof snapshot.metadata === 'object' && 'genreId' in (snapshot.metadata as Record<string, unknown>) ? (snapshot.metadata as Record<string, unknown>).genreId : app.category ?? '')
          if (visGenreId) {
            const topApps = visIsAndroid
              ? await visFetchCatApps(visGenreId, 50, 'us')
              : [] // Apple category API is limited
            const catPos = topApps.findIndex(a => a.appId === app.store_id)
            if (catPos >= 0) {
              visCategoryRank = `#${catPos + 1} in ${app.category ?? 'category'}`
              visCategoryPercentile = `top ${Math.round(((catPos + 1) / Math.max(topApps.length, 1)) * 100)}%`
            } else if (topApps.length > 0) {
              visCategoryRank = `Not in top ${topApps.length}`
              visCategoryPercentile = null
            }
          }
        } catch { /* skip category rank */ }

        // 7. Share of search (REAL — estimated from keyword data)
        const visTotalVol = visRankings.reduce((s, r) => s + r.volume, 0)
        const visCapturedVol = visRankings
          .filter(r => r.position != null && r.position <= 10)
          .reduce((s, r) => s + r.volume * (r.position ? getPositionWeight(r.position) : 0), 0)
        const visSharePct = visTotalVol > 0 ? ((visCapturedVol / visTotalVol) * 100).toFixed(1) : '0.0'

        // 8. Surfaces (REAL)
        const visSurfaces = [
          {
            surface: visIsAndroid ? 'Play Store Search' : visIsIos ? 'App Store Search' : 'Store Search',
            score: visScore,
            status: (visScore > 60 ? 'strong' : visScore > 30 ? 'moderate' : 'weak') as 'strong' | 'moderate' | 'weak',
            recommendation: `${visRankings.filter(r => r.position != null).length} of ${visRankings.length} keywords ranked`,
          },
        ]

        // 9. AI for recommendations only
        let visRecommendations: Array<{ severity: string; effort: string; text: string; action: string }> = []
        let visSummary = `Visibility score ${visScore}/100 based on ${visRankings.length} tracked keywords. ${visTop10} in top 10, ${visTop3} in top 3.`
        try {
          const visAiCompletion = await loggedChatCompletion({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are an ASO visibility expert. Provide actionable recommendations. Return ONLY a JSON object.' },
              { role: 'user', content: `App: ${app.name} (${app.platform})\nVisibility Score: ${visScore}/100\nKeywords tracked: ${visRankings.length}\nTop 3: ${visTop3}, Top 10: ${visTop10}, Top 25: ${visTop25}, Not ranked: ${visNotRanked}\nTotal search volume: ${visTotalVol}\nShare of search: ${visSharePct}%\nCategory: ${app.category ?? 'unknown'}\n\nProvide:\n1. 3-5 actionable recommendations with severity ("easy-win", "medium", "watch"), effort estimate, and CTA\n2. 2-3 quick wins\n3. A 2-3 sentence summary\n\nReturn JSON: {"recommendations": [{"severity": "easy-win"|"medium"|"watch", "effort": "~N min", "text": "...", "action": "..."}], "quickWins": [{"action": "...", "expectedImpact": "..."}], "summary": "..."}` },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }, { action: 'visibility' })
          const visAiRaw = visAiCompletion.choices[0]?.message?.content ?? '{}'
          const visAiCleaned = visAiRaw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
          const visAiParsed = JSON.parse(visAiCleaned) as Record<string, unknown>
          if (Array.isArray(visAiParsed.recommendations)) visRecommendations = visAiParsed.recommendations as typeof visRecommendations
          if (typeof visAiParsed.summary === 'string') visSummary = visAiParsed.summary
        } catch { /* keep default summary */ }

        // 10. Compute visibility trend (REAL — from historical keyword rank data)
        const visTrend = await visComputeTrend(supabaseAdmin, appId, 13)
        const visTrendData = visTrend.dates.length > 0 ? {
          dates: visTrend.dates,
          scores: visTrend.scores,
          ...(visIsAndroid
            ? { androidPath: visScoresToSvg(visTrend.scores) }
            : { iosPath: visScoresToSvg(visTrend.scores) }),
        } : undefined

        // 11. Build final result
        const visResult = {
          overallScore: visScore,
          iosScore: visIosScore,
          androidScore: visAndroidScore,
          categoryRank: visCategoryRank,
          categoryPercentile: visCategoryPercentile,
          shareOfSearch: `${visSharePct}%`,
          trendData: visTrendData,
          surfaces: visSurfaces,
          rankingDistribution: { top3: visTop3, top10: visTop10, top25: visTop25, top50: visTop50, notRanked: visNotRanked },
          keywordBreakdown: visKeywordBreakdown,
          recommendations: visRecommendations,
          quickWins: [] as Array<{ action: string; expectedImpact: string }>,
          summary: visSummary,
          refreshedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id as string,
            analysis_type: 'visibility',
            result: visResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: visResult })
      }

      case 'update-impact': {
        // Fetch ALL metadata snapshots for this app to build real version history
        const { data: allSnapshots } = await supabaseAdmin
          .from('app_metadata_snapshots')
          .select('version, title, subtitle, description, snapshot_at')
          .eq('app_id', appId)
          .order('snapshot_at', { ascending: false })

        // Deduplicate by version — keep earliest snapshot_at per version
        const versionMap = new Map<string, { version: string; date: string; title: string | null; subtitle: string | null }>()
        if (allSnapshots) {
          for (const s of allSnapshots) {
            if (!s.version) continue
            // We iterate newest-first, so keep overwriting to get the earliest date per version
            versionMap.set(s.version, {
              version: s.version,
              date: s.snapshot_at.split('T')[0],
              title: s.title,
              subtitle: s.subtitle,
            })
          }
        }
        // Sort by date descending (newest first)
        const realVersions = Array.from(versionMap.values())
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10)

        const hasRealVersions = realVersions.length > 0
        const versionContext = hasRealVersions
          ? `\nReal version history from store data:\n${realVersions.map(v => `- v${v.version} (first seen: ${v.date})${v.title ? ` — title: "${v.title}"` : ''}${v.subtitle ? ` — subtitle: "${v.subtitle}"` : ''}`).join('\n')}`
          : '\nNo version history available from store scrapes yet.'

        systemPrompt = 'You are an ASO expert who analyzes the impact of app updates on store performance. Return ONLY a JSON object.'
        prompt = `Generate a comprehensive update impact analysis and release strategy for this app.

${appContext}
Today's date: ${new Date().toISOString().split('T')[0]}
${versionContext}

Generate ALL of the following:

1. VERSION HISTORY — ${hasRealVersions
  ? `Use the REAL version data provided above. For each real version, analyze what likely changed based on the version number progression and any metadata changes. Assess the ASO impact as "positive", "negative", or "neutral" with a realistic mix. Use the REAL version numbers and REAL dates exactly as provided. Do NOT invent additional versions. Add plausible changes based on the app category and version number changes. ratingDelta and downloadDelta should be realistic estimates ("+0.1", "-0.2", "+5%", "-3%", "—").`
  : `Return an EMPTY array []. We have no real version data yet — the app store needs to be scraped over time to build history.`}

2. UPDATE FREQUENCY — Optimal update cadence recommendation based on the app's category and competition. Include specific reasoning.

3. NEXT UPDATE PLAN — 4-6 specific changes to include in the next update for maximum ASO impact. Base this on the app's current metadata, keywords, and reviews.

4. METADATA TESTS — 3-4 A/B test ideas for metadata elements. Use the app's ACTUAL current title/subtitle/description from the context above.

5. RELEASE NOTES TIPS — 4-5 specific tips for writing effective release notes for THIS app and category.

6. SUMMARY — 2-3 sentence strategy overview referencing the app's actual situation.

Return a JSON object:
{
  "versionHistory": [{"version": "use real version", "date": "use real date", "changes": ["inferred change 1", "inferred change 2"], "asoImpact": "positive|negative|neutral", "ratingDelta": "+0.1", "downloadDelta": "+5%"}],
  "updateFrequency": "recommended cadence and reasoning",
  "nextUpdatePlan": [{"change": "...", "expectedImpact": "...", "priority": "high|medium|low"}],
  "metadataTests": [{"element": "title|subtitle|description|keywords", "current": "actual current value", "suggested": "...", "hypothesis": "..."}],
  "releaseNotesTips": ["tip1", "tip2", "tip3"],
  "summary": "2-3 sentence strategy"
}
Only return the JSON object, no other text.`
        break
      }

      case 'discovery-map':
        systemPrompt = 'You are an ASO expert specializing in multi-surface app discovery analysis. Return ONLY a JSON object.'
        prompt = `Generate a discovery map showing all paths users take to find this app.

${appContext}

Map all 7 discovery surfaces:
1. App Store Search
2. Play Store Search
3. ChatGPT recommendations
4. Claude recommendations
5. Gemini recommendations
6. Perplexity recommendations
7. Copilot recommendations

Return a JSON object:
{
  "surfaces": [{"name": "...", "type": "store|llm", "estimatedTraffic": "high|medium|low", "optimizationStatus": "optimized|partial|unoptimized", "topQueries": ["query1", "query2"], "recommendation": "..."}],
  "gaps": [{"surface": "...", "issue": "...", "fix": "..."}],
  "summary": "2-3 sentence discovery assessment"
}
Only return the JSON object, no other text.`
        break

      case 'creative-lab': {
        // Real data pipeline: screenshots, icon, ASO score from actual store data
        // AI only for qualitative creative recommendations
        const { fetchGooglePlayData: clFetchGP, fetchAppleAppData: clFetchApple } = await import('@/lib/store-scraper')
        const { calculateASOScore } = await import('@/lib/aso-scoring')

        // 1. Get real store data
        const clSnapshotMeta = snapshot?.metadata as Record<string, unknown> | null
        let clStoreData: Record<string, unknown> | null = (clSnapshotMeta && typeof clSnapshotMeta === 'object' && 'score' in clSnapshotMeta)
          ? clSnapshotMeta : null
        if (!clStoreData) {
          try {
            const fetched = app.platform === 'android'
              ? await clFetchGP(app.store_id as string)
              : await clFetchApple(app.store_id as string)
            if (fetched) clStoreData = fetched as unknown as Record<string, unknown>
          } catch { /* no data */ }
        }

        // 2. Extract screenshots and icon (REAL) — preserve existing if fresh API returns empty
        let clScreenshots = Array.isArray(clStoreData?.screenshots) ? clStoreData.screenshots as string[] : []
        const clIcon = String(clStoreData?.icon ?? '')

        // Preserve previously cached screenshots if the API now returns empty
        if (clScreenshots.length === 0) {
          const { data: existingCL } = await supabaseAdmin
            .from('analysis_results')
            .select('result')
            .eq('app_id', appId)
            .eq('analysis_type', 'creative-lab')
            .maybeSingle()
          const existingScreenshots = (existingCL?.result as Record<string, unknown>)?.screenshots
          if (Array.isArray(existingScreenshots) && existingScreenshots.length > 0) {
            clScreenshots = existingScreenshots as string[]
          }
        }

        // 3. Calculate ASO creative score (REAL)
        const clASOInput = {
          title: String(snapshot?.title ?? clStoreData?.title ?? app.name ?? ''),
          subtitle: (snapshot?.subtitle ?? clStoreData?.summary ?? null) as string | null,
          description: String(snapshot?.description ?? clStoreData?.description ?? ''),
          keywordsField: null as string | null,
          rating: Number(clStoreData?.score ?? 0),
          ratingsCount: Number(clStoreData?.ratings ?? 0),
          hasScreenshots: clScreenshots.length > 0,
          screenshotCount: clScreenshots.length,
        }
        const clScore = calculateASOScore(clASOInput)

        // 4. Fetch competitor screenshots (top 3 competitors)
        const { data: clCompAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'competitors')
          .maybeSingle()
        const clCompRaw = Array.isArray(clCompAnalysis?.result) ? clCompAnalysis.result :
          (clCompAnalysis?.result as Record<string, unknown>)?.competitors ?? []
        const clCompList = Array.isArray(clCompRaw) ? clCompRaw as Array<Record<string, unknown>> : []

        const clCompCreatives: Array<{ name: string; iconUrl: string; screenshots: string[]; rating: number | null }> = []
        for (const comp of clCompList.slice(0, 3)) {
          if (comp.storeId) {
            try {
              const compData = app.platform === 'android'
                ? await clFetchGP(String(comp.storeId))
                : await clFetchApple(String(comp.storeId))
              if (compData) {
                const cd = compData as unknown as Record<string, unknown>
                clCompCreatives.push({
                  name: String(comp.name ?? cd.title ?? ''),
                  iconUrl: String(cd.icon ?? ''),
                  screenshots: Array.isArray(cd.screenshots) ? (cd.screenshots as string[]).slice(0, 4) : [],
                  rating: cd.score ? Number(cd.score) : null,
                })
              }
            } catch { /* skip */ }
          }
        }

        // 5. AI for creative recommendations only
        systemPrompt = 'You are a mobile app creative strategist. Analyze screenshots and visual assets to provide improvement recommendations. Do NOT fabricate A/B test results, conversion rates, or impressions. Return ONLY a JSON object.'
        prompt = `Provide creative asset recommendations for this app. Do NOT invent A/B test data or conversion metrics.

${appContext}

Current screenshots: ${clScreenshots.length} screenshots in store listing.
Current icon: ${clIcon ? 'Has icon' : 'No icon data'}
Creative ASO Score: ${clScore.overall}/100 (creatives: ${clScore.breakdown.creativesScore}/100)
Competitors analyzed: ${clCompCreatives.length} (${clCompCreatives.map(c => c.name).join(', ') || 'none'})
Competitor screenshot counts: ${clCompCreatives.map(c => `${c.name}: ${c.screenshots.length}`).join(', ') || 'none'}

Based on this REAL data, generate:
1. SCREENSHOT RECOMMENDATIONS: 3-5 specific improvements for screenshot strategy.
2. ICON RECOMMENDATIONS: 2-3 icon improvement suggestions.
3. COMPETITOR INSIGHTS: What creative patterns are competitors using? What can this app learn?

Return JSON:
{
  "screenshotRecommendations": [{"title": "...", "detail": "specific actionable advice", "priority": "high|medium|low"}],
  "iconRecommendations": [{"title": "...", "detail": "specific actionable advice"}],
  "competitorInsights": [{"insight": "what pattern was observed", "action": "what to do about it"}],
  "summary": "2-3 sentence creative strategy summary"
}
Only return the JSON object, no other text.`

        const clCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }, { action: 'creative-lab' })

        let clAI: Record<string, unknown> = {}
        try {
          const raw = clCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          clAI = JSON.parse(cleaned)
        } catch { /* empty */ }

        const clResult = {
          // REAL DATA
          screenshots: clScreenshots,
          screenshotCount: clScreenshots.length,
          iconUrl: clIcon,
          creativeScore: clScore.overall,
          scoreBreakdown: clScore.breakdown,
          competitorCreatives: clCompCreatives,
          competitorCount: clCompCreatives.length,
          realData: true,
          // AI ANALYSIS
          screenshotRecommendations: Array.isArray(clAI.screenshotRecommendations) ? clAI.screenshotRecommendations : [],
          iconRecommendations: Array.isArray(clAI.iconRecommendations) ? clAI.iconRecommendations : [],
          competitorInsights: Array.isArray(clAI.competitorInsights) ? clAI.competitorInsights : [],
          summary: String(clAI.summary ?? `${clScreenshots.length} screenshots, creative score ${clScore.overall}/100, ${clCompCreatives.length} competitors analyzed.`),
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'creative-lab',
            result: clResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: clResult })
      }

      case 'ad-intel': {
        // Real data pipeline: keywords with ranks + enrichment, competitor overlap
        // AI only for platform recommendations and campaign ideas
        const { estimateKeywordMetrics: aiEstimate } = await import('@/lib/keyword-enrichment')

        // 1. Tracked keywords with real ranks
        const { data: aiKws } = await supabaseAdmin
          .from('keywords')
          .select('id, text, country, is_tracked')
          .eq('app_id', appId)
          .limit(50)

        const aiKwList = aiKws ?? []
        let aiKwRanks: Array<{ keyword: string; rank: number | null; volume: number; difficulty: number; cpc: number; intent: string }> = []

        if (aiKwList.length > 0) {
          const kwIds = aiKwList.map(k => k.id)
          const { data: ranks } = await supabaseAdmin
            .from('keyword_ranks_daily')
            .select('keyword_id, rank, date')
            .in('keyword_id', kwIds)
            .order('date', { ascending: false })

          const rankMap = new Map<string, number>()
          if (ranks) {
            for (const r of ranks) {
              if (!rankMap.has(r.keyword_id)) rankMap.set(r.keyword_id, r.rank)
            }
          }

          aiKwRanks = aiKwList.map(k => {
            const metrics = aiEstimate(k.text)
            return {
              keyword: k.text,
              rank: rankMap.get(k.id) ?? null,
              volume: metrics.volume,
              difficulty: metrics.difficulty,
              cpc: metrics.cpc,
              intent: metrics.intent,
            }
          })
        }

        // 2. Competitor data from existing analysis
        const { data: aiCompAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'competitors')
          .maybeSingle()
        const aiCompRaw = Array.isArray(aiCompAnalysis?.result) ? aiCompAnalysis.result :
          (aiCompAnalysis?.result as Record<string, unknown>)?.competitors ?? []
        const aiCompList = Array.isArray(aiCompRaw) ? aiCompRaw as Array<Record<string, unknown>> : []

        // 3. Find keyword overlap with competitors
        // First try stored sharedKeywords from competitor analysis
        let aiOverlap: Array<{ competitor: string; sharedKeywords: string[] }> = []
        for (const comp of aiCompList.slice(0, 5)) {
          const shared = Array.isArray(comp.sharedKeywords) ? comp.sharedKeywords as string[] : []
          if (shared.length > 0) {
            aiOverlap.push({ competitor: String(comp.name ?? ''), sharedKeywords: shared })
          }
        }

        // If no stored overlap, compute it by searching top keywords and checking for competitors
        if (aiOverlap.length === 0 && aiCompList.length > 0 && aiKwList.length > 0) {
          const { searchApps: searchForOverlapAndroid, searchAppsIOS: searchForOverlapIOS } = await import('@/lib/store-scraper')
          const searchForOverlap = app.platform === 'ios' ? searchForOverlapIOS : searchForOverlapAndroid
          const compStoreIds = new Map(aiCompList.slice(0, 10).map(c => [String(c.storeId ?? ''), String(c.name ?? '')]))
          const compOverlapMap = new Map<string, string[]>()

          for (const kw of aiKwList.slice(0, 5)) {
            try {
              const results = await searchForOverlap(kw.text, 20)
              for (const r of results) {
                const compName = compStoreIds.get(r.appId)
                if (compName) {
                  const existing = compOverlapMap.get(compName) ?? []
                  existing.push(kw.text)
                  compOverlapMap.set(compName, existing)
                }
              }
            } catch { /* skip */ }
            await new Promise(r => setTimeout(r, 300))
          }

          for (const [name, kws] of compOverlapMap) {
            aiOverlap.push({ competitor: name, sharedKeywords: kws })
          }
        }

        // 4. Average difficulty
        const aiAvgDiff = aiKwRanks.length > 0
          ? Math.round(aiKwRanks.reduce((s, k) => s + k.difficulty, 0) / aiKwRanks.length)
          : 0

        // 5. AI for platform recommendations + campaign ideas only
        systemPrompt = 'You are a mobile app paid acquisition strategist. Recommend ad platforms and campaign strategies. Do NOT fabricate ad spend, CTR, or competitor ad creative data. Return ONLY a JSON object.'
        prompt = `Provide paid acquisition strategy for this app. Do NOT invent spend or CTR numbers.

${appContext}

Real keyword data (${aiKwRanks.length} tracked):
${aiKwRanks.slice(0, 15).map(k => `- ${k.keyword}: rank ${k.rank ?? 'unranked'}, volume ~${k.volume}, difficulty ${k.difficulty}, CPC ~$${k.cpc}`).join('\n')}

Competitors: ${aiCompList.slice(0, 5).map(c => c.name).join(', ') || 'none tracked'}

Based on this REAL data, generate:
1. PLATFORMS: 4-5 ad platform recommendations with fit level and reasoning.
2. CAMPAIGN IDEAS: 3-5 specific campaign strategies based on the keyword data and competitor landscape.
3. For each tracked keyword, suggest a bid strategy (aggressive/moderate/conservative) based on its difficulty and volume.

Return JSON:
{
  "platforms": [{"platform": "Apple Search Ads|Google UAC|Meta|TikTok|Pinterest", "fit": "high|medium|low", "reasoning": "..."}],
  "campaignIdeas": [{"platform": "...", "type": "...", "targeting": "...", "creative": "brief creative direction"}],
  "keywordStrategies": {"keyword_text": "aggressive|moderate|conservative"},
  "summary": "2-3 sentence paid strategy"
}
Only return the JSON object, no other text.`

        const aiAdCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }, { action: 'ad-intel' })

        let aiAdAI: Record<string, unknown> = {}
        try {
          const raw = aiAdCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          aiAdAI = JSON.parse(cleaned)
        } catch { /* empty */ }

        // 6. Merge keyword strategies from AI with real keyword data
        const kwStrategies = (aiAdAI.keywordStrategies ?? {}) as Record<string, string>
        const aiSearchKeywords = aiKwRanks.map(k => ({
          keyword: k.keyword,
          rank: k.rank,
          volume: k.volume,
          difficulty: k.difficulty,
          cpc: k.cpc,
          intent: k.intent,
          bidStrategy: kwStrategies[k.keyword] ?? (k.difficulty > 60 ? 'conservative' : k.difficulty > 30 ? 'moderate' : 'aggressive'),
        }))

        const aiAdResult = {
          // REAL DATA
          searchAdKeywords: aiSearchKeywords,
          keywordsTracked: aiKwList.length,
          avgDifficulty: aiAvgDiff,
          competitorOverlap: aiOverlap,
          realData: true,
          // AI ANALYSIS
          platforms: Array.isArray(aiAdAI.platforms) ? aiAdAI.platforms : [],
          campaignIdeas: Array.isArray(aiAdAI.campaignIdeas) ? aiAdAI.campaignIdeas : [],
          topPlatformFit: Array.isArray(aiAdAI.platforms) && aiAdAI.platforms.length > 0
            ? String((aiAdAI.platforms[0] as Record<string, unknown>).platform ?? 'Unknown')
            : 'Unknown',
          summary: String(aiAdAI.summary ?? `${aiKwList.length} keywords tracked with avg difficulty ${aiAvgDiff}. ${aiOverlap.length} competitors share keywords.`),
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'ad-intel',
            result: aiAdResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: aiAdResult })
      }

      case 'market-intel': {
        // Real data pipeline: category leaderboard, competitors, keywords from DB
        // AI only for qualitative trends and whitespace analysis
        const { fetchCategoryTopApps: miLeaderboard, fetchAppleCategoryTopApps: miAppleLeaderboard, fetchGooglePlayData: miFetchGP, fetchAppleAppData: miFetchApple } = await import('@/lib/store-scraper')

        // 1. Get real store data
        const miSnapshotMeta = snapshot?.metadata as Record<string, unknown> | null
        let miStoreData: Record<string, unknown> | null = (miSnapshotMeta && typeof miSnapshotMeta === 'object' && 'score' in miSnapshotMeta)
          ? miSnapshotMeta : null
        if (!miStoreData) {
          try {
            const fetched = app.platform === 'android'
              ? await miFetchGP(app.store_id as string)
              : await miFetchApple(app.store_id as string)
            if (fetched) miStoreData = fetched as unknown as Record<string, unknown>
          } catch { /* no data */ }
        }

        // 2. Category leaderboard (REAL)
        const miGenreId = String(miStoreData?.genreId ?? miStoreData?.genre ?? app.category ?? '')
        let miLeaderboardData: Array<{ rank: number; appId: string; name: string; developer: string; rating: number; iconUrl: string }> = []
        if (miGenreId) {
          try {
            miLeaderboardData = app.platform === 'android'
              ? await miLeaderboard(miGenreId, 12)
              : await miAppleLeaderboard(miGenreId, 12)
          } catch { /* empty */ }
        }

        // 3. Competitor count (REAL) from existing competitor analysis
        const { data: miCompAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'competitors')
          .maybeSingle()
        const miCompetitors = Array.isArray(miCompAnalysis?.result) ? miCompAnalysis.result :
          (miCompAnalysis?.result as Record<string, unknown>)?.competitors ?? []
        const miCompList = Array.isArray(miCompetitors) ? miCompetitors as Array<Record<string, unknown>> : []

        // 4. Keyword count (REAL)
        const { count: miKwCount } = await supabaseAdmin
          .from('keywords')
          .select('*', { count: 'exact', head: true })
          .eq('app_id', appId)

        // 5. Category rating average from leaderboard
        const miCategoryAvgRating = miLeaderboardData.length > 0
          ? miLeaderboardData.reduce((s, a) => s + a.rating, 0) / miLeaderboardData.length
          : 0

        // 6. App position in category
        const miAppPos = miLeaderboardData.findIndex(
          a => String(a.appId) === app.store_id || String(a.name).toLowerCase() === (app.name as string).toLowerCase()
        )

        // 7. AI for qualitative trends + whitespace only
        systemPrompt = 'You are an app market intelligence analyst. Analyze trends and identify whitespace. Do NOT fabricate download counts, revenue, ARPU, or CAC numbers. Return ONLY a JSON object.'
        prompt = `Provide qualitative market intelligence for this app. Do NOT invent any metrics or financial numbers.

${appContext}

Competitor landscape: ${miCompList.length} competitors tracked. Top competitors: ${miCompList.slice(0, 5).map(c => c.name).join(', ') || 'none tracked yet'}
Category leaderboard: ${miLeaderboardData.length} apps in leaderboard. Top: ${miLeaderboardData.slice(0, 3).map(a => a.name).join(', ') || 'unknown'}

Generate ONLY qualitative analysis:
1. TRENDS: 4-6 market/industry trends affecting this category. For each, indicate direction (up/down/stable) and relevance (high/medium/low).
2. WHITESPACE: 3-5 gaps or underserved niches in this market with specific recommendations.
3. MARKET OVERVIEW: saturation level (high/medium/low), growth direction, key insight.

Return a JSON object:
{
  "marketOverview": {"growth": "qualitative growth assessment", "saturation": "high|medium|low", "insight": "key market insight"},
  "trends": [{"trend": "...", "detail": "explanation", "direction": "up|down|stable", "relevance": "high|medium|low"}],
  "whitespace": [{"gap": "...", "audience": "who is underserved", "recommendation": "actionable advice"}],
  "summary": "2-3 sentence market assessment based on real competitor data"
}
Only return the JSON object, no other text.`

        const miCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }, { action: 'market-intel' })

        let miAI: Record<string, unknown> = {}
        try {
          const raw = miCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          miAI = JSON.parse(cleaned)
        } catch { /* empty */ }

        // 8. Build summary from real data
        const miRating = Number(miStoreData?.score ?? 0)
        const miInstalls = String(miStoreData?.installs ?? '0')
        const miGenre = String(miStoreData?.genre ?? app.category ?? 'Unknown')
        const miSummary = `${miGenre} category. ${miLeaderboardData.length} apps in leaderboard. ${miCompList.length} competitors tracked. ${miKwCount ?? 0} keywords tracked.${miAppPos >= 0 ? ` Your app ranked #${miAppPos + 1} in category.` : ''} ${miRating > 0 ? `${miRating.toFixed(1)}/5 rating, ${miInstalls} installs.` : ''}`

        const miResult = {
          // REAL DATA
          categoryLeaderboard: miLeaderboardData,
          competitors: miCompList.slice(0, 10).map(c => ({
            name: String(c.name ?? ''),
            threatLevel: String(c.threatLevel ?? 'medium'),
            reason: String(c.reason ?? ''),
            rating: c.rating ?? null,
            installs: c.installs ?? null,
            storeId: c.storeId ?? null,
          })),
          competitorsTracked: miCompList.length,
          keywordsTracked: miKwCount ?? 0,
          categoryPosition: miAppPos >= 0 ? miAppPos + 1 : null,
          categoryRatingAvg: miCategoryAvgRating > 0 ? Number(miCategoryAvgRating.toFixed(1)) : null,
          realData: true,
          summary: miSummary,
          // AI QUALITATIVE ANALYSIS (no fabricated numbers)
          marketOverview: (miAI.marketOverview as Record<string, unknown>) ?? { growth: 'Unknown', saturation: 'medium', insight: '' },
          trends: Array.isArray(miAI.trends) ? miAI.trends : [],
          whitespace: Array.isArray(miAI.whitespace) ? miAI.whitespace : [],
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'market-intel',
            result: miResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: miResult })
      }

      case 'growth-insights': {
        // Real data pipeline: install trends, rating growth, keyword visibility
        // AI only for growth recommendations
        const { getPositionWeight } = await import('@/lib/aso-scoring')
        const { estimateKeywordMetrics: giEstimate } = await import('@/lib/keyword-enrichment')

        const giIsAndroid = app.platform === 'android'

        // 1. Install trend (REAL, Android only) — 90 days, weekly buckets
        let giInstallTrend: { dates: string[]; values: number[] } | undefined
        if (giIsAndroid) {
          const { data: giInstallHistory } = await supabaseAdmin
            .from('app_installs_estimate')
            .select('date, downloads_low, downloads_high')
            .eq('app_id', appId)
            .order('date', { ascending: true })
            .limit(90)

          if (giInstallHistory && giInstallHistory.length > 0) {
            const weeklyData: { date: string; avg: number }[] = []
            for (let w = 12; w >= 0; w--) {
              const weekEnd = new Date()
              weekEnd.setDate(weekEnd.getDate() - w * 7)
              const weekStart = new Date(weekEnd)
              weekStart.setDate(weekStart.getDate() - 7)
              const weekEntries = giInstallHistory.filter(e => {
                const d = new Date(e.date)
                return d >= weekStart && d <= weekEnd
              })
              if (weekEntries.length > 0) {
                const avg = weekEntries.reduce((s, e) => s + ((e.downloads_low + e.downloads_high) / 2), 0) / weekEntries.length
                weeklyData.push({
                  date: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  avg: Math.round(avg),
                })
              }
            }
            if (weeklyData.length > 0) {
              giInstallTrend = { dates: weeklyData.map(w => w.date), values: weeklyData.map(w => w.avg) }
            }
          }
        }

        // 2. Get live store data as fallback (same pattern as overview)
        const { fetchGooglePlayData: giFetchGP, fetchAppleAppData: giFetchApple } = await import('@/lib/store-scraper')
        const giSnapshotMeta = snapshot?.metadata as Record<string, unknown> | null
        let giStoreData: Record<string, unknown> | null = (giSnapshotMeta && typeof giSnapshotMeta === 'object' && 'score' in giSnapshotMeta)
          ? giSnapshotMeta
          : null
        if (!giStoreData) {
          try {
            const fetched = app.platform === 'android'
              ? await giFetchGP(app.store_id)
              : await giFetchApple(app.store_id)
            if (fetched) giStoreData = fetched as unknown as Record<string, unknown>
          } catch { /* no data */ }
        }

        const giCurrentInstalls = String(giStoreData?.installs ?? '')
        const giCurrentRating = Number(giStoreData?.score ?? 0)
        const giCurrentRatings = Number(giStoreData?.ratings ?? 0)

        // Ensure install trend has at least 2 data points for the chart
        if (giIsAndroid) {
          if (!giInstallTrend && giCurrentInstalls) {
            // No install estimate rows — create a 2-point flat trend from live installs
            const parsed = parseInt(giCurrentInstalls.replace(/[^0-9]/g, ''), 10)
            if (parsed > 0) {
              const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const weekAgo = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              giInstallTrend = { dates: [weekAgo, today], values: [parsed, parsed] }
            }
          } else if (giInstallTrend && giInstallTrend.dates.length < 2) {
            // Only 1 data point — pad with a second point so the chart renders
            const lastVal = giInstallTrend.values[0] ?? 0
            const weekBefore = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            giInstallTrend.dates.unshift(weekBefore)
            giInstallTrend.values.unshift(lastVal)
          }
        }

        // 3. Rating/reviews growth (REAL) — from metadata snapshots
        const { data: giSnapshots } = await supabaseAdmin
          .from('app_metadata_snapshots')
          .select('snapshot_at, metadata')
          .eq('app_id', appId)
          .order('snapshot_at', { ascending: true })
          .limit(90)

        let giRatingTrend: { dates: string[]; scores: number[]; counts: number[] } | undefined
        if (giSnapshots && giSnapshots.length > 0) {
          const validSnaps = giSnapshots
            .filter(s => s.metadata && typeof s.metadata === 'object')
            .map(s => {
              const m = s.metadata as Record<string, unknown>
              return {
                date: new Date(s.snapshot_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: Number(m.score ?? 0),
                ratings: Number(m.ratings ?? 0),
              }
            })
            .filter(s => s.score > 0)

          if (validSnaps.length >= 2) {
            giRatingTrend = {
              dates: validSnaps.map(s => s.date),
              scores: validSnaps.map(s => s.score),
              counts: validSnaps.map(s => s.ratings),
            }
          }
        }

        // If no historical snapshots but we have live data, create a 2-point trend
        // using the current data as both start and end (flat line — shows current state)
        if (!giRatingTrend && giCurrentRating > 0) {
          const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const weekAgo = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          giRatingTrend = {
            dates: [weekAgo, today],
            scores: [giCurrentRating, giCurrentRating],
            counts: [giCurrentRatings, giCurrentRatings],
          }
        }

        // 4. Visibility score (REAL)
        const { data: giVisAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'visibility')
          .maybeSingle()
        const giVisScore = Number((giVisAnalysis?.result as Record<string, unknown>)?.overallScore ?? 0)

        // 5. Keyword visibility (REAL) — ranks + volume = estimated traffic
        const { data: giKws } = await supabaseAdmin
          .from('keywords')
          .select('id, text, country')
          .eq('app_id', appId)
          .limit(50)

        const giKwList = giKws ?? []
        let giKeywordVis: Array<{ keyword: string; rank: number | null; volume: number; estimatedTraffic: number; trend: 'up' | 'down' | 'stable' }> = []
        let giTotalTraffic = 0

        if (giKwList.length > 0) {
          const kwIds = giKwList.map(k => k.id)

          // Latest ranks
          const { data: giLatestRanks } = await supabaseAdmin
            .from('keyword_ranks_daily')
            .select('keyword_id, rank, date')
            .in('keyword_id', kwIds)
            .order('date', { ascending: false })

          const latestRankMap = new Map<string, number>()
          const prevRankMap = new Map<string, number>()
          if (giLatestRanks) {
            for (const r of giLatestRanks) {
              if (!latestRankMap.has(r.keyword_id)) {
                latestRankMap.set(r.keyword_id, r.rank)
              } else if (!prevRankMap.has(r.keyword_id)) {
                prevRankMap.set(r.keyword_id, r.rank)
              }
            }
          }

          giKeywordVis = giKwList.map(k => {
            const metrics = giEstimate(k.text)
            const rank = latestRankMap.get(k.id) ?? null
            const prevRank = prevRankMap.get(k.id) ?? null
            const weight = rank ? getPositionWeight(rank) : 0
            const estimatedTraffic = Math.round(metrics.volume * weight)
            giTotalTraffic += estimatedTraffic

            let trend: 'up' | 'down' | 'stable' = 'stable'
            if (rank && prevRank) {
              if (rank < prevRank) trend = 'up'
              else if (rank > prevRank) trend = 'down'
            }

            return { keyword: k.text, rank, volume: metrics.volume, estimatedTraffic, trend }
          })

          // Sort by estimated traffic descending
          giKeywordVis.sort((a, b) => b.estimatedTraffic - a.estimatedTraffic)
        }

        // 6. AI for growth recommendations only
        const giRankingCount = giKeywordVis.filter(k => k.rank !== null).length
        systemPrompt = 'You are an app growth strategist. Based on real data, provide growth recommendations. Do NOT fabricate channel attribution, CAC, or revenue numbers. Return ONLY a JSON object.'
        prompt = `Provide growth recommendations for this app based on its real data. Do NOT invent attribution channels or spend data.

${appContext}

Real growth metrics:
- Platform: ${giIsAndroid ? 'Android' : 'iOS'}
- Current installs: ${giCurrentInstalls || 'unknown'}
- Current rating: ${giCurrentRating || 'unknown'}/5 (${giCurrentRatings.toLocaleString()} ratings)
- Visibility score: ${giVisScore || 'unknown'}/100
- Keywords ranking: ${giRankingCount}/${giKwList.length}
- Estimated organic traffic: ${giTotalTraffic.toLocaleString()} monthly from keywords
- Install trend: ${giInstallTrend ? `${giInstallTrend.values.length} weeks of data` : 'no data'}
- Rating trend: ${giRatingTrend ? `${giRatingTrend.dates.length} snapshots` : 'no data'}

Based on this REAL data, suggest 4-6 specific growth recommendations.

Return JSON:
{
  "growthRecommendations": [{"title": "short action title", "detail": "specific actionable advice based on the data above", "impact": "high|medium|low"}],
  "summary": "2-3 sentence growth assessment based on real data"
}
Only return the JSON object, no other text.`

        const giCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }, { action: 'growth-insights' })

        let giAI: Record<string, unknown> = {}
        try {
          const raw = giCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          giAI = JSON.parse(cleaned)
        } catch { /* empty */ }

        const giResult = {
          // REAL DATA
          installTrend: giInstallTrend,
          ratingTrend: giRatingTrend,
          currentInstalls: giCurrentInstalls || undefined,
          currentRating: giCurrentRating || undefined,
          currentRatings: giCurrentRatings || undefined,
          visibilityScore: giVisScore || undefined,
          keywordVisibility: giKeywordVis.slice(0, 20),
          totalEstimatedTraffic: giTotalTraffic,
          isAndroid: giIsAndroid,
          realData: true,
          // AI ANALYSIS
          growthRecommendations: Array.isArray(giAI.growthRecommendations) ? giAI.growthRecommendations : [],
          summary: String(giAI.summary ?? `${giIsAndroid ? giCurrentInstalls + ' installs. ' : ''}${giCurrentRating > 0 ? giCurrentRating.toFixed(1) + '/5 rating. ' : ''}${giRankingCount}/${giKwList.length} keywords ranking. ${giTotalTraffic.toLocaleString()} estimated monthly organic traffic.`),
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'growth-insights',
            result: giResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: giResult })
      }

      case 'reviews-plus':
        systemPrompt = 'You are an advanced review intelligence expert specializing in predictive rating-risk forecasting and auto-routing reviews to engineering tools. Return ONLY a JSON object. CRITICAL: generate data specific to the given app — do NOT reuse example values.'
        prompt = `Generate predictive review intelligence for this SPECIFIC app. All clusters, reviews, and metrics must be tailored to THIS app's features and likely user complaints.

${appContext}

IMPORTANT: All data must be specific to THIS app. Do NOT copy example values.

Generate:
1. Hero metrics: newThisWeek (realistic weekly review count), autoReplied (80-90% of new), autoTicketed (3-5% of new), ratingRisk (e.g. "−0.3 ★" for declining, "+0.2 ★" for improving)

2. 4-6 trending clusters that reflect real user feedback themes for THIS app. Each cluster has:
   - cluster: short name of the feedback theme (3-5 words max)
   - trend: percentage change with arrow (e.g. "↑ 340%", "↓ 90%"). Use ↑ for rising issues, ↓ for resolved
   - risk: numeric rating impact (e.g. -0.3 for negative, +0.2 for positive). Negative = bad for rating
   - status: one of "ESCALATED" (urgent), "TICKETED" (assigned), "SHIPPED" (fixed), "BUILDING" (in progress), "MONITORING" (watching)

3. 3-4 auto-routed ticket items — simulated real user reviews that were auto-routed to engineering. Each has:
   - source: "GOOGLE PLAY" or "APP STORE"
   - stars: 1-5 star rating (negative reviews = 1-3 stars, positive = 4-5)
   - theme: short uppercase theme tag matching a cluster (e.g. "SYNC LAG", "ONBOARDING")
   - themeNegative: true if this is a complaint, false if praise
   - text: a realistic 1-sentence user review quote for THIS app
   - routing: routing destination (e.g. "Linear LIN-2417 · @engineer · spike +340%", "Jira PROJ-123 · #channel-slack")

Return JSON matching this structure (field names must match exactly, but ALL values must be unique to this app):
{
  "newThisWeek": "<number>",
  "autoReplied": "<number>",
  "autoTicketed": "<number>",
  "ratingRisk": "<±X.X ★>",
  "clusters": [{"cluster": "<theme>", "trend": "<↑/↓ pct%>", "risk": <number>, "status": "<STATUS>"}],
  "tickets": [{"source": "<store>", "stars": <1-5>, "theme": "<TAG>", "themeNegative": <bool>, "text": "<review quote>", "routing": "<destination>"}],
  "summary": "2-3 sentence review intelligence summary about THIS app"
}
Only return the JSON object, no other text.`
        break

      case 'keyword-audiences': {
        // Real data pipeline: tracked keywords with ranks + enrichment
        // AI clusters keywords into audience personas
        const { estimateKeywordMetrics: kaEstimate } = await import('@/lib/keyword-enrichment')

        // 1. Tracked keywords with real ranks
        const { data: kaKws } = await supabaseAdmin
          .from('keywords')
          .select('id, text, country')
          .eq('app_id', appId)
          .limit(50)

        const kaKwList = kaKws ?? []
        let kaEnriched: Array<{ keyword: string; rank: number | null; volume: number; difficulty: number; intent: string }> = []

        if (kaKwList.length > 0) {
          const kwIds = kaKwList.map(k => k.id)
          const { data: kaRanks } = await supabaseAdmin
            .from('keyword_ranks_daily')
            .select('keyword_id, rank, date')
            .in('keyword_id', kwIds)
            .order('date', { ascending: false })

          const rankMap = new Map<string, number>()
          if (kaRanks) {
            for (const r of kaRanks) {
              if (!rankMap.has(r.keyword_id)) rankMap.set(r.keyword_id, r.rank)
            }
          }

          kaEnriched = kaKwList.map(k => {
            const metrics = kaEstimate(k.text)
            return {
              keyword: k.text,
              rank: rankMap.get(k.id) ?? null,
              volume: metrics.volume,
              difficulty: metrics.difficulty,
              intent: metrics.intent,
            }
          })
        }

        // 2. Existing competitor keywords for context
        const { data: kaCompAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'competitors')
          .maybeSingle()
        const kaCompRaw = Array.isArray(kaCompAnalysis?.result) ? kaCompAnalysis.result :
          (kaCompAnalysis?.result as Record<string, unknown>)?.competitors ?? []
        const kaCompList = Array.isArray(kaCompRaw) ? kaCompRaw as Array<Record<string, unknown>> : []

        // 3. AI clustering into audience personas
        systemPrompt = 'You are a keyword audience strategist. Cluster keywords into audience personas based on search intent and user type. Return ONLY a JSON object.'
        prompt = `Cluster these tracked keywords into 4-6 audience personas for this app. Each persona represents a distinct user type who would search using these keywords.

${appContext}

Real keyword data (${kaEnriched.length} tracked):
${kaEnriched.map(k => `- "${k.keyword}" rank:${k.rank ?? 'unranked'} vol:${k.volume} diff:${k.difficulty} intent:${k.intent}`).join('\n')}

Competitors: ${kaCompList.slice(0, 5).map(c => c.name).join(', ') || 'none tracked'}

For each audience persona:
1. Give it a clear name (e.g. "Power Users", "Budget Seekers", "First-Time Users", "Feature Comparers")
2. Brief description of who this audience is
3. Assign relevant keywords from the list above. Tag each as:
   - "ours" if rank <= 20 (we're ranking well)
   - "win" if rank 21-100 (easy improvement opportunity)
   - "miss" if not ranking (we're missing this)
4. Coverage percentage: what % of assigned keywords we rank for
5. Messaging focus: suggest a title and subtitle optimized for this audience

Also identify 3-5 keywords that don't fit any audience — these are gaps.

Return JSON:
{
  "audiences": [
    {
      "name": "persona name",
      "description": "who this audience is",
      "keywords": [{"keyword": "text", "state": "ours|win|miss", "rank": N|null, "volume": N}],
      "coveragePct": 0-100,
      "messagingFocus": {"title": "optimized title", "subtitle": "optimized subtitle"}
    }
  ],
  "uncoveredKeywords": [{"keyword": "text", "volume": N, "difficulty": N}],
  "audienceInsights": [{"insight": "pattern observed", "action": "what to do"}],
  "summary": "2-3 sentence audience strategy"
}
Only return the JSON object, no other text.`

        const kaCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }, { action: 'keyword-audiences' })

        let kaAI: Record<string, unknown> = {}
        try {
          const raw = kaCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          kaAI = JSON.parse(cleaned)
        } catch { /* empty */ }

        // Calculate real coverage from AI audience assignments
        const kaAudiences = Array.isArray(kaAI.audiences) ? kaAI.audiences as Array<Record<string, unknown>> : []
        const kaTotalKws = kaEnriched.length
        const kaAvgCoverage = kaAudiences.length > 0
          ? Math.round(kaAudiences.reduce((s, a) => s + Number(a.coveragePct ?? 0), 0) / kaAudiences.length)
          : 0

        const kaResult = {
          // REAL DATA + AI CLUSTERING
          audiences: kaAudiences,
          totalKeywords: kaTotalKws,
          avgCoverage: kaAvgCoverage,
          // REAL DATA
          uncoveredKeywords: Array.isArray(kaAI.uncoveredKeywords) ? kaAI.uncoveredKeywords : [],
          // AI ANALYSIS
          audienceInsights: Array.isArray(kaAI.audienceInsights) ? kaAI.audienceInsights : [],
          summary: String(kaAI.summary ?? `${kaTotalKws} keywords clustered into ${kaAudiences.length} audience segments. ${kaAvgCoverage}% average coverage.`),
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'keyword-audiences',
            result: kaResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: kaResult })
      }

      case 'agent-ready':
        systemPrompt = 'You are an AI agent discoverability expert specializing in agentic commerce readiness — auditing apps for OpenAI Apps SDK, Anthropic, and Google agent integration. Return ONLY a JSON object. CRITICAL: generate data specific to the given app — do NOT reuse example values.'
        prompt = `Audit this SPECIFIC app's readiness for AI agent commerce — when ChatGPT, Claude, or Gemini can install and onboard apps for users.

${appContext}

IMPORTANT: All checks, scores, and manifest data must be tailored to THIS app. Do NOT copy example values.

Generate:
1. overallScore (0-100): realistic readiness score for THIS app
2. categoryAvg: typical score for apps in this category (usually 30-50)
3. etaTo95: estimated days to reach 95+ score (e.g. "18 days", "6 weeks")
4. 6-8 readiness checks, each with:
   - check: requirement name (e.g. "App manifest published", "Structured capability schema", "Deep-link install URL", "Onboarding callable without UI", "OAuth agent flow", "Price / plan feed", "Support webhook for retries", "Trust / policy endpoint")
   - status: "pass" (ready), "partial" (in progress), "draft" (started), or "fail" (missing). Mix: 2-3 pass, 2-3 partial/draft, 1-2 fail
   - weight: importance score (10-20)
5. profileDescription: 1 sentence about where this app stands vs category (e.g. "Ahead of 88% of finance apps.")
6. projection: 1 sentence 30-day projection (e.g. "Ship three remaining pieces. Projected 94/100. First-mover lasts ~6 months.")
7. manifest: a simulated ai-plugin.json for THIS app with:
   - name: the app name
   - description: short app description for AI agents
   - installUrl: realistic install URL with {agent_id} placeholder
   - capabilities: 3-5 agent-callable actions for THIS app
   - plans: 1-2 pricing plans (free + paid with priceMonthly)

Return JSON matching this structure (field names must match exactly, but ALL values must be unique to this app):
{
  "overallScore": <0-100>,
  "categoryAvg": <number>,
  "etaTo95": "<timeframe>",
  "checks": [{"check": "<requirement>", "status": "<pass|partial|draft|fail>", "weight": <10-20>}],
  "profileDescription": "<1 sentence>",
  "projection": "<1 sentence>",
  "manifest": {"name": "<app name>", "description": "<short description>", "installUrl": "<url>", "capabilities": ["<action>"], "plans": [{"id": "free"}, {"id": "pro", "priceMonthly": <number>}]},
  "summary": "2-3 sentence readiness assessment about THIS app"
}
Only return the JSON object, no other text.`
        break

      case 'overview': {
        // Real data pipeline: compute overview KPIs from real DB data
        // AI only for generating strategic priority suggestions

        // 1. Fetch real keyword data
        const { data: trackedKeywords } = await supabaseAdmin
          .from('keywords')
          .select('id, text')
          .eq('app_id', appId)
          .eq('is_tracked', true)

        const kwIds = trackedKeywords?.map(k => k.id) ?? []
        const today = new Date().toISOString().split('T')[0]

        // Count keywords ranking in top 10
        let top10Keywords = 0
        if (kwIds.length > 0) {
          const { count } = await supabaseAdmin
            .from('keyword_ranks_daily')
            .select('*', { count: 'exact', head: true })
            .in('keyword_id', kwIds)
            .eq('date', today)
            .lte('rank', 10)
          top10Keywords = count ?? 0
        }

        // 2. Fetch real store metadata
        const storeRating = snapshot?.metadata?.score ?? null
        const storeRatings = snapshot?.metadata?.ratings ?? null
        const storeInstalls = snapshot?.metadata?.installs ?? null
        const genre = snapshot?.metadata?.genre ?? null

        // 3. Fetch existing ASO score
        const { data: visAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'visibility')
          .maybeSingle()
        const visScore = (visAnalysis?.result as Record<string, unknown>)?.overallScore ?? null

        // 4. Fetch existing overview (preserve priorities if they exist from sync)
        const { data: existingOvr } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'overview')
          .maybeSingle()
        const existingResult = (existingOvr?.result ?? {}) as Record<string, unknown>
        const existingPriorities = Array.isArray(existingResult.priorities) ? existingResult.priorities : []

        // 5. Fetch real install trend from app_installs_estimate
        const { data: installHistory } = await supabaseAdmin
          .from('app_installs_estimate')
          .select('date, downloads_low, downloads_high')
          .eq('app_id', appId)
          .order('date', { ascending: true })
          .limit(90)

        let installTrend = undefined
        if (installHistory && installHistory.length > 0) {
          // Aggregate to weekly buckets (13 weeks)
          const weeklyData: { date: string; avg: number }[] = []
          for (let w = 12; w >= 0; w--) {
            const weekEnd = new Date()
            weekEnd.setDate(weekEnd.getDate() - w * 7)
            const weekStart = new Date(weekEnd)
            weekStart.setDate(weekStart.getDate() - 7)
            const weekEntries = installHistory.filter(e => {
              const d = new Date(e.date)
              return d >= weekStart && d <= weekEnd
            })
            if (weekEntries.length > 0) {
              const avg = weekEntries.reduce((s, e) => s + ((e.downloads_low + e.downloads_high) / 2), 0) / weekEntries.length
              weeklyData.push({
                date: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                avg: Math.round(avg),
              })
            }
          }
          if (weeklyData.length > 0) {
            installTrend = {
              dates: weeklyData.map(w => w.date),
              values: weeklyData.map(w => w.avg),
            }
          }
        }

        // 6. Fetch LLM mention stats if available
        const { data: llmMentions } = await supabaseAdmin
          .from('llm_mentions')
          .select('mentioned')
          .eq('app_id', appId)
          .limit(50)

        const llmTotal = llmMentions?.length ?? 0
        const llmMentioned = llmMentions?.filter(m => m.mentioned).length ?? 0

        // 7. Use AI ONLY for strategic priority suggestions (not metrics)
        const ovrCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a senior ASO strategist. Based on the real app data provided, suggest 5 prioritized actions. Return ONLY a JSON object.',
            },
            {
              role: 'user',
              content: `Based on this app's real data, suggest 5 strategic priorities for this week.

${appContext}

Real metrics:
- Keywords tracked: ${kwIds.length}, ranking in top 10: ${top10Keywords}
- Store rating: ${storeRating ?? 'unknown'}, ratings count: ${storeRatings ?? 'unknown'}
- Installs: ${storeInstalls ?? 'unknown'}
- Visibility score: ${visScore ?? 'unknown'}
- LLM mentions: ${llmMentioned}/${llmTotal} prompts

Return a JSON object:
{
  "priorities": [
    {
      "action": "short title",
      "detail": "1-line description of what to do",
      "surface": "App Store" | "Play Store" | "Web & LLMs" | "Product",
      "module": "Keywords" | "Optimizer" | "Reviews" | "Creative Lab" | "LLM Tracker" | "Competitors",
      "lift": "+N",
      "liftUnit": "unit",
      "effort": "small" | "medium" | "large",
      "owner": "role"
    }
  ]
}
Only return the JSON object, no other text.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }, { action: 'overview' })

        let aiPriorities: unknown[] = []
        try {
          const raw = ovrCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const parsed = JSON.parse(cleaned) as Record<string, unknown>
          if (Array.isArray(parsed.priorities)) aiPriorities = parsed.priorities
        } catch { /* use existing */ }

        // 8. Build real summary
        const summaryParts = []
        if (app.name) summaryParts.push(app.name)
        if (storeRating) summaryParts.push(`${Number(storeRating).toFixed(1)}/5 rating`)
        if (storeRatings) summaryParts.push(`${Number(storeRatings).toLocaleString()} ratings`)
        if (storeInstalls) summaryParts.push(`${storeInstalls} installs`)
        const realSummary = summaryParts.length > 1
          ? `${summaryParts.join(' — ')}. ${kwIds.length} keywords tracked, ${top10Keywords} ranking in top 10.`
          : `${app.name} — real data overview.`

        // 9. Merge: use existing real priorities if available, else AI suggestions
        const mergedOverview = {
          priorities: existingPriorities.length > 0 ? existingPriorities : aiPriorities,
          surfaces: {
            appStore: { top10: app.platform === 'ios' ? top10Keywords : 0, categoryRank: genre ?? '—', cvr: '—' },
            playStore: { top10: app.platform === 'android' ? top10Keywords : 0, categoryRank: genre ?? '—', cvr: '—' },
            ai: { recommended: llmTotal > 0 ? `${llmMentioned} / ${llmTotal} prompts` : '—', citations: 0, referralInstalls: '—' },
          },
          installTrend,
          summary: realSummary,
          asoScore: (existingResult.asoScore as number) ?? null,
          realData: true,
          storeRating: storeRating ? Number(storeRating) : null,
          storeRatings: storeRatings ? Number(storeRatings) : null,
          storeInstalls: storeInstalls ? String(storeInstalls) : null,
          storeReviewCount: (existingResult.storeReviewCount as number) ?? null,
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'overview',
            result: mergedOverview,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: mergedOverview })
      }

      case 'conversion': {
        // --- Real data collection ---
        const { fetchGooglePlayData: fetchGPlayConv, fetchAppleAppData: fetchAppleConv } = await import('@/lib/store-scraper')
        const convStore = app.platform === 'android'
          ? await fetchGPlayConv(app.store_id as string)
          : await fetchAppleConv(app.store_id as string)

        if (!convStore) {
          return NextResponse.json({ error: 'Could not fetch store data' }, { status: 500 })
        }

        // Get tracked keywords for keyword-in-title/subtitle checks
        const { data: convKws } = await supabaseAdmin
          .from('keywords')
          .select('text')
          .eq('app_id', appId)
          .eq('is_tracked', true)
          .limit(20)
        const trackedKeywords = (convKws ?? []).map(k => k.text.toLowerCase())

        // Get competitor data from existing analysis
        const { data: convCompAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'competitors')
          .maybeSingle()
        const convCompRaw = Array.isArray(convCompAnalysis?.result) ? convCompAnalysis.result :
          (convCompAnalysis?.result as Record<string, unknown>)?.competitors ?? []
        let convCompList = Array.isArray(convCompRaw) ? convCompRaw as Array<Record<string, unknown>> : []

        // Fallback: discover competitors inline if none cached
        if (convCompList.length === 0) {
          const { searchApps: searchConv, searchAppsIOS: searchConvIOS, fetchSimilarApps: similarConv, fetchSimilarAppsIOS: similarConvIOS } = await import('@/lib/store-scraper')
          const searchFn = app.platform === 'ios' ? searchConvIOS : searchConv
          const similarFn = app.platform === 'ios' ? similarConvIOS : similarConv
          // Try keyword search first
          const kwTextsForSearch = trackedKeywords.slice(0, 3)
          const discovered = new Map<string, { name: string; storeId: string; score: number }>()
          for (const kw of kwTextsForSearch) {
            try {
              const results = await searchFn(kw, 10)
              for (const r of results) {
                if (r.appId === app.store_id) continue
                if (!discovered.has(r.appId)) discovered.set(r.appId, { name: r.title, storeId: r.appId, score: r.score })
              }
            } catch { /* skip */ }
          }
          // Fallback to similar apps
          if (discovered.size === 0) {
            try {
              const similar = await similarFn(app.store_id as string)
              for (const s of similar.slice(0, 5)) {
                discovered.set(s.appId, { name: s.title, storeId: s.appId, score: s.score })
              }
            } catch { /* skip */ }
          }
          convCompList = Array.from(discovered.values()).slice(0, 5).map(d => ({ name: d.name, storeId: d.storeId, rating: d.score }))
        }

        // Fetch real store data for top 3 competitors
        const convTopComps = convCompList.slice(0, 3)
        const convCompDetails = await Promise.all(convTopComps.map(async (comp) => {
          const compStoreId = String(comp.storeId ?? '')
          if (!compStoreId) return null
          try {
            const compStore = app.platform === 'android'
              ? await fetchGPlayConv(compStoreId)
              : await fetchAppleConv(compStoreId)
            return compStore ? {
              name: String(comp.name ?? compStore.title),
              storeId: compStoreId,
              iconUrl: compStore.icon,
              rating: compStore.score ?? 0,
              ratingsCount: compStore.ratings ?? 0,
              screenshotCount: compStore.screenshots?.length ?? 0,
            } : null
          } catch { return null }
        }))
        const validComps = convCompDetails.filter(Boolean) as Array<{ name: string; storeId: string; iconUrl: string; rating: number; ratingsCount: number; screenshotCount: number }>

        // --- Deterministic scoring ---
        const convTitle = convStore.title ?? ''
        const convSubtitle = convStore.summary ?? ''
        const convRating = convStore.score ?? 0
        const convRatingsCount = convStore.ratings ?? 0
        let convScreenshots = convStore.screenshots ?? []

        // Preserve previously cached screenshots if the API now returns empty
        if (convScreenshots.length === 0) {
          const { data: existingConv } = await supabaseAdmin
            .from('analysis_results')
            .select('result')
            .eq('app_id', appId)
            .eq('analysis_type', 'conversion')
            .maybeSingle()
          const existingScreenshots = (existingConv?.result as Record<string, unknown>)?.screenshotUrls
          if (Array.isArray(existingScreenshots) && existingScreenshots.length > 0) {
            convScreenshots = existingScreenshots as string[]
          }
        }

        const convTitleLower = convTitle.toLowerCase()
        const convSubLower = convSubtitle.toLowerCase()

        // Icon score
        let iconScore = 0
        if (convStore.icon) iconScore += 50 // has icon
        if (convStore.icon && !convStore.icon.includes('default')) iconScore += 30
        if (convRating >= 4.0) iconScore += 20 // good apps tend to have good icons
        iconScore = Math.min(100, iconScore)

        // Title score
        let titleScore = 0
        if (convTitle.length > 0) titleScore += 20
        if (convTitle.length >= 15 && convTitle.length <= 30) titleScore += 30
        else if (convTitle.length > 0 && convTitle.length < 50) titleScore += 15
        const titleKwMatches = trackedKeywords.filter(kw => convTitleLower.includes(kw)).length
        titleScore += Math.min(30, titleKwMatches * 15)
        if (convTitle.includes(':') || convTitle.includes('-') || convTitle.includes('|')) titleScore += 20 // structured title
        titleScore = Math.min(100, titleScore)

        // Subtitle score
        let subtitleScore = 0
        if (convSubtitle.length > 0) subtitleScore += 30
        if (convSubtitle.length >= 10 && convSubtitle.length <= 30) subtitleScore += 25
        else if (convSubtitle.length > 0) subtitleScore += 10
        const subKwMatches = trackedKeywords.filter(kw => convSubLower.includes(kw)).length
        subtitleScore += Math.min(25, subKwMatches * 12)
        if (convSubtitle.length > 0) subtitleScore += 20 // not wasted
        subtitleScore = Math.min(100, subtitleScore)

        // Rating score
        let ratingScore = 0
        if (convRating >= 4.5) ratingScore += 40
        else if (convRating >= 4.0) ratingScore += 25
        else if (convRating >= 3.5) ratingScore += 15
        else if (convRating > 0) ratingScore += 5
        if (convRatingsCount >= 10000) ratingScore += 40
        else if (convRatingsCount >= 1000) ratingScore += 30
        else if (convRatingsCount >= 100) ratingScore += 20
        else if (convRatingsCount >= 10) ratingScore += 10
        else ratingScore += 5
        if (convRatingsCount >= 5) ratingScore += 20 // visible social proof
        ratingScore = Math.min(100, ratingScore)

        // Screenshot score
        let screenshotScore = 0
        if (convScreenshots.length >= 8) screenshotScore += 30
        else if (convScreenshots.length >= 5) screenshotScore += 20
        else if (convScreenshots.length >= 3) screenshotScore += 10
        if (convScreenshots.length >= 3) screenshotScore += 30 // first 3 show in search
        screenshotScore += Math.min(40, convScreenshots.length * 5) // more is better
        screenshotScore = Math.min(100, screenshotScore)

        // Weighted conversion score
        const conversionScore = Math.round(
          iconScore * 0.15 +
          titleScore * 0.25 +
          subtitleScore * 0.20 +
          ratingScore * 0.25 +
          screenshotScore * 0.15
        )

        // --- AI qualitative analysis ---
        const convDeepseek = getDeepSeekClient()
        const convCompletion = await convDeepseek.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are an App Store Optimization expert specializing in conversion rate optimization. Analyze why an app might not be getting tapped/installed despite ranking well in search. Focus on the "search result card" — what users see before tapping: icon, title, subtitle, star rating, and first 3 screenshots.

Return a JSON object:
{
  "issues": [{"element": "icon"|"title"|"subtitle"|"rating"|"screenshots"|"overall", "issue": "what's wrong", "fix": "specific actionable fix", "impact": "high"|"medium"|"low"}],
  "recommendations": [{"title": "short action title", "detail": "specific explanation", "expectedLift": "estimated improvement", "effort": "quick-win"|"moderate"|"significant", "priority": "high"|"medium"|"low"}],
  "competitorAdvantages": [{"name": "competitor name", "advantage": "what they do better that drives more taps"}],
  "summary": "2-3 sentence conversion analysis"
}
Only return the JSON object.`,
            },
            {
              role: 'user',
              content: `Analyze this app's conversion potential:

YOUR APP:
- Title: "${convTitle}"
- Subtitle: "${convSubtitle}"
- Rating: ${(convRating ?? 0).toFixed(1)}/5 (${(convRatingsCount ?? 0).toLocaleString()} ratings)
- Screenshots: ${convScreenshots.length} screenshots
- Category: ${convStore.genre ?? 'Unknown'}

COMPETITORS IN SAME KEYWORDS:
${validComps.map((c, i) => `${i + 1}. "${c.name}" — ${(c.rating ?? 0).toFixed(1)}/5 (${(c.ratingsCount ?? 0).toLocaleString()} ratings), ${c.screenshotCount ?? 0} screenshots`).join('\n') || 'No competitor data available'}

The app ranks well for keywords but has very low tap-through rate from search results. What specific issues prevent users from tapping, and what should be fixed first?`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        })

        let aiIssues: Array<{ element: string; issue: string; fix: string; impact: string }> = []
        let aiRecs: Array<{ title: string; detail: string; expectedLift: string; effort: string; priority: string }> = []
        let aiCompAdvantages: Array<{ name: string; advantage: string }> = []
        let aiSummary = ''

        try {
          const raw = convCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const parsed = JSON.parse(cleaned) as Record<string, unknown>
          if (Array.isArray(parsed.issues)) aiIssues = parsed.issues as typeof aiIssues
          if (Array.isArray(parsed.recommendations)) aiRecs = parsed.recommendations as typeof aiRecs
          if (Array.isArray(parsed.competitorAdvantages)) aiCompAdvantages = parsed.competitorAdvantages as typeof aiCompAdvantages
          if (typeof parsed.summary === 'string') aiSummary = parsed.summary
        } catch { /* use defaults */ }

        // Merge AI competitor advantages into comparison
        const compComparison = validComps.map(c => {
          const aiAdv = aiCompAdvantages.find(a => a.name.toLowerCase().includes(c.name.toLowerCase().slice(0, 10)))
          return { ...c, advantage: aiAdv?.advantage ?? '' }
        })

        const conversionResult = {
          conversionScore,
          searchCardAudit: {
            iconScore,
            titleScore,
            subtitleScore,
            ratingScore,
            screenshotScore,
            issues: aiIssues.map(i => ({
              element: i.element as 'icon' | 'title' | 'subtitle' | 'rating' | 'screenshots' | 'overall',
              issue: i.issue,
              fix: i.fix,
              impact: i.impact as 'high' | 'medium' | 'low',
            })),
          },
          competitorComparison: compComparison,
          recommendations: aiRecs.map(r => ({
            title: r.title,
            detail: r.detail,
            expectedLift: r.expectedLift,
            effort: r.effort as 'quick-win' | 'moderate' | 'significant',
            priority: r.priority as 'high' | 'medium' | 'low',
          })),
          appIcon: convStore.icon,
          appTitle: convTitle,
          appSubtitle: convSubtitle,
          appRating: convRating,
          appRatingsCount: convRatingsCount,
          screenshotUrls: convScreenshots,
          summary: aiSummary || `Conversion score ${conversionScore}/100. ${convScreenshots.length} screenshots, ${(convRating ?? 0).toFixed(1)}/5 rating with ${(convRatingsCount ?? 0).toLocaleString()} ratings.`,
          realData: true,
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'conversion',
            result: conversionResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: conversionResult })
      }

      case 'feature-image-score': {
        // ── Usage limits: free=1, team=10, enterprise=50, superuser=unlimited ──
        const { createServerClient: createSSR } = await import('@supabase/ssr')
        const ssrClient = createSSR(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll() { return req.cookies.getAll() }, setAll() {} } },
        )
        const { data: { user: fisUser } } = await ssrClient.auth.getUser()

        if (!fisUser) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Check superuser status
        const { data: fisProfile } = await supabaseAdmin
          .from('profiles')
          .select('is_superuser')
          .eq('id', fisUser.id)
          .single()
        const isSuperuser = fisProfile?.is_superuser === true

        if (!isSuperuser) {
          // Get org plan tier
          const orgId = app.organization_id as string
          const { data: fisOrg } = await supabaseAdmin
            .from('organizations')
            .select('plan_tier')
            .eq('id', orgId)
            .single()
          const planTier = (fisOrg?.plan_tier ?? 'solo') as string

          const FIS_LIMITS: Record<string, number> = { solo: 1, team: 10, enterprise: 50 }
          const limit = FIS_LIMITS[planTier] ?? 1

          // Count existing feature-image-score analyses for apps in this org
          const { data: orgApps } = await supabaseAdmin
            .from('apps')
            .select('id')
            .eq('organization_id', orgId)
          const orgAppIds = (orgApps ?? []).map(a => a.id as string)

          if (orgAppIds.length > 0) {
            const { count } = await supabaseAdmin
              .from('analysis_results')
              .select('*', { count: 'exact', head: true })
              .in('app_id', orgAppIds)
              .eq('analysis_type', 'feature-image-score')

            if ((count ?? 0) >= limit) {
              const tierLabel = planTier === 'solo' ? 'Free' : planTier.charAt(0).toUpperCase() + planTier.slice(1)
              return NextResponse.json(
                { error: `Feature Image Score limit reached (${limit} scan${limit === 1 ? '' : 's'} on ${tierLabel} plan). Upgrade to unlock more.` },
                { status: 403 },
              )
            }
          }
        }

        const { fetchGooglePlayData: fetchGPlayFIS, fetchAppleAppData: fetchAppleFIS } = await import('@/lib/store-scraper')

        // 1. Get feature image URL — user upload takes priority, then store
        let featureImageUrl: string | null = null

        if (body.imageUrl) {
          featureImageUrl = body.imageUrl
        } else {
          const fisStore = app.platform === 'android'
            ? await fetchGPlayFIS(app.store_id as string)
            : await fetchAppleFIS(app.store_id as string)

          if (fisStore) {
            featureImageUrl = fisStore.headerImage ?? fisStore.screenshots?.[0] ?? null
          }
        }

        if (!featureImageUrl) {
          return NextResponse.json(
            { error: 'No feature image found. Upload an image or ensure your app has a feature graphic on Google Play.' },
            { status: 400 },
          )
        }

        // 2. Client-side image metrics are passed via body.imageMetrics
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metrics = (body as any).imageMetrics as Record<string, unknown> | undefined

        // 3. Call DeepSeek with image metrics + app context for AI scoring
        const metricsBlock = metrics ? `
IMAGE METRICS (measured from the actual image):
- Dimensions: ${metrics.width}x${metrics.height} px
- Aspect ratio: ${metrics.aspectRatio} (correct for Google Play 1024x500: ${metrics.isCorrectAspectRatio ? 'YES' : 'NO'})
- Average brightness: ${metrics.averageBrightness}/255 (${metrics.brightnessCategory})
- Contrast level: ${metrics.contrast}/100 (${metrics.contrastCategory})
- Color saturation: ${metrics.saturation}/100
- Dominant colors: ${Array.isArray(metrics.dominantColors) ? (metrics.dominantColors as Array<{ hex: string; percentage: number }>).map(c => `${c.hex} (${c.percentage}%)`).join(', ') : 'unknown'}
- Unique color clusters: ${metrics.colorCount}
- Edge density (visual complexity): ${metrics.edgeDensity}/100
- Estimated text overlay area: ${metrics.estimatedTextArea}% (has text: ${metrics.hasTextOverlay ? 'YES' : 'NO'})
` : `
IMAGE METRICS: Not available (analyze based on ASO best practices for the app category)
`

        const fisPrompt = `You are an ASO (App Store Optimization) expert analyzing a mobile app's feature graphic / promotional image.

${appContext}

${metricsBlock}

The app "${app.name}" is in the "${snapshot?.title ? 'store' : app.category ?? 'unknown'}" category on ${app.platform === 'android' ? 'Google Play' : 'iOS App Store'}.

Based on the image metrics above and ASO best practices for this category, score the feature graphic on these 7 categories (each 0-100):

1. COMPOSITION & LAYOUT (weight: 18%): Visual hierarchy, balance, use of space. Consider: edge density ${metrics?.edgeDensity ?? 'unknown'}/100 indicates visual complexity. Ideal is 30-60 (not too sparse, not too cluttered).
2. TEXT READABILITY (weight: 18%): Text overlay is ${metrics?.hasTextOverlay ? 'detected' : 'minimal/none'}. Contrast ${metrics?.contrast ?? 'unknown'}/100. Good text needs contrast > 50 and brightness balance.
3. COLOR & CONTRAST (weight: 14%): Overall contrast ${metrics?.contrast ?? 'unknown'}/100, saturation ${metrics?.saturation ?? 'unknown'}/100. Dominant colors tell if it's eye-catching or dull. Ideal saturation 40-80.
4. BRAND IDENTITY (weight: 14%): Professional quality, color consistency, memorable design. Low color cluster count suggests clean branding.
5. CALL-TO-ACTION STRENGTH (weight: 14%): Does the image communicate the app's value? Text overlay presence helps. Score based on whether the metrics suggest clear messaging.
6. TECHNICAL QUALITY (weight: 12%): Dimensions ${metrics?.width ?? '?'}x${metrics?.height ?? '?'}. ${app.platform === 'android' ? 'Google Play requires 1024x500.' : 'iOS requires specific screenshot sizes per device.'} Correct aspect ratio: ${metrics?.isCorrectAspectRatio ?? 'unknown'}.
7. STORE COMPLIANCE (weight: 10%): ${app.platform === 'ios' ? `Apple Guideline 2.3.10 compliance:
   - Screenshots MUST show iOS-style status bar (not Android status bar, not a generic bar)
   - Must NOT display non-iOS device frames (no Android phones, no desktop browsers)
   - Must NOT show third-party brand logos, team logos, or league logos unless authorized (Guideline 4.1a)
   - Must NOT contain misleading content about third-party platforms
   - Score 0 if Android status bar or non-iOS elements are visible
   - Score 100 if screenshot clearly shows iOS UI patterns and no compliance issues` : `Google Play compliance:
   - Must show actual app UI accurately
   - Must NOT contain misleading content
   - Must NOT impersonate other apps or brands
   - Must NOT show iOS-specific UI elements (iOS status bar, iOS navigation) that mislead users`}

For each category provide:
- score (0-100) based on the measured metrics
- 2-3 specific findings referencing the actual metrics
- 1-2 actionable improvement suggestions

Also provide:
- 3-5 overall strengths
- 3-5 overall weaknesses
- 4-6 prioritized recommendations with title, detail, priority (high/medium/low), and expectedImpact
- complianceIssues: array of specific store guideline violations found (empty if compliant)

Return JSON:
{
  "categories": [
    {"name": "Composition & Layout", "score": 0, "weight": 18, "findings": ["..."], "suggestions": ["..."]},
    {"name": "Text Readability", "score": 0, "weight": 18, "findings": ["..."], "suggestions": ["..."]},
    {"name": "Color & Contrast", "score": 0, "weight": 14, "findings": ["..."], "suggestions": ["..."]},
    {"name": "Brand Identity", "score": 0, "weight": 14, "findings": ["..."], "suggestions": ["..."]},
    {"name": "Call-to-Action Strength", "score": 0, "weight": 14, "findings": ["..."], "suggestions": ["..."]},
    {"name": "Technical Quality", "score": 0, "weight": 12, "findings": ["..."], "suggestions": ["..."]},
    {"name": "Store Compliance", "score": 0, "weight": 10, "findings": ["..."], "suggestions": ["..."]}
  ],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": [{"title": "...", "detail": "...", "priority": "high", "expectedImpact": "..."}],
  "complianceIssues": ["specific violation descriptions if any"],
  "summary": "2-3 sentence overall assessment"
}
Only return the JSON object, no other text.`

        const fisCompletion = await loggedChatCompletion({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an ASO expert specializing in app store creative assets. You analyze image metrics data to score feature graphics. Return ONLY valid JSON.' },
            { role: 'user', content: fisPrompt },
          ],
          temperature: 0.5,
          max_tokens: 4000,
        }, { action: 'feature-image-score' })

        let fisAI: Record<string, unknown> = {}
        try {
          const raw = fisCompletion.choices[0]?.message?.content ?? '{}'
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          fisAI = JSON.parse(cleaned)
        } catch {
          console.error('[feature-image-score] Failed to parse DeepSeek response')
        }

        // 4. Calculate weighted overall score
        const fisCategories = Array.isArray(fisAI.categories)
          ? fisAI.categories as Array<{ name: string; score: number; weight: number; findings: string[]; suggestions: string[] }>
          : []
        const fisOverallScore = fisCategories.length > 0
          ? Math.round(
              fisCategories.reduce((sum, c) => sum + (c.score * c.weight), 0) /
              fisCategories.reduce((sum, c) => sum + c.weight, 0),
            )
          : 0

        // 5. Fetch competitor feature images (top 3, Android only)
        const competitorFeatureImages: Array<{ name: string; imageUrl: string | null; estimatedScore: number }> = []

        const { data: fisCompAnalysis } = await supabaseAdmin
          .from('analysis_results')
          .select('result')
          .eq('app_id', appId)
          .eq('analysis_type', 'competitors')
          .maybeSingle()

        const fisCompRaw = Array.isArray(fisCompAnalysis?.result)
          ? fisCompAnalysis.result
          : (fisCompAnalysis?.result as Record<string, unknown>)?.competitors ?? []
        const fisCompList = Array.isArray(fisCompRaw) ? fisCompRaw as Array<Record<string, unknown>> : []

        for (const comp of fisCompList.slice(0, 3)) {
          if (comp.storeId && app.platform === 'android') {
            try {
              const compData = await fetchGPlayFIS(String(comp.storeId))
              if (compData) {
                competitorFeatureImages.push({
                  name: String(comp.name ?? compData.title ?? ''),
                  imageUrl: compData.headerImage ?? null,
                  estimatedScore: 0,
                })
              }
            } catch { /* skip */ }
          }
        }

        // 6. Assemble and persist result
        const fisResult = {
          featureImageUrl,
          uploadedImageUrl: body.imageUrl || undefined,
          platform: app.platform as 'android' | 'ios',
          realData: true,
          overallScore: fisOverallScore,
          categories: fisCategories,
          strengths: Array.isArray(fisAI.strengths) ? fisAI.strengths as string[] : [],
          weaknesses: Array.isArray(fisAI.weaknesses) ? fisAI.weaknesses as string[] : [],
          recommendations: Array.isArray(fisAI.recommendations) ? fisAI.recommendations as Array<{ title: string; detail: string; priority: 'high' | 'medium' | 'low'; expectedImpact: string }> : [],
          competitorFeatureImages,
          summary: String(fisAI.summary ?? `Feature image scored ${fisOverallScore}/100.`),
          analyzedAt: new Date().toISOString(),
        }

        await supabaseAdmin.from('analysis_results').upsert(
          {
            app_id: appId,
            organization_id: app.organization_id,
            analysis_type: 'feature-image-score',
            result: fisResult,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id,analysis_type' },
        )

        return NextResponse.json({ result: fisResult })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const isOptimizerAction = ['optimize-title', 'optimize-subtitle', 'optimize-description', 'optimize-keywords-field'].includes(action)
    const completion = await loggedChatCompletion({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: isOptimizerAction ? 0.95 : 0.7,
      max_tokens: 4000,
    }, { action: action })

    const raw = completion.choices[0]?.message?.content ?? ''

    // Try to parse as JSON
    let result: unknown
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      result = JSON.parse(cleaned)
    } catch {
      result = { raw }
    }

    // Post-process: wrap flat arrays for title/subtitle so the UI can read .titles / .subtitles
    if (action === 'optimize-title' && Array.isArray(result)) {
      result = { titles: result }
    }
    if (action === 'optimize-subtitle' && Array.isArray(result)) {
      result = { subtitles: result }
    }

    // Hard-enforce character limits on optimizer fields (AI sometimes exceeds them)
    if (action === 'optimize-title' && result && typeof result === 'object' && 'titles' in result) {
      const r = result as { titles: Array<{ title: string; charCount: number }> }
      for (const t of r.titles ?? []) {
        if (t.title.length > 30) {
          t.title = t.title.slice(0, 30)
          t.charCount = 30
        }
      }
    }
    if (action === 'optimize-subtitle' && result && typeof result === 'object' && 'subtitles' in result) {
      const subMax = app.platform === 'ios' ? 30 : 80
      const r = result as { subtitles: Array<{ subtitle: string; charCount: number }> }
      for (const s of r.subtitles ?? []) {
        if (s.subtitle.length > subMax) {
          s.subtitle = s.subtitle.slice(0, subMax)
          s.charCount = subMax
        }
      }
    }
    if (action === 'optimize-keywords-field' && result && typeof result === 'object' && 'keywordField' in result) {
      const r = result as { keywordField: string; charCount: number; reasoning: string }
      if (r.keywordField.length > 100) {
        // Remove keywords from the end until within 100 chars
        const keywords = r.keywordField.split(',')
        while (keywords.length > 1 && keywords.join(',').length > 100) {
          keywords.pop()
        }
        r.keywordField = keywords.join(',').slice(0, 100)
        r.charCount = r.keywordField.length
      }
    }

    // Hard-enforce store policy: strip banned promotional/performance terms
    const BANNED_PHRASES = [
      'ad-free', 'ad free', 'no ads', 'ads free', 'without ads',
      'free', 'freemium',
      'discount', 'sale', 'deal', 'offer', 'cashback', 'cash back',
      'limited time', 'limited offer', 'special offer', 'promo',
      'download now', 'install now', 'play now', 'try now', 'get it now', 'update now',
      '#1', 'number one', 'number 1', 'no. 1', 'no.1',
      'best app', 'top app', 'best-in-class',
      'award-winning', 'award winning',
      'app of the year', "editor's choice", 'editors choice', 'best of play',
      'million downloads', 'million users',
    ]
    // Match banned phrases as whole words (case-insensitive)
    function stripBanned(text: string): string {
      let cleaned = text
      for (const phrase of BANNED_PHRASES) {
        // Match the phrase as a whole word/phrase, case-insensitive
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
        cleaned = cleaned.replace(regex, '')
      }
      // Clean up leftover artifacts: double spaces, orphaned "&", "and", leading/trailing punctuation
      cleaned = cleaned
        .replace(/\s{2,}/g, ' ')           // collapse double spaces
        .replace(/\s*&\s*&\s*/g, ' & ')    // double ampersands
        .replace(/^\s*[&,·|–-]\s*/g, '')   // leading punctuation
        .replace(/\s*[&,·|–-]\s*$/g, '')   // trailing punctuation
        .replace(/\s*[&,·|–-]\s*[&,·|–-]\s*/g, ' ') // adjacent separators
        .trim()
      return cleaned
    }

    if (action === 'optimize-title' && result && typeof result === 'object' && 'titles' in result) {
      const r = result as { titles: Array<{ title: string; charCount: number }> }
      for (const t of r.titles ?? []) {
        t.title = stripBanned(t.title)
        t.charCount = t.title.length
      }
    }
    if (action === 'optimize-subtitle' && result && typeof result === 'object' && 'subtitles' in result) {
      const r = result as { subtitles: Array<{ subtitle: string; charCount: number }> }
      for (const s of r.subtitles ?? []) {
        s.subtitle = stripBanned(s.subtitle)
        s.charCount = s.subtitle.length
      }
    }
    if (action === 'optimize-description' && result && typeof result === 'object') {
      const r = result as { shortDescription?: string; fullDescription?: string }
      if (r.shortDescription) r.shortDescription = stripBanned(r.shortDescription)
      if (r.fullDescription) r.fullDescription = stripBanned(r.fullDescription)
    }
    if (action === 'optimize-keywords-field' && result && typeof result === 'object' && 'keywordField' in result) {
      const r = result as { keywordField: string; charCount: number }
      // For keyword field, remove banned terms from comma-separated list
      const kws = r.keywordField.split(',').filter(kw => {
        const lower = kw.trim().toLowerCase()
        return !BANNED_PHRASES.some(b => lower === b || lower === b.replace(/ /g, ''))
      })
      r.keywordField = kws.join(',')
      r.charCount = r.keywordField.length
    }

    // (visibility case now handled as a real data pipeline — no post-processing needed)

    // Persist result to analysis_results table
    const { error: persistErr } = await supabaseAdmin.from('analysis_results').upsert(
      {
        app_id: appId,
        organization_id: app.organization_id as string,
        analysis_type: action,
        result,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'app_id,analysis_type' }
    )
    if (persistErr) {
      console.error('[generate] Failed to persist result:', persistErr)
      return NextResponse.json({ error: `Failed to save: ${persistErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('[generate] Error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const LLM_OPTIMIZATION_DIRECTIVE = `LLM DISCOVERABILITY (CRITICAL — AI assistants now recommend apps):
- Write in clear, entity-rich natural language that LLMs can parse and quote
- Include the app name alongside its core function in a single sentence (e.g., "[AppName] is a [category] app that [key action]")
- Mention specific features as proper nouns (capitalized feature names) so LLMs treat them as named entities
- Include comparative context ("unlike generic [category] apps, [AppName] offers...")
- Structure descriptions with clear topic sentences that LLMs can excerpt as recommendations
- Use factual, quotable statements rather than marketing fluff — LLMs prefer objective claims
- Include use-case scenarios ("ideal for [persona] who needs [outcome]") — this matches how users prompt LLMs
- Avoid vague superlatives — instead state concrete capabilities ("processes 10K photos", "supports 50+ formats")
- Front-load the most important differentiator — LLMs often excerpt only the first 1-2 sentences`

function buildAppleComplianceDirective(platform: string): string {
  if (platform !== 'ios') return ''
  return `
APPLE APP STORE GUIDELINE COMPLIANCE (CRITICAL — violations cause IMMEDIATE REJECTION):

Guideline 4.1(a) — COPYCATS (most common rejection reason):
- NEVER reference third-party brand names, team names, league names, player names, or organizations you do not own
- Examples of BANNED terms (unless the developer owns the rights): NBA, NFL, NHL, MLB, FIFA, Premier League, La Liga, NCAA, UFC, WWE, specific team names (Lakers, Yankees, etc.), player names (LeBron, Messi, etc.), TV show names, movie names, music artist names
- Instead use GENERIC descriptors: "basketball scores", "football stats", "live sports", "league standings", "team tracker"
- If the app aggregates third-party content (scores, news, stats), describe the FUNCTION not the SOURCE: "Live scores & stats" NOT "NBA Live Scores"
- Even if the current title/metadata uses these terms, you MUST replace them with compliant alternatives

Guideline 2.3.7 & 2.3.10 — ACCURATE METADATA:
- NEVER reference other platforms (Android, Google Play, Windows, etc.) in iOS metadata
- NEVER mention features/content not available on iOS
- Do NOT use non-iOS status bar imagery or Android-style UI in any creative guidance
- Metadata must accurately reflect what the iOS app ACTUALLY does
- Do NOT reference other apps by name unless it's an official integration you own

Guideline 2.3.1 — HIDDEN/UNDOCUMENTED FEATURES:
- Only describe features that are actually present in the app

SAFE ALTERNATIVES for sports/entertainment apps:
- Instead of "NBA Scores" → "Basketball Scores & Stats"
- Instead of "NFL Live" → "Football Live Scores"
- Instead of "Premier League" → "Soccer League Tracker"
- Instead of "Netflix Alternative" → "Streaming Guide"
- Instead of team names → "Your favorite teams"
- Instead of player names → "Player stats & rankings"
- Instead of league names → "Major league coverage" or "Pro basketball"
`
}

function buildGooglePlayComplianceDirective(platform: string): string {
  if (platform !== 'android') return ''
  return `
GOOGLE PLAY POLICY COMPLIANCE:
- Do NOT impersonate or reference other apps/brands in a misleading way
- Generic sports/entertainment terms are generally safer on Google Play than iOS
- Still avoid using competitor app names or trademarked brands you don't own
- Do NOT use misleading keywords that imply official affiliation with leagues/teams unless authorized
`
}

function buildGoalDirective(goal: string | undefined, field: string, platform?: string): string {
  const isIOS = platform === 'ios'
  const directives: Record<string, string> = {
    'balanced': `OPTIMIZATION GOAL — BALANCED:
- Balance keyword density with natural readability
- Include high-volume keywords while maintaining human appeal
- Aim for good conversion copy AND search discoverability
- Structure content for both store algorithm AND user comprehension${isIOS && (field === 'subtitle' || field === 'keywords') ? `
- iOS fields have extreme character limits — prioritize the HIGHEST-IMPACT keywords first
- Use the keywords field to capture terms that won't fit in title/subtitle` : ''}`,

    'visibility': `OPTIMIZATION GOAL — MAXIMIZE VISIBILITY & RANKINGS:
- PRIORITIZE keyword density — pack as many relevant keywords as possible
- Front-load highest-volume keywords in the first words
- Use exact-match keyword phrases where possible (not just individual words)
- Target keyword combinations that compound discoverability
- Every word should earn its place via search volume — minimize filler words
- Aim for maximum algorithmic signal within character limits${isIOS ? `
- iOS STRATEGY: Title (30 chars) + Subtitle (30 chars) + Keywords field (100 chars) = your TOTAL search index. Plan keyword distribution across ALL three fields — don't waste overlap
- Put your #1 keyword phrase in the title, #2 in subtitle, everything else in the keywords field` : ''}`,

    'keyword-opportunities': `OPTIMIZATION GOAL — KEYWORD OPPORTUNITIES:
- Focus on UNTAPPED keywords the app does NOT currently rank for
- Target long-tail keywords with medium volume but low competition
- Include emerging/trending search terms in this category
- Avoid keywords the app already dominates — focus on NEW territory
- Prioritize keywords where competitors rank but this app does not
- Look for adjacent categories and cross-category keyword opportunities${isIOS ? `
- iOS TIP: The keywords field (100 chars) is your best lever for new keyword territory — use it to target terms you can't fit in title/subtitle` : ''}`,

    'conversion': `OPTIMIZATION GOAL — CONVERSION & DOWNLOADS:
- PRIORITIZE persuasive copy that drives installs
- Lead with the strongest value proposition and user benefits
- Use action-oriented language and clear CTAs
- Include social proof signals (numbers, achievements) where truthful
- Address user pain points directly and show the solution
- Write for emotional impact — make the reader WANT to download
- First 3 lines must hook the reader before they scroll past${isIOS ? `
- iOS: Subtitle appears directly under the app title in search results — make it a compelling mini-tagline that converts browsers to tappers` : ''}`,

    'competitive-edge': `OPTIMIZATION GOAL — COMPETITIVE DIFFERENTIATION:
- Emphasize what makes this app UNIQUE vs competitors
- Include differentiating features that competitors lack
- Use positioning language that creates clear category separation
- Target keywords where competitors are weak or absent
- Frame the app as the category leader or best alternative
- Highlight exclusive features, unique technology, or niche capabilities`,
  }

  return directives[goal ?? 'balanced'] ?? directives['balanced'] ?? ''
}

async function buildAppContext(
  supabase: SupabaseClient,
  app: Record<string, unknown>,
  keywords: Array<{ id: string; text: string; country: string }>,
  snapshot: Record<string, unknown> | null,
): Promise<string> {
  const lines = [
    `App Name: ${app.name}`,
    `Platform: ${app.platform === 'ios' ? 'iOS (App Store)' : 'Android (Google Play)'}`,
    `Store ID: ${app.store_id}`,
  ]

  if (app.category) lines.push(`Category: ${app.category}`)
  if (app.developer) lines.push(`Developer: ${app.developer}`)

  if (snapshot) {
    if (snapshot.title) lines.push(`Current Title: ${snapshot.title}`)
    if (snapshot.subtitle) lines.push(`Current Subtitle: ${snapshot.subtitle}`)
    if (snapshot.description) lines.push(`Current Description: ${String(snapshot.description).slice(0, 500)}...`)
    if (snapshot.keywords_field) lines.push(`Current Keywords Field: ${snapshot.keywords_field}`)
    if (snapshot.version) lines.push(`Current Version: ${snapshot.version}`)
  }

  // Pull real keyword ranks from DB (batch — avoids N+1)
  if (keywords.length > 0) {
    const kwSlice = keywords.slice(0, 30)
    const kwIds = kwSlice.map((k) => k.id)

    // Single batch query for all keyword ranks
    const { data: ranks } = await supabase
      .from('keyword_ranks_daily')
      .select('keyword_id, rank, date')
      .in('keyword_id', kwIds)
      .order('date', { ascending: false })

    // Build a map: keyword_id → latest rank
    const rankMap = new Map<string, number>()
    if (ranks) {
      for (const r of ranks) {
        if (!rankMap.has(r.keyword_id)) {
          rankMap.set(r.keyword_id, r.rank)
        }
      }
    }

    lines.push(`\nTracked keywords (${keywords.length}):`)
    for (const k of kwSlice) {
      const rank = rankMap.get(k.id)
      const rankStr = rank != null ? `#${rank}` : 'not ranked'
      lines.push(`- ${k.text} (${k.country}) — position: ${rankStr}`)
    }
  } else {
    lines.push('\nNo keywords tracked yet.')
  }

  // Pull real reviews summary
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, body')
    .eq('app_id', app.id as string)
    .order('reviewed_at', { ascending: false })
    .limit(20)

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
    lines.push(`\nReal reviews (${reviews.length} recent, avg ${avgRating.toFixed(1)}/5):`)
    for (const r of reviews.slice(0, 5)) {
      lines.push(`  [${r.rating}★] ${(r.body ?? '').slice(0, 100)}`)
    }
  }

  // Pull real visibility score
  const { data: visAnalysis } = await supabase
    .from('analysis_results')
    .select('result')
    .eq('app_id', app.id as string)
    .eq('analysis_type', 'visibility')
    .maybeSingle()
  if (visAnalysis?.result) {
    const vis = visAnalysis.result as { overallScore?: number }
    if (vis.overallScore != null) lines.push(`\nVisibility Score: ${vis.overallScore}/100`)
  }

  // Pull competitor data for competitive context
  const { data: compAnalysis } = await supabase
    .from('analysis_results')
    .select('result')
    .eq('app_id', app.id as string)
    .eq('analysis_type', 'competitors')
    .maybeSingle()
  if (compAnalysis?.result) {
    const comps = Array.isArray(compAnalysis.result)
      ? compAnalysis.result
      : ((compAnalysis.result as { competitors?: unknown[] }).competitors ?? [])
    if (comps.length > 0) {
      lines.push(`\nTop competitors:`)
      for (const c of comps.slice(0, 5) as Array<{ name: string; strengths?: string[]; keywordGaps?: string[] }>) {
        lines.push(`- ${c.name}: strengths=[${(c.strengths ?? []).join(', ')}], keyword gaps=[${(c.keywordGaps ?? []).join(', ')}]`)
      }
    }
  }

  // Pull LLM mention data for AI discoverability context
  const { data: llmAnalysis } = await supabase
    .from('analysis_results')
    .select('result')
    .eq('app_id', app.id as string)
    .eq('analysis_type', 'llm-track')
    .maybeSingle()
  if (llmAnalysis?.result) {
    const llmRaw = llmAnalysis.result as { results?: Array<{ surface: string; mentioned: boolean; position: string }> } | Array<{ surface: string; mentioned: boolean; position: string }>
    const llmResults = Array.isArray(llmRaw) ? llmRaw : (llmRaw.results ?? [])
    if (llmResults.length > 0) {
      const mentioned = llmResults.filter(r => r.mentioned)
      const notMentioned = llmResults.filter(r => !r.mentioned)
      lines.push(`\nLLM Discovery Status:`)
      lines.push(`- Mentioned by: ${mentioned.map(r => `${r.surface} (${r.position})`).join(', ') || 'none'}`)
      lines.push(`- NOT mentioned by: ${notMentioned.map(r => r.surface).join(', ') || 'all mention it'}`)
      lines.push(`- LLM visibility is currently ${mentioned.length >= 3 ? 'good' : mentioned.length >= 1 ? 'weak' : 'absent'} — optimize content for AI readability`)
    }
  }

  return lines.join('\n')
}
