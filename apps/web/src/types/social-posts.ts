export type SocialPlatform =
  | 'TWITTER'
  | 'LINKEDIN'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'TIKTOK'

export type PostStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'FAILED'
  | 'CANCELLED'

export type ToneType =
  | 'informative'
  | 'engaging'
  | 'promotional'
  | 'controversial'
  | 'witty'
  | 'storytelling'
  | 'authoritative'
  | 'casual'
  | 'inspirational'
  | 'data-driven'

export interface SocialMediaPost {
  id: string
  platform: SocialPlatform
  content: string
  status: PostStatus
  hashtags: string[]
  image_prompt: string | null
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface AutomationConfig {
  enabled: boolean
  platforms: SocialPlatform[]
  hour: number
  topics: string[]
  useDomainContent: boolean
  requireApproval: boolean
}

export interface GeneratedPost {
  platform: SocialPlatform
  content: string
  hashtags: string[]
  imagePrompt: string
}

export const CHAR_LIMITS: Record<SocialPlatform, number> = {
  TWITTER: 280,
  TIKTOK: 300,
  FACEBOOK: 2000,
  INSTAGRAM: 2200,
  LINKEDIN: 3000,
}

export const TONE_OPTIONS: { value: ToneType; label: string }[] = [
  { value: 'informative', label: 'Informative' },
  { value: 'engaging', label: 'Engaging' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'controversial', label: 'Controversial' },
  { value: 'witty', label: 'Witty' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'casual', label: 'Casual' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'data-driven', label: 'Data-Driven' },
]

export const PLATFORM_CREDENTIALS: Record<
  string,
  { key: string; label: string }[]
> = {
  TWITTER: [
    { key: 'twitter_api_key', label: 'API Key' },
    { key: 'twitter_api_secret', label: 'API Secret' },
    { key: 'twitter_access_token', label: 'Access Token' },
    { key: 'twitter_access_token_secret', label: 'Access Token Secret' },
  ],
  LINKEDIN: [
    { key: 'linkedin_access_token', label: 'Access Token' },
    { key: 'linkedin_person_urn', label: 'Person URN' },
  ],
  FACEBOOK: [
    { key: 'facebook_page_token', label: 'Page Access Token' },
    { key: 'facebook_page_id', label: 'Page ID' },
  ],
  INSTAGRAM: [
    { key: 'instagram_access_token', label: 'Access Token' },
    { key: 'instagram_account_id', label: 'Account ID' },
  ],
  TIKTOK: [
    { key: 'tiktok_access_token', label: 'Access Token' },
  ],
}
