import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AdventureStyle } from '@/types/game'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const STYLE_PREFIXES: Record<AdventureStyle, string> = {
  whimsical: 'Bright, colorful storybook illustration style. Friendly, rounded shapes. Warm lighting.',
  realistic: 'Detailed fantasy art, dynamic composition. Exciting but not scary. Think Pixar/DreamWorks.',
  dark: 'Atmospheric fantasy art. Moody lighting, rich shadows. Mature aesthetic.',
}

const imageCache = new Map<string, string>()

export async function generateSceneImage(
  sceneDescription: string,
  style: AdventureStyle
): Promise<string | null> {
  const cacheKey = `${style}:${sceneDescription.slice(0, 100)}`
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!

  try {
    const prompt = `${STYLE_PREFIXES[style]} Scene: ${sceneDescription}. No text or UI elements in the image.`
    const result = await imageModel.generateContent(prompt)
    const response = result.response

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    )

    if (imagePart?.inlineData) {
      const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      imageCache.set(cacheKey, dataUrl)
      return dataUrl
    }
    return null
  } catch (error) {
    console.error('Image generation error:', error)
    return null
  }
}
