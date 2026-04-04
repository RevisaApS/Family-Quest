import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn(
      "min-h-screen bg-background px-4 py-8",
      "flex flex-col items-center",
      className
    )}>
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  )
}
