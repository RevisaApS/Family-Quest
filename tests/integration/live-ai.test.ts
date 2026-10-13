import { describe, it, expect } from 'vitest'
import { generateScene } from '@/lib/ai/story'
import { generateActions } from '@/lib/ai/actions'
import { generateOutcome } from '@/lib/ai/outcomes'
import { joinSegments } from '@/lib/ai/segments'
import type { StoryContext } from '@/types/ai'

// Preflight against the REAL Gemini API — run this before a session to prove
// the key works, the model ids resolve, and every scene comes back parseable:
//
//   set -a && . ./.env.local && set +a && npx vitest run tests/integration
//
// Skipped automatically when no key is present, so CI stays offline.
const hasKey = !!process.env.GOOGLE_AI_API_KEY
const REPEATS = 5

const context: StoryContext = {
  adventureStyle: 'realistic',
  language: 'da',
  // The real on-disk format written by handleContinue: bracketed meta, then
  // pure story-language prose.
  storyHistory: [
    '[Ravn · Jeg sniger mig langs muren · ✓] Ravn gled gennem skyggerne som en kat og nåede porten uden en lyd.',
    '[Storm · Jeg sprænger låsen med en ildkugle · ~] Låsen sprang op, men et brøl lød dybt inde fra borgen.',
  ],
  characters: [
    {
      playerId: 'p-lucas', playerName: 'Lucas', characterName: 'Ravn', class: 'rogue',
      rpg: {
        level: 2, hp: 6, maxHp: 7, knockedOut: false,
        skillNames: ['Snu Finte'], gearNames: ['Jernsværd'], petName: 'Banjo',
      },
    },
    {
      playerId: 'p-mason', playerName: 'Mason', characterName: 'Storm', class: 'wizard',
      rpg: { level: 2, hp: 7, maxHp: 7, knockedOut: false, skillNames: ['Ildkugle'], gearNames: [] },
    },
  ],
  currentPlayerId: 'p-mason',
  encounterPhase: 'none',
  quest: {
    title: 'Den Sorte Krones Forbandelse',
    goal: 'Find den stjålne krone og bryd forbandelsen over landsbyen.',
    villain: 'Skyggegreven',
    milestonesDone: 1,
  },
}

describe.skipIf(!hasKey)('live Gemini calls', () => {
  it(`returns a parseable scene ${REPEATS} times running`, async () => {
    const scenes = await Promise.all(
      Array.from({ length: REPEATS }, () => generateScene(context))
    )
    for (const scene of scenes) {
      expect(scene.narration.length).toBeGreaterThan(20)
      expect(scene.imagePrompt.length).toBeGreaterThan(20)
      expect(['p-lucas', 'p-mason']).toContain(scene.suggestedNextPlayer)
      // The story-memory lines are bracketed meta — the DM must not copy that
      // shape into what the family actually hears read aloud.
      expect(scene.narration).not.toMatch(/\[.+·.+\]/)
      // The scene comes back as segments for the narrator, and the page text
      // is exactly those segments joined
      expect(scene.segments.length).toBeGreaterThan(0)
      expect(joinSegments(scene.segments, 'da')).toBe(scene.narration)
      for (const segment of scene.segments) expect(segment.text.trim()).toBeTruthy()
    }
    const lines = scenes.flatMap(s => s.segments.filter(seg => seg.speaker === 'character'))
    console.log(`\n--- ${lines.length} spoken line(s) across ${REPEATS} scenes ---\n${lines.map(l => `${l.name} (${l.voice}): ${l.text}`).join('\n')}\n`)
    // Dialogue is optional and short: never more than two lines in a scene
    for (const scene of scenes) {
      expect(scene.segments.filter(seg => seg.speaker === 'character').length).toBeLessThanOrEqual(2)
    }
  }, 120_000)

  it('sets quest, goal and villain on the opening scene', async () => {
    const scene = await generateScene({
      ...context,
      isFirstScene: true,
      storyHistory: [],
      quest: null,
    })
    // These only come back if the dynamic schema declared them.
    expect(scene.questTitle?.trim()).toBeTruthy()
    expect(scene.questGoal?.trim()).toBeTruthy()
    expect(scene.villainName?.trim()).toBeTruthy()
  }, 60_000)

  it('names the monster when one arrives', async () => {
    const scene = await generateScene({ ...context, encounterPhase: 'arriving-monster' })
    expect(scene.encounterName?.trim()).toBeTruthy()
  }, 60_000)

  it('returns exactly 3 actions with valid stats and scene fits', async () => {
    const actions = await generateActions(context, 'Porten står åben mod en mørk slotsgård.')
    expect(actions).toHaveLength(3)
    for (const action of actions) {
      expect(['strength', 'magic', 'agility', 'heart']).toContain(action.stat)
      expect(['good', 'okay', 'risky']).toContain(action.sceneFit)
      expect(action.text.trim()).toBeTruthy()
    }
  }, 60_000)

  it('calls back to villains the family already beat', async () => {
    const pastAdventures = [
      { questTitle: 'Solstenens Vogtere', villain: 'Skyggeherren Malakor' },
      { questTitle: 'Frostkongens Fald', villain: 'Frostkongen' },
    ]
    const scene = await generateScene({
      ...context,
      isFirstScene: true,
      storyHistory: [],
      quest: null,
      pastAdventures,
    })
    console.log('\n--- opening scene for returning heroes ---\n' + scene.narration + '\n')
    // A returning family's opening must name one past villain or quest. Whole
    // names only, with an optional Danish genitive "s": the old substring
    // markers passed on "helt galt", "ryster" and "Pigen" without any nod.
    const names = pastAdventures.flatMap(a => [a.questTitle, ...a.villain.split(' ')])
    const said = (text: string) =>
      names.filter(name => new RegExp(`(?<!\\p{L})${name}s?(?!\\p{L})`, 'iu').test(text))
    expect(said(scene.narration), scene.narration).not.toHaveLength(0)
    // The nod is history: the new quest still gets a villain of its own.
    expect(said(scene.villainName ?? ''), scene.villainName).toHaveLength(0)
  }, 60_000)

  it('narrates an outcome as plain prose', async () => {
    const narrative = await generateOutcome({
      storyContext: context,
      actionChosen: 'Jeg kaster en ildkugle mod porten',
      stat: 'magic',
      outcome: 'success',
      currentScene: 'Porten står åben mod en mørk slotsgård.',
      crit: 'crit',
    })
    expect(narrative.length).toBeGreaterThan(20)
    expect(narrative).not.toContain('{')
  }, 60_000)
})
