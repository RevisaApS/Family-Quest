import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  // Screens with side-by-side content (the play screen's book spread)
  // get the full tablet width; forms and menus stay a readable column.
  wide?: boolean
}

export function PageContainer({ children, className, wide = false }: PageContainerProps) {
  return (
    <main className={cn(
      // No bg here — the body paints the torchlit gradient backdrop
      "relative min-h-screen px-4 pt-14 pb-12",
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
      {/* Phone-first, but let tablets breathe: the column widens with the screen */}
      <div className={cn(
        "relative z-20 w-full",
        wide ? "max-w-md md:max-w-3xl lg:max-w-5xl" : "max-w-md md:max-w-2xl"
      )}>
        {children}
      </div>
    </main>
  )
}
