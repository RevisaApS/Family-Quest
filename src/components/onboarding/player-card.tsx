'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PlayerCardProps {
  id: string
  name: string
  age: number
  color: string
  selected?: boolean
  onSelect?: () => void
  onRemove?: () => void
  selectable?: boolean
}

export function PlayerCard({
  name, age, color, selected, onSelect, onRemove, selectable = false,
}: PlayerCardProps) {
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={cn(
        "relative p-4 rounded-lg border-2 transition-all bg-card",
        selectable && "cursor-pointer hover:border-primary/50",
        selected ? "border-primary" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">Age {age}</p>
        </div>
        {selectable && (
          <div className={cn(
            "w-6 h-6 rounded-full border-2 transition-colors",
            selected ? "bg-primary border-primary" : "border-muted-foreground"
          )}>
            {selected && (
              <svg className="w-full h-full text-primary-foreground p-0.5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            )}
          </div>
        )}
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
        >
          ×
        </Button>
      )}
    </div>
  )
}
