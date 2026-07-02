'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { ITEMS_PER_PAGE_OPTIONS, type PaginationMeta } from '@/lib/types/pagination.types'

export interface DataTablePaginationProps {
  /** Pagination metadata from backend */
  pagination: PaginationMeta
  /** Called when page changes */
  onPageChange: (page: number) => void
  /** Called when perPage changes */
  onPerPageChange: (perPage: number) => void
  /** Optional: Show per-page selector */
  showPerPageSelector?: boolean
  /** Optional: Custom label for items */
  itemLabel?: string
}

/**
 * Reusable pagination component for data tables
 * Provides button-based navigation with per-page selector
 *
 * @example
 * <DataTablePagination
 *   pagination={data.meta.pagination}
 *   onPageChange={setPage}
 *   onPerPageChange={setPerPage}
 *   itemLabel="users"
 * />
 */
export function DataTablePagination({
  pagination,
  onPageChange,
  onPerPageChange,
  showPerPageSelector = true,
  itemLabel = 'results',
}: DataTablePaginationProps) {
  const { page, perPage, total, totalPages, hasNextPage, hasPrevPage } = pagination

  // Calculate display range
  const startItem = total === 0 ? 0 : (page - 1) * perPage + 1
  const endItem = Math.min(page * perPage, total)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Results info */}
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
        <span className="font-medium text-foreground">{endItem}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> {itemLabel}
      </p>

      {/* Items per page + Page info + Prev/Next */}
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        {showPerPageSelector && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-muted-foreground">Rows:</span>
            <Select
              value={perPage.toString()}
              onValueChange={value => onPerPageChange(parseInt(value, 10))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-md border-filter-border text-sm">
                <SelectValue placeholder={perPage.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {page} / {totalPages || 1}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPrevPage}
              className="flex size-8 items-center justify-center rounded-md border border-filter-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              <AppIcon icon={ChevronLeft} size="sm" />
            </button>

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage}
              className="flex size-8 items-center justify-center rounded-md border border-filter-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              <AppIcon icon={ChevronRight} size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
