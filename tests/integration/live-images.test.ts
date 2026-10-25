import { describe, it, expect } from 'vitest'
import { writeFileSync } from 'node:fs'
import { generateHeroPortrait, generateMonsterPortrait, generateSceneImage } from '@/lib/ai/images'

// Picture preflight against the REAL Gemini API. Costs about 50 øre a run, so
// it stays off unless asked for:
//
//   set -a && . ./.env.local && set +a && LIVE_IMAGES=1 npx vitest run tests/integration/live-images.test.ts
//
// Add LIVE_IMAGES_OUT=<folder> to save the pictures and look at them.
const enabled = !!process.env.GOOGLE_AI_API_KEY && process.env.LIVE_IMAGES === '1'

const HERO =
  'Testo, a brave young boy ranger in a plain leaf-green cloth tunic, wearing a teal cape, carrying nothing at all: ' +
  'empty hands and no weapon, no armor, only plain cloth, a bare head, no helmet, no amulet or jewellery, bare feet, no boots'

const TROLL = {
  name: 'Mosetrolden',
  appearance: 'A hulking moss-green troll the size of a hut, with a mushroom-covered back, small amber eyes and one cracked tusk.',
}

const reference = (label: string, dataUrl: string) => {
  const [, mimeType, data] = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/)!
  return { label, image: { mimeType, data } }
}

function save(name: string, dataUrl: string) {
  const out = process.env.LIVE_IMAGES_OUT
  if (out) writeFileSync(`${out}/${name}.jpg`, Buffer.from(dataUrl.split(',')[1], 'base64'))
}

describe.skipIf(!enabled)('live images', () => {
  it('paints a portrait, then a scene that uses it as the reference', async () => {
    const portrait = await generateHeroPortrait(HERO)
    expect(portrait).toMatch(/^data:image\/[a-z]+;base64,/)
    save('portrait', portrait!)

    const scene = await generateSceneImage(
      'A hero waves from a rope bridge over a misty river at dawn',
      'whimsical',
      [HERO],
      [reference('Testo', portrait!)]
    )
    expect(scene).toMatch(/^data:image\/[a-z]+;base64,/)
    save('scene', scene!)
  }, 120_000)

  // Part 2's check: Steven compares troll-1 and troll-2 by eye
  it('paints the same troll in two scenes from one monster portrait', async () => {
    const portrait = await generateMonsterPortrait(TROLL.name, TROLL.appearance, 'realistic')
    expect(portrait).toMatch(/^data:image\/[a-z]+;base64,/)
    save('troll-portrait', portrait!)

    const scenes = [
      'Mosetrolden blocks a mossy stone bridge in a foggy forest, roaring at the hero',
      'Mosetrolden swings a fallen log at the hero beside a waterfall',
    ]
    for (const [i, scene] of scenes.entries()) {
      const image = await generateSceneImage(scene, 'realistic', [HERO], [reference(TROLL.name, portrait!)], TROLL)
      expect(image).toMatch(/^data:image\/[a-z]+;base64,/)
      save(`troll-${i + 1}`, image!)
    }
  }, 180_000)
})
