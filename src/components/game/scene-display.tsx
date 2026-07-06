'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LoadingShimmer } from '@/components/layout/loading-shimmer'

interface SceneDisplayProps {
  imageUrl?: string
  isLoadingImage: boolean
  narration: string
  isLoadingNarration: boolean
}

export function SceneDisplay({ imageUrl, isLoadingImage, narration, isLoadingNarration }: SceneDisplayProps) {
  const showNarrationBox = isLoadingNarration || !!narration

  return (
    <div className="space-y-4">
      <div className="frame-gold rounded-xl">
      <div className="relative aspect-video rounded-[10px] overflow-hidden">
        {imageUrl ? (
          <motion.img
            key={imageUrl}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            src={imageUrl}
            alt="Scene"
            className="w-full h-full object-cover"
          />
        ) : isLoadingImage ? (
          // The picture is painted in the background while the scene is read
          // aloud — shimmer until it fades in.
          <LoadingShimmer className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-card flex items-center justify-center">
            <span className="text-4xl">🏰</span>
          </div>
        )}
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>
      </div>

      <AnimatePresence>
        {showNarrationBox && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="card-surface rounded-xl p-5 border border-primary/15"
          >
            {isLoadingNarration ? (
              <div className="space-y-2">
                <LoadingShimmer className="h-4 w-full" />
                <LoadingShimmer className="h-4 w-3/4" />
              </div>
            ) : (
              <motion.p
                key={narration}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="drop-cap text-lg text-foreground leading-relaxed"
              >
                {narration}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
