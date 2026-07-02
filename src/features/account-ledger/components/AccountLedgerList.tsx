'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, ChevronDown, Download, Search } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/core/utils'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useRolePath } from '@/hooks/use-role-prefix'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { useAuthStore } from '@/features/auth'
import { useCanPerformAction } from '@/features/access/model'
import { useExportReport } from '@/features/reports'
import { useMyWallets } from '@/features/payouts'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { AsyncSearchSelect } from '@/components/shared/async-search-select'
import { merchantsService, merchantKeys } from '@/features/merchants'
import { providersService, providerKeys } from '@/features/providers'
import {
  formatINR,
  formatDateTime,
  formatISODate,
  toRFC3339DayStart,
  toRFC3339DayEnd,
} from '@/lib/core/format'

import { RefreshButton } from '@/components/shared/refresh-button'
import { useLedger, useExportLedgerCSV } from '../model/use-account-ledger'
import { useAccountLedgerPaginationStore } from '../model/account-ledger-ui-store'
import type { GetLedgerParams, LedgerEntry } from '../types'

export function AccountLedgerList() {
  const router = useRouter()
  const rolePath = useRolePath()

  const { user } = useAuthStore()
  const isMerchant = user?.accountType === 'MERCHANT'
  const isAdmin = !isMerchant

  const canExport = useCanPerformAction('ledger', 'export')
  const { mutate: exportReport, isPending: isExportingReport } = useExportReport()
  const { mutate: exportCSV, isPending: isExportingCSV } = useExportLedgerCSV()
  const isExporting = isExportingReport || isExportingCSV

  // Merchants can't hit the admin /providers API — derive their provider list
  // from their own wallets (/me/wallets), de-duplicated by provider.
  const { data: myWallets } = useMyWallets(isMerchant)
  const merchantProviders = useMemo(() => {
    const seen = new Map<string, string>()
    for (const w of myWallets ?? []) {
      if (w.providerId && !seen.has(w.providerId)) seen.set(w.providerId, w.providerName)
    }
    return Array.from(seen, ([id, name]) => ({ id, name }))
  }, [myWallets])

  const {
    filters,
    setSearch,
    setMerchantFilter,
    setProviderFilter,
    setDateFrom,
    setDateTo,
    setPage,
    setPerPage,
  } = useAccountLedgerPaginationStore()
  const [searchValue, setSearchValue] = useDebouncedSearch(filters.search, setSearch)

  // Date range popover
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!filters.dateFrom) return undefined
    return {
      from: new Date(filters.dateFrom),
      to: filters.dateTo ? new Date(filters.dateTo) : undefined,
    }
  })
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)

  const queryParams = useMemo<GetLedgerParams>(
    () => ({
      tab: 'all',
      q: filters.search || undefined,
      page: filters.page,
      perPage: filters.perPage,
      order: 'desc',
      // merchant_id is admin-only; merchants are auto-scoped by the backend.
      merchantId: isAdmin ? filters.merchantFilter || undefined : undefined,
      providerId: filters.providerFilter || undefined,
      dateFrom: filters.dateFrom ? toRFC3339DayStart(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? toRFC3339DayEnd(filters.dateTo) : undefined,
    }),
    [filters, isAdmin],
  )

  function handleExport() {
    if (isMerchant) {
      // Merchants download the CSV directly (GET /ledger/export, self-scoped).
      exportCSV(
        {
          tab: queryParams.tab,
          q: queryParams.q,
          merchantId: queryParams.merchantId,
          providerId: queryParams.providerId,
          dateFrom: queryParams.dateFrom,
          dateTo: queryParams.dateTo,
          order: queryParams.order,
        },
        {
          onSuccess: () => toast.success('CSV downloaded successfully.'),
          onError: err => toast.error(getErrorMessage(err)),
        },
      )
    } else {
      // Admins queue an async report (POST /admin/reports/exports) that appears
      // on the Generated Reports page. Ledger uses created_from/created_to +
      // tab/provider_id (no status/mode).
      exportReport(
        {
          report_type: 'LEDGER',
          filters: {
            merchant_id: queryParams.merchantId,
            tab: queryParams.tab,
            provider_id: queryParams.providerId,
            created_from: queryParams.dateFrom,
            created_to: queryParams.dateTo,
            q: queryParams.q,
          },
        },
        {
          onSuccess: () => toast.success('Export initiated. View in Generated Reports.'),
          onError: err => toast.error(getErrorMessage(err)),
        },
      )
    }
  }

  const { data, isLoading, isFetching, refetch } = useLedger(queryParams)
  const items = data?.data.items ?? []
  const pagination = data?.meta.pagination

  const columns: ColumnDef<LedgerEntry>[] = useMemo(
    () => [
      {
        key: 'sno',
        header: 'S.No',
        skeletonWidth: 'w-8',
        width: '60px',
        cell: (_row, index) => (
          <span className="text-sm">
            {pagination
              ? (pagination.page - 1) * pagination.perPage + (index ?? 0) + 1
              : (index ?? 0) + 1}
          </span>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        skeletonWidth: 'w-24',
        cell: row => {
          const { time, date } = formatDateTime(row.date)
          return (
            <div className="text-sm leading-relaxed">
              <p>{date}</p>
              <p className="text-xs text-muted-foreground">{time}</p>
            </div>
          )
        },
      },
      ...(isAdmin
        ? [
            {
              key: 'merchant',
              header: 'Merchant',
              skeletonWidth: 'w-28',
              cell: (row: LedgerEntry) => (
                <div className="flex flex-col gap-1">
                  <span className="text-sm capitalize">{row.merchantName || '-'}</span>
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      router.push(rolePath(`/merchants/${row.merchantId}`))
                    }}
                    className="w-fit cursor-pointer text-xs text-status-green hover:underline"
                  >
                    {row.merchantCode}
                  </button>
                </div>
              ),
            } satisfies ColumnDef<LedgerEntry>,
          ]
        : []),
      {
        key: 'transactionId',
        header: 'Transaction ID',
        skeletonWidth: 'w-28',
        cell: row => <span className="text-sm">{row.transactionId}</span>,
      },
      {
        key: 'type',
        header: 'Type',
        skeletonWidth: 'w-24',
        cell: row => {
          const isCredit = row.closingBalance >= row.openingBalance
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs',
                isCredit
                  ? 'bg-status-green/10 text-status-green'
                  : 'bg-status-red/10 text-status-red',
              )}
            >
              {row.transactionType}
            </span>
          )
        },
      },
      {
        key: 'mode',
        header: 'Mode',
        skeletonWidth: 'w-16',
        cell: row => <span className="text-sm">{row.mode}</span>,
      },
      {
        key: 'amount',
        header: 'Amount',
        skeletonWidth: 'w-20',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        cell: row => {
          const isCredit = row.closingBalance >= row.openingBalance
          return (
            <span
              className={cn(
                'text-sm font-medium',
                isCredit ? 'text-status-green' : 'text-status-red',
              )}
            >
              {isCredit ? '+' : '-'}
              {formatINR(row.amount)}
            </span>
          )
        },
      },
      {
        key: 'serviceFees',
        header: 'Service Fees',
        skeletonWidth: 'w-16',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        cell: row => <span className="text-sm">{formatINR(row.serviceFees)}</span>,
      },
      {
        key: 'openingBalance',
        header: 'Opening Balance',
        skeletonWidth: 'w-20',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        cell: row => (
          <span className="text-sm text-muted-foreground">{formatINR(row.openingBalance)}</span>
        ),
      },
      {
        key: 'closingBalance',
        header: 'Closing Balance',
        skeletonWidth: 'w-20',
        headerClassName: 'text-right',
        cellClassName: 'text-right',
        cell: row => <span className="text-sm font-medium">{formatINR(row.closingBalance)}</span>,
      },
    ],
    [pagination, isAdmin, router, rolePath],
  )

  const hasFilters = Boolean(
    filters.search || filters.merchantFilter || filters.providerFilter || filters.dateFrom,
  )

  return (
    <div className="min-w-0 space-y-5 overflow-hidden">
      {/* Search filters */}
      <Card className="p-6 shadow-none hover:shadow-none">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <p className="text-lg font-normal">Search filters</p>
            <div className="flex w-full items-center gap-3.5 sm:w-auto">
              <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
              <label className="flex h-12 w-full cursor-text items-center gap-2 rounded-[11px] bg-search-bg px-3.5 sm:w-[280px]">
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

          <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-3.5 sm:flex sm:flex-wrap sm:items-center">
              {isAdmin && (
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
                  placeholder={<span>Select merchant</span>}
                />
              )}

              {isMerchant ? (
                <Select
                  value={filters.providerFilter || 'all'}
                  onValueChange={val => {
                    if (val === 'all') {
                      setProviderFilter('', '')
                      return
                    }
                    const provider = merchantProviders.find(p => p.id === val)
                    setProviderFilter(val, provider?.name ?? '')
                  }}
                >
                  <SelectTrigger className="!h-12 w-full border-[0.5px] border-foreground/20 bg-secondary px-6 sm:w-auto">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {merchantProviders.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <AsyncSearchSelect
                  value={filters.providerFilter}
                  valueLabel={filters.providerFilterLabel}
                  onChange={(id, label) => setProviderFilter(id, label)}
                  queryKey={providerKeys.list()}
                  queryFn={async ({ q }) => {
                    const all = await providersService.getProviders()
                    const term = (q ?? '').trim().toLowerCase()
                    const items = term
                      ? all.filter(
                          p =>
                            p.name.toLowerCase().includes(term) ||
                            p.code.toLowerCase().includes(term),
                        )
                      : all
                    return { data: { items }, meta: { pagination: { page: 1, totalPages: 1 } } }
                  }}
                  mapOption={p => ({ id: p.id, label: p.name, subtitle: p.code })}
                  searchPlaceholder="Search providers..."
                  emptyMessage="No providers found."
                  className="w-full sm:w-auto"
                  placeholder={<span>Select provider</span>}
                />
              )}

              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
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
                        if (dateRange?.from) setDateFrom(formatISODate(dateRange.from))
                        if (dateRange?.to) setDateTo(formatISODate(dateRange.to))
                        setDatePopoverOpen(false)
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              {canExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={isExporting}
                      className="h-12 !px-5 gap-3.5 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
                    >
                      <AppIcon icon={Download} size="sm" color="primary-foreground" />
                      Export
                      <AppIcon icon={ChevronDown} size="sm" color="primary-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExport}>CSV</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Table card */}
      <div className="rounded-[10px] border border-transparent bg-card p-6 pb-8 dark:border-input">
        <div className="mb-6 flex flex-col gap-1">
          <h2 className="text-xl font-medium text-foreground">Account Ledger</h2>
          <p className="text-sm text-muted-foreground">
            Wallet operations across payouts and deposits with running balances
          </p>
        </div>

        <DataTable
          columns={columns}
          data={items}
          rowKey={row => `${row.transactionId}-${row.date}-${row.closingBalance}`}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          emptyMessage={
            hasFilters
              ? 'No ledger entries found matching your filters.'
              : 'No ledger entries found.'
          }
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />

        {pagination && pagination.total > 0 && (
          <div className="mt-8">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={pp => {
                setPerPage(pp)
                setPage(1)
              }}
              itemLabel="ledger entries"
            />
          </div>
        )}
      </div>
    </div>
  )
}
