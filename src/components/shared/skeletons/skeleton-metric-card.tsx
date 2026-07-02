import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/core/utils'

interface SkeletonMetricGridProps {
  count?: number
  gridClassName?: string
}

export function SkeletonMetricGrid({
  count = 3,
  gridClassName = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}: SkeletonMetricGridProps) {
  return (
    <div className={cn('grid gap-3.5', gridClassName)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-md border-[0.5px] border-foreground/20 bg-card px-6 py-3.5 shadow-[var(--shadow-card)]"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3.5">
              <Skeleton className="size-9 rounded-md" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-8 w-28" />
              <div className="w-fit rounded-full bg-foreground/10 px-2 py-1">
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
