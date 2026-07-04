import type { CharacterClass, Skill, Stat } from '@/types/game'
import type { Language } from '@/lib/ai/language'

interface SkillDefinition {
  id: string
  emoji: string
  stat: Stat
  bonus: number
  name: Record<Language, string>
  description: Record<Language, string>
}

// Each class has its own pool of "powers" offered on level-up.
// Bonuses are permanent stat boosts; the names give the AI story hooks.
const SKILL_POOLS: Record<CharacterClass, SkillDefinition[]> = {
  warrior: [
    { id: 'w-shield-bash', emoji: '🛡️', stat: 'strength', bonus: 1,
      name: { da: 'Skjoldbrag', en: 'Shield Bash' },
      description: { da: 'Dit skjold rammer som torden. +1 Styrke', en: 'Your shield strikes like thunder. +1 Strength' } },
    { id: 'w-battle-cry', emoji: '📣', stat: 'heart', bonus: 1,
      name: { da: 'Kampråb', en: 'Battle Cry' },
      description: { da: 'Dit råb giver alle mod. +1 Hjerte', en: 'Your cry fills everyone with courage. +1 Heart' } },
    { id: 'w-iron-grip', emoji: '💪', stat: 'strength', bonus: 2,
      name: { da: 'Jerngreb', en: 'Iron Grip' },
      description: { da: 'Intet slipper ud af dine hænder. +2 Styrke', en: 'Nothing escapes your grasp. +2 Strength' } },
    { id: 'w-quick-dodge', emoji: '🌀', stat: 'agility', bonus: 1,
      name: { da: 'Lynundvigelse', en: 'Quick Dodge' },
      description: { da: 'Du hopper væk i sidste sekund. +1 Behændighed', en: 'You leap away at the last second. +1 Agility' } },
    { id: 'w-guardian', emoji: '🏰', stat: 'heart', bonus: 2,
      name: { da: 'Beskytteren', en: 'The Guardian' },
      description: { da: 'Du passer altid på dine venner. +2 Hjerte', en: 'You always protect your friends. +2 Heart' } },
  ],
  wizard: [
    { id: 'z-fireball', emoji: '🔥', stat: 'magic', bonus: 2,
      name: { da: 'Ildkugle', en: 'Fireball' },
      description: { da: 'Flammer danser i dine hænder. +2 Magi', en: 'Flames dance in your hands. +2 Magic' } },
    { id: 'z-frost-wind', emoji: '❄️', stat: 'magic', bonus: 1,
      name: { da: 'Frostvind', en: 'Frost Wind' },
      description: { da: 'Du fryser alt med et pust. +1 Magi', en: 'You freeze anything with a breath. +1 Magic' } },
    { id: 'z-mind-reader', emoji: '🔮', stat: 'heart', bonus: 1,
      name: { da: 'Tankelæser', en: 'Mind Reader' },
      description: { da: 'Du forstår, hvad andre føler. +1 Hjerte', en: 'You sense what others feel. +1 Heart' } },
    { id: 'z-blink', emoji: '✨', stat: 'agility', bonus: 1,
      name: { da: 'Blink', en: 'Blink' },
      description: { da: 'Du teleporterer et lille hop. +1 Behændighed', en: 'You teleport a short hop. +1 Agility' } },
    { id: 'z-arcane-might', emoji: '🌟', stat: 'magic', bonus: 2,
      name: { da: 'Stjernekraft', en: 'Starpower' },
      description: { da: 'Stjernerne lyder dit kald. +2 Magi', en: 'The stars answer your call. +2 Magic' } },
  ],
  rogue: [
    { id: 'r-shadow-step', emoji: '🌑', stat: 'agility', bonus: 2,
      name: { da: 'Skyggetrin', en: 'Shadow Step' },
      description: { da: 'Du glider gennem skygger. +2 Behændighed', en: 'You slip through shadows. +2 Agility' } },
    { id: 'r-lockpick', emoji: '🗝️', stat: 'agility', bonus: 1,
      name: { da: 'Dirkemester', en: 'Lockpick Master' },
      description: { da: 'Ingen lås kan stoppe dig. +1 Behændighed', en: 'No lock can stop you. +1 Agility' } },
    { id: 'r-trickster', emoji: '🎭', stat: 'magic', bonus: 1,
      name: { da: 'Narrestreger', en: 'Trickster' },
      description: { da: 'Dine tricks forvirrer alle. +1 Magi', en: 'Your tricks baffle everyone. +1 Magic' } },
    { id: 'r-eagle-eye', emoji: '👁️', stat: 'heart', bonus: 1,
      name: { da: 'Ørneøje', en: 'Eagle Eye' },
      description: { da: 'Du ser det, andre overser. +1 Hjerte', en: 'You spot what others miss. +1 Heart' } },
    { id: 'r-acrobat', emoji: '🤸', stat: 'agility', bonus: 2,
      name: { da: 'Akrobat', en: 'Acrobat' },
      description: { da: 'Du klatrer og springer overalt. +2 Behændighed', en: 'You climb and leap anywhere. +2 Agility' } },
  ],
  ranger: [
    { id: 'g-true-shot', emoji: '🎯', stat: 'agility', bonus: 2,
      name: { da: 'Præcisionsskud', en: 'True Shot' },
      description: { da: 'Din pil rammer altid plet. +2 Behændighed', en: 'Your arrow always finds its mark. +2 Agility' } },
    { id: 'g-animal-friend', emoji: '🦊', stat: 'heart', bonus: 2,
      name: { da: 'Dyreven', en: 'Animal Friend' },
      description: { da: 'Alle dyr stoler på dig. +2 Hjerte', en: 'All animals trust you. +2 Heart' } },
    { id: 'g-pathfinder', emoji: '🧭', stat: 'heart', bonus: 1,
      name: { da: 'Stifinder', en: 'Pathfinder' },
      description: { da: 'Du finder altid vej. +1 Hjerte', en: 'You always find the way. +1 Heart' } },
    { id: 'g-nature-magic', emoji: '🌿', stat: 'magic', bonus: 1,
      name: { da: 'Naturmagi', en: 'Nature Magic' },
      description: { da: 'Planterne hjælper dig. +1 Magi', en: 'The plants come to your aid. +1 Magic' } },
    { id: 'g-bear-strength', emoji: '🐻', stat: 'strength', bonus: 1,
      name: { da: 'Bjørnekraft', en: 'Bear Strength' },
      description: { da: 'Stærk som skovens bjørn. +1 Styrke', en: 'Strong as the forest bear. +1 Strength' } },
  ],
}

function toSkill(def: SkillDefinition, language: Language): Skill {
  return {
    id: def.id,
    emoji: def.emoji,
    stat: def.stat,
    bonus: def.bonus,
    name: def.name[language],
    description: def.description[language],
  }
}

// Up to 3 not-yet-owned powers to choose from on level-up.
export function skillChoices(
  characterClass: CharacterClass,
  ownedSkillIds: string[],
  language: Language
): Skill[] {
  return SKILL_POOLS[characterClass]
    .filter(def => !ownedSkillIds.includes(def.id))
    .slice(0, 3)
    .map(def => toSkill(def, language))
}
