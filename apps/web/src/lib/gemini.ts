import { logAPICall } from './api-logger'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

interface GeminiImagePart {
  inlineData: { mimeType: string; data: string }
}

interface GeminiTextPart {
  text: string
}

type GeminiPart = GeminiTextPart | GeminiImagePart

interface GeminiRequest {
  contents: Array<{ parts: GeminiPart[]; role: 'user' }>
  generationConfig?: {
    temperature?: number
    maxOutputTokens?: number
    responseMimeType?: string
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> }
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
}

export async function analyzeImageWithGemini(options: {
  imageUrl?: string
  imageBase64?: string
  imageMimeType?: string
  prompt: string
  temperature?: number
  maxOutputTokens?: number
}): Promise<{ text: string; usage?: { promptTokens: number; completionTokens: number } }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const { imageUrl, imageBase64, imageMimeType, prompt, temperature = 0.4, maxOutputTokens = 4000 } = options

  // Build image part
  const parts: GeminiPart[] = []

  if (imageUrl) {
    // Fetch image and convert to base64 (Gemini requires inlineData)
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`)
    const buffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = imgRes.headers.get('content-type') || 'image/png'
    parts.push({ inlineData: { mimeType, data: base64 } })
  } else if (imageBase64) {
    parts.push({ inlineData: { mimeType: imageMimeType || 'image/png', data: imageBase64 } })
  } else {
    throw new Error('Either imageUrl or imageBase64 must be provided')
  }

  parts.push({ text: prompt })

  const body: GeminiRequest = {
    contents: [{ parts, role: 'user' }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  }

  const start = performance.now()
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Gemini API error ${res.status}: ${errorText}`)
    }

    const data = (await res.json()) as GeminiResponse
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const usage = data.usageMetadata
      ? { promptTokens: data.usageMetadata.promptTokenCount ?? 0, completionTokens: data.usageMetadata.candidatesTokenCount ?? 0 }
      : undefined

    const logParams: Parameters<typeof logAPICall>[0] = {
      provider: 'gemini',
      endpoint: 'generateContent',
      responseTimeMs: performance.now() - start,
      isSuccess: true,
      metadata: { action: 'feature-image-score' },
    }
    if (usage) {
      logParams.promptTokens = usage.promptTokens
      logParams.completionTokens = usage.completionTokens
    }
    logAPICall(logParams)

    return { text, ...(usage ? { usage } : {}) }
  } catch (err) {
    logAPICall({
      provider: 'gemini',
      endpoint: 'generateContent',
      responseTimeMs: performance.now() - start,
      isSuccess: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      metadata: { action: 'feature-image-score' },
    })
    throw err
  }
}
