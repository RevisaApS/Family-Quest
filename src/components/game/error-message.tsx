'use client'

import { Button } from '@/components/ui/button'
import { useGameStore } from '@/stores/game-store'
import { t } from '@/lib/i18n'

interface ErrorMessageProps {
  message: string
  onRetry: () => void
}

export function ErrorMessage({ onRetry }: ErrorMessageProps) {
  const language = useGameStore(s => s.language)
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3 text-center">
      <span className="text-3xl block">📜</span>
      <p className="text-destructive font-serif">{t('errorTitle', language)}</p>
      <p className="text-sm text-muted-foreground">{t('errorSub', language)}</p>
      <Button variant="outline" onClick={onRetry}>{t('tryAgain', language)}</Button>
    </div>
  )
}
