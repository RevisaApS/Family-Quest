// The values layer: every adventure quietly carries ONE idea. The villain is
// built as a person who lives the opposite of it, and once per chapter the
// heroes meet a choice where the harder right thing gives up something they
// actually wanted.
//
// Nothing in this file is ever rendered to the players. The `da`/`en` phrasings
// exist for the grown-up's settings view (and for talking about it at dinner);
// `antiVirtue` and `dilemmaGuidance` are prompt fragments for the AI only.
//
// This module is deliberately dependency-free so it stays pure and testable.

export type ValueThemeId = 'control' | 'response' | 'hard-first' | 'others-anger'

export interface ValueTheme {
  id: ValueThemeId
  /** Kid-Danish phrasing. NEVER shown to players — grown-up's view only. */
  da: string
  /** English equivalent. NEVER shown to players — grown-up's view only. */
  en: string
  /**
   * What the villain embodies: a concrete person doing the opposite, never an
   * abstraction. Prompt fragment (English, goes to the model).
   */
  antiVirtue: string
  /**
   * What a genuinely costly choice looks like for this idea, in concrete
   * kid-legible terms. Prompt fragment (English, goes to the model).
   */
  dilemmaGuidance: string
}

// Rotation order. One theme per adventure, all four before any repeat.
export const VALUE_THEMES: readonly ValueTheme[] = [
  {
    id: 'control',
    da: 'Terningen bestemmer ikke, hvem du er. Du vælger, hvad du gør — terningen vælger kun, hvad der sker.',
    en: "The dice don't decide who you are. You choose what you do — the dice only choose what happens.",
    antiVirtue:
      'The villain is someone who tells people their fate is already decided, so there is no point in trying: a fortune-reader who shows villagers a picture of their own doom and then walks off with their tools, seed and savings while they stand still and wait for it. Their servants repeat it — "it is already written", "nothing you do changes it" — and the villain profits from every hand that stops working. Never explain this; only show people who have given up and one villain who arranged it.',
    dilemmaGuidance:
      'Someone offers a way to make the outcome certain — a marked map, a rigged lock, a charm sold as guaranteed luck, a bribe that skips the test — and the price is leaving a job half-finished or someone else holding the risk. The harder path is doing the thing themselves with no promise it works.',
  },
  {
    id: 'response',
    da: 'Det er ikke uheldet, der tæller. Det er, hvad du gør bagefter.',
    en: "It's not the bad luck that counts. It's what you do afterwards.",
    antiVirtue:
      'The villain is someone who never puts right what they break and always hands the blame to someone else: they cracked the mill dam and blamed the rain, burned a barn and blamed the boy who owned it, and they punish anyone caught repairing the damage. Wreckage with a shrug behind it, everywhere they have been. Never explain this; only show the mess, the excuse and the people forbidden to fix it.',
    dilemmaGuidance:
      'Something has just gone wrong — a rope snapped, a lantern was dropped in dry straw, a cart tipped into the ford. The tempting option walks on toward the prize that is still there for the taking (the open gate, the head start, the unguarded chest); the harder option stays and puts right what just happened, and the prize goes to somebody else.',
  },
  {
    id: 'hard-first',
    da: 'Tag det svære først. Så bliver resten lettere.',
    en: 'Do the hard thing first. Then the rest gets easier.',
    antiVirtue:
      'The villain is someone who always takes the quick way and lets other people carry what it costs: they sold the town\'s winter grain for a fast purse and now sell the same town water by the cup; they cut the dam instead of digging the channel and the low farms drowned. Their followers are given easy work and someone else\'s bill. Never explain this; only show the quick win and who is paying for it.',
    dilemmaGuidance:
      'Two ways forward: one short and sweet with a reward waiting right now (a chest nobody is guarding, a climb they can skip, a door someone else will open later), and one that starts with the heavy part — the long climb, the digging, the difficult question asked out loud — and pays nothing at all at first.',
  },
  {
    id: 'others-anger',
    da: 'Andres vrede er deres. Du behøver ikke tage den ind.',
    en: "Other people's anger is theirs. You don't have to take it in.",
    antiVirtue:
      'The villain is someone who runs on other people\'s tempers: a masked baiter who wins every fight by making the other side swing first, who sets brothers against each other with a whispered insult and collects whatever they smash. Taunts, needling, unfair names — and then a bow when the heroes lose their heads. Never explain this; only show the goading and what it wins them.',
    dilemmaGuidance:
      'Someone shouts at, taunts, cheats or insults a hero — and hitting back or shouting back comes with a real prize attached (the loud merchant\'s purse, the bully\'s shortcut key, the crowd finally on their side). The harder option keeps their hands down and their voice level, and that prize is gone.',
  },
] as const

export const ACT_COUNT = 3

export function themeById(id: ValueThemeId | string | null | undefined): ValueTheme | undefined {
  if (!id) return undefined
  return VALUE_THEMES.find(theme => theme.id === id)
}

/**
 * The adventure's theme. Deterministic rotation through all four before any
 * repeat, so weeks of play cover every idea with no setup step. A grown-up's
 * override always wins and does not consume a rotation step.
 */
export function nextTheme(rotationCount: number, override?: ValueThemeId | null): ValueTheme {
  const forced = themeById(override)
  if (forced) return forced
  const count = Number.isFinite(rotationCount) ? Math.trunc(rotationCount) : 0
  const index = ((count % VALUE_THEMES.length) + VALUE_THEMES.length) % VALUE_THEMES.length
  return VALUE_THEMES[index]
}

/** Which act (0-2) the quest is in. milestonesDone doubles as the chapter index. */
export function actIndex(milestonesDone: number): number {
  const done = Number.isFinite(milestonesDone) ? Math.trunc(milestonesDone) : 0
  return Math.min(Math.max(done, 0), ACT_COUNT - 1)
}

// A dilemma needs three real options, and battle forces all three to be
// attacks (src/lib/ai/actions.ts) — so only scenes with no live enemy qualify.
// Whitelisted rather than blacklisted: an unknown phase is treated as unsafe.
export function phaseAllowsDilemma(encounterPhase: string | undefined | null): boolean {
  return !encounterPhase || encounterPhase === 'none' || encounterPhase === 'just-defeated'
}

export interface DilemmaSchedule {
  /** Encounters beaten so far (0-3); doubles as the act index. */
  milestonesDone: number
  /** The act that already spent its one dilemma, or null. */
  lastDilemmaAct?: number | null
  encounterPhase?: string | null
  /** The opening scene is already inventing quest, villain and quest-giver. */
  isFirstScene?: boolean
  /** Adventures started before the values layer carry no theme, so no dilemma. */
  hasTheme?: boolean
}

/**
 * Exactly one dilemma per act, planted on the first eligible scene of an act
 * that hasn't had one. Deterministic (so it's diagnosable) and never during an
 * encounter.
 */
export function shouldPlantDilemma(schedule: DilemmaSchedule): boolean {
  if (!schedule.hasTheme) return false
  if (schedule.isFirstScene) return false
  if (!phaseAllowsDilemma(schedule.encounterPhase)) return false
  // The quest is over once every milestone is done — no more chapters to seed.
  if (schedule.milestonesDone >= ACT_COUNT) return false
  return actIndex(schedule.milestonesDone) !== (schedule.lastDilemmaAct ?? null)
}
