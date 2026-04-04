import { Button } from '@/components/ui/button'

interface ErrorMessageProps {
  message: string
  onRetry: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={onRetry}>Try Again</Button>
    </div>
  )
}
