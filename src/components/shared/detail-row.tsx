interface DetailRowProps {
  label: string
  value?: string
  isLast?: boolean
  children?: React.ReactNode
}

export function DetailRow({ label, value, isLast = false, children }: DetailRowProps) {
  return (
    <div className={`flex items-center ${!isLast ? 'border-b border-foreground/15' : ''}`}>
      <p className="w-2/5 shrink-0 text-xs capitalize text-foreground/80">{label}</p>
      <div className="w-3/5 px-4 py-3.5 sm:px-6">
        {children ?? (
          <p className="text-sm font-semibold text-foreground/80 break-words">{value || '—'}</p>
        )}
      </div>
    </div>
  )
}
