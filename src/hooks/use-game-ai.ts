'use client'

import { useState, useCallback } from 'react'
import type { StoryContext, GeneratedScene, GeneratedAction } from '@/types/ai'
import type { EpilogueContext, GeneratedEpilogue } from '@/lib/ai/epilogue'
import type { OutcomeType, Stat, EquipSlot } from '@/types/game'
import type { Language } from '@/lib/ai/language'

export function useGameAI() {
  const [loadingScene, setLoadingScene] = useState(false)
  const [loadingActions, setLoadingActions] = useState(false)
  const [loadingCustomAction, setLoadingCustomAction] = useState(false)
  const [loadingOutcome, setLoadingOutcome] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchScene = useCallback(async (context: StoryContext): Promise<GeneratedScene | null> => {
    setLoadingScene(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      if (!response.ok) throw new Error('Failed to generate scene')
      return response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoadingScene(false)
    }
  }, [])

  const fetchActions = useCallback(async (context: StoryContext, currentScene: string): Promise<GeneratedAction[] | null> => {
    setLoadingActions(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, currentScene }),
      })
      if (!response.ok) throw new Error('Failed to generate actions')
      return response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoadingActions(false)
    }
  }, [])

  // Grading the kid's own idea is best-effort: a failure returns null and the
  // caller falls back to a locally-built action, so nobody's plan is blocked.
  const fetchCustomAction = useCallback(async (
    context: StoryContext,
    currentScene: string,
    idea: string
  ): Promise<GeneratedAction | null> => {
    setLoadingCustomAction(true)
    try {
      const response = await fetch('/api/ai/custom-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, currentScene, idea }),
      })
      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    } finally {
      setLoadingCustomAction(false)
    }
  }, [])

  const fetchOutcome = useCallback(async (
    storyContext: StoryContext,
    actionChosen: string,
    stat: Stat,
    outcome: OutcomeType,
    currentScene: string,
    damageTaken = 0,
    bossDamage = 0,
    crit: 'crit' | 'fumble' | null = null,
  ): Promise<string | null> => {
    setLoadingOutcome(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyContext, actionChosen, stat, outcome, currentScene, damageTaken, bossDamage, crit }),
      })
      if (!response.ok) throw new Error('Failed to generate outcome')
      const data = await response.json()
      return data.narrative
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoadingOutcome(false)
    }
  }, [])

  const fetchImage = useCallback(async (
    sceneDescription: string,
    style: string,
    heroDescriptions: string[] = [],
    heroPortraits: string[] = []
  ): Promise<string | null> => {
    setLoadingImage(true)
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneDescription, style, heroDescriptions, heroPortraits }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.imageUrl
    } catch {
      return null
    } finally {
      setLoadingImage(false)
    }
  }, [])

  const fetchPortrait = useCallback(async (heroDescription: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/ai/portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroDescription }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.imageUrl ?? null
    } catch {
      return null
    }
  }, [])

  // The storybook epilogue is best-effort: a failure returns null and the
  // victory screen simply skips the tale.
  const fetchEpilogue = useCallback(async (context: EpilogueContext): Promise<GeneratedEpilogue | null> => {
    try {
      const response = await fetch('/api/ai/epilogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }, [])

  // Loot naming is decorative — failures fall back to canned names, no error state.
  const fetchLootName = useCallback(async (
    slot: EquipSlot,
    stat: Stat,
    language: Language,
    sceneContext: string,
    style?: string
  ): Promise<{ name: string; look: string | null } | null> => {
    try {
      const response = await fetch('/api/ai/loot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, stat, language, sceneContext, style }),
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.name ? { name: data.name, look: data.look ?? null } : null
    } catch {
      return null
    }
  }, [])

  return {
    loadingScene, loadingActions, loadingCustomAction, loadingOutcome, loadingImage,
    error,
    fetchScene, fetchActions, fetchCustomAction, fetchOutcome, fetchImage, fetchLootName, fetchPortrait,
    fetchEpilogue,
  }
}
