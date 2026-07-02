import { type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AppIcon } from '@/components/shared/app-icon'

export interface MetricCardProps {
  icon: LucideIcon
  label: string
  sublabel?: string
  amount: string
  transactionCount?: string
  isLoading?: boolean
}

export function MetricCard({
  icon: Icon,
  label,
  sublabel,
  amount,
  transactionCount,
  isLoading = false,
}: MetricCardProps) {
  return (
    <div className="@container overflow-hidden rounded-md border border-transparent dark:border-input bg-card px-6 py-3.5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-button-bg">
            <AppIcon icon={Icon} color="primary-foreground" />
          </div>
          <div>
            <p className="text-sm capitalize text-foreground">{label}</p>
            {sublabel && <p className="text-sm capitalize text-muted-foreground">{sublabel}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <p className="break-all leading-none text-[min(2rem,12cqi)] text-foreground">
              {amount}
            </p>
          )}
          {transactionCount !== undefined &&
            (isLoading ? (
              <Skeleton className="h-6 w-28 rounded-full" />
            ) : (
              <div className="w-fit rounded-full bg-foreground/10 px-2 py-1">
                <p className="text-xs text-muted-foreground">{transactionCount}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
