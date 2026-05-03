/**
 * Client-side image analysis using Canvas API.
 * Extracts real visual metrics from an image without any external API.
 */

export interface ImageMetrics {
  width: number
  height: number
  aspectRatio: string
  isCorrectAspectRatio: boolean // 1024x500 for Google Play feature graphic
  averageBrightness: number     // 0-255
  brightnessCategory: 'dark' | 'medium' | 'bright'
  contrast: number              // 0-100 (standard deviation of luminance)
  contrastCategory: 'low' | 'medium' | 'high'
  dominantColors: Array<{ hex: string; percentage: number }>
  colorCount: number            // unique color clusters
  saturation: number            // 0-100 average saturation
  estimatedTextArea: number     // 0-100 percentage of high-contrast edges (proxy for text)
  hasTextOverlay: boolean
  edgeDensity: number           // 0-100 visual complexity
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s * 100, l * 100]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

export async function analyzeImage(imageUrl: string): Promise<ImageMetrics> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'

    img.onload = () => {
      try {
        // Downscale for performance (max 400px wide)
        const scale = Math.min(1, 400 / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)

        const imageData = ctx.getImageData(0, 0, w, h)
        const pixels = imageData.data
        const totalPixels = w * h

        // === Brightness & Contrast ===
        const luminances: number[] = []
        let totalBrightness = 0
        let totalSaturation = 0

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]!, g = pixels[i + 1]!, b = pixels[i + 2]!
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          luminances.push(lum)
          totalBrightness += lum
          const [, s] = rgbToHsl(r, g, b)
          totalSaturation += s
        }

        const avgBrightness = totalBrightness / totalPixels
        const avgSaturation = totalSaturation / totalPixels

        // Contrast = standard deviation of luminance
        const variance = luminances.reduce((sum, l) => sum + (l - avgBrightness) ** 2, 0) / totalPixels
        const contrast = Math.min(100, Math.sqrt(variance) / 1.28) // normalize to 0-100

        // === Dominant Colors (simple k-means-like clustering) ===
        const colorBuckets: Map<string, number> = new Map()
        for (let i = 0; i < pixels.length; i += 16) { // sample every 4th pixel
          const r = Math.round(pixels[i]! / 32) * 32
          const g = Math.round(pixels[i + 1]! / 32) * 32
          const b = Math.round(pixels[i + 2]! / 32) * 32
          const key = `${r},${g},${b}`
          colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1)
        }

        const sampledCount = Math.ceil(pixels.length / 16)
        const sortedColors = Array.from(colorBuckets.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([key, count]) => {
            const parts = key.split(',').map(Number)
            return { hex: rgbToHex(parts[0]!, parts[1]!, parts[2]!), percentage: Math.round((count / sampledCount) * 100) }
          })

        // === Edge Detection (Sobel-like for text estimation) ===
        let edgePixels = 0
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x)
            const gx = Math.abs(luminances[idx + 1]! - luminances[idx - 1]!)
            const gy = Math.abs(luminances[idx + w]! - luminances[idx - w]!)
            if (gx + gy > 40) edgePixels++
          }
        }
        const edgeDensity = Math.min(100, Math.round((edgePixels / totalPixels) * 100 * 2))
        const estimatedTextArea = Math.min(100, Math.round((edgePixels / totalPixels) * 100 * 3))

        // === Aspect Ratio ===
        const ratio = img.width / img.height
        const isCorrect = Math.abs(ratio - 2.048) < 0.15 // 1024/500 = 2.048

        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: `${img.width}:${img.height}`,
          isCorrectAspectRatio: isCorrect,
          averageBrightness: Math.round(avgBrightness),
          brightnessCategory: avgBrightness < 85 ? 'dark' : avgBrightness > 170 ? 'bright' : 'medium',
          contrast: Math.round(contrast),
          contrastCategory: contrast < 30 ? 'low' : contrast > 60 ? 'high' : 'medium',
          dominantColors: sortedColors,
          colorCount: colorBuckets.size,
          saturation: Math.round(avgSaturation),
          estimatedTextArea,
          hasTextOverlay: estimatedTextArea > 15,
          edgeDensity,
        })
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}
