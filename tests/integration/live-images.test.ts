import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { generateHeroPortrait, generateSceneImage } from '@/lib/ai/images'

// Picture preflight against the REAL Gemini API. Costs about 50 øre a run, so
// it stays off unless asked for:
//
//   set -a && . ./.env.local && set +a && LIVE_IMAGES=1 npx vitest run tests/integration/live-images.test.ts
//
// Add LIVE_IMAGES_OUT=<folder> to save the two pictures and look at them.
const enabled = !!process.env.GOOGLE_AI_API_KEY && process.env.LIVE_IMAGES === '1'

const HERO =
  'Testo, a brave young boy ranger in a plain leaf-green cloth tunic, wearing a teal cape, carrying nothing at all: ' +
  'empty hands and no weapon, no armor, only plain cloth, a bare head, no helmet, no amulet or jewellery, bare feet, no boots'

function save(name: string, dataUrl: string) {
  const out = process.env.LIVE_IMAGES_OUT
  if (out) writeFileSync(`${out}/${name}.jpg`, Buffer.from(dataUrl.split(',')[1], 'base64'))
}

describe.skipIf(!enabled)('live images', () => {
  it('paints a portrait, then a scene that uses it as the reference', async () => {
    const portrait = await generateHeroPortrait(HERO)
    expect(portrait).toMatch(/^data:image\/[a-z]+;base64,/)
    save('portrait', portrait!)

    const [, mimeType, data] = portrait!.match(/^data:(image\/[a-z]+);base64,(.+)$/)!
    const scene = await generateSceneImage(
      'A hero waves from a rope bridge over a misty river at dawn',
      'whimsical',
      [HERO],
      [{ mimeType, data }]
    )
    expect(scene).toMatch(/^data:image\/[a-z]+;base64,/)
    save('scene', scene!)
  }, 120_000)
})
