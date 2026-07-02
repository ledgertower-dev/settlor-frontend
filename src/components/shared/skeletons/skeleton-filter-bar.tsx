import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/core/utils'

interface SkeletonFilterBarProps {
  items: { width: string; height?: string }[]
  className?: string
}

export function SkeletonFilterBar({ items, className }: SkeletonFilterBarProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {items.map((item, i) => (
        <Skeleton key={i} className={`${item.width} ${item.height || 'h-10'}`} />
      ))}
    </div>
  )
}
