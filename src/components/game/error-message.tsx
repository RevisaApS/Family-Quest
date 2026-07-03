import { Button } from '@/components/ui/button'

interface ErrorMessageProps {
  message: string
  onRetry: () => void
}

export function ErrorMessage({ onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3 text-center">
      <span className="text-3xl block">📜</span>
      <p className="text-destructive font-serif">The magic scroll got a bit jumbled...</p>
      <p className="text-sm text-muted-foreground">Something went wrong, but every hero faces setbacks!</p>
      <Button variant="outline" onClick={onRetry}>Cast Again</Button>
    </div>
  )
}
