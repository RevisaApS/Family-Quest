// Who is in a scene picture, built from one list. Hero descriptions and hero
// portraits used to be filtered separately, so a hero without a portrait
// shifted every later portrait one place and a face could land on the wrong
// hero. Every reference is labelled with the name the prompt uses.
import type { EncounterPhase, GeneratedScene } from '@/types/ai'
import type { EncounterState } from '@/types/game'

export interface CastHero {
  name: string
  description: string
  portrait: string | null
}

export interface Creature {
  // Set once the encounter exists; keys its stored portrait
  id?: string
  name: string
  appearance: string
}

export interface SceneImageRequest {
  heroDescriptions: string[]
  references: Array<{ label: string; dataUrl: string }>
  creature: { name: string; appearance: string } | null
}

export function sceneCast(heroes: CastHero[], creature: (Creature & { portrait: string | null }) | null): SceneImageRequest {
  const references = heroes
    .filter(h => h.portrait)
    .map(h => ({ label: h.name, dataUrl: h.portrait! }))
  if (creature?.portrait) references.push({ label: creature.name, dataUrl: creature.portrait })
  return {
    heroDescriptions: heroes.map(h => h.description),
    references,
    creature: creature ? { name: creature.name, appearance: creature.appearance } : null,
  }
}

// The creature a scene picture must keep the same. On arrival it comes from
// the scene itself (the encounter does not exist yet), named exactly as
// loadScene will name the encounter. During the fight it is the stored
// encounter. An encounter from before the look was stored has none.
export function sceneCreature(
  phase: EncounterPhase | undefined,
  scene: Pick<GeneratedScene, 'encounterName' | 'encounterAppearance'>,
  encounter: Pick<EncounterState, 'id' | 'name' | 'appearance' | 'defeated'> | null,
  fallbackName: string
): Creature | null {
  if (phase === 'arriving-monster' || phase === 'arriving-boss') {
    const appearance = scene.encounterAppearance?.trim()
    return appearance ? { name: scene.encounterName?.trim() || fallbackName, appearance } : null
  }
  if (phase === 'active' && encounter && !encounter.defeated && encounter.appearance) {
    return { id: encounter.id, name: encounter.name, appearance: encounter.appearance }
  }
  return null
}
