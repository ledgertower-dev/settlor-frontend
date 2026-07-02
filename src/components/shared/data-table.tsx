'use client'

import { useRef, useState, type ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/core/utils'

export interface ColumnDef<T> {
  key: string
  header: string
  cell: (row: T, index?: number) => ReactNode
  headerClassName?: string
  cellClassName?: string
  skeletonWidth?: string
  /** When true, cell text wraps instead of being truncated */
  noTruncate?: boolean
  /** When true, removes the max-width constraint so the column can use full available width */
  widthFull?: boolean
  /** Fixed width for this column (e.g. '60px'). Applied as inline style on th/td. */
  width?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  rowKey: (row: T) => string
  isLoading?: boolean
  loadingRows?: number
  emptyMessage?: string
  onRowClick?: (row: T) => void
  containerClassName?: string
  headerClassName?: string
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  loadingRows: rawLoadingRows = 5,
  emptyMessage = 'No results found',
  onRowClick,
  containerClassName,
  headerClassName,
}: DataTableProps<T>) {
  const loadingRows = Math.min(rawLoadingRows, 8)

  return (
    <div className={cn('rounded-lg bg-card shadow-[var(--shadow-card)]', containerClassName)}>
      <Table>
        <TableHeader className="[&_tr]:border-0">
          <TableRow
            className={cn(
              'bg-table-header-bg hover:bg-table-header-bg [&>th:first-child]:rounded-l-[10px] [&>th:last-child]:rounded-r-[10px] [&>th:first-child]:pl-6',
              headerClassName,
            )}
          >
            {columns.map(col => (
              <TableHead
                key={col.key}
                className={cn(
                  'h-15 px-4 text-sm font-medium capitalize text-foreground',
                  col.headerClassName,
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr>td:first-child]:pl-6">
          {isLoading ? (
            Array.from({ length: loadingRows }, (_, i) => (
              <TableRow key={i} className="border-table-row-border hover:bg-transparent">
                {columns.map(col => (
                  <TableCell key={col.key} className={cn('px-4 py-5', col.cellClassName)}>
                    <Skeleton className={cn('h-4', col.skeletonWidth || 'w-24')} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={rowKey(row)}
                className={cn(
                  'border-table-row-border',
                  onRowClick ? 'cursor-pointer' : 'hover:bg-transparent',
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      'px-4 py-5 text-sm text-foreground',
                      col.widthFull ? '' : 'max-w-[300px]',
                      !col.noTruncate && 'overflow-hidden',
                      col.cellClassName,
                    )}
                  >
                    {col.noTruncate ? (
                      col.cell(row, index)
                    ) : (
                      <TruncateCell>{col.cell(row, index)}</TruncateCell>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function TruncateCell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tooltipText, setTooltipText] = useState('')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showTooltip = () => {
    clearTimeout(hideTimerRef.current)
    const el = ref.current
    if (!el) return
    const range = document.createRange()
    range.selectNodeContents(el)
    const contentWidth = range.getBoundingClientRect().width
    const visibleWidth = el.getBoundingClientRect().width
    if (contentWidth > visibleWidth) {
      setTooltipText(el.textContent || '')
    }
  }

  const hideTooltip = () => {
    hideTimerRef.current = setTimeout(() => setTooltipText(''), 150)
  }

  const keepTooltip = () => {
    clearTimeout(hideTimerRef.current)
  }

  return (
    <Tooltip open={!!tooltipText}>
      <TooltipTrigger asChild>
        <div
          ref={ref}
          className="truncate"
          onPointerEnter={showTooltip}
          onPointerLeave={hideTooltip}
        >
          {children}
        </div>
      </TooltipTrigger>
      {tooltipText && (
        <TooltipContent
          side="top"
          variant="native"
          className="select-text cursor-text"
          onPointerEnter={keepTooltip}
          onPointerLeave={hideTooltip}
        >
          {tooltipText}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
