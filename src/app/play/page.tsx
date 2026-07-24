'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/layout/page-container'
import { SceneDisplay } from '@/components/game/scene-display'
import { PlayerTurn } from '@/components/game/player-turn'
import { PartyBar, type PartyMember } from '@/components/game/party-bar'
import { ActionPicker } from '@/components/game/action-picker'
import { DiceRoller, type RollBoost } from '@/components/game/dice-roller'
import { OutcomeDisplay, type PowerAction } from '@/components/game/outcome-display'
import { ErrorMessage } from '@/components/game/error-message'
import { EncounterBanner } from '@/components/game/encounter-banner'
import { QuestBar } from '@/components/game/quest-bar'
import { LevelUpModal } from '@/components/game/level-up-modal'
import { LootChestModal, type ChestContent } from '@/components/game/loot-chest-modal'
import { MonsterVictoryModal } from '@/components/game/monster-victory-modal'
import { VictoryOverlay } from '@/components/game/victory-overlay'
import { ShopModal } from '@/components/game/shop-modal'
import { InventoryModal } from '@/components/game/inventory-modal'
import { useGameStore } from '@/stores/game-store'
import { useGameAI } from '@/hooks/use-game-ai'
import { calculateDC, resolveD20, requiredRolls, rollD20 } from '@/lib/game/mechanics'
import {
  heroStatBonus, applyTurnOutcome, reviveHero,
  encounterDamageForOutcome, lootShouldDrop, lootBonusForRoll,
  encounterSpawnTurn, nextEncounterKind, createEncounter, QUEST_MILESTONES,
  equipLoot, addSkill, addGold, buyItem, chestIsGold, chestGoldAmount,
  MONSTER_GOLD_REWARD, BOSS_GOLD_REWARD,
  canUsePower, usePower, healHero,
  ASSIST_BONUS, spendAssist, potionCount, removePotion, buyPotion, buyPet,
  shouldEnrage, enrageBoss, rollWeakStat, weaknessBonus,
} from '@/lib/game/rpg'
import { skillChoices, POWER_META } from '@/lib/game/skills'
import { rollLootSlot, rollLootStat, createLoot, fallbackLootName } from '@/lib/game/loot'
import { toLootItem, type ShopItem } from '@/lib/game/shop'
import { potionDefinition, HEAL_POTION_HP, LUCK_POTION_BONUS, type PotionDefinition } from '@/lib/game/potions'
import { toPet, type PetDefinition } from '@/lib/game/pets'
import { turnStatsForPlayer, type CompletedAdventure } from '@/lib/game/chronicle'
import type { GeneratedEpilogue } from '@/lib/ai/epilogue'
import { CLASS_DEFINITIONS } from '@/lib/game/classes'
import { cn } from '@/lib/utils'
import { heroVisualDescription } from '@/lib/game/appearance'
import { loadPortraits } from '@/lib/portraits'
import { sfx, setSoundEnabled } from '@/lib/sound'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GeneratedAction, StoryContext, EncounterPhase } from '@/types/ai'
import type { OutcomeType, Skill, CritType, HeroState, EncounterState } from '@/types/game'

const MAX_STORY_HISTORY = 10

interface PendingLevelUp {
  playerId: string
  characterName: string
  newLevel: number
  choices: Skill[]
}

// Chest contents are bound to the hero who rolled them — the turn pointer
// advances before the chest opens, so ownership must be captured at roll time.
interface PendingChest {
  content: ChestContent
  playerId: string
  // True while the AI is still naming the item — the item image waits for
  // the final name so picture and name match
  namePending?: boolean
}

interface PendingMonsterVictory {
  monsterName: string
  finisherName: string
}

export default function PlayPage() {
  const router = useRouter()
  const {
    players, selectedPlayerIds, characters, difficulty,
    adventureStyle, dicePreference, language, storyHistory, turnHistory,
    currentPlayerIndex, updateAdventureState, _hasHydrated,
    saveAdventure, savedAdventures, activeAdventureId,
    heroes, encounter, quest, initHeroes, updateHero, setEncounter, setQuest,
    diceInventory, soundEnabled, setSoundEnabled: setSoundPref, startNewAdventure,
    shopHintSeen, setShopHintSeen,
  } = useGameStore()
  const {
    loadingScene, loadingActions, loadingCustomAction, loadingOutcome, loadingImage,
    error, fetchScene, fetchActions, fetchCustomAction, fetchOutcome, fetchImage, fetchLootName,
    fetchEpilogue,
  } = useGameAI()

  const selectedPlayers = useMemo(
    () => players.filter(p => selectedPlayerIds.includes(p.id)),
    [players, selectedPlayerIds]
  )

  const currentPlayer = selectedPlayers[currentPlayerIndex]
  const currentCharacter = characters.find(c => c.playerId === currentPlayer?.id)
  const currentHero = heroes.find(h => h.playerId === currentPlayer?.id)

  const [narration, setNarration] = useState('')
  const [currentSceneText, setCurrentSceneText] = useState('')
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null)
  const [actions, setActions] = useState<GeneratedAction[]>([])
  const [gamePhase, setGamePhase] = useState<'loading' | 'scene' | 'dice' | 'outcome' | 'rewards'>('loading')
  const [selectedAction, setSelectedAction] = useState<GeneratedAction | null>(null)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [outcomeType, setOutcomeType] = useState<OutcomeType | null>(null)
  const [outcomeNarrative, setOutcomeNarrative] = useState('')
  const [turnCounter, setTurnCounter] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [retryFn, setRetryFn] = useState<(() => void) | null>(null)

  // RPG per-turn results
  const [turnXp, setTurnXp] = useState(0)
  const [turnGold, setTurnGold] = useState(0)
  const [turnDamage, setTurnDamage] = useState(0)
  const [turnEncounterDamage, setTurnEncounterDamage] = useState(0)
  const [turnCrit, setTurnCrit] = useState<CritType>(null)
  const [pendingLoot, setPendingLoot] = useState<PendingChest | null>(null)
  const [pendingLevelUp, setPendingLevelUp] = useState<PendingLevelUp | null>(null)
  const [monsterVictory, setMonsterVictory] = useState<PendingMonsterVictory | null>(null)
  const [showVictory, setShowVictory] = useState(false)
  const [rescueMessage, setRescueMessage] = useState<string | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [inventoryPlayerId, setInventoryPlayerId] = useState<string | null>(null)
  // Lucky Hand power: armed until a good roll lands, then guarantees a chest
  const [luckyArmedFor, setLuckyArmedFor] = useState<string | null>(null)
  // Teamwork: which teammate is lending +1 to this roll
  const [assistPlayerId, setAssistPlayerId] = useState<string | null>(null)
  // A drunk luck potion rides on this turn's roll (rerolls included)
  const [luckActive, setLuckActive] = useState(false)
  // The storybook epilogue written when the boss falls
  const [epilogue, setEpilogue] = useState<GeneratedEpilogue | null>(null)
  const [epilogueLoading, setEpilogueLoading] = useState(false)
  // Guards the one-time chronicle entry per completed adventure
  const chronicleRecordedRef = useRef(false)
  // Pre-roll snapshot so Second Chance / Rally can re-resolve the turn cleanly
  const preRollRef = useRef<{ hero: HeroState; encounter: EncounterState | null } | null>(null)

  // Sound engine follows the persisted preference
  useEffect(() => { setSoundEnabled(soundEnabled) }, [soundEnabled])

  const encounterActive = !!encounter && !encounter.defeated
  const isFirstScene = storyHistory.length === 0 && !quest

  const currentEncounterPhase = useCallback((): EncounterPhase => {
    if (encounter) return encounter.defeated ? 'just-defeated' : 'active'
    const milestones = quest?.milestonesDone ?? 0
    if (quest && milestones < QUEST_MILESTONES
      && turnHistory.length >= encounterSpawnTurn(milestones, selectedPlayers.length)) {
      return nextEncounterKind(milestones) === 'boss' ? 'arriving-boss' : 'arriving-monster'
    }
    return 'none'
  }, [encounter, quest, turnHistory.length, selectedPlayers.length])

  // Build story context for AI calls
  const buildStoryContext = useCallback((): StoryContext => ({
    adventureStyle,
    storyHistory: storyHistory.slice(-MAX_STORY_HISTORY),
    characters: selectedPlayers
      .filter(p => characters.find(c => c.playerId === p.id))
      .map(p => {
        const char = characters.find(c => c.playerId === p.id)!
        const hero = heroes.find(h => h.playerId === p.id)
        return {
          playerId: p.id,
          playerName: p.name,
          characterName: char.name,
          class: char.class,
          rpg: hero ? {
            level: hero.level,
            hp: hero.hp,
            maxHp: hero.maxHp,
            knockedOut: hero.knockedOut,
            skillNames: hero.skills.map(s => s.name),
            gearNames: Object.values(hero.equipment).filter(Boolean).map(i => i!.name),
            petName: hero.pet?.name,
          } : undefined,
        }
      }),
    currentPlayerId: currentPlayer?.id ?? '',
    language,
    encounterPhase: currentEncounterPhase(),
    encounter: encounter
      ? {
          kind: encounter.kind,
          name: encounter.name,
          hp: encounter.hp,
          maxHp: encounter.maxHp,
          enraged: encounter.enraged,
          weakStat: encounter.weakStat,
          announceEnrage: !!encounter.enraged && !encounter.enrageAnnounced && !encounter.defeated,
        }
      : null,
    quest: quest ?? null,
    isFirstScene,
  }), [adventureStyle, storyHistory, selectedPlayers, characters, heroes, currentPlayer, language, encounter, quest, currentEncounterPhase, isFirstScene])

  const heroImageDescriptions = useCallback((): string[] =>
    selectedPlayers
      .map(p => {
        const char = characters.find(c => c.playerId === p.id)
        if (!char) return null
        const base = heroVisualDescription(char.name, char.class, char.gender, p.color, p.age)
        // Equipped gear shows up on the hero in every scene: buy the Golden
        // Helm and the pictures wear it — and the pet walks alongside
        const hero = heroes.find(h => h.playerId === p.id)
        const gearLooks = Object.values(hero?.equipment ?? {})
          .filter((i): i is NonNullable<typeof i> => !!i)
          .map(i => i.look)
          .filter((l): l is string => !!l)
        const parts = [base]
        if (gearLooks.length) parts.push(`equipped with ${gearLooks.join(', ')}`)
        if (hero?.pet) parts.push(`accompanied by ${hero.pet.look}`)
        return parts.join(', ')
      })
      .filter((d): d is string => !!d),
  [selectedPlayers, characters, heroes])

  // Hero portraits (IndexedDB) ride along on scene-image requests as visual
  // anchors. Awaited inside loadScene (and cached) so even the very first
  // scene image gets the references — no state race on mount.
  const portraitsRef = useRef<string[] | null>(null)
  const getHeroPortraits = useCallback(async (): Promise<string[]> => {
    if (portraitsRef.current) return portraitsRef.current
    const map = await loadPortraits(selectedPlayers.map(p => p.id))
    const portraits = selectedPlayers.map(p => map.get(p.id)).filter((u): u is string => !!u)
    if (portraits.length > 0 || selectedPlayers.length > 0) portraitsRef.current = portraits
    return portraits
  }, [selectedPlayers])

  // Load scene for current player
  const loadScene = useCallback(async () => {
    setGamePhase('loading')
    setNarration('')
    setSceneImageUrl(null)
    setActions([])
    setSelectedAction(null)
    setDiceResult(null)
    setOutcomeType(null)
    setOutcomeNarrative('')
    setRetryFn(null)
    setTurnXp(0)
    setTurnGold(0)
    setTurnDamage(0)
    setTurnEncounterDamage(0)
    setTurnCrit(null)
    setRescueMessage(null)
    setAssistPlayerId(null)
    setLuckActive(false)
    preRollRef.current = null

    // A knocked-out hero stays down — cheering teammates on from the
    // sidelines — until their OWN turn begins; then friends help them back
    // up at half HP. Nobody ever misses their turn.
    const state = useGameStore.getState()
    const koHero = state.heroes.find(h => h.knockedOut && h.playerId === currentPlayer?.id)
    if (koHero && currentCharacter) {
      updateHero(reviveHero(koHero))
      const helperNames = selectedPlayers
        .filter(p => p.id !== currentPlayer?.id)
        .map(p => characters.find(c => c.playerId === p.id)?.name)
        .filter(Boolean)
        .join(', ')
      if (helperNames) {
        setRescueMessage(`🤝 ${helperNames} ${t('rescuedBy', language)} ${currentCharacter.name} ${t('backUp', language)}`)
      } else {
        setRescueMessage(`💫 ${currentCharacter.name} ${t('soloRecover', language)}`)
      }
    }

    const context = buildStoryContext()
    const scene = await fetchScene(context)
    if (scene) {
      setNarration(scene.narration)
      setCurrentSceneText(scene.narration)
      setGamePhase('scene')

      const partySize = selectedPlayers.length
      const fallbackMonster = language === 'da' ? 'Skyggeuhyret' : 'The Shadow Beast'
      const fallbackBoss = quest?.villain || (language === 'da' ? 'Skyggekongen' : 'The Shadow King')

      if (context.isFirstScene) {
        // The call to adventure: a quest-giver, stakes, and a named villain
        // whose shadow hangs over the whole arc. The first fight comes a
        // couple of turns later.
        setQuest({
          title: scene.questTitle?.trim() || (language === 'da' ? 'Det Store Eventyr' : 'The Great Quest'),
          goal: scene.questGoal?.trim() || '',
          villain: scene.villainName?.trim() || undefined,
          milestonesDone: 0,
        })
      } else if (context.encounterPhase === 'arriving-monster') {
        setEncounter(createEncounter('monster', scene.encounterName?.trim() || fallbackMonster, quest?.milestonesDone ?? 1, partySize))
        sfx.bossAppear()
      } else if (context.encounterPhase === 'arriving-boss') {
        setEncounter(createEncounter('boss', scene.encounterName?.trim() || fallbackBoss, 2, partySize))
        sfx.bossAppear()
      } else if (context.encounterPhase === 'just-defeated') {
        // Aftermath scene told — the battlefield is clear again
        setEncounter(null)
      } else if (context.encounter?.announceEnrage) {
        // The boss transformation scene has now been told — don't retell it
        const enc = useGameStore.getState().encounter
        if (enc && !enc.defeated) setEncounter({ ...enc, enrageAnnounced: true })
      }

      // Paint the scene in the background — the text is readable immediately
      // and the image fades in whenever it's ready.
      getHeroPortraits()
        .then(portraits => fetchImage(scene.imagePrompt, adventureStyle, heroImageDescriptions(), portraits))
        .then(url => { if (url) setSceneImageUrl(url) })
    } else {
      setRetryFn(() => () => { loadScene() })
    }
  }, [buildStoryContext, fetchScene, fetchImage, adventureStyle, heroImageDescriptions, getHeroPortraits, language, selectedPlayers.length, characters, currentCharacter, currentPlayer, updateHero, setEncounter, setQuest, quest])

  // Load actions for current scene
  const loadActions = useCallback(async () => {
    const context = buildStoryContext()
    const generatedActions = await fetchActions(context, currentSceneText)
    if (generatedActions) {
      setActions(generatedActions)
    } else {
      setRetryFn(() => () => { loadActions() })
    }
  }, [buildStoryContext, fetchActions, currentSceneText])

  // Validate all players have characters
  useEffect(() => {
    if (!_hasHydrated) return
    const missingCharacter = selectedPlayers.some(p => !characters.find(c => c.playerId === p.id))
    if (missingCharacter || selectedPlayers.length === 0) {
      router.push('/characters')
    }
  }, [_hasHydrated, selectedPlayers, characters, router])

  // Create level-1 heroes when an adventure has none (new adventure or a save
  // from before the RPG update).
  useEffect(() => {
    if (!_hasHydrated || selectedPlayers.length === 0) return
    const heroesMatch = selectedPlayers.every(p => heroes.some(h => h.playerId === p.id))
    if (!heroesMatch || heroes.length !== selectedPlayers.length) {
      initHeroes(selectedPlayers.map(p => p.id))
    }
  }, [_hasHydrated, selectedPlayers, heroes, initHeroes])

  // Clear retryFn when error clears
  useEffect(() => { if (!error) setRetryFn(null) }, [error])

  // Load first scene on mount, and new scene on player rotation
  useEffect(() => {
    if (!_hasHydrated || !currentPlayer) return
    loadScene()
  }, [_hasHydrated, turnCounter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Actions are fetched the moment the scene text lands — the family reads
  // (or listens) while the DM thinks, and the choices are ready when they are.
  // The ref keeps one request per scene; the retry button can always re-ask.
  const actionsRequestedRef = useRef<string | null>(null)
  useEffect(() => {
    if (gamePhase !== 'scene' || loadingScene || !currentSceneText) return
    if (actionsRequestedRef.current === currentSceneText) return
    actionsRequestedRef.current = currentSceneText
    loadActions()
  }, [gamePhase, loadingScene, currentSceneText, loadActions])

  // The boss just fell and the victory overlay is up: write the storybook
  // epilogue and record this quest in the family chronicle. Everything is
  // snapshotted first so a quick "New adventure" tap can't corrupt the record.
  const victoryVisible = gamePhase === 'rewards' && !monsterVictory && !pendingLoot
    && !pendingLevelUp && showVictory && !!encounter

  useEffect(() => {
    if (!victoryVisible || chronicleRecordedRef.current) return
    const state = useGameStore.getState()
    const finishedQuest = state.quest
    if (!finishedQuest) return
    chronicleRecordedRef.current = true
    setEpilogueLoading(true)

    const heroContexts = selectedPlayers
      .map(p => ({ player: p, char: characters.find(c => c.playerId === p.id) }))
      .filter((x): x is { player: typeof x.player; char: NonNullable<typeof x.char> } => !!x.char)
      .map(({ player, char }) => {
        const hero = state.heroes.find(h => h.playerId === player.id)
        return {
          playerId: player.id,
          characterName: char.name,
          playerName: player.name,
          class: char.class,
          level: hero?.level ?? 1,
          petName: hero?.pet?.name,
          stats: turnStatsForPlayer(state.turnHistory, player.id),
        }
      })

    const record: CompletedAdventure = {
      id: crypto.randomUUID(),
      completedAt: Date.now(),
      questTitle: finishedQuest.title,
      questGoal: finishedQuest.goal,
      villain: finishedQuest.villain,
      style: adventureStyle,
      heroes: heroContexts.map(h => ({
        playerId: h.playerId,
        playerName: h.playerName,
        characterName: h.characterName,
        class: h.class,
        level: h.level,
        petName: h.petName,
        ...h.stats,
      })),
    }

    fetchEpilogue({
      language,
      adventureStyle,
      questTitle: finishedQuest.title,
      questGoal: finishedQuest.goal,
      villain: finishedQuest.villain,
      storyHistory: state.storyHistory,
      heroes: heroContexts,
    }).then(result => {
      setEpilogue(result)
      setEpilogueLoading(false)
      const finalRecord: CompletedAdventure = result
        ? {
            ...record,
            tale: { title: result.title, story: result.story },
            heroes: record.heroes.map(h => {
              const award = result.awards?.find(a => a.playerId === h.playerId)
              return award ? { ...h, award: { title: award.title, reason: award.reason } } : h
            }),
          }
        : record
      useGameStore.getState().addToChronicle(finalRecord)
    })
  }, [victoryVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentPlayer || !currentCharacter) {
    return (
      <PageContainer className="justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t('noCharacters', useGameStore.getState().language)}</p>
          <Button onClick={() => router.push('/players')}>{t('startOver', useGameStore.getState().language)}</Button>
        </div>
      </PageContainer>
    )
  }

  const dcForAction = (action: GeneratedAction, hero: HeroState) => calculateDC({
    difficulty,
    sceneFit: action.sceneFit,
    level: hero.level,
    encounterActive,
    age: currentPlayer.age,
  })

  const handleActionSelect = (action: GeneratedAction) => {
    setSelectedAction(action)
    setGamePhase('dice')
  }

  // "My own idea!" — the DM grades the kid's plan; if the AI can't be
  // reached the plan still plays as a brave, okay-fit action.
  const handleCustomIdea = async (idea: string) => {
    const graded = await fetchCustomAction(buildStoryContext(), currentSceneText, idea)
    handleActionSelect(graded ?? { id: 'custom', text: idea, stat: 'heart', sceneFit: 'okay', sceneFitReason: '' })
  }

  // Resolve (or re-resolve, for Second Chance / Rally) the current turn from
  // the pre-roll snapshot. `bonus` is Rally's +3.
  const resolveTurn = async (roll: number, bonus: number, action: GeneratedAction) => {
    const base = preRollRef.current
    if (!base || !currentCharacter) return

    const baseHero = base.hero
    const baseEncounter = base.encounter
    const encActive = !!baseEncounter && !baseEncounter.defeated

    const statValue = heroStatBonus(currentCharacter.class, baseHero, action.stat)
    const dc = calculateDC({
      difficulty, sceneFit: action.sceneFit, level: baseHero.level,
      encounterActive: encActive, age: currentPlayer?.age,
    })
    // Determination, a helping friend, and a drunk luck potion all ride on
    // the roll — and stick around through Second Chance / Rally re-resolves
    const boostBonus = baseHero.comeback
      + (assistPlayerId ? ASSIST_BONUS : 0)
      + (luckActive ? LUCK_POTION_BONUS : 0)
    const resolved = resolveD20(roll, statValue + bonus + boostBonus, dc)

    setOutcomeType(resolved.outcome)
    setTurnCrit(resolved.crit)
    setGamePhase('outcome')
    setPendingLoot(null)
    setPendingLevelUp(null)
    setMonsterVictory(null)
    setShowVictory(false)

    if (resolved.crit === 'crit') sfx.fanfare()
    else if (resolved.outcome === 'success') sfx.success()
    else if (resolved.outcome === 'failure') sfx.failure()

    // Apply RPG consequences to the acting hero (from the snapshot baseline)
    const resolution = applyTurnOutcome(baseHero, resolved.outcome, encActive, resolved.crit)
    updateHero(resolution.hero)
    setTurnXp(resolution.xpGained)
    setTurnGold(resolution.goldGained)
    setTurnDamage(resolution.damageTaken)
    if (resolution.damageTaken > 0) sfx.hit()

    // Level up → queue the "pick your power" cards
    if (resolution.leveledUp) {
      setPendingLevelUp({
        playerId: baseHero.playerId,
        characterName: currentCharacter.name,
        newLevel: resolution.hero.level,
        choices: skillChoices(currentCharacter.class, resolution.hero.skills.map(s => s.id), language),
      })
    }

    // Damage the shared enemy; defeat queues the celebration (rewards applied
    // on the celebration's continue, so a reroll can cleanly undo all of it)
    let encDamage = 0
    let monsterDown = false
    if (encActive && baseEncounter) {
      const baseDamage = encounterDamageForOutcome(resolved.outcome, resolved.crit)
      encDamage = baseDamage + weaknessBonus(baseEncounter, action.stat, baseDamage)
      const newHp = Math.max(0, baseEncounter.hp - encDamage)
      const defeated = newHp === 0
      let updatedEncounter: EncounterState = { ...baseEncounter, hp: newHp, defeated }
      // Boss phase 2: wounded to half HP, the boss transforms and reveals a
      // weak spot — the next scene narrates it, the banner shows it
      if (shouldEnrage(updatedEncounter)) {
        updatedEncounter = enrageBoss(updatedEncounter, rollWeakStat())
        sfx.bossAppear()
      }
      setEncounter(updatedEncounter)
      if (defeated) {
        if (baseEncounter.kind === 'boss') {
          setShowVictory(true)
        } else {
          monsterDown = true
          setMonsterVictory({ monsterName: baseEncounter.name, finisherName: currentCharacter.name })
        }
      }
    } else if (baseEncounter) {
      setEncounter(baseEncounter)
    }
    setTurnEncounterDamage(encDamage)

    // Treasure: crits and strong successes drop chests; a slain monster
    // always leaves one for the finisher; Lucky Hand forces one too.
    const luckyTriggers = luckyArmedFor === currentPlayer.id && resolved.outcome !== 'failure'
    if (lootShouldDrop(resolved.outcome, roll, resolved.crit) || monsterDown || luckyTriggers) {
      if (luckyTriggers) setLuckyArmedFor(null)
      const ownerPlayerId = currentPlayer.id
      if (!monsterDown && !luckyTriggers && chestIsGold()) {
        setPendingLoot({ content: { kind: 'gold', amount: chestGoldAmount(roll) }, playerId: ownerPlayerId })
      } else {
        const slot = rollLootSlot()
        const stat = rollLootStat()
        const itemBonus = luckyTriggers ? 2 : lootBonusForRoll(roll)
        const item = createLoot(slot, stat, itemBonus, fallbackLootName(slot, stat, language))
        setPendingLoot({ content: { kind: 'item', item }, playerId: ownerPlayerId, namePending: true })
        fetchLootName(slot, stat, language, currentSceneText, adventureStyle).then(named => {
          setPendingLoot(prev =>
            prev && prev.content.kind === 'item' && prev.content.item.id === item.id
              ? {
                  ...prev,
                  namePending: false,
                  content: {
                    kind: 'item',
                    item: {
                      ...prev.content.item,
                      name: named?.name ?? prev.content.item.name,
                      look: named?.look ?? prev.content.item.look,
                    },
                  },
                }
              : prev
          )
        })
      }
    }

    // Fetch AI-generated outcome narrative — the helping teammate gets
    // written into the story too
    const helperCharacter = assistPlayerId ? characters.find(c => c.playerId === assistPlayerId) : null
    const context = buildStoryContext()
    const narrative = await fetchOutcome(
      context,
      helperCharacter ? `${action.text} (with help from ${helperCharacter.name})` : action.text,
      action.stat,
      resolved.outcome,
      currentSceneText,
      // The damage the hero actually took, not a second guess at it — a
      // recomputation here once missed the fumble retaliation, so the DM never
      // narrated the monster's free swing.
      resolution.damageTaken,
      encDamage,
      resolved.crit,
    )
    setOutcomeNarrative(narrative || 'The story continues...')
  }

  const handleDiceRoll = async (result: number) => {
    if (!selectedAction || !currentCharacter || !currentHero) return
    setDiceResult(result)
    // The helping teammate spends their assist now — it stays spent even
    // through rerolls, and recharges on their own next turn
    if (assistPlayerId) {
      const helper = useGameStore.getState().heroes.find(h => h.playerId === assistPlayerId)
      if (helper && !helper.assistUsed) updateHero(spendAssist(helper))
    }
    preRollRef.current = { hero: currentHero, encounter }
    await resolveTurn(result, 0, selectedAction)
  }

  // --- Once-per-adventure powers ---

  const consumePowerOnBaseline = (power: 'reroll' | 'rally') => {
    if (!preRollRef.current) return
    preRollRef.current = { ...preRollRef.current, hero: usePower(preRollRef.current.hero, power) }
  }

  const handleReroll = async () => {
    if (!selectedAction) return
    consumePowerOnBaseline('reroll')
    sfx.diceRoll()
    const newRoll = rollD20()
    setDiceResult(newRoll)
    await resolveTurn(newRoll, 0, selectedAction)
  }

  const handleRally = async () => {
    if (!selectedAction || diceResult === null) return
    consumePowerOnBaseline('rally')
    await resolveTurn(diceResult, 3, selectedAction)
  }

  const handleShield = () => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero || turnDamage === 0) return
    updateHero(healHero(usePower(hero, 'shield'), turnDamage))
    setTurnDamage(0)
    sfx.chestOpen()
  }

  const handleHeal = () => {
    const state = useGameStore.getState()
    const self = state.heroes.find(h => h.playerId === currentPlayer.id)
    if (!self || !canUsePower(self, 'heal')) return
    const mostHurt = [...state.heroes].sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0]
    if (!mostHurt || mostHurt.hp >= mostHurt.maxHp) return
    updateHero(usePower(self, 'heal'))
    const healed = state.heroes.find(h => h.playerId === mostHurt.playerId)!
    updateHero(healHero(healed.playerId === self.playerId ? usePower(self, 'heal') : healed, 3))
    sfx.success()
  }

  const handleArmLucky = () => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero || !canUsePower(hero, 'lucky')) return
    updateHero(usePower(hero, 'lucky'))
    setLuckyArmedFor(currentPlayer.id)
    sfx.chestOpen()
  }

  const outcomePowerActions = (): PowerAction[] => {
    const hero = heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero) return []
    const list: PowerAction[] = []
    if (canUsePower(hero, 'reroll')) {
      list.push({ id: 'reroll', label: `${POWER_META.reroll.emoji} ${POWER_META.reroll.name[language]}`, onUse: handleReroll })
    }
    if (canUsePower(hero, 'rally') && outcomeType !== 'success' && turnCrit !== 'fumble') {
      list.push({ id: 'rally', label: `${POWER_META.rally.emoji} ${POWER_META.rally.name[language]} (+3)`, onUse: handleRally })
    }
    if (canUsePower(hero, 'shield') && turnDamage > 0) {
      list.push({ id: 'shield', label: `${POWER_META.shield.emoji} ${POWER_META.shield.name[language]}`, onUse: handleShield })
    }
    return list
  }

  const handleContinue = () => {
    // Append turn summary to story history
    const turnSummary = `${currentPlayer.name}'s character ${currentCharacter.name} chose to ${selectedAction?.text}. Using ${selectedAction?.stat}, they ${outcomeType === 'success' ? 'succeeded' : outcomeType === 'partial' ? 'partially succeeded' : 'faced a twist'}. ${outcomeNarrative}`

    const newStoryHistory = [...storyHistory, turnSummary].slice(-MAX_STORY_HISTORY)
    const newTurnHistory = [...turnHistory, {
      playerId: currentPlayer.id,
      actionChosen: selectedAction?.text ?? '',
      stat: selectedAction?.stat ?? 'strength',
      sceneFit: selectedAction?.sceneFit ?? 'okay',
      diceRoll: diceResult ?? 0,
      outcome: outcomeType ?? 'partial',
      narrativeResult: outcomeNarrative,
    }]

    const nextPlayerIndex = (currentPlayerIndex + 1) % selectedPlayers.length

    updateAdventureState({
      currentScene: currentSceneText,
      storyHistory: newStoryHistory,
      turnHistory: newTurnHistory,
      currentPlayerIndex: nextPlayerIndex,
    })

    // Celebration → loot chest → level-up cards → (boss victory) → next scene
    setGamePhase('rewards')
    if (!monsterVictory && !pendingLoot && !pendingLevelUp && !showVictory) {
      setTurnCounter(prev => prev + 1)
    }
  }

  const handleMonsterVictoryContinue = () => {
    // The party payday + quest progress land here so a reroll can't double-pay
    useGameStore.getState().heroes.forEach(h => updateHero(addGold(h, MONSTER_GOLD_REWARD)))
    if (quest) setQuest({ ...quest, milestonesDone: Math.min(QUEST_MILESTONES, quest.milestonesDone + 1) })
    setMonsterVictory(null)
    if (!pendingLoot && !pendingLevelUp && !showVictory) setTurnCounter(prev => prev + 1)
  }

  const handleLootResolve = (equip: boolean) => {
    if (pendingLoot) {
      // Equip/credit the hero who opened the chest — not whoever's turn it is now
      const hero = useGameStore.getState().heroes.find(h => h.playerId === pendingLoot.playerId)
      if (hero) {
        if (pendingLoot.content.kind === 'gold') {
          updateHero(addGold(hero, pendingLoot.content.amount))
        } else if (equip) {
          updateHero(equipLoot(hero, pendingLoot.content.item))
        }
      }
    }
    setPendingLoot(null)
    if (!pendingLevelUp && !showVictory) setTurnCounter(prev => prev + 1)
  }

  const handleSkillPick = (skill: Skill | null) => {
    if (skill && pendingLevelUp) {
      const hero = useGameStore.getState().heroes.find(h => h.playerId === pendingLevelUp.playerId)
      if (hero) updateHero(addSkill(hero, skill))
    }
    setPendingLevelUp(null)
    if (!showVictory) setTurnCounter(prev => prev + 1)
  }

  const handleVictoryContinue = () => {
    useGameStore.getState().heroes.forEach(h => updateHero(addGold(h, BOSS_GOLD_REWARD)))
    if (quest) setQuest({ ...quest, milestonesDone: QUEST_MILESTONES })
    setShowVictory(false)
    setTurnCounter(prev => prev + 1)
  }

  const handleBuy = (item: ShopItem) => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero) return
    const bought = buyItem(hero, toLootItem(item, language), item.price)
    if (bought) updateHero(bought)
  }

  const handleBuyPotion = (potion: PotionDefinition) => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero) return
    const bought = buyPotion(hero, potion.id, potion.price)
    if (bought) updateHero(bought)
  }

  const handleBuyPet = (petDef: PetDefinition, customName: string) => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero) return
    const bought = buyPet(hero, toPet(petDef, language, customName), petDef.price)
    if (bought) updateHero(bought)
  }

  const handleDrinkHeal = () => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero || potionCount(hero, 'heal') === 0 || hero.hp >= hero.maxHp) return
    updateHero(healHero(removePotion(hero, 'heal'), HEAL_POTION_HP))
    sfx.success()
  }

  const handleDrinkLuck = () => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero || potionCount(hero, 'luck') === 0 || luckActive) return
    updateHero(removePotion(hero, 'luck'))
    setLuckActive(true)
    sfx.chestOpen()
  }

  const partyMembers: PartyMember[] = selectedPlayers
    .map(p => {
      const char = characters.find(c => c.playerId === p.id)
      const hero = heroes.find(h => h.playerId === p.id)
      return char && hero ? {
        playerId: p.id,
        characterName: char.name,
        characterClass: char.class,
        hero,
      } : null
    })
    .filter((m): m is PartyMember => !!m)

  const anyoneHurt = heroes.some(h => h.hp < h.maxHp)
  const canHeal = currentHero && canUsePower(currentHero, 'heal') && anyoneHurt
  const canArmLucky = currentHero && canUsePower(currentHero, 'lucky') && luckyArmedFor !== currentPlayer.id
  const canDrinkHeal = currentHero && potionCount(currentHero, 'heal') > 0 && currentHero.hp < currentHero.maxHp
  const canDrinkLuck = currentHero && potionCount(currentHero, 'luck') > 0 && !luckActive

  // Teammates who can lend +1 to this roll — knocked-out heroes cheer from
  // the sidelines (📣), so being down never means sitting out
  const helpers = selectedPlayers
    .filter(p => p.id !== currentPlayer.id)
    .map(p => ({
      playerId: p.id,
      char: characters.find(c => c.playerId === p.id),
      hero: heroes.find(h => h.playerId === p.id),
    }))
    .filter(x => x.char && x.hero && !x.hero.assistUsed)

  // Every bonus riding on the upcoming roll, each shown as its own chip
  const assistHelperChar = assistPlayerId ? characters.find(c => c.playerId === assistPlayerId) : null
  const rollBoosts: RollBoost[] = currentHero ? [
    ...(currentHero.comeback > 0
      ? [{ emoji: '🔥', label: t('determination', language), value: currentHero.comeback }] : []),
    ...(assistHelperChar
      ? [{ emoji: '🤝', label: assistHelperChar.name, value: ASSIST_BONUS }] : []),
    ...(luckActive
      ? [{ emoji: '🍀', label: potionDefinition('luck').name[language], value: LUCK_POTION_BONUS }] : []),
  ] : []
  const boostTotal = rollBoosts.reduce((sum, b) => sum + b.value, 0)

  const phaseTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  }

  return (
    <PageContainer wide>
      <div className="space-y-4">
        {/* Shop + sound + pause buttons */}
        <button
          onClick={() => { setShopHintSeen(); setShopOpen(true) }}
          className="fixed top-4 right-28 size-11 flex items-center justify-center rounded-full bg-card/70 backdrop-blur-sm border border-primary/25 shadow-lg shadow-black/30 transition-colors hover:border-primary/60 z-40"
          aria-label="Open shop"
        >
          🏪
        </button>

        {/* One-time onboarding hint: an arrow at the shop button */}
        {!shopHintSeen && _hasHydrated && gamePhase === 'scene' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[3.75rem] right-4 z-40 w-56"
          >
            {/* Only the arrow bobs — the card (and its button) stays still */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -top-2 right-[6.5rem] w-4 h-4 rotate-45 bg-primary"
              aria-hidden="true"
            />
            <div className="relative rounded-lg bg-primary text-primary-foreground p-3 text-sm shadow-lg space-y-2">
              <p>☝️ {t('shopHint', language)}</p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => setShopHintSeen()}
              >
                {t('gotIt', language)}
              </Button>
            </div>
          </motion.div>
        )}
        <button
          onClick={() => setSoundPref(!soundEnabled)}
          className="fixed top-4 right-16 size-11 flex items-center justify-center rounded-full bg-card/70 backdrop-blur-sm border border-primary/25 shadow-lg shadow-black/30 transition-colors hover:border-primary/60 z-40"
          aria-label="Toggle sound"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          onClick={() => {
            setSaveName(savedAdventures.find(a => a.id === activeAdventureId)?.name ?? '')
            setIsPaused(true)
          }}
          className="fixed top-4 right-4 size-11 flex items-center justify-center rounded-full bg-card/70 backdrop-blur-sm border border-primary/25 shadow-lg shadow-black/30 transition-colors hover:border-primary/60 z-40"
        >
          ⏸
        </button>

        {/* Pause overlay */}
        {isPaused && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="card-surface p-6 rounded-xl border border-primary/20 space-y-4 max-w-xs w-full">
              <h2 className="text-xl font-serif text-primary text-center">{t('paused', language)}</h2>
              <Button className="w-full" onClick={() => setIsPaused(false)}>{t('resume', language)}</Button>
              <div className="space-y-2">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder={t('nameAdventure', language)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    saveAdventure(saveName || undefined)
                    router.push('/')
                  }}
                >
                  {t('saveQuit', language)}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Shop for the current player's hero */}
        {shopOpen && currentHero && (
          <ShopModal
            hero={currentHero}
            characterName={currentCharacter.name}
            language={language}
            onBuy={handleBuy}
            onBuyPotion={handleBuyPotion}
            onBuyPet={handleBuyPet}
            onClose={() => setShopOpen(false)}
          />
        )}

        {/* Inventory for whichever hero chip was tapped */}
        {inventoryPlayerId && (() => {
          const invHero = heroes.find(h => h.playerId === inventoryPlayerId)
          const invChar = characters.find(c => c.playerId === inventoryPlayerId)
          return invHero && invChar ? (
            <InventoryModal
              hero={invHero}
              characterName={invChar.name}
              characterClass={invChar.class}
              language={language}
              onClose={() => setInventoryPlayerId(null)}
            />
          ) : null
        })()}

        {/* Reward overlays: monster celebration → loot → level-up → boss victory */}
        {gamePhase === 'rewards' && monsterVictory && (
          <MonsterVictoryModal
            monsterName={monsterVictory.monsterName}
            finisherName={monsterVictory.finisherName}
            language={language}
            onContinue={handleMonsterVictoryContinue}
          />
        )}
        {gamePhase === 'rewards' && !monsterVictory && pendingLoot && (
          <LootChestModal
            content={pendingLoot.content}
            currentItem={pendingLoot.content.kind === 'item'
              ? heroes.find(h => h.playerId === pendingLoot.playerId)?.equipment[pendingLoot.content.item.slot] ?? null
              : null}
            namePending={pendingLoot.namePending}
            language={language}
            onResolve={handleLootResolve}
          />
        )}
        {gamePhase === 'rewards' && !monsterVictory && !pendingLoot && pendingLevelUp && (
          <LevelUpModal
            characterName={pendingLevelUp.characterName}
            newLevel={pendingLevelUp.newLevel}
            choices={pendingLevelUp.choices}
            language={language}
            onPick={handleSkillPick}
          />
        )}
        {gamePhase === 'rewards' && !monsterVictory && !pendingLoot && !pendingLevelUp && showVictory && encounter && (
          <VictoryOverlay
            bossName={encounter.name}
            language={language}
            goldReward={BOSS_GOLD_REWARD}
            tale={epilogue ? { title: epilogue.title, story: epilogue.story } : null}
            awards={(epilogue?.awards ?? [])
              .map(a => ({
                characterName: characters.find(c => c.playerId === a.playerId)?.name ?? '',
                title: a.title,
                reason: a.reason,
              }))
              .filter(a => a.characterName)}
            taleLoading={epilogueLoading}
            onKeepPlaying={handleVictoryContinue}
            onNewAdventure={() => {
              startNewAdventure()
              router.push('/')
            }}
          />
        )}

        {quest && <QuestBar quest={quest} language={language} />}

        {partyMembers.length > 0 && (
          <PartyBar
            members={partyMembers}
            currentPlayerId={currentPlayer.id}
            language={language}
            onSelectHero={setInventoryPlayerId}
          />
        )}

        {encounter && !encounter.defeated && <EncounterBanner encounter={encounter} language={language} />}

        {rescueMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-center"
          >
            {rescueMessage}
          </motion.div>
        )}

        <PlayerTurn
          playerName={currentPlayer.name}
          characterName={currentCharacter.name}
          characterClass={currentCharacter.class}
        />

        {/* Error display with retry */}
        {error && retryFn && (
          <ErrorMessage message={error} onRetry={retryFn} />
        )}

        <AnimatePresence mode="wait">
          {/* Loading state for initial scene */}
          {(gamePhase === 'loading' || gamePhase === 'rewards') && !error && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center py-12 space-y-4"
            >
              <span className="text-5xl block animate-bounce">🏰</span>
              <p className="text-primary font-serif text-lg animate-pulse">{t('preparing', language)}</p>
            </motion.div>
          )}

          {(gamePhase === 'scene' || gamePhase === 'dice') && (
            <motion.div
              key="scene"
              {...phaseTransition}
              className="space-y-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0"
            >
              {/* On tablets the app opens like a book: page on the left,
                  choices and dice on the right. The page stays put while
                  the right side scrolls. */}
              <div className="lg:sticky lg:top-14">
                <SceneDisplay
                  narration={narration}
                  isLoadingNarration={loadingScene}
                  imageUrl={sceneImageUrl ?? undefined}
                  isLoadingImage={loadingImage}
                />
              </div>

              {gamePhase === 'scene' && !loadingScene && narration && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="space-y-2"
                >
                  {canHeal && (
                    <Button variant="outline" className="w-full border-success/40" onClick={handleHeal}>
                      {POWER_META.heal.emoji} {POWER_META.heal.name[language]} (+3 ❤️)
                    </Button>
                  )}
                  {canDrinkHeal && (
                    <Button variant="outline" className="w-full border-success/40" onClick={handleDrinkHeal}>
                      🧪 {potionDefinition('heal').name[language]} (+{HEAL_POTION_HP} ❤️)
                    </Button>
                  )}
                  {loadingActions ? (
                    <div className="text-center text-muted-foreground animate-pulse py-4">
                      {t('thinkingActions', language)}
                    </div>
                  ) : actions.length > 0 ? (
                    <ActionPicker
                      options={actions}
                      statBonusFor={currentHero
                        ? (a) => heroStatBonus(currentCharacter.class, currentHero, a.stat)
                        : undefined}
                      language={language}
                      onSelect={handleActionSelect}
                      onCustomIdea={handleCustomIdea}
                      customLoading={loadingCustomAction}
                    />
                  ) : null}
                </motion.div>
              )}

              {gamePhase === 'dice' && selectedAction && currentHero && (
                <div className="space-y-2">
                  {canArmLucky && (
                    <Button variant="outline" className="w-full border-primary/40" onClick={handleArmLucky}>
                      {POWER_META.lucky.emoji} {POWER_META.lucky.name[language]}
                    </Button>
                  )}
                  {luckyArmedFor === currentPlayer.id && (
                    <p className="text-center text-xs text-primary">🍀 ✓</p>
                  )}
                  {canDrinkLuck && (
                    <Button variant="outline" className="w-full border-primary/40" onClick={handleDrinkLuck}>
                      🍀 {potionDefinition('luck').name[language]} (+{LUCK_POTION_BONUS})
                    </Button>
                  )}

                  {/* Teamwork: a sibling lends +1 before the dice hit the table */}
                  {helpers.length > 0 && (
                    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                      <p className="text-center text-xs text-muted-foreground">
                        🤝 {t('assistTitle', language)} (+{ASSIST_BONUS})
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {helpers.map(({ playerId, char, hero }) => (
                          <button
                            key={playerId}
                            onClick={() => setAssistPlayerId(assistPlayerId === playerId ? null : playerId)}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95',
                              assistPlayerId === playerId
                                ? 'border-primary bg-primary/15 text-primary'
                                : 'border-border bg-card text-foreground'
                            )}
                          >
                            {hero!.knockedOut ? '📣' : CLASS_DEFINITIONS[char!.class].emoji} {char!.name}
                            {assistPlayerId === playerId && ' ✓'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <DiceRoller
                    stat={selectedAction.stat}
                    statBonus={heroStatBonus(currentCharacter.class, currentHero, selectedAction.stat)}
                    required={requiredRolls(
                      dcForAction(selectedAction, currentHero),
                      heroStatBonus(currentCharacter.class, currentHero, selectedAction.stat) + boostTotal
                    )}
                    boosts={rollBoosts}
                    dicePreference={dicePreference}
                    hasD20={(diceInventory.d20 ?? 0) > 0}
                    language={language}
                    onRoll={handleDiceRoll}
                  />
                </div>
              )}
            </motion.div>
          )}

          {gamePhase === 'outcome' && outcomeType && diceResult !== null && (
            <motion.div
              key="outcome"
              {...phaseTransition}
              className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6"
            >
              <div className="hidden lg:block lg:sticky lg:top-14">
                <SceneDisplay
                  narration={narration}
                  isLoadingNarration={false}
                  imageUrl={sceneImageUrl ?? undefined}
                  isLoadingImage={false}
                />
              </div>
              <OutcomeDisplay
                outcome={outcomeType}
                diceRoll={diceResult}
                crit={turnCrit}
                narrative={outcomeNarrative}
                isLoading={loadingOutcome || !outcomeNarrative}
                xpGained={turnXp}
                goldGained={turnGold}
                damageTaken={turnDamage}
                bossDamage={turnEncounterDamage}
                bossName={encounter?.name}
                language={language}
                powerActions={outcomePowerActions()}
                onContinue={handleContinue}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}
