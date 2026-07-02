'use client'

import { RefreshCw } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/core/utils'

interface RefreshButtonProps {
  /** Refetch the page's data — typically the React Query `refetch` fn. */
  onRefresh: () => void
  /** Spins the icon and disables the button while a refetch is in flight. */
  isFetching?: boolean
  className?: string
}

/**
 * Standard "Refresh" control for table/list pages. Outline button with a
 * RefreshCw icon that spins while data is being refetched.
 */
export function RefreshButton({ onRefresh, isFetching = false, className }: RefreshButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Refresh"
          className={cn('size-12 rounded-md', className)}
        >
          <AppIcon icon={RefreshCw} size="sm" className={cn(isFetching && 'animate-spin')} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Refresh</TooltipContent>
    </Tooltip>
  )
}
