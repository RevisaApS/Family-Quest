'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/stores/game-store'
import { unlockNarrator } from '@/lib/narrator'

// iPad Safari only lets audio start inside a tap. In read-aloud mode every tap
// anywhere in the app (the home screen's "continue" included) unlocks the
// narrator's audio, so the first page can be read without an extra tap.
// Capture phase, so it runs before the tap's own handler awaits anything.
export function NarratorUnlock() {
  const readAloud = useGameStore(s => s.readAloud)

  useEffect(() => {
    if (readAloud !== 'narrator') return
    const unlock = () => unlockNarrator()
    const options = { capture: true, passive: true }
    const events = ['touchend', 'click', 'keydown'] as const
    for (const event of events) document.addEventListener(event, unlock, options)
    return () => {
      for (const event of events) document.removeEventListener(event, unlock, options)
    }
  }, [readAloud])

  return null
}
