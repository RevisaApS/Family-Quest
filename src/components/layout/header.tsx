interface HeaderProps {
  backHref?: string
}

export function Header({ backHref }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-30">
      {backHref ? (
        <a
          href={backHref}
          className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-full bg-card/50 hover:bg-card border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &#8592; Back
        </a>
      ) : (
        <div />
      )}
    </header>
  )
}
