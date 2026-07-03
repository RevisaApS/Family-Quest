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
      <div className="relative aspect-video rounded-lg overflow-hidden border border-border shadow-[0_0_15px_rgba(212,168,67,0.1)]">
        {isLoadingImage ? (
          <LoadingShimmer className="w-full h-full" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="Scene" className="w-full h-full object-cover" />
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

      <AnimatePresence>
        {showNarrationBox && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-lg p-4 border border-border"
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
                className="text-foreground leading-relaxed"
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
