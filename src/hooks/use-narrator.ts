'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { narrator, narrationId, IDLE_SNAPSHOT, type NarrationKind } from '@/lib/narrator'
import type { StorySegment } from '@/lib/ai/segments'
import type { Language } from '@/lib/ai/language'

// How long the calm "the narrator is hoarse" note stays up
const HOARSE_NOTE_MS = 6000

const idle = () => IDLE_SNAPSHOT

// The play screen's handle on the narrator. Off means off: nothing is queued,
// nothing is fetched, and whatever was playing stops. Paused means the voice
// holds its breath until the game resumes.
export function useNarrator(enabled: boolean, paused: boolean) {
  const snapshot = useSyncExternalStore(narrator.subscribe, narrator.getSnapshot, idle)
  // Each text is read aloud automatically once; "Læs igen" is how to hear it again
  const spoken = useRef(new Set<string>())
  const [dismissedErrorAt, setDismissedErrorAt] = useState(0)

  useEffect(() => {
    if (enabled) return
    narrator.stop()
    // Switching back on reads the page that is up right now
    spoken.current.clear()
  }, [enabled])

  useEffect(() => {
    narrator.setPaused(paused)
  }, [paused])

  // Leaving the play screen ends the story time
  useEffect(() => {
    const said = spoken.current
    return () => {
      narrator.stop()
      narrator.setPaused(false)
      said.clear()
    }
  }, [])

  const errorAt = snapshot.error?.at ?? 0
  useEffect(() => {
    if (!errorAt) return
    const timer = setTimeout(() => setDismissedErrorAt(errorAt), HOARSE_NOTE_MS)
    return () => clearTimeout(timer)
  }, [errorAt])

  const narrate = useCallback((kind: NarrationKind, segments: StorySegment[], language: Language) => {
    if (!enabled || segments.length === 0) return
    const id = narrationId(kind, segments, language)
    if (spoken.current.has(id)) return
    spoken.current.add(id)
    narrator.say({ id, kind, segments, language })
  }, [enabled])

  const cancel = useCallback((kind: NarrationKind) => narrator.cancel(kind), [])

  // "Læs igen": read these again from the start, in order. Audio in memory is
  // reused; a narration that failed or was cut off is asked for again.
  const replay = useCallback((items: Array<[NarrationKind, StorySegment[]]>, language: Language) => {
    if (!enabled) return
    narrator.replay(
      items
        .filter(([, segments]) => segments.length > 0)
        .map(([kind, segments]) => {
          const id = narrationId(kind, segments, language)
          spoken.current.add(id)
          return { id, kind, segments, language }
        })
    )
  }, [enabled])

  return {
    status: snapshot.status,
    hoarse: enabled && errorAt > 0 && errorAt !== dismissedErrorAt,
    narrate,
    cancel,
    replay,
  }
}
