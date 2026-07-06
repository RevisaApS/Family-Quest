interface HeaderProps {
  backHref?: string
}

export function Header({ backHref }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-30">
      {backHref ? (
        <a
          href={backHref}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-full bg-card/70 backdrop-blur-sm hover:bg-card border border-primary/25 hover:border-primary/60 text-sm font-medium text-muted-foreground hover:text-primary shadow-lg shadow-black/30 transition-colors"
        >
          &#8592; Back
        </a>
      ) : (
        <div />
      )}
    </header>
  )
}
