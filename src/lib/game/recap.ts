// "Sidst i eventyret…" — the recap read aloud when a saved adventure is
// resumed or the iPad reloads mid-story. Built from the story memory the
// game already keeps, so it costs no AI call and works offline.
//
// Story-memory lines are written by the play page as
//   "[Hero · action · ✓] outcome prose"
// (see handleContinue). Older saves may hold lines in another shape; those
// come through as plain text rather than being dropped.

export type BeatTag = '✓' | '~' | '✗'

export interface RecapBeat {
  hero?: string
  action?: string
  tag?: BeatTag
  text: string
}

const LINE = /^\[(.+?) · (.+?) · ([✓~✗])\] ?([\s\S]*)$/

export function parseStoryLine(line: string): RecapBeat {
  const m = LINE.exec(line.trim())
  if (!m) return { text: line.trim() }
  const [, hero, action, tag, text] = m
  return { hero, action, tag: tag as BeatTag, text: text.trim() || action }
}

// The last `count` beats, oldest first, so Far reads them in story order.
export function buildRecap(storyHistory: string[], count = 3): RecapBeat[] {
  return storyHistory
    .filter(l => l && l.trim())
    .slice(-count)
    .map(parseStoryLine)
}

// A resumed adventure has something to recap; a fresh one does not.
export function shouldShowRecap(storyHistory: string[]): boolean {
  return storyHistory.some(l => l && l.trim())
}
