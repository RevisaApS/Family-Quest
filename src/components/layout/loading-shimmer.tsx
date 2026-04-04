import { cn } from "@/lib/utils"

interface LoadingShimmerProps {
  className?: string
}

export function LoadingShimmer({ className }: LoadingShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-card via-muted to-card",
        "rounded-lg",
        className
      )}
    />
  )
}
