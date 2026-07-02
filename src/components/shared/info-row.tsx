import { cn } from '@/lib/core/utils'

interface InfoRowProps {
  label: string
  value: string
  hasBorder?: boolean
}

export function InfoRow({ label, value, hasBorder = false }: InfoRowProps) {
  return (
    <div
      className={cn('flex h-15 items-center px-6', hasBorder && 'border-b border-table-row-border')}
    >
      <span className="w-[12.5rem] text-sm font-medium capitalize text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
