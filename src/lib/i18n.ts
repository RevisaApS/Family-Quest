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
  rollTheDice: { da: 'Kast d20!', en: 'Roll the d20!' },
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
  petNamePrompt: { da: 'Hvad skal den hedde?', en: 'What will you call it?' },
  hallTitle: { da: 'Heltehallen', en: 'Hall of Heroes' },
  hallEmpty: { da: 'Fuldfør jeres første eventyr — så bliver jeres saga skrevet her!', en: 'Complete your first adventure — your legend will be written here!' },
  adventuresLabel: { da: 'Eventyr', en: 'Adventures' },
  critsLabel: { da: 'Kritiske hit', en: 'Critical hits' },
  successesLabel: { da: 'Sejre', en: 'Successes' },
  villainsDefeated: { da: 'Besejrede skurke', en: 'Villains defeated' },
  storybook: { da: 'Eventyrbogen', en: 'Storybook' },
  awardsTitle: { da: 'Udmærkelser', en: 'Awards' },
  epilogueWriting: { da: 'Fortælleren skriver jeres saga...', en: 'The storyteller is writing your tale...' },
  cheerHint: { da: 'hepper!', en: 'cheers!' },

  // Home
  welcomeSub: { da: 'Tag på magiske eventyr sammen', en: 'Embark on magical adventures together' },
  beginJourney: { da: 'Begynd jeres rejse', en: 'Begin Your Journey' },
  storyAwaits: { da: 'Jeres historie venter', en: 'Your story awaits' },
  continueList: { da: 'Eller fortsæt et eventyr:', en: 'Or continue an adventure:' },
  deleteWord: { da: 'Slet', en: 'Delete' },
  cannotUndo: { da: 'Det kan ikke fortrydes.', en: 'This cannot be undone.' },

  // Shared chrome
  back: { da: 'Tilbage', en: 'Back' },
  cancel: { da: 'Annullér', en: 'Cancel' },
  continueWord: { da: 'Fortsæt', en: 'Continue' },

  // Onboarding steps
  stepPlayers: { da: 'Spillere', en: 'Players' },
  stepSettings: { da: 'Indstillinger', en: 'Settings' },
  stepCharacters: { da: 'Helte', en: 'Characters' },

  // Players page
  whosPlaying: { da: 'Hvem spiller?', en: "Who's Playing?" },
  selectAdventurers: { da: 'Vælg 1-4 eventyrere til dagens eventyr', en: "Select 1-4 adventurers for today's quest" },
  doneEditing: { da: 'Færdig', en: 'Done Editing' },
  editPlayers: { da: 'Redigér spillere', en: 'Edit Players' },
  nameLabel: { da: 'Navn', en: 'Name' },
  ageLabel: { da: 'Alder', en: 'Age' },
  enterPlayerName: { da: 'Skriv spillerens navn', en: 'Enter player name' },
  enterAge: { da: 'Skriv alder', en: 'Enter age' },
  addPlayer: { da: 'Tilføj spiller', en: 'Add Player' },
  addAnotherPlayer: { da: '+ Tilføj en spiller til', en: '+ Add Another Player' },
  selectedWord: { da: 'valgt', en: 'selected' },
  removePlayerTitle: { da: 'Fjern spiller?', en: 'Remove Player?' },
  removeWord: { da: 'Fjern', en: 'Remove' },
  removeFromParty: { da: 'fra eventyrgruppen?', en: 'from the adventuring party?' },

  // Settings page
  settingsTitle: { da: 'Indstillinger', en: 'Settings' },
  settingsSub: { da: 'Tilpas jeres eventyr', en: 'Customize your adventure experience' },
  whatDoTheseMean: { da: 'ℹ️ Hvad betyder de her?', en: 'ℹ️ What do these mean?' },
  hideGuide: { da: 'Skjul hjælpen', en: 'Hide guide' },
  infoStyle: { da: 'Eventyrstil: Sætter tonen — Eventyrlig til de yngste (4-7), Episk til seje monstereventyr (7-12), Dyster til teenagere (13+)', en: 'Adventure Style: Sets the tone - Whimsical for younger kids (4-7), Epic for cool monster-filled adventure (7-12), Dark for teens (13+)' },
  infoDifficulty: { da: 'Sværhedsgrad: Let = blid, Mellem = balanceret, Svær = rigtige konsekvenser', en: 'Difficulty: Easy = gentle, Medium = balanced, Hard = real consequences' },
  infoDice: { da: 'Terninger: Digital = tryk for at rulle i appen, Fysisk = brug jeres egne terninger', en: 'Dice: Digital = tap to roll in-app, Physical = use your own dice' },
  infoLanguage: { da: 'Sprog: Det sprog, eventyret fortælles på', en: 'Language: The language the adventure is told in' },
  adventureStyleLabel: { da: 'Eventyrstil', en: 'Adventure Style' },
  difficultyLabel: { da: 'Sværhedsgrad', en: 'Difficulty' },
  diceSettingLabel: { da: 'Terninger', en: 'Dice' },
  digitalDice: { da: 'Digital', en: 'Digital' },
  physicalDice: { da: 'Fysisk', en: 'Physical' },
  languageLabel: { da: 'Sprog', en: 'Language' },
  continueToCharacters: { da: 'Videre til heltene', en: 'Continue to Characters' },

  // Style / difficulty option names
  styleWhimsical: { da: 'Eventyrlig', en: 'Whimsical' },
  styleEpic: { da: 'Episk', en: 'Epic' },
  styleDark: { da: 'Dyster', en: 'Dark' },
  diffEasy: { da: 'Let', en: 'Easy' },
  diffMedium: { da: 'Mellem', en: 'Medium' },
  diffHard: { da: 'Svær', en: 'Hard' },

  // Characters page
  playerWord: { da: 'Spiller', en: 'Player' },
  ofWord: { da: 'af', en: 'of' },
  charTitleSuffix: { da: 's helt', en: '’s Character' },
  characterNameLabel: { da: 'Heltens navn', en: 'Character Name' },
  theBrave: { da: ' den Tapre', en: ' the Brave' },
  avatarStyle: { da: 'Udseende', en: 'Avatar Style' },
  genderMale: { da: 'Dreng', en: 'Male' },
  genderFemale: { da: 'Pige', en: 'Female' },
  genderNeutral: { da: 'Neutral', en: 'Neutral' },
  chooseClass: { da: 'Vælg din helt', en: 'Choose Class' },
  heroPortrait: { da: 'Heltebillede', en: 'Hero Portrait' },
  paintingWord: { da: 'Maler', en: 'Painting' },
  paintAgain: { da: 'Mal igen', en: 'Paint Again' },
  paintPortrait: { da: 'Mal et heltebillede', en: 'Paint Hero Portrait' },
  painterBusy: { da: 'Maleren har travlt — I kan fortsætte uden billede og prøve igen senere.', en: 'The painter is busy — you can continue without a portrait and try again later.' },
  startAdventure: { da: 'Start eventyret!', en: 'Start Adventure!' },
  nextPlayer: { da: 'Næste spiller →', en: 'Next Player →' },

  // Play page chrome
  preparing: { da: 'Gør jeres eventyr klar...', en: 'Preparing your adventure...' },
  thinkingActions: { da: 'Fortælleren tænker over, hvad I kan gøre...', en: 'Thinking of what you can do...' },
  noCharacters: { da: 'Ingen helte fundet', en: 'No characters found' },
  startOver: { da: 'Start forfra', en: 'Start Over' },
  paused: { da: 'Pause', en: 'Paused' },
  resume: { da: 'Fortsæt', en: 'Resume' },
  saveQuit: { da: 'Gem og afslut', en: 'Save & Quit' },
  nameAdventure: { da: 'Giv eventyret et navn', en: 'Name this adventure' },
  continueAdventure: { da: 'Eventyret fortsætter →', en: 'Continue Adventure →' },
  storyUnfolds: { da: 'Historien folder sig ud...', en: 'The story unfolds...' },
  outcomeSuccess: { da: 'Sejr!', en: 'Success!' },
  outcomePartial: { da: 'Delvis sejr', en: 'Partial Success' },
  outcomeTwist: { da: 'Uventet drejning!', en: 'Plot Twist!' },

  // Errors
  errorTitle: { da: 'Den magiske skriftrulle blev lidt rodet...', en: 'The magic scroll got a bit jumbled...' },
  errorSub: { da: 'Noget gik galt, men alle helte møder modgang!', en: 'Something went wrong, but every hero faces setbacks!' },
  tryAgain: { da: 'Prøv igen', en: 'Cast Again' },
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

// Hero class names shown on cards and the turn banner
const CLASS_LABELS: Record<string, Record<Language, string>> = {
  warrior: { da: 'Kriger', en: 'Warrior' },
  wizard: { da: 'Troldmand', en: 'Wizard' },
  rogue: { da: 'Snigtyv', en: 'Rogue' },
  ranger: { da: 'Jæger', en: 'Ranger' },
}

export function classLabel(characterClass: string, language: Language): string {
  return CLASS_LABELS[characterClass]?.[language] ?? characterClass
}

// "Age 8" / "8 år" — the two languages order it differently
export function ageText(age: number, language: Language): string {
  return language === 'da' ? `${age} år` : `Age ${age}`
}
