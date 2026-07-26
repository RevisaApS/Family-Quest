// Every adventure used to open with a byte-identical prompt: same style text,
// same "the adventure is just beginning", same three jobs for the quest-giver.
// With thinking off, the model answers a fixed question the same way, so the
// family kept meeting the same villain — Malachor, over and over.
//
// The fix is upstream of the model: make the question different every time.
// One ingredient is drawn from each pool below and handed to the dungeon
// master as the raw material for the opening, which puts the adventure
// somewhere new before a single token is generated.

export interface StorySeed {
  opening: string
  stake: string
  villain: string
  villainNaming: string
  questGiver: string
  hook: string
}

// Where the family is standing when the story starts. Deliberately not all
// forests and castles — a story that opens in a beekeeper's orchard cannot
// end up being the same story as one that opens under a frozen lighthouse.
const OPENINGS = [
  'a rain-soaked harbour where the fishing boats have all come back empty',
  'a mountain monastery where the bells have started ringing by themselves',
  'a marsh village built on stilts that is sinking a little more each night',
  'a travelling circus whose animals have all escaped at once',
  'a frozen lighthouse whose keeper has not been seen in a month',
  'a beekeeper\'s orchard where the bees have begun spelling out warnings',
  'an abandoned mine that the whole town insists was sealed for good reason',
  'a floating market on a wide slow river, the morning after a theft',
  'a windmill on an empty moor, turning fast although there is no wind',
  'a library so old that some of its books have to be kept in cages',
  'a bridge town where both bridges collapsed on the same night',
  'a sheep farm where every gate was found open and every animal gone',
  'a hot spring where the water has run cold and something is frozen in it',
  'a scrapyard of broken war machines that have started repairing themselves',
  'a coastal village the tide refuses to return to',
  'a mushroom forest lit from below, where the glow is going out patch by patch',
]

// What is actually at stake. Not always "a dark lord rises" — kids remember
// the quest where they had to get a stolen tuba back.
const STAKES = [
  'something small but precious has been stolen, and the whole town depends on it',
  'someone the heroes will come to care about has vanished without a trace',
  'a strange curse is spreading, and the family can watch it move',
  'a wild creature has to be got home before something worse finds it',
  'a door that should never have been opened is standing open',
  'the water has been poisoned, and every day counts',
  'a festival the whole region waited a year for is about to be ruined',
  'a promise made generations ago is coming due, and someone has to pay it',
  'a map is missing its final piece, and others are hunting for it too',
  'a song, a recipe or a craft is being forgotten on purpose, and someone wants it gone',
  'a debt is being collected by force, and the collectors are not human',
  'a great machine is running out of control and nobody remembers how to stop it',
]

// The villain archetype. A lonely giant and a clockwork tyrant do not produce
// the same story, and neither one produces a generic dark lord.
const VILLAINS = [
  'a greedy merchant who is technically doing nothing illegal',
  'a lonely giant who only wanted company and has gone about it terribly',
  'a clockwork tyrant that is following its last order far too literally',
  'a trickster spirit who thinks all of this is extremely funny',
  'a jealous witch protecting something she genuinely believes is hers',
  'a hungry storm that seems to be choosing where it goes',
  'a knight who lost their name and is taking other people\'s',
  'a rat king the size of a child, ruling the tunnels under the town',
  'a collector who wants one of everything, alive or not',
  'a shapeshifter who has been living among the villagers for years',
  'a scholar whose experiment got out and who is still pretending it did not',
  'an old hero who has turned bitter and is now the problem',
  'a swarm with a single shared mind and a very simple demand',
  'a mapmaker who erases places for money',
]

// This pool exists specifically to kill "Malachor". Left to itself the model
// reaches for the same dark-fantasy syllables every time, so each adventure
// gets a naming convention that pushes the name somewhere else entirely.
const VILLAIN_NAMING = [
  'a plain nickname the villagers made up, not a grand fantasy name',
  'a title rather than a name, like "The Tallow Man" or "The Quiet Aunt"',
  'a Nordic-sounding name that would not look strange in a Danish phone book',
  'a name borrowed from an animal or a plant',
  'a soft, pretty name that does not match how frightening they are',
  'a name made of two ordinary everyday words stuck together',
  'an old-fashioned first name and surname, like a real person',
  'a name that sounds like it came out of a nursery rhyme',
  'a name that is really a job description the villagers use in a whisper',
  'a short, blunt, one-syllable name',
  'a name that is a number or a measurement',
  'a name so grand and self-given that it is slightly ridiculous',
]

// Who hands over the quest. The old prompt listed three examples and the
// model picked from those three forever.
const QUEST_GIVERS = [
  'a child who nobody else believes',
  'a retired soldier who is embarrassed to be asking',
  'an innkeeper who has clearly been paid to say this',
  'a talking animal that is in a great hurry',
  'a rival adventurer who has already failed at this',
  'a local official reading nervously from a piece of paper',
  'an old woman who knows far more than she is saying',
  'a ghost who can only manage a few words at a time',
  'a merchant caravan guard with one arm in a sling',
  'the villain\'s own servant, defecting',
  'a wounded messenger who collapses mid-sentence',
  'nobody at all — the heroes find a note, and it names them',
]

// How the curtain goes up. Varies the shape of the opening scene itself, so
// the narration does not always begin with the party arriving somewhere.
const HOOKS = [
  'open in the middle of something already going wrong',
  'open quietly, with the wrongness only visible if you look closely',
  'open during a celebration that is about to be interrupted',
  'open with the heroes being blamed for something they did not do',
  'open with the heroes arriving too late to prevent the first loss',
  'open with an offer that sounds too generous',
  'open with a chase already in progress',
  'open with the heroes woken in the night',
]

function pick<T>(pool: readonly T[], random: () => number): T {
  return pool[Math.floor(random() * pool.length) % pool.length]
}

// ~16 × 12 × 14 × 12 × 12 × 8 ≈ 3.1 million combinations, so a family will
// not see the same opening twice.
export function pickStorySeed(random: () => number = Math.random): StorySeed {
  return {
    opening: pick(OPENINGS, random),
    stake: pick(STAKES, random),
    villain: pick(VILLAINS, random),
    villainNaming: pick(VILLAIN_NAMING, random),
    questGiver: pick(QUEST_GIVERS, random),
    hook: pick(HOOKS, random),
  }
}

// Names the model falls back on when nothing pushes it elsewhere. Banning them
// by name is blunt, but they are exactly what the family kept getting.
const OVERUSED_VILLAIN_NAMES = [
  'Malachor', 'Malachar', 'Malakar', 'Mordred', 'Morgrim', 'Vex', 'Zarthax',
  'Grimtooth', 'Shadowfang', 'Dreadlord', 'Lord Vex', 'The Shadow King',
]

export function seedInstruction(seed: StorySeed, pastVillains: string[] = []): string {
  const banned = [...OVERUSED_VILLAIN_NAMES, ...pastVillains].join(', ')
  return `THIS ADVENTURE'S INGREDIENTS — build the opening from these, and do not drift back to a generic fantasy village-and-dark-lord story:
- Where it starts: ${seed.opening}
- What is at stake: ${seed.stake}
- Who is behind it: ${seed.villain}
- How to open the scene: ${seed.hook}
- Who brings the family in: ${seed.questGiver}
- The villain's NAME must be ${seed.villainNaming}. Never use any of these worn-out names: ${banned}.

These ingredients are the raw material, not a checklist to recite — the quest, the villain and the opening scene must all grow out of them, and the villain must fit the description above rather than being a generic evil overlord.`
}
