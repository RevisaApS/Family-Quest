'use client'

import { useCallback, useMemo, useRef } from 'react'
import type { GeneratedAction, GeneratedScene, StoryContext } from '@/types/ai'
import type { FetchOpts } from '@/hooks/use-game-ai'
import { contextKey } from '@/lib/game/prefetch'

// The next page, written while the family reads the outcome of this one.
// Holds at most one prefetch; the play page adopts it in loadScene only when
// the real context still matches the one it was built from.

export interface PrefetchStart {
  // Identifies the context this prefetch was built from. The same id twice is
  // a no-op, which also absorbs StrictMode's double-invoked effects.
  id: string
  context: StoryContext
  // Off on arrival, aftermath and enrage turns: today their actions are asked
  // for after loadScene has created or changed the encounter, and a prefetch
  // built before that would offer non-combat options in a fight.
  prefetchActions: boolean
  fetchScene: (c: StoryContext, o: FetchOpts) => Promise<GeneratedScene | null>
  fetchActions: (c: StoryContext, sceneText: string, o: FetchOpts) => Promise<GeneratedAction[] | null>
  fetchImage: (scene: GeneratedScene, signal: AbortSignal) => Promise<string | null>
}

export interface PrefetchTaken {
  scene: Promise<GeneratedScene | null>
  actions: Promise<GeneratedAction[] | null> | null
  image: Promise<string | null>
}

interface Entry extends PrefetchTaken {
  id: string
  key: string
  controller: AbortController
}

export function useScenePrefetch() {
  const entry = useRef<Entry | null>(null)

  const cancel = useCallback(() => {
    entry.current?.controller.abort()
    entry.current = null
  }, [])

  const start = useCallback((s: PrefetchStart) => {
    if (entry.current?.id === s.id) return
    cancel()
    const controller = new AbortController()
    const opts: FetchOpts = { signal: controller.signal, silent: true }
    const scene = s.fetchScene(s.context, opts)
    const actions = s.prefetchActions
      ? scene.then(sc => (sc ? s.fetchActions(s.context, sc.narration, opts) : null))
      : null
    const image = scene.then(sc => (sc ? s.fetchImage(sc, controller.signal) : null))
    entry.current = { id: s.id, key: contextKey(s.context), controller, scene, actions, image }
  }, [cancel])

  // Hands over the prefetch when it still fits the real context, else aborts it.
  // Aborting stops the browser waiting; the server may still finish its
  // Gemini call, so a discarded prefetch can cost one image.
  const take = useCallback((real: StoryContext): PrefetchTaken | null => {
    const e = entry.current
    if (!e || e.key !== contextKey(real)) { cancel(); return null }
    entry.current = null
    return { scene: e.scene, actions: e.actions, image: e.image }
  }, [cancel])

  // Stable identity, so it can sit in loadScene's dependency list
  return useMemo(() => ({ start, take, cancel }), [start, take, cancel])
}
