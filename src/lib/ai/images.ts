import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'
import type { AdventureStyle } from '@/types/game'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Nano Banana Pro first (best quality), plain Nano Banana as fallback for
// accounts/regions where the Pro model is unavailable.
const IMAGE_MODEL_CANDIDATES = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']
let workingModelIndex = 0

// The image API needs response modalities + aspect ratio, which the older
// SDK's GenerationConfig type doesn't know about — the API accepts them.
const imageGenerationConfig = {
  responseModalities: ['TEXT', 'IMAGE'],
  imageConfig: { aspectRatio: '16:9' },
} as GenerationConfig

// One shared base look so the whole adventure feels like one illustrated book,
// with the adventure style shifting tone rather than technique.
const BASE_STYLE =
  'Epic painterly fantasy artwork in the style of classic tabletop RPG book covers. ' +
  'Dramatic composition, rich colors, detailed digital painting, cinematic lighting.'

const STYLE_TONES: Record<AdventureStyle, string> = {
  whimsical: 'Bright, warm and friendly mood. Rounded, cheerful details. Nothing scary.',
  realistic: 'Adventurous and exciting mood, suitable for children — thrilling but never frightening.',
  dark: 'Moody, mysterious atmosphere with rich shadows, but still heroic and hopeful.',
}

const imageCache = new Map<string, string>()

export function buildImagePrompt(
  sceneDescription: string,
  style: AdventureStyle,
  heroDescriptions: string[] = []
): string {
  const heroes = heroDescriptions.length
    ? ` The heroes in this scene: ${heroDescriptions.join('; ')}. Keep each hero's appearance exactly as described.`
    : ''
  return `${BASE_STYLE} ${STYLE_TONES[style]} Scene: ${sceneDescription}.${heroes} No text, letters, or UI elements in the image.`
}

export async function generateSceneImage(
  sceneDescription: string,
  style: AdventureStyle,
  heroDescriptions: string[] = []
): Promise<string | null> {
  const prompt = buildImagePrompt(sceneDescription, style, heroDescriptions)
  const cacheKey = prompt.slice(0, 300)
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!

  for (let i = workingModelIndex; i < IMAGE_MODEL_CANDIDATES.length; i++) {
    try {
      const model = genAI.getGenerativeModel({
        model: IMAGE_MODEL_CANDIDATES[i],
        generationConfig: imageGenerationConfig,
      })
      const result = await model.generateContent(prompt)

      const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
        (p) => 'inlineData' in p && p.inlineData
      )

      if (imagePart && 'inlineData' in imagePart && imagePart.inlineData) {
        const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
        imageCache.set(cacheKey, dataUrl)
        workingModelIndex = i
        return dataUrl
      }
      console.error(`Image model ${IMAGE_MODEL_CANDIDATES[i]} returned no image part`)
    } catch (error) {
      console.error(`Image model ${IMAGE_MODEL_CANDIDATES[i]} failed:`, error)
    }
  }
  return null
}
