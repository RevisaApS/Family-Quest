import type { Language } from '@/lib/ai/language'
import type { Stat } from '@/types/game'

// Kid-facing UI strings for the RPG layer. The story itself is localized by
// the AI; these are the fixed labels around it.
const STRINGS = {
  levelUp: { da: 'Niveau op!', en: 'Level Up!' },
  pickPower: { da: 'Vælg din nye kraft', en: 'Pick your new power' },
  treasureFound: { da: 'Du fandt en skat!', en: 'You found treasure!' },
  tapToOpen: { da: 'Tryk på kisten for at åbne den', en: 'Tap the chest to open it' },
  equip: { da: 'Tag på', en: 'Equip' },
  replaceQuestion: { da: 'Byt med', en: 'Swap with' },
  keepCurrent: { da: 'Behold', en: 'Keep' },
  knockedOut: { da: 'er slået omkuld!', en: 'is knocked out!' },
  rescuedBy: { da: 'hjælper', en: 'helps' },
  backUp: { da: 'på benene igen!', en: 'back on their feet!' },
  soloRecover: { da: 'rejser sig igen!', en: 'gets back up!' },
  bossAppears: { da: 'BOSSKAMP!', en: 'BOSS FIGHT!' },
  bossDefeated: { da: 'Bossen er besejret!', en: 'The boss is defeated!' },
  victory: { da: 'Eventyret er fuldført!', en: 'Adventure complete!' },
  victorySub: { da: 'I er ægte helte!', en: 'You are true heroes!' },
  keepPlaying: { da: 'Spil videre', en: 'Keep playing' },
  newAdventure: { da: 'Nyt eventyr', en: 'New adventure' },
  damageTaken: { da: 'liv mistet', en: 'damage taken' },
  level: { da: 'Niv.', en: 'Lv.' },
  rare: { da: 'Sjælden!', en: 'Rare!' },
  shop: { da: 'Butikken', en: 'The Shop' },
  buy: { da: 'Køb', en: 'Buy' },
  equipped: { da: 'I brug', en: 'Equipped' },
  yourGold: { da: 'Dit guld', en: 'Your gold' },
  goldFound: { da: 'Du fandt guld!', en: 'You found gold!' },
  takeGold: { da: 'Tag guldet', en: 'Take the gold' },
  bossGoldReward: { da: 'guld til alle helte!', en: 'gold for every hero!' },
  inventory: { da: 'Udstyr', en: 'Inventory' },
  skills: { da: 'Kræfter', en: 'Powers' },
  empty: { da: 'Tom', en: 'Empty' },
  close: { da: 'Luk', en: 'Close' },
  rollToSucceed: { da: 'Slå', en: 'Roll' },
  orMore: { da: 'eller mere', en: 'or more' },
  partialFrom: { da: 'delvist fra', en: 'partial from' },
  critHit: { da: 'KRITISK HIT!', en: 'CRITICAL HIT!' },
  fumble: { da: 'Sikke et fumleri!', en: 'What a fumble!' },
  monsterAppears: { da: 'ET UHYRE!', en: 'A MONSTER!' },
  monsterDefeated: { da: 'Uhyret er besejret!', en: 'Monster defeated!' },
  finishingBlow: { da: 'gav dødsstødet!', en: 'landed the finishing blow!' },
  goldForAll: { da: 'guld til alle', en: 'gold for everyone' },
  questLabel: { da: 'Eventyret', en: 'The Quest' },
  usePowerLabel: { da: 'Brug kraft', en: 'Use power' },
  yourDice: { da: 'Hvilke terninger har I?', en: 'Which dice do you have?' },
  diceNote: { da: 'Handlinger bruger en d20. Mangler I den, ruller appen digitalt.', en: 'Actions use a d20. If you don\'t have one, the app rolls digitally.' },
  tapYourRoll: { da: 'Kast din terning, og tryk på dit resultat:', en: 'Roll your die, then tap your result:' },
  shopHint: { da: 'Butikken! Her kan I købe udstyr for jeres guld', en: 'The shop! Buy gear here with your gold' },
  gotIt: { da: 'Forstået!', en: 'Got it!' },
  whatDoYouDo: { da: 'Hvad gør du?', en: 'What do you do?' },
  ownIdea: { da: 'Min egen idé!', en: 'My own idea!' },
  ownIdeaPlaceholder: { da: 'Skriv din plan her...', en: 'Type your plan here...' },
  ownIdeaGo: { da: 'Gør det!', en: 'Do it!' },
  ownIdeaThinking: { da: 'Fortælleren tænker over din idé...', en: 'The storyteller is judging your idea...' },
  assistTitle: { da: 'Hvem hjælper til?', en: 'Who helps?' },
  determination: { da: 'Kampvilje', en: 'Determination' },
  weakSpot: { da: 'Svagt punkt', en: 'Weak spot' },
  enraged: { da: 'RASENDE!', en: 'ENRAGED!' },
  potionsLabel: { da: 'Drikke', en: 'Potions' },
  petsLabel: { da: 'Kæledyr', en: 'Pets' },
  petLabel: { da: 'Kæledyr', en: 'Pet' },
  yours: { da: 'Din ven!', en: 'Your friend!' },
} as const

export type StringKey = keyof typeof STRINGS

export function t(key: StringKey, language: Language): string {
  return STRINGS[key][language]
}

// Everyday words only — an 8-year-old must know every one of these.
const STAT_LABELS: Record<Stat, Record<Language, string>> = {
  strength: { da: 'Styrke', en: 'Strength' },
  magic: { da: 'Magi', en: 'Magic' },
  agility: { da: 'Hurtighed', en: 'Speed' },
  heart: { da: 'Mod', en: 'Courage' },
}

export function statLabel(stat: Stat, language: Language): string {
  return STAT_LABELS[stat][language]
}
