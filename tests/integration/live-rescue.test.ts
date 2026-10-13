import { describe, it, expect } from 'vitest'
import { generateOutcome } from '@/lib/ai/outcomes'
import type { StoryContext } from '@/types/ai'

// Preflight against the REAL Gemini API for the knock-out and the teammate
// rescue (playtest 2026-10-12: Steven's hero went down and nothing said so).
// The knock-out must be told, and told gently; a rescue must be told as the
// friend helping. Skipped without a key.
const hasKey = !!process.env.GOOGLE_AI_API_KEY
const REPEATS = 3

const context: StoryContext = {
  adventureStyle: 'realistic',
  language: 'da',
  storyHistory: [
    '[Ravn · Jeg sniger mig ind bag trolden · ~] Ravn kom tæt på, men trolden snusede og vendte sig om.',
  ],
  characters: [
    {
      playerId: 'p-steven', playerName: 'Steven', characterName: 'Aldor', class: 'warrior',
      rpg: { level: 2, hp: 3, maxHp: 7, knockedOut: false, skillNames: [], gearNames: [] },
    },
    {
      playerId: 'p-lucas', playerName: 'Lucas', characterName: 'Ravn', class: 'rogue',
      rpg: { level: 2, hp: 6, maxHp: 7, knockedOut: false, skillNames: [], gearNames: [] },
    },
  ],
  currentPlayerId: 'p-steven',
  encounterPhase: 'active',
  encounter: { kind: 'monster', name: 'Mosetrolden', hp: 4, maxHp: 5 },
  quest: { title: 'Den Sorte Krone', goal: 'Find kronen', villain: 'Skyggegreven', milestonesDone: 0 },
}

// Words that would make a knock-out frightening for an 8-year-old
const SCARY = /\b(blod\w*|død\w*|dræb\w*|dør\b|bevidstløs\w*|skrig\w*|rædsel\w*|sår\b|knogle\w*|brækk\w*)/i
// Ways the story can say the hero went down: stars, birds, dizzy, sitting down, knocked over
const KNOCKOUT = /(stjern|fugl|svimmel|svimle|omkuld|sætter sig|satte sig|sidder|dump|ør i hovedet|vakler|vaklende|slået ud|går i gulvet|segner)/i
// Ways the story can say the friend helped them up
const HELP_UP = /(hjælp|op igen|på benene|op at stå|op og stå|rejse|hive|trække|løfte|rækker|hånd)/i

describe.skipIf(!hasKey)('live Gemini: knock-out and rescue', () => {
  it('tells the knock-out, gently', async () => {
    const narratives = await Promise.all(Array.from({ length: REPEATS }, () => generateOutcome({
      storyContext: context,
      actionChosen: 'Jeg løber direkte mod trolden med hævet næve',
      stat: 'strength',
      outcome: 'failure',
      currentScene: 'Mosetrolden står på broen og brøler.',
      damageTaken: 3,
      knockedOut: true,
    })))
    console.log(`\n--- knock-out ---\n${narratives.join('\n\n')}\n`)
    for (const narrative of narratives) {
      expect(narrative.length).toBeGreaterThan(20)
      expect(narrative, narrative).toMatch(KNOCKOUT)
      expect(narrative, narrative).not.toMatch(SCARY)
    }
  }, 90_000)

  it('tells a rescue as the friend helping them up', async () => {
    const narratives = await Promise.all(Array.from({ length: REPEATS }, (_, i) => generateOutcome({
      storyContext: {
        ...context,
        currentPlayerId: 'p-lucas',
        characters: context.characters.map(c =>
          c.playerId === 'p-steven' ? { ...c, rpg: { ...c.rpg!, hp: 0, knockedOut: true } } : c),
      },
      actionChosen: 'Hjælp Aldor op',
      stat: 'heart',
      // One of each: the rescue always gets Aldor up, the result only says how well
      outcome: (['success', 'partial', 'failure'] as const)[i % 3],
      currentScene: 'Aldor sidder svimmel på broen, og Mosetrolden griner.',
      rescueTargetName: 'Aldor',
    })))
    console.log(`\n--- rescue ---\n${narratives.join('\n\n')}\n`)
    for (const narrative of narratives) {
      expect(narrative, narrative).toContain('Aldor')
      expect(narrative, narrative).toMatch(HELP_UP)
      expect(narrative, narrative).not.toMatch(SCARY)
    }
  }, 90_000)
})
