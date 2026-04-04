'use client'

import { LoadingShimmer } from '@/components/layout/loading-shimmer'

interface SceneDisplayProps {
  imageUrl?: string
  isLoadingImage: boolean
  narration: string
  isLoadingNarration: boolean
}

export function SceneDisplay({ imageUrl, isLoadingImage, narration, isLoadingNarration }: SceneDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="aspect-video rounded-lg overflow-hidden border border-border">
        {isLoadingImage ? (
          <LoadingShimmer className="w-full h-full" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="Scene" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-card flex items-center justify-center">
            <span className="text-4xl">🏰</span>
          </div>
        )}
      </div>
      <div className="bg-card rounded-lg p-4 border border-border">
        {isLoadingNarration ? (
          <div className="space-y-2">
            <LoadingShimmer className="h-4 w-full" />
            <LoadingShimmer className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-foreground leading-relaxed">{narration}</p>
        )}
      </div>
    </div>
  )
}
