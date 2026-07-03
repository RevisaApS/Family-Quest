import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn(
      "relative min-h-screen bg-background px-4 pt-14 pb-12",
      "flex flex-col items-center",
      className
    )}>
      {/* Vignette overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, oklch(0.08 0.015 250 / 0.3) 100%)',
        }}
        aria-hidden="true"
      />
      <div className="relative z-20 w-full max-w-md">
        {children}
      </div>
    </main>
  )
}
