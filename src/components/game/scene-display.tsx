'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { LoadingShimmer } from '@/components/layout/loading-shimmer'

interface SceneDisplayProps {
  imageUrl?: string
  isLoadingImage: boolean
  narration: string
  isLoadingNarration: boolean
  // False when re-showing a page the family has already seen — no fade-in
  animateIn?: boolean
}

// The signature element of the whole app: a page of the storybook.
// Illustration plate on top, narration in ink below — one piece of paper.
export function SceneDisplay({ imageUrl, isLoadingImage, narration, isLoadingNarration, animateIn = true }: SceneDisplayProps) {
  const showNarrationBox = isLoadingNarration || !!narration

  return (
    <div className="page-parchment p-3 sm:p-4 space-y-4">
      <div className="plate-frame relative aspect-video overflow-hidden">
        {imageUrl ? (
          <motion.img
            key={imageUrl}
            initial={animateIn ? { opacity: 0, scale: 1.05 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            src={imageUrl}
            alt="Scene"
            className="w-full h-full object-cover"
          />
        ) : isLoadingImage ? (
          // The picture is painted in the background while the scene is read
          // aloud — shimmer until it fades in.
          <LoadingShimmer className="w-full h-full rounded-none from-[oklch(0.88_0.045_82)] via-[oklch(0.93_0.04_86)] to-[oklch(0.88_0.045_82)]" />
        ) : (
          <div className="w-full h-full bg-[oklch(0.88_0.045_82)] flex items-center justify-center">
            <span className="text-4xl">🏰</span>
          </div>
        )}
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(40,25,10,0.35) 100%)',
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
            className="px-1 pb-1"
          >
            {isLoadingNarration ? (
              <div className="space-y-2">
                <LoadingShimmer className="h-4 w-full from-[oklch(0.88_0.045_82)] via-[oklch(0.93_0.04_86)] to-[oklch(0.88_0.045_82)]" />
                <LoadingShimmer className="h-4 w-3/4 from-[oklch(0.88_0.045_82)] via-[oklch(0.93_0.04_86)] to-[oklch(0.88_0.045_82)]" />
              </div>
            ) : (
              <motion.p
                key={narration}
                initial={animateIn ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="drop-cap text-lg leading-relaxed"
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
