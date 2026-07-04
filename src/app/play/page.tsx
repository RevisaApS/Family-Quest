'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PageContainer } from '@/components/layout/page-container'
import { SceneDisplay } from '@/components/game/scene-display'
import { PlayerTurn } from '@/components/game/player-turn'
import { PartyBar, type PartyMember } from '@/components/game/party-bar'
import { ActionPicker } from '@/components/game/action-picker'
import { DiceRoller } from '@/components/game/dice-roller'
import { OutcomeDisplay } from '@/components/game/outcome-display'
import { ErrorMessage } from '@/components/game/error-message'
import { BossBanner } from '@/components/game/boss-banner'
import { LevelUpModal } from '@/components/game/level-up-modal'
import { LootChestModal, type ChestContent } from '@/components/game/loot-chest-modal'
import { VictoryOverlay } from '@/components/game/victory-overlay'
import { ShopModal } from '@/components/game/shop-modal'
import { InventoryModal } from '@/components/game/inventory-modal'
import { useGameStore } from '@/stores/game-store'
import { useGameAI } from '@/hooks/use-game-ai'
import { calculateOutcome } from '@/lib/game/mechanics'
import {
  heroStatBonus, levelThresholdAdjustment, applyTurnOutcome, reviveHero,
  heroDamageForOutcome, bossDamageForOutcome, lootShouldDrop, lootBonusForRoll,
  bossArrivalTurn, createBoss, equipLoot, addSkill, addGold, buyItem,
  chestIsGold, chestGoldAmount, BOSS_GOLD_REWARD,
} from '@/lib/game/rpg'
import { skillChoices } from '@/lib/game/skills'
import { rollLootSlot, rollLootStat, createLoot, fallbackLootName } from '@/lib/game/loot'
import { toLootItem, type ShopItem } from '@/lib/game/shop'
import { heroVisualDescription } from '@/lib/game/appearance'
import { loadPortraits } from '@/lib/portraits'
import { sfx, setSoundEnabled } from '@/lib/sound'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { GeneratedAction, StoryContext, BossPhase } from '@/types/ai'
import type { OutcomeType, Skill } from '@/types/game'

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
}

export default function PlayPage() {
  const router = useRouter()
  const {
    players, selectedPlayerIds, characters, difficulty,
    adventureStyle, dicePreference, language, storyHistory, turnHistory,
    currentPlayerIndex, updateAdventureState, _hasHydrated,
    saveAdventure, savedAdventures, activeAdventureId,
    heroes, boss, initHeroes, updateHero, setBoss,
    soundEnabled, setSoundEnabled: setSoundPref, startNewAdventure,
  } = useGameStore()
  const {
    loadingScene, loadingActions, loadingOutcome, loadingImage,
    error, fetchScene, fetchActions, fetchOutcome, fetchImage, fetchLootName,
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
  const [gamePhase, setGamePhase] = useState<'loading' | 'scene' | 'action' | 'dice' | 'outcome' | 'rewards'>('loading')
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
  const [turnBossDamage, setTurnBossDamage] = useState(0)
  const [pendingLoot, setPendingLoot] = useState<PendingChest | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [inventoryPlayerId, setInventoryPlayerId] = useState<string | null>(null)
  const [pendingLevelUp, setPendingLevelUp] = useState<PendingLevelUp | null>(null)
  const [showVictory, setShowVictory] = useState(false)
  const [rescueMessage, setRescueMessage] = useState<string | null>(null)
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

  // Sound engine follows the persisted preference
  useEffect(() => { setSoundEnabled(soundEnabled) }, [soundEnabled])

  const bossActive = !!boss && !boss.defeated && boss.hp > 0

  const currentBossPhase = useCallback((): BossPhase => {
    if (boss) return boss.defeated ? 'defeated' : 'active'
    if (selectedPlayers.length > 0 && turnHistory.length >= bossArrivalTurn(selectedPlayers.length)) {
      return 'arriving'
    }
    return 'none'
  }, [boss, selectedPlayers.length, turnHistory.length])

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
          } : undefined,
        }
      }),
    currentPlayerId: currentPlayer?.id ?? '',
    language,
    bossPhase: currentBossPhase(),
    boss: boss ? { name: boss.name, hp: boss.hp, maxHp: boss.maxHp } : null,
  }), [adventureStyle, storyHistory, selectedPlayers, characters, heroes, currentPlayer, language, boss, currentBossPhase])

  const heroImageDescriptions = useCallback((): string[] =>
    selectedPlayers
      .map(p => {
        const char = characters.find(c => c.playerId === p.id)
        if (!char) return null
        const base = heroVisualDescription(char.name, char.class, char.gender, p.color, p.age)
        // Equipped gear shows up on the hero in every scene: buy the Golden
        // Helm and the pictures wear it
        const gearLooks = Object.values(heroes.find(h => h.playerId === p.id)?.equipment ?? {})
          .filter((i): i is NonNullable<typeof i> => !!i)
          .map(i => i.look)
          .filter((l): l is string => !!l)
        return gearLooks.length ? `${base}, equipped with ${gearLooks.join(', ')}` : base
      })
      .filter((d): d is string => !!d),
  [selectedPlayers, characters, heroes])

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
    setTurnBossDamage(0)
    setRescueMessage(null)

    // Teammates help knocked-out heroes back up at the start of the next turn
    const state = useGameStore.getState()
    const koHeroes = state.heroes.filter(h => h.knockedOut)
    if (koHeroes.length > 0) {
      koHeroes.forEach(h => updateHero(reviveHero(h)))
      const koNames = koHeroes
        .map(h => characters.find(c => c.playerId === h.playerId)?.name)
        .filter(Boolean)
        .join(', ')
      if (selectedPlayers.length > 1 && currentCharacter && !koHeroes.some(h => h.playerId === currentPlayer?.id)) {
        setRescueMessage(`🤝 ${currentCharacter.name} ${t('rescuedBy', language)} ${koNames} ${t('backUp', language)}`)
      } else {
        setRescueMessage(`💫 ${koNames} ${t('soloRecover', language)}`)
      }
    }

    const context = buildStoryContext()
    const scene = await fetchScene(context)
    if (scene) {
      setNarration(scene.narration)
      setCurrentSceneText(scene.narration)
      setGamePhase('scene')

      // Boss makes its entrance
      if (context.bossPhase === 'arriving') {
        const fallbackName = language === 'da' ? 'Skyggekongen' : 'The Shadow King'
        setBoss(createBoss(scene.bossName?.trim() || fallbackName, selectedPlayers.length))
        sfx.bossAppear()
      }

      // Paint the scene in the background — the text is readable immediately
      // and the image fades in whenever it's ready.
      getHeroPortraits()
        .then(portraits => fetchImage(scene.imagePrompt, adventureStyle, heroImageDescriptions(), portraits))
        .then(url => { if (url) setSceneImageUrl(url) })
    } else {
      setRetryFn(() => () => { loadScene() })
    }
  }, [buildStoryContext, fetchScene, fetchImage, adventureStyle, heroImageDescriptions, getHeroPortraits, language, selectedPlayers.length, characters, currentCharacter, currentPlayer, updateHero, setBoss])

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

  if (!currentPlayer || !currentCharacter) {
    return (
      <PageContainer className="justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No characters found</p>
          <Button onClick={() => router.push('/players')}>Start Over</Button>
        </div>
      </PageContainer>
    )
  }

  const handleChooseAction = async () => {
    setGamePhase('action')
    await loadActions()
  }

  const handleActionSelect = (action: GeneratedAction) => {
    setSelectedAction(action)
    setGamePhase('dice')
  }

  const handleDiceRoll = async (result: number) => {
    setDiceResult(result)

    if (!selectedAction || !currentCharacter || !currentHero) return

    const statValue = heroStatBonus(currentCharacter.class, currentHero, selectedAction.stat)
    const calculated = calculateOutcome({
      sceneFit: selectedAction.sceneFit,
      statValue,
      diceRoll: result,
      difficulty,
      thresholdAdjustment: levelThresholdAdjustment(currentHero.level) + (bossActive ? 1 : 0),
    })
    setOutcomeType(calculated.outcome)
    setGamePhase('outcome')

    if (calculated.outcome === 'success') sfx.success()
    else if (calculated.outcome === 'failure') sfx.failure()

    // Apply RPG consequences to the acting hero
    const resolution = applyTurnOutcome(currentHero, calculated.outcome, bossActive)
    updateHero(resolution.hero)
    setTurnXp(resolution.xpGained)
    setTurnGold(resolution.goldGained)
    setTurnDamage(resolution.damageTaken)
    if (resolution.damageTaken > 0) sfx.hit()

    // Level up → queue the "pick your power" cards
    if (resolution.leveledUp) {
      setPendingLevelUp({
        playerId: currentHero.playerId,
        characterName: currentCharacter.name,
        newLevel: resolution.hero.level,
        choices: skillChoices(currentCharacter.class, resolution.hero.skills.map(s => s.id), language),
      })
    }

    // Boss takes damage on success/partial
    let bossDamage = 0
    if (bossActive && boss) {
      bossDamage = bossDamageForOutcome(calculated.outcome)
      if (bossDamage > 0) {
        const newHp = Math.max(0, boss.hp - bossDamage)
        const defeated = newHp === 0
        setBoss({ ...boss, hp: newHp, defeated })
        if (defeated) {
          setShowVictory(true)
          // The quest reward: every hero gets a big payday
          useGameStore.getState().heroes.forEach(h => updateHero(addGold(h, BOSS_GOLD_REWARD)))
        }
      }
      setTurnBossDamage(bossDamage)
    }

    // Strong success → treasure, owned by the hero who rolled it.
    // Named by the AI while the outcome is read.
    if (lootShouldDrop(calculated.outcome, result)) {
      const ownerPlayerId = currentPlayer.id
      if (chestIsGold()) {
        setPendingLoot({ content: { kind: 'gold', amount: chestGoldAmount(result) }, playerId: ownerPlayerId })
      } else {
        const slot = rollLootSlot()
        const stat = rollLootStat()
        const bonus = lootBonusForRoll(result)
        const item = createLoot(slot, stat, bonus, fallbackLootName(slot, stat, language))
        setPendingLoot({ content: { kind: 'item', item }, playerId: ownerPlayerId })
        fetchLootName(slot, stat, language, currentSceneText).then(name => {
          if (name) {
            setPendingLoot(prev =>
              prev && prev.content.kind === 'item' && prev.content.item.id === item.id
                ? { ...prev, content: { kind: 'item', item: { ...prev.content.item, name } } }
                : prev
            )
          }
        })
      }
    }

    // Fetch AI-generated outcome narrative
    const context = buildStoryContext()
    const narrative = await fetchOutcome(
      context,
      selectedAction.text,
      selectedAction.stat,
      calculated.outcome,
      currentSceneText,
      heroDamageForOutcome(calculated.outcome, bossActive),
      bossDamage,
    )
    if (narrative) {
      setOutcomeNarrative(narrative)
    } else {
      setOutcomeNarrative('The story continues...')
    }
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

    // Loot chest → level-up cards → (boss victory) → next scene
    setGamePhase('rewards')
    if (!pendingLoot && !pendingLevelUp && !showVictory) {
      setTurnCounter(prev => prev + 1)
    }
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

  const handleBuy = (item: ShopItem) => {
    const hero = useGameStore.getState().heroes.find(h => h.playerId === currentPlayer.id)
    if (!hero) return
    const bought = buyItem(hero, toLootItem(item, language), item.price)
    if (bought) updateHero(bought)
  }

  const handleSkillPick = (skill: Skill | null) => {
    if (skill && pendingLevelUp) {
      const hero = useGameStore.getState().heroes.find(h => h.playerId === pendingLevelUp.playerId)
      if (hero) updateHero(addSkill(hero, skill))
    }
    setPendingLevelUp(null)
    if (!showVictory) setTurnCounter(prev => prev + 1)
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

  const phaseTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Shop + sound + pause buttons */}
        <button
          onClick={() => setShopOpen(true)}
          className="fixed top-4 right-24 p-2 rounded-lg bg-card border border-border z-40"
          aria-label="Open shop"
        >
          🏪
        </button>
        <button
          onClick={() => setSoundPref(!soundEnabled)}
          className="fixed top-4 right-14 p-2 rounded-lg bg-card border border-border z-40"
          aria-label="Toggle sound"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          onClick={() => {
            setSaveName(savedAdventures.find(a => a.id === activeAdventureId)?.name ?? '')
            setIsPaused(true)
          }}
          className="fixed top-4 right-4 p-2 rounded-lg bg-card border border-border z-40"
        >
          ⏸
        </button>

        {/* Pause overlay */}
        {isPaused && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg border border-border space-y-4 max-w-xs w-full">
              <h2 className="text-xl font-serif text-primary text-center">Paused</h2>
              <Button className="w-full" onClick={() => setIsPaused(false)}>Resume</Button>
              <div className="space-y-2">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Name this adventure"
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
                  Save &amp; Quit
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

        {/* Reward overlays: loot first, then level-up, then victory */}
        {gamePhase === 'rewards' && pendingLoot && (
          <LootChestModal
            content={pendingLoot.content}
            currentItem={pendingLoot.content.kind === 'item'
              ? heroes.find(h => h.playerId === pendingLoot.playerId)?.equipment[pendingLoot.content.item.slot] ?? null
              : null}
            language={language}
            onResolve={handleLootResolve}
          />
        )}
        {gamePhase === 'rewards' && !pendingLoot && pendingLevelUp && (
          <LevelUpModal
            characterName={pendingLevelUp.characterName}
            newLevel={pendingLevelUp.newLevel}
            choices={pendingLevelUp.choices}
            language={language}
            onPick={handleSkillPick}
          />
        )}
        {gamePhase === 'rewards' && !pendingLoot && !pendingLevelUp && showVictory && boss && (
          <VictoryOverlay
            bossName={boss.name}
            language={language}
            goldReward={BOSS_GOLD_REWARD}
            onKeepPlaying={() => {
              setShowVictory(false)
              setTurnCounter(prev => prev + 1)
            }}
            onNewAdventure={() => {
              startNewAdventure()
              router.push('/')
            }}
          />
        )}

        {partyMembers.length > 0 && (
          <PartyBar
            members={partyMembers}
            currentPlayerId={currentPlayer.id}
            language={language}
            onSelectHero={setInventoryPlayerId}
          />
        )}

        {boss && !boss.defeated && <BossBanner boss={boss} />}

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
              <p className="text-primary font-serif text-lg animate-pulse">Preparing your adventure...</p>
            </motion.div>
          )}

          {gamePhase === 'scene' && (
            <motion.div
              key="scene"
              {...phaseTransition}
              className="space-y-4"
            >
              <SceneDisplay
                narration={narration}
                isLoadingNarration={loadingScene}
                imageUrl={sceneImageUrl ?? undefined}
                isLoadingImage={loadingImage}
              />

              {!loadingScene && narration && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Button className="w-full" onClick={handleChooseAction}>
                    Choose Action
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {gamePhase === 'action' && (
            <motion.div
              key="action"
              {...phaseTransition}
            >
              <SceneDisplay
                narration={narration}
                isLoadingNarration={false}
                imageUrl={sceneImageUrl ?? undefined}
                isLoadingImage={loadingImage}
              />

              <div className="mt-4">
                {loadingActions ? (
                  <div className="text-center text-muted-foreground animate-pulse py-4">
                    Thinking of what you can do...
                  </div>
                ) : actions.length > 0 ? (
                  <ActionPicker options={actions} onSelect={handleActionSelect} />
                ) : null}
              </div>
            </motion.div>
          )}

          {gamePhase === 'dice' && selectedAction && (
            <motion.div
              key="dice"
              {...phaseTransition}
            >
              <SceneDisplay
                narration={narration}
                isLoadingNarration={false}
                imageUrl={sceneImageUrl ?? undefined}
                isLoadingImage={loadingImage}
              />

              <div className="mt-4">
                <DiceRoller
                  stat={selectedAction.stat}
                  dicePreference={dicePreference}
                  statBonus={currentCharacter && currentHero
                    ? heroStatBonus(currentCharacter.class, currentHero, selectedAction.stat)
                    : undefined}
                  onRoll={handleDiceRoll}
                />
              </div>
            </motion.div>
          )}

          {gamePhase === 'outcome' && outcomeType && diceResult !== null && (
            <motion.div
              key="outcome"
              {...phaseTransition}
            >
              <OutcomeDisplay
                outcome={outcomeType}
                diceRoll={diceResult}
                narrative={outcomeNarrative}
                isLoading={loadingOutcome || !outcomeNarrative}
                xpGained={turnXp}
                goldGained={turnGold}
                damageTaken={turnDamage}
                bossDamage={turnBossDamage}
                bossName={boss?.name}
                language={language}
                onContinue={handleContinue}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  )
}
