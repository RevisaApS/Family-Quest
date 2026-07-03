'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface PlayerCardProps {
  id: string
  name: string
  age: number
  color: string
  selected?: boolean
  onSelect?: () => void
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  selectable?: boolean
  editMode?: boolean
}

const shimmerStyle = {
  borderImage: 'linear-gradient(90deg, hsl(45 100% 50%) 0%, #ffd700 25%, #fff8dc 50%, #ffd700 75%, hsl(45 100% 50%) 100%) 1',
  animation: 'playerCardShimmer 3s linear infinite',
} as const

export function PlayerCard({
  name, age, color, selected, onSelect, onRemove, onMoveUp, onMoveDown, selectable = false, editMode = false,
}: PlayerCardProps) {
  return (
    <>
      <style>{`
        @keyframes playerCardShimmer {
          0% { border-image-source: linear-gradient(90deg, hsl(45 100% 50%) 0%, #ffd700 25%, #fff8dc 50%, #ffd700 75%, hsl(45 100% 50%) 100%); }
          33% { border-image-source: linear-gradient(90deg, #ffd700 0%, #fff8dc 25%, #ffd700 50%, hsl(45 100% 50%) 75%, #ffd700 100%); }
          66% { border-image-source: linear-gradient(90deg, #fff8dc 0%, #ffd700 25%, hsl(45 100% 50%) 50%, #ffd700 75%, #fff8dc 100%); }
          100% { border-image-source: linear-gradient(90deg, hsl(45 100% 50%) 0%, #ffd700 25%, #fff8dc 50%, #ffd700 75%, hsl(45 100% 50%) 100%); }
        }
      `}</style>
      <div className="flex items-center gap-2">
        {editMode && (
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="min-w-[32px] min-h-[32px] p-0 text-muted-foreground hover:text-foreground"
              onClick={onMoveUp}
              disabled={!onMoveUp}
            >
              &#x25B2;
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-w-[32px] min-h-[32px] p-0 text-muted-foreground hover:text-foreground"
              onClick={onMoveDown}
              disabled={!onMoveDown}
            >
              &#x25BC;
            </Button>
          </div>
        )}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={selectable && !editMode ? onSelect : undefined}
          style={selected ? shimmerStyle : undefined}
          className={cn(
            "relative flex-1 p-4 rounded-lg border-2 transition-all min-h-[64px]",
            selectable && !editMode && "cursor-pointer hover:border-primary/50",
            selected
              ? "border-primary bg-[hsl(45_100%_50%/0.06)]"
              : "border-muted bg-card",
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}40`,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-h-[44px] flex flex-col justify-center">
              <p className="font-medium text-foreground">{name}</p>
              <p className="text-sm text-muted-foreground">Age {age}</p>
            </div>
            {selectable && !editMode && (
              <div className={cn(
                "w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center",
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
        </motion.div>
        {editMode && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            &times;
          </Button>
        )}
      </div>
    </>
  )
}
