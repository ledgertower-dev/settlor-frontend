'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/core/utils'
import { formatDateTime } from '@/lib/core/format'
import { Calendar as CalendarIcon, Search } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { RefreshButton } from '@/components/shared/refresh-button'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AsyncSearchSelect } from '@/components/shared/async-search-select'
import { merchantsService, merchantKeys } from '@/features/merchants'
import { useAuditLogs } from '../model/use-audit-logs'
import { useAuditLogsUIStore } from '../model/audit-logs-ui-store'
import type { AuditLog, AuditLogCategory } from '../types/audit-log.types'

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const VALID_CATEGORIES = new Set<AuditLogCategory>(['auth', 'payout', 'deposit', 'action'])

const TABS: { value: AuditLogCategory; label: string }[] = [
  { value: 'auth', label: 'Auth logs' },
  { value: 'payout', label: 'Payout logs' },
  { value: 'deposit', label: 'Deposit logs' },
  { value: 'action', label: 'Action logs' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const selectTriggerClassName =
  '!h-12 w-full sm:w-auto border-[0.5px] border-foreground/20 bg-secondary px-6'

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

const columns: ColumnDef<AuditLog>[] = [
  {
    key: 'createdAt',
    header: 'Date & Time',
    cell: row => {
      const { date, time } = formatDateTime(row.createdAt)
      return (
        <div className="text-sm leading-relaxed">
          <p>{date}</p>
          <p className="text-muted-foreground">{time}</p>
        </div>
      )
    },
    skeletonWidth: 'w-36',
  },
  {
    key: 'userEmail',
    header: 'User',
    cell: row => (
      <div className="flex flex-col gap-1">
        <span className="text-sm">{row.userEmail ?? '-'}</span>
        {row.role && <span className="text-xs text-muted-foreground capitalize">{row.role}</span>}
      </div>
    ),
    skeletonWidth: 'w-40',
  },
  {
    key: 'ipAddress',
    header: 'IP Address',
    cell: row => <span className="text-sm">{row.ipAddress ?? '-'}</span>,
    skeletonWidth: 'w-28',
  },
  {
    key: 'event',
    header: 'Event',
    cell: row => <span className="text-sm">{row.event}</span>,
    skeletonWidth: 'w-28',
  },
  {
    key: 'actionLabel',
    header: 'Action',
    headerClassName: 'text-center',
    cellClassName: 'text-center',
    cell: row => <StatusBadge status={row.outcome.toUpperCase()} variant="plain" />,
    skeletonWidth: 'w-32',
  },
  {
    key: 'description',
    header: 'Description',
    cell: row => <span className="text-sm">{row.description}</span>,
    skeletonWidth: 'w-48',
  },
]

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function AdminAuditLogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    filters,
    setSearch,
    setPage,
    setPerPage,
    setCategory,
    setStatus,
    setDateFrom,
    setDateTo,
    setMerchantFilter,
  } = useAuditLogsUIStore()

  // Sync tab from URL on mount / URL change
  useEffect(() => {
    const urlTab = searchParams.get('tab') as AuditLogCategory | null
    if (urlTab && VALID_CATEGORIES.has(urlTab) && urlTab !== filters.category) {
      setCategory(urlTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleCategoryChange = (category: AuditLogCategory) => {
    if (category === filters.category) return // no-op when the active tab is re-clicked
    setCategory(category)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', category)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const [searchValue, setSearchValue] = useDebouncedSearch(filters.search, setSearch)

  /* Date range picker state */
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!filters.dateFrom) return undefined
    return {
      from: new Date(filters.dateFrom),
      to: filters.dateTo ? new Date(filters.dateTo) : undefined,
    }
  })
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const ignoreCloseRef = useRef(false)

  /* Build query params */
  const queryParams = useMemo(
    () => ({
      category: filters.category,
      page: filters.page,
      per_page: filters.perPage,
      q: filters.search || undefined,
      status: filters.status || undefined,
      created_from: filters.dateFrom || undefined,
      created_to: filters.dateTo || undefined,
      sort: filters.sort || undefined,
      order: filters.order || undefined,
      merchant_id: filters.merchantFilter || undefined,
    }),
    [filters],
  )

  const { data, isLoading, isFetching, refetch } = useAuditLogs(queryParams)

  const auditLogs = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  return (
    <div className="space-y-5">
      {/* Tab Bar */}
      <div className="flex items-center w-fit max-w-full overflow-x-auto rounded-full border border-transparent dark:border-input bg-card p-1.5 shadow-[var(--shadow-card)]">
        {TABS.map(tab => {
          const isActive = filters.category === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => handleCategoryChange(tab.value)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2.5 text-sm transition-colors',
                isActive ? 'bg-tab-active text-tab-active-foreground' : 'text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search Filters */}
      <Card className="shadow-none hover:shadow-none p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <p className="text-lg font-normal">Search filters</p>
            <div className="flex w-full items-center gap-3.5 sm:w-auto">
              <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
              <label className="flex items-center gap-2 cursor-text rounded-[11px] bg-search-bg px-3.5 h-12 w-full sm:w-[280px]">
                <AppIcon icon={Search} size="sm" color="muted" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="grid grid-cols-2 gap-3.5 sm:flex sm:flex-wrap sm:items-center">
              {/* Status Select */}
              <Select
                value={filters.status ?? 'all'}
                onValueChange={value =>
                  setStatus(value === 'all' ? undefined : (value as 'success' | 'failed'))
                }
              >
                <SelectTrigger className={selectTriggerClassName}>
                  <SelectValue
                    placeholder={
                      <>
                        <span className="sm:hidden">Status</span>
                        <span className="hidden sm:inline">Select Status</span>
                      </>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Merchant Select */}
              <AsyncSearchSelect
                value={filters.merchantFilter}
                valueLabel={filters.merchantFilterLabel}
                onChange={(id, label) => setMerchantFilter(id, label)}
                queryKey={merchantKeys.list({})}
                queryFn={({ page, q, per_page }) =>
                  merchantsService.getMerchants({ page, q, per_page })
                }
                mapOption={m => ({ id: m.id, label: m.name, subtitle: m.code })}
                searchPlaceholder="Search merchants..."
                emptyMessage="No merchants found."
                className="w-full sm:w-auto"
                placeholder={
                  <>
                    <span className="sm:hidden">Merchant</span>
                    <span className="hidden sm:inline">Select merchant</span>
                  </>
                }
              />

              {/* Date Range */}
              <Popover
                open={datePopoverOpen}
                onOpenChange={open => {
                  if (!open && ignoreCloseRef.current) return
                  setDatePopoverOpen(open)
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center gap-6 rounded-md border-[0.5px] border-foreground/20 bg-secondary px-6 outline-none data-[state=open]:border-ring data-[state=open]:ring-[1px] data-[state=open]:ring-ring/30 sm:w-auto"
                  >
                    <span className="whitespace-nowrap text-sm text-foreground">
                      {filters.dateFrom && filters.dateTo ? (
                        `${format(new Date(filters.dateFrom), 'dd/MM/yy')} - ${format(new Date(filters.dateTo), 'dd/MM/yy')}`
                      ) : (
                        <>
                          <span className="sm:hidden">Date range</span>
                          <span className="hidden sm:inline">Select date range</span>
                        </>
                      )}
                    </span>
                    <AppIcon icon={CalendarIcon} size="sm" color="muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                  />
                  <div className="flex justify-end gap-2 border-t px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDateRange(undefined)
                        setDateFrom('')
                        setDateTo('')
                        setDatePopoverOpen(false)
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      disabled={!dateRange?.from || !dateRange?.to}
                      onClick={() => {
                        if (dateRange?.from) setDateFrom(toDateString(dateRange.from))
                        if (dateRange?.to) setDateTo(toDateString(dateRange.to))
                        setDatePopoverOpen(false)
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Table Card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <DataTable
          columns={columns}
          data={auditLogs}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          emptyMessage={
            filters.search ? 'No audit logs found matching your search.' : 'No audit logs found.'
          }
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="mt-8">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={pp => {
                setPerPage(pp)
                setPage(1)
              }}
              itemLabel="audit logs"
            />
          </div>
        )}
      </div>
    </div>
  )
}
