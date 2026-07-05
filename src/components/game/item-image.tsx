'use client'

import { useEffect, useState } from 'react'
import { itemImageKey, loadItemImage, saveItemImage } from '@/lib/item-images'
import { useGameStore } from '@/stores/game-store'
import { cn } from '@/lib/utils'
import type { LootItem } from '@/types/game'
import type { AdventureStyle } from '@/types/game'

// One request per item id, shared across every place the item is shown
// (chest, shop, inventory) — the result lands in IndexedDB for good.
const inflight = new Map<string, Promise<string | null>>()

async function resolveItemImage(key: string, item: LootItem, style: AdventureStyle): Promise<string | null> {
  const cached = await loadItemImage(key)
  if (cached) return cached
  let pending = inflight.get(key)
  if (!pending) {
    pending = fetch('/api/ai/item-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name, look: item.look ?? '', bonus: item.bonus, style }),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => (data?.imageUrl as string | undefined) ?? null)
      .catch(() => null)
      .then(async url => {
        if (url) await saveItemImage(key, url)
        inflight.delete(key)
        return url
      })
    inflight.set(key, pending)
  }
  return pending
}

interface ItemImageProps {
  item: LootItem
  // Hold off generating while the item's AI name/look is still settling, so
  // the picture matches the final name
  defer?: boolean
  className?: string
  emojiClassName?: string
}

export function ItemImage({ item, defer, className, emojiClassName }: ItemImageProps) {
  const adventureStyle = useGameStore(s => s.adventureStyle)
  const [url, setUrl] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (defer) return
    let alive = true
    resolveItemImage(itemImageKey(item.id, adventureStyle), item, adventureStyle).then(u => {
      if (!alive) return
      if (u) setUrl(u)
      setSettled(true)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.name, adventureStyle, defer])

  if (url) {
    return <img src={url} alt={item.name} className={cn('object-cover', className)} />
  }
  return (
    <span
      className={cn(
        'flex items-center justify-center bg-muted/40',
        !settled && !defer && 'animate-pulse',
        className
      )}
      aria-label={item.name}
    >
      <span className={emojiClassName}>{item.emoji}</span>
    </span>
  )
}
