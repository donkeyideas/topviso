import type { GlossarySection } from '@/components/dashboard/GlossaryModal'

export interface GlossaryDef {
  title: string
  subtitle?: string
  sections: GlossarySection[]
}

const INTENT_TERMS = [
  { label: 'Informational', description: 'User wants to learn (e.g., "how to track keywords")' },
  { label: 'Navigational', description: 'User is looking for a specific app or brand' },
  { label: 'Commercial', description: 'User is comparing options before downloading' },
  { label: 'Transactional', description: 'User is ready to download or buy now' },
]

const KEYWORD_TERMS = [
  { label: 'Keyword', description: 'The search query users type in the app store. Each row is a tracked keyword.' },
  { label: 'Rank', description: "Your app's position in app store search results for this keyword. #1 is the top result. Lower is better.", range: '#1–#250+' },
  { label: 'Vol.', shortFor: 'Search Volume', description: 'Estimated monthly searches for this keyword in the app store. Higher means more potential traffic.', range: '0–100K+' },
  { label: 'Diff.', shortFor: 'Difficulty', description: 'How hard it is to rank in the top 10 for this keyword. Based on competitor strength and ranking density.', range: '0 (easy) – 100 (hard)' },
  { label: 'Δ 7d', shortFor: 'Delta 7 Days', description: 'Change in your rank over the last 7 days. Positive (green) means moved up; negative (red) means dropped.' },
  { label: 'KEI', shortFor: 'Keyword Effectiveness Index', description: 'A composite score weighing search volume against difficulty. High KEI = high opportunity (lots of searches, low competition). Calculated as (Volume² ÷ Difficulty).', range: '0–1000+' },
  { label: 'Top Competitor', description: 'The app currently ranking #1 for this keyword. Useful for identifying who you need to outrank.' },
  { label: 'Rel.', shortFor: 'Relevance', description: "How relevant this keyword is to your app's actual category and feature set. Higher means a better match.", range: '0–100' },
  { label: 'Intent', description: "The user's motivation when searching this keyword. See Intent types below." },
]

export const GLOSSARIES = {
  keywords: {
    title: 'Keyword terms',
    subtitle: 'Quick reference for the metrics in the keyword intelligence table.',
    sections: [
      { terms: KEYWORD_TERMS },
      { heading: 'Intent types', terms: INTENT_TERMS, compact: true },
    ],
  },

  overview: {
    title: 'Overview metrics',
    subtitle: 'The headline numbers shown on your app overview dashboard.',
    sections: [
      {
        terms: [
          { label: 'ASO Score', description: 'Composite score (0–100) measuring overall app store optimization health. Combines metadata quality, keyword performance, ratings, and visibility.', range: '0–100' },
          { label: 'Visibility Score', description: "Weighted measure of your app's overall search visibility. Considers how many keywords you rank for and at what positions. Top-10 positions count more than #100.", range: '0–100' },
          { label: 'Keywords Ranked', description: 'How many of your tracked keywords your app currently appears for (rank 1–250).' },
          { label: 'LLM Share of Voice', description: 'Percentage of AI assistants (ChatGPT, Claude, Gemini, Perplexity, Copilot) that mention your app when asked about your category.', range: '0–100%' },
          { label: 'Avg Rating', description: 'Your app store rating averaged from the most recent reviews we polled.', range: '0–5 stars' },
          { label: 'Share of Search', description: 'Of all the searches your tracked keywords represent, the share where your app appears in the top 10.', range: '0–100%' },
          { label: 'Category Rank', description: "Your app's position in its store category's top charts. 'Not in top 50' means you haven't broken the visible chart yet." },
        ],
      },
      { heading: 'Intent types', terms: INTENT_TERMS, compact: true },
    ],
  },

  competitors: {
    title: 'Competitor terms',
    subtitle: 'How we score and compare competing apps in your category.',
    sections: [
      {
        terms: [
          { label: 'Threat Level', description: 'How dangerous a competitor is to your rankings. High = overlaps with many of your keywords AND ranks above you. Low = minimal overlap.' },
          { label: 'Keyword Overlap', description: 'Number of keywords where both you and this competitor rank in the top 250. More overlap = direct competition.' },
          { label: 'Keyword Gaps', description: 'Keywords this competitor ranks for that you do not. Each gap is an opportunity to target.' },
          { label: 'Rating', description: 'Their app store rating, for benchmarking against yours.', range: '0–5 stars' },
          { label: 'Keywords Tracked', description: 'Total keywords we have visibility on for this competitor.' },
          { label: 'Top Keywords', description: 'The keywords driving the most traffic to this competitor.' },
        ],
      },
      {
        heading: 'Threat levels',
        compact: true,
        terms: [
          { label: 'High', description: 'Dominates many of your target keywords. Direct rival.' },
          { label: 'Medium', description: 'Overlaps in some keywords. Worth monitoring.' },
          { label: 'Low', description: 'Minimal overlap. Indirect competitor.' },
        ],
      },
    ],
  },

  'llm-discovery': {
    title: 'LLM discovery terms',
    subtitle: 'How AI assistants surface (or fail to surface) your app.',
    sections: [
      {
        terms: [
          { label: 'Surface', description: 'An AI assistant we poll: ChatGPT, Claude, Gemini, Perplexity, or Copilot.' },
          { label: 'Mentioned', description: 'Whether the assistant named your app when asked a category-relevant query.' },
          { label: 'Position', description: "Where your app fell in the assistant's recommended list. 1st is best; 'Not listed' means it was not surfaced." },
          { label: 'Share of Voice', description: 'Percentage of polled assistants that mention your app.', range: '0–100%' },
          { label: 'Citations', description: 'Articles, blog posts, and sites the LLMs reference when explaining the category. Getting cited here lifts your visibility.' },
          { label: 'Prompt Matrix', description: 'A grid of common user queries scored across all 5 engines. Identifies which prompts work and which engine is your weakest.' },
          { label: 'Mention Score', description: 'Per-engine score (0–100) reflecting how prominently your app was mentioned for a given prompt.', range: '0–100' },
        ],
      },
    ],
  },

  reviews: {
    title: 'Review terms',
    subtitle: 'How we analyze the reviews we poll from the store.',
    sections: [
      {
        terms: [
          { label: 'Avg Rating', description: 'Average star rating from the most recent reviews we have pulled.', range: '0–5 stars' },
          { label: 'Real Review Count', description: 'Number of reviews we successfully scraped from the store for analysis.' },
          { label: 'Sentiment', description: 'AI classification of each review as positive, neutral, or negative based on its text content.' },
          { label: 'Theme', description: 'Recurring topic clustered from multiple reviews (e.g., "crashes on launch", "great UI").' },
          { label: 'Themes — Positive', description: 'Top recurring praise across reviews. Use these as conversion hooks in your description.' },
          { label: 'Themes — Negative', description: 'Top recurring complaints. Address these in updates or in your responses.' },
          { label: 'Severity', description: 'How damaging a negative theme is (high = mentioned in many low-star reviews and threatens ratings).' },
        ],
      },
    ],
  },

  growth: {
    title: 'Growth terms',
    subtitle: 'How we measure traffic, version impact, and retention signals.',
    sections: [
      {
        terms: [
          { label: 'Downloads', description: 'Reported install count for the time window. Store-reported numbers are bucketed (e.g., 10+, 100+, 1K+) for low-volume apps.' },
          { label: 'Traffic Share', description: "Share of your tracked keyword traffic this keyword is responsible for. Helps identify which keywords actually drive installs." },
          { label: 'Version Timeline', description: "Each app version release and what changed. Useful for correlating a metric shift with a release." },
          { label: 'Version Impact', description: 'How a new version changed rankings, ratings, or downloads in the days after release.' },
          { label: 'Retention', description: 'Estimated percentage of users still active a given number of days after install.' },
          { label: 'Churn Risk', description: 'AI signal flagging whether negative reviews and ratings trends suggest users are abandoning the app.' },
        ],
      },
    ],
  },

  localization: {
    title: 'Localization terms',
    subtitle: 'How your app is performing in each market and language.',
    sections: [
      {
        terms: [
          { label: 'Market', description: 'A country/region storefront where your app is listed (e.g., US, GB, DE).' },
          { label: 'Downloads', description: 'Installs attributed to this market.' },
          { label: 'Keywords Ranked', description: 'Keywords your app currently ranks for in this market.' },
          { label: 'Status', description: "Health summary for the market: 'Strong', 'Growing', 'Stagnant', or 'Underperforming'." },
          { label: 'Translation Quality', description: "AI-assessed quality of your store listing's translation. Poor translations hurt conversion." },
          { label: 'Locale Diff', description: 'Per-locale differences in your store metadata — title, subtitle, description, keywords.' },
        ],
      },
    ],
  },

  visibility: {
    title: 'Visibility terms',
    subtitle: 'How your search visibility is scored and broken down.',
    sections: [
      {
        terms: [
          { label: 'Visibility Score', description: "Overall measure of search visibility, weighted by keyword volume and rank position.", range: '0–100' },
          { label: 'Position Weight', description: 'How much credit a rank gives. #1 = full credit; ranks fall off quickly past #10 and minimally past #50.' },
          { label: 'Keyword Contribution', description: "Each keyword's contribution to your total visibility score. Driven by volume × position weight." },
          { label: 'Top 3 / Top 10', description: 'Count of keywords where your app ranks in the top 3 or top 10. The most valuable buckets.' },
          { label: 'Δ 30d', description: 'Change in your visibility score over the last 30 days.' },
          { label: 'Trend', description: 'A sparkline showing visibility over time. Climbing = healthy ASO; flat or falling = needs attention.' },
        ],
      },
    ],
  },

  intent: {
    title: 'Intent terms',
    subtitle: 'How we cluster keywords by what the searcher actually wants.',
    sections: [
      { heading: 'Intent types', terms: INTENT_TERMS, compact: true },
      {
        heading: 'Map metrics',
        terms: [
          { label: 'Cluster', description: 'A group of related keywords sharing the same intent and topic.' },
          { label: 'Ours', description: 'Keywords in this cluster where your app ranks well.' },
          { label: 'Win', description: 'Keywords where your app ranks above competitors. Defend these.' },
          { label: 'Miss', description: 'Keywords in the cluster you do not rank for at all. Biggest opportunity.' },
          { label: 'Gap', description: "A high-value keyword in this cluster that you're missing. Add to your targeting." },
        ],
      },
    ],
  },

  audiences: {
    title: 'Audience terms',
    subtitle: 'How we segment your keywords by audience and journey stage.',
    sections: [
      {
        terms: [
          { label: 'Audience', description: 'A user segment defined by keyword patterns (e.g., "fantasy football players", "casual gamers").' },
          { label: 'State', description: "Whether this audience is 'ours' (we rank), 'win' (we outrank competitors), or 'miss' (we do not rank)." },
          { label: 'Audience Size', description: 'Combined volume of all keywords this audience searches.' },
          { label: 'Coverage', description: 'Percentage of this audience\'s keywords your app currently ranks for.' },
        ],
      },
    ],
  },

  'store-intel': {
    title: 'Store intel terms',
    subtitle: 'Qualitative market signals and featuring opportunities.',
    sections: [
      {
        terms: [
          { label: 'Category Trends', description: 'Emerging patterns in your app store category that affect demand.' },
          { label: 'Featuring Tips', description: 'Specific actions that improve your odds of being featured by Apple or Google editorial.' },
          { label: 'Keyword Opportunities', description: 'Untapped keyword phrases your app should target but does not currently rank for.' },
          { label: 'Opportunity Score', description: 'Composite score for a keyword opportunity, weighting volume against competition.', range: '0–100' },
        ],
      },
    ],
  },

  'market-intel': {
    title: 'Market intel terms',
    subtitle: 'Broader market signals across categories and geos.',
    sections: [
      {
        terms: [
          { label: 'Category Size', description: 'Estimated total installs or active users across the category.' },
          { label: 'Growth Rate', description: 'Year-over-year growth in category installs.' },
          { label: 'Saturation', description: 'How crowded the category is. High saturation = harder to break in.' },
          { label: 'Top Performers', description: "The category's leading apps by downloads and visibility." },
        ],
      },
    ],
  },

  strategy: {
    title: 'Strategy terms',
    subtitle: 'How recommendations are scored and prioritized.',
    sections: [
      {
        terms: [
          { label: 'Recommendation', description: 'A specific action the platform suggests you take to improve performance.' },
          { label: 'Impact', description: 'Expected magnitude of effect on your KPIs if this action is shipped.' },
          { label: 'Effort', description: 'How much engineering or content work the action will take.' },
          { label: 'Lift', description: 'Quantified expected gain (e.g., "+12% installs", "+8 ranking positions").' },
          { label: 'Owner', description: 'Suggested team or role that should ship this action.' },
          { label: 'Category', description: 'The bucket the action falls into: keywords, metadata, creatives, ratings, competitors, or LLM.' },
        ],
      },
    ],
  },
} as const satisfies Record<string, GlossaryDef>

export type GlossaryKey = keyof typeof GLOSSARIES
