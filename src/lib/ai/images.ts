import { Modality, type GenerateContentConfig, type Part } from '@google/genai'
import { genai } from './gemini'
import type { AdventureStyle } from '@/types/game'

// Nano Banana 2.1 first: it won Steven's blind portrait test 4.67 to 3.00 on
// 2026-10-11 and costs about a quarter of Pro per image. Nano Banana Pro is the
// fallback for accounts/regions where 2.1 is unavailable. The Pro preview id
// was shut down on 2026-06-25 and plain Nano Banana is legacy, so both old ids
// failed every portrait before an adventure could start.
const IMAGE_MODEL_CANDIDATES = ['gemini-nano-banana-2.1', 'gemini-3-pro-image']
let workingModelIndex = 0

export interface ReferenceImage {
  mimeType: string
  data: string // base64, no data: prefix
}

// A reference image goes in right after a text part naming who it shows, so
// the prompt can point at "the reference labelled Lyn" instead of guessing
// which picture is whose.
export interface LabelledReference {
  label: string
  image: ReferenceImage
}

// The monster or boss in a fight, with the look fixed when it arrived
export interface SceneCreature {
  name: string
  appearance: string
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

// The realistic tone's stock "fierce monsters with glowing eyes" would fight
// a creature's fixed look, so it is left out whenever one is given.
const REALISTIC_TONE_FIXED_CREATURE =
  'Epic and adventurous with a dark, cool edge: dramatic shadows, stormlight, mist. ' +
  'Thrilling and a little spooky, but heroic. No gore.'

function styleTone(style: AdventureStyle, fixedCreature: boolean): string {
  return fixedCreature && style === 'realistic' ? REALISTIC_TONE_FIXED_CREATURE : STYLE_TONES[style]
}

const sentence = (text: string) => `${text.trim().replace(/[.!\s]+$/, '')}.`

const imageCache = new Map<string, string>()

function imageGenerationConfig(aspectRatio: '16:9' | '1:1'): GenerateContentConfig {
  return {
    responseModalities: [Modality.TEXT, Modality.IMAGE],
    imageConfig: { aspectRatio },
  }
}

async function generateImage(
  parts: Part[],
  aspectRatio: '16:9' | '1:1'
): Promise<string | null> {
  for (let i = workingModelIndex; i < IMAGE_MODEL_CANDIDATES.length; i++) {
    try {
      const response = await genai().models.generateContent({
        model: IMAGE_MODEL_CANDIDATES[i],
        contents: [{ role: 'user', parts }],
        config: imageGenerationConfig(aspectRatio),
      })

      const image = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data)?.inlineData

      if (image?.data) {
        workingModelIndex = i
        return `data:${image.mimeType ?? 'image/png'};base64,${image.data}`
      }
      console.error(`Image model ${IMAGE_MODEL_CANDIDATES[i]} returned no image part`)
    } catch (error) {
      console.error(`Image model ${IMAGE_MODEL_CANDIDATES[i]} failed:`, error)
    }
  }
  return null
}

// The kids buy gear and then look for it in the picture, so equipment is the
// one part of a scene that has to be literally right: everything they earned
// visible, and nothing they haven't earned handed to them for free.
const GEAR_RULE =
  " Equipment accuracy is the most important thing in this picture: paint every item a hero is described as carrying so it is large, unobstructed and instantly recognisable, and never give a hero a weapon, shield, armor, helmet, amulet or boots that their description does not list."

export interface ImagePromptOptions {
  // At least one hero portrait is attached, labelled with the hero's name
  heroReferences?: boolean
  creature?: SceneCreature | null
  // The creature's portrait is attached, labelled with its name
  creatureReference?: boolean
}

export function buildImagePrompt(
  sceneDescription: string,
  style: AdventureStyle,
  heroDescriptions: string[] = [],
  opts: ImagePromptOptions = {}
): string {
  const heroes = heroDescriptions.length
    ? opts.heroReferences
      ? ` The heroes in this scene: ${heroDescriptions.join('; ')}. Each attached reference portrait follows a label with the name of who it shows. Take each hero's face, hair, skin and body from the reference labelled with their name. The written description above — not the portrait — decides their equipment: ignore any weapon, armor, helmet, jewellery or boots visible in a reference portrait unless the description lists it too.`
      : ` The heroes in this scene: ${heroDescriptions.join('; ')}. Keep each hero's appearance exactly as described.`
    : ''
  const creature = opts.creature
    ? ` The creature is ${opts.creature.name}: ${sentence(opts.creature.appearance)}` +
      (opts.creatureReference ? ` It must match the reference labelled ${opts.creature.name}.` : '')
    : ''
  const gearRule = heroDescriptions.length ? GEAR_RULE : ''
  return `${BASE_STYLE} ${styleTone(style, !!opts.creature)} Scene: ${sceneDescription}.${heroes}${creature}${gearRule} No text, letters, or UI elements in the image.`
}

// Each picture right after the text part that names it
export function referenceParts(references: LabelledReference[]): Part[] {
  return references.flatMap(r => [
    { text: `Reference: ${r.label}` },
    { inlineData: { mimeType: r.image.mimeType, data: r.image.data } },
  ])
}

export async function generateSceneImage(
  sceneDescription: string,
  style: AdventureStyle,
  heroDescriptions: string[] = [],
  references: LabelledReference[] = [],
  creature: SceneCreature | null = null
): Promise<string | null> {
  // Key on the FULL prompt: the fixed style prefix alone is longer than any
  // truncated key, and a truncated key made every scene "identical" — the
  // whole adventure got stuck on the first cached image.
  const creatureReference = !!creature && references.some(r => r.label === creature.name)
  const prompt = buildImagePrompt(sceneDescription, style, heroDescriptions, {
    heroReferences: references.some(r => r.label !== creature?.name),
    creature,
    creatureReference,
  })
  const cacheKey = prompt
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey)!

  const parts: Part[] = [...referenceParts(references), { text: prompt }]
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
// anchor for that hero in every later scene image. The hero owns nothing at
// this point, so the portrait must show an empty-handed kid: it is the
// "before" picture the first bought item gets compared against.
export async function generateHeroPortrait(heroDescription: string): Promise<string | null> {
  const prompt =
    `${BASE_STYLE} Character portrait, waist-up, centered, looking at the viewer with a confident smile. ` +
    `Subject: ${heroDescription}. Simple softly-lit fantasy background. ` +
    'Paint only what the description lists — do not add any weapon, shield, armor, helmet or jewellery that it does not mention. ' +
    'Friendly and heroic, suitable for children. No text or letters in the image.'
  return generateImage([{ text: prompt }], '1:1')
}

export function buildMonsterPortraitPrompt(name: string, appearance: string, style: AdventureStyle): string {
  return (
    `${BASE_STYLE} ${styleTone(style, true)} ` +
    `Creature portrait of ${name}: ${sentence(appearance)} ` +
    'The whole creature, centered and facing the viewer, on a simple atmospheric background. ' +
    'Only this one creature: no people, no heroes. No text or letters in the image.'
  )
}

// One portrait per monster, painted when it arrives. It is the reference for
// every scene of that fight, so the creature stays the same creature.
export async function generateMonsterPortrait(
  name: string,
  appearance: string,
  style: AdventureStyle
): Promise<string | null> {
  return generateImage([{ text: buildMonsterPortraitPrompt(name, appearance, style) }], '1:1')
}
