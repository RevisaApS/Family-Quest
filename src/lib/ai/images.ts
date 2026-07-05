import { GoogleGenerativeAI, type GenerationConfig, type Part } from '@google/generative-ai'
import type { AdventureStyle } from '@/types/game'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Nano Banana Pro first (best quality), plain Nano Banana as fallback for
// accounts/regions where the Pro model is unavailable.
const IMAGE_MODEL_CANDIDATES = ['gemini-3-pro-image-preview', 'gemini-2.5-flash-image']
let workingModelIndex = 0

export interface ReferenceImage {
  mimeType: string
  data: string // base64, no data: prefix
}

// One shared base look so the whole adventure feels like one illustrated book,
// with the adventure style shifting tone rather than technique.
const BASE_STYLE =
  'Epic painterly fantasy artwork in the style of classic tabletop RPG book covers. ' +
  'Dramatic composition, rich colors, detailed digital painting, cinematic lighting.'

const STYLE_TONES: Record<AdventureStyle, string> = {
  whimsical: 'Bright, warm and friendly mood. Rounded, cheerful details. Nothing scary.',
  realistic:
    'Epic and adventurous with a dark, cool edge — dramatic shadows, stormlight, mist, ' +
    'fierce monsters with glowing eyes. Thrilling and a little spooky, but heroic. No gore.',
  dark: 'Moody, mysterious atmosphere with rich shadows, but still heroic and hopeful.',
}

const imageCache = new Map<string, string>()

// The image API needs response modalities + aspect ratio, which the older
// SDK's GenerationConfig type doesn't know about — the API accepts them.
function imageGenerationConfig(aspectRatio: '16:9' | '1:1'): GenerationConfig {
  return {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: { aspectRatio },
  } as GenerationConfig
}

async function generateImage(
  parts: Part[],
  aspectRatio: '16:9' | '1:1'
): Promise<string | null> {
  for (let i = workingModelIndex; i < IMAGE_MODEL_CANDIDATES.length; i++) {
    try {
      const model = genAI.getGenerativeModel({
        model: IMAGE_MODEL_CANDIDATES[i],
        generationConfig: imageGenerationConfig(aspectRatio),
      })
      const result = await model.generateContent(parts)

      const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
        (p) => 'inlineData' in p && p.inlineData
      )

      if (imagePart && 'inlineData' in imagePart && imagePart.inlineData) {
        workingModelIndex = i
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
      }
      console.error(`Image model ${IMAGE_MODEL_CANDIDATES[i]} returned no image part`)
    } catch (error) {
      console.error(`Image model ${IMAGE_MODEL_CANDIDATES[i]} failed:`, error)
    }
  }
  return null
}

export function buildImagePrompt(
  sceneDescription: string,
  style: AdventureStyle,
  heroDescriptions: string[] = [],
  hasReferencePortraits = false
): string {
  const heroes = heroDescriptions.length
    ? hasReferencePortraits
      ? ` The heroes in this scene are the characters shown in the attached reference portraits: ${heroDescriptions.join('; ')}. Keep each hero's face, hair, outfit and colors EXACTLY as in their reference portrait.`
      : ` The heroes in this scene: ${heroDescriptions.join('; ')}. Keep each hero's appearance exactly as described.`
    : ''
  return `${BASE_STYLE} ${STYLE_TONES[style]} Scene: ${sceneDescription}.${heroes} No text, letters, or UI elements in the image.`
}

export async function generateSceneImage(
  sceneDescription: string,
  style: AdventureStyle,
  heroDescriptions: string[] = [],
  heroPortraits: ReferenceImage[] = []
): Promise<string | null> {
  // Key on the FULL prompt: the fixed style prefix alone is longer than any
  // truncated key, and a truncated key made every scene "identical" — the
  // whole adventure got stuck on the first cached image.
  const prompt = buildImagePrompt(sceneDescription, style, heroDescriptions, heroPortraits.length > 0)
  const cacheKey = prompt
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!

  const parts: Part[] = [
    ...heroPortraits.map(p => ({ inlineData: { mimeType: p.mimeType, data: p.data } })),
    { text: prompt },
  ]
  const dataUrl = await generateImage(parts, '16:9')
  if (dataUrl) imageCache.set(cacheKey, dataUrl)
  return dataUrl
}

// Rarity must be legible at a glance: +0 junk looks like junk, +3 legendary
// gear looks like a museum piece. The bonus drives the visual quality cue.
const ITEM_QUALITY = [
  'Shabby, bent and worn out, comically poor quality — obviously the worst gear imaginable.',
  'Simple and sturdy with plain, honest craftsmanship. Nothing fancy.',
  'Finely crafted and impressive, with subtle magical details and a faint glow.',
  'Legendary and awe-inspiring, radiating magical power, dramatic glow and sparks.',
] as const

export function buildItemImagePrompt(
  name: string,
  look: string,
  bonus: number,
  style: AdventureStyle
): string {
  const quality = ITEM_QUALITY[Math.max(0, Math.min(3, Math.round(bonus)))]
  return (
    `${BASE_STYLE} ${STYLE_TONES[style]} ` +
    `A single fantasy RPG item on display: "${name}" — ${look}. ${quality} ` +
    'Centered still-life of the item alone, filling the frame, on a simple atmospheric background. ' +
    'No people, no creatures, no text, letters or UI elements in the image.'
  )
}

export async function generateItemImage(
  name: string,
  look: string,
  bonus: number,
  style: AdventureStyle
): Promise<string | null> {
  const prompt = buildItemImagePrompt(name, look, bonus, style)
  if (imageCache.has(prompt)) return imageCache.get(prompt)!
  const dataUrl = await generateImage([{ text: prompt }], '1:1')
  if (dataUrl) imageCache.set(prompt, dataUrl)
  return dataUrl
}

// One-off hero portrait made at character creation — becomes the visual
// anchor for that hero in every later scene image.
export async function generateHeroPortrait(heroDescription: string): Promise<string | null> {
  const prompt =
    `${BASE_STYLE} Character portrait, waist-up, centered, looking at the viewer with a confident smile. ` +
    `Subject: ${heroDescription}. Simple softly-lit fantasy background. ` +
    'Friendly and heroic, suitable for children. No text or letters in the image.'
  return generateImage([{ text: prompt }], '1:1')
}
