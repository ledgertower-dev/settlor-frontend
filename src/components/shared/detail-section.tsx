interface DetailSectionProps {
  title: string
  children: React.ReactNode
}

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs uppercase text-muted-foreground">{title}</p>
      <div className="rounded-md border-[0.4px] border-foreground/40 bg-secondary px-4 py-3.5 sm:px-6">
        {children}
      </div>
    </div>
  )
}
