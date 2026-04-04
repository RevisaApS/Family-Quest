'use client'

import { useState, useCallback } from 'react'
import type { StoryContext, GeneratedScene, GeneratedAction } from '@/types/ai'
import type { OutcomeType, Stat } from '@/types/game'

export function useGameAI() {
  const [loadingScene, setLoadingScene] = useState(false)
  const [loadingActions, setLoadingActions] = useState(false)
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

  const fetchOutcome = useCallback(async (
    storyContext: StoryContext,
    actionChosen: string,
    stat: Stat,
    outcome: OutcomeType,
    currentScene: string
  ): Promise<string | null> => {
    setLoadingOutcome(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyContext, actionChosen, stat, outcome, currentScene }),
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

  const fetchImage = useCallback(async (sceneDescription: string, style: string): Promise<string | null> => {
    setLoadingImage(true)
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneDescription, style }),
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

  return {
    loadingScene, loadingActions, loadingOutcome, loadingImage,
    error,
    fetchScene, fetchActions, fetchOutcome, fetchImage,
  }
}
