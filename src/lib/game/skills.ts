import type { CharacterClass, Skill, Stat, PowerId } from '@/types/game'
import type { Language } from '@/lib/ai/language'

// Every level-up choice is the SAME size boost (+1) — the real choice is
// which stat it lands on and which once-per-adventure power comes with it.
// No more "+1 vs +2" no-brainers.
const SKILL_BONUS = 1

export const POWER_META: Record<PowerId, {
  emoji: string
  name: Record<Language, string>
  description: Record<Language, string>
}> = {
  reroll: {
    emoji: '🎲',
    name: { da: 'Ny Chance', en: 'Second Chance' },
    description: { da: 'Slå terningen om én gang pr. eventyr', en: 'Reroll a die once per adventure' },
  },
  shield: {
    emoji: '🛡️',
    name: { da: 'Skjold', en: 'Shield' },
    description: { da: 'Bloker al skade fra ét slag', en: 'Block all damage from one hit' },
  },
  heal: {
    emoji: '💚',
    name: { da: 'Helbred', en: 'Heal' },
    description: { da: 'Giv 3 liv til den mest sårede helt', en: 'Give 3 HP to the most hurt hero' },
  },
  rally: {
    emoji: '📣',
    name: { da: 'Kampgejst', en: 'Rally' },
    description: { da: 'Læg 3 oven i et slag, du lige har slået', en: 'Add 3 to a roll you just made' },
  },
  lucky: {
    emoji: '🍀',
    name: { da: 'Heldig Hånd', en: 'Lucky Hand' },
    description: { da: 'Dit næste gode slag giver helt sikkert en skattekiste', en: 'Your next good roll is guaranteed to drop a chest' },
  },
}

interface SkillDefinition {
  id: string
  emoji: string
  stat: Stat
  power: PowerId
  name: Record<Language, string>
}

// Each class covers all five powers with its own themed skill names,
// spread across different stats. Everyday Danish only.
const SKILL_POOLS: Record<CharacterClass, SkillDefinition[]> = {
  warrior: [
    { id: 'w-skjoldvagt', emoji: '🛡️', stat: 'heart', power: 'shield',
      name: { da: 'Skjoldvagt', en: 'Shield Guard' } },
    { id: 'w-jernnaeve', emoji: '💪', stat: 'strength', power: 'rally',
      name: { da: 'Jernnæve', en: 'Iron Fist' } },
    { id: 'w-kampraab', emoji: '📣', stat: 'heart', power: 'heal',
      name: { da: 'Kampråb', en: 'Battle Cry' } },
    { id: 'w-lynhug', emoji: '⚡', stat: 'agility', power: 'reroll',
      name: { da: 'Lynhug', en: 'Lightning Strike' } },
    { id: 'w-krigerlykke', emoji: '🍀', stat: 'strength', power: 'lucky',
      name: { da: 'Krigerlykke', en: 'Warrior\'s Luck' } },
  ],
  wizard: [
    { id: 'z-ildkugle', emoji: '🔥', stat: 'magic', power: 'rally',
      name: { da: 'Ildkugle', en: 'Fireball' } },
    { id: 'z-tryllevaern', emoji: '🔮', stat: 'magic', power: 'shield',
      name: { da: 'Tryllevaern', en: 'Magic Ward' } },
    { id: 'z-laegedrik', emoji: '🧪', stat: 'heart', power: 'heal',
      name: { da: 'Lægedrik', en: 'Healing Potion' } },
    { id: 'z-tidsvrid', emoji: '⏳', stat: 'agility', power: 'reroll',
      name: { da: 'Tidsvrid', en: 'Time Twist' } },
    { id: 'z-stjernelykke', emoji: '🌟', stat: 'magic', power: 'lucky',
      name: { da: 'Stjernelykke', en: 'Starluck' } },
  ],
  rogue: [
    { id: 'r-nyt-forsoeg', emoji: '🌀', stat: 'agility', power: 'reroll',
      name: { da: 'Snu Finte', en: 'Sly Feint' } },
    { id: 'r-roegsky', emoji: '💨', stat: 'agility', power: 'shield',
      name: { da: 'Røgsky', en: 'Smoke Cloud' } },
    { id: 'r-snigangreb', emoji: '🗡️', stat: 'strength', power: 'rally',
      name: { da: 'Snigangreb', en: 'Sneak Attack' } },
    { id: 'r-foerstehjælp', emoji: '🩹', stat: 'heart', power: 'heal',
      name: { da: 'Lommeplaster', en: 'Pocket Bandage' } },
    { id: 'r-tyveheld', emoji: '🍀', stat: 'magic', power: 'lucky',
      name: { da: 'Tyveheld', en: 'Thief\'s Luck' } },
  ],
  ranger: [
    { id: 'g-sikkert-skud', emoji: '🎯', stat: 'agility', power: 'reroll',
      name: { da: 'Sikkert Skud', en: 'Sure Shot' } },
    { id: 'g-urtekur', emoji: '🌿', stat: 'heart', power: 'heal',
      name: { da: 'Urtekur', en: 'Herbal Cure' } },
    { id: 'g-ulvebrol', emoji: '🐺', stat: 'strength', power: 'rally',
      name: { da: 'Ulvebrøl', en: 'Wolf Howl' } },
    { id: 'g-skovskjul', emoji: '🌲', stat: 'agility', power: 'shield',
      name: { da: 'Skovskjul', en: 'Forest Cover' } },
    { id: 'g-spejderlykke', emoji: '🍀', stat: 'magic', power: 'lucky',
      name: { da: 'Spejderlykke', en: 'Scout\'s Luck' } },
  ],
}

const STAT_WORD: Record<Stat, Record<Language, string>> = {
  strength: { da: 'Styrke', en: 'Strength' },
  magic: { da: 'Magi', en: 'Magic' },
  agility: { da: 'Hurtighed', en: 'Speed' },
  heart: { da: 'Mod', en: 'Courage' },
}

function toSkill(def: SkillDefinition, language: Language): Skill {
  const power = POWER_META[def.power]
  return {
    id: def.id,
    emoji: def.emoji,
    stat: def.stat,
    bonus: SKILL_BONUS,
    name: def.name[language],
    power: def.power,
    powerName: power.name[language],
    description: `+${SKILL_BONUS} ${STAT_WORD[def.stat][language]} · ${power.emoji} ${power.name[language]}: ${power.description[language]}`,
  }
}

// Up to 3 not-yet-owned skills to choose from on level-up — all the same
// +1 boost, each with a different power.
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
