'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, ChevronDown, Download, FileText, Search } from 'lucide-react'

import { toast } from 'sonner'

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
import { StatusBadge } from '@/components/shared/status-badge'

import { useResourcePermissions, useCanPerformAction } from '@/features/access/model'
import { useAuthStore } from '@/features/auth'
import { useExportReport } from '@/features/reports'

import { RefreshButton } from '@/components/shared/refresh-button'
import { useDeposits, useExportDepositsCSV } from '../model/use-deposit-transactions'
import {
  useDepositTransactionsPaginationStore,
  useDepositTransactionsPanelStore,
} from '../model/deposit-transactions-ui-store'
import {
  formatINR,
  formatDateTime,
  formatISODate,
  toRFC3339DayStart,
  toRFC3339DayEnd,
} from '@/lib/core/format'
import { AsyncSearchSelect } from '@/components/shared/async-search-select'
import { merchantsService, merchantKeys } from '@/features/merchants'
import { DepositStatCards } from './DepositStatCards'
import { DepositTransactionDetailsSheet } from './DepositTransactionDetailsSheet'
import { CreateDepositModal } from './CreateDepositModal'
import type { Deposit, DepositMode, DepositStatus, GetDepositsParams } from '../types'

// ============================================================================
// Constants
// ============================================================================

const DEPOSIT_STATUSES: { value: DepositStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'REVERTED', label: 'Reverted' },
]

const DEPOSIT_MODES: { value: DepositMode; label: string }[] = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTO', label: 'Auto' },
]

// ============================================================================
// Component
// ============================================================================

export function DepositTransactionsList() {
  const router = useRouter()
  const rolePath = useRolePath()
  const { user } = useAuthStore()
  const isMerchant = user?.accountType === 'MERCHANT'
  const isAdmin = !isMerchant
  const { canCreate } = useResourcePermissions('deposits')
  const canExport = useCanPerformAction('deposits', 'export')
  const { mutate: exportReport, isPending: isExportingReport } = useExportReport()
  const { mutate: exportCSV, isPending: isExportingCSV } = useExportDepositsCSV()
  const isExporting = isExportingReport || isExportingCSV

  const {
    filters,
    setSearch,
    setStatusFilter,
    setMerchantFilter,
    setModeFilter,
    setDateFrom,
    setDateTo,
    setPage,
    setPerPage,
  } = useDepositTransactionsPaginationStore()

  const { setViewingDeposit, openCreateDeposit } = useDepositTransactionsPanelStore()

  const [searchValue, setSearchValue] = useDebouncedSearch(filters.search, setSearch)

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!filters.dateFrom) return undefined
    return {
      from: new Date(filters.dateFrom),
      to: filters.dateTo ? new Date(filters.dateTo) : undefined,
    }
  })
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const ignoreCloseRef = useRef(false)

  const queryParams = useMemo<GetDepositsParams>(() => {
    // Merchants only ever see their own deposits, Admins can optionally narrow via the merchant picker.
    const scopedMerchantId = isMerchant
      ? user?.id || undefined
      : filters.merchantFilter || undefined

    return {
      q: filters.search.trim() || undefined,
      page: filters.page,
      perPage: filters.perPage,
      status:
        filters.statusFilter && filters.statusFilter !== 'all'
          ? (filters.statusFilter as DepositStatus)
          : undefined,
      mode:
        filters.modeFilter && filters.modeFilter !== 'all'
          ? (filters.modeFilter as DepositMode)
          : undefined,
      merchantId: scopedMerchantId,
      createdFrom: filters.dateFrom ? toRFC3339DayStart(filters.dateFrom) : undefined,
      createdTo: filters.dateTo ? toRFC3339DayEnd(filters.dateTo) : undefined,
    }
  }, [isMerchant, user?.id, filters])

  function handleExport() {
    if (isMerchant) {
      exportCSV(
        {
          merchantId: queryParams.merchantId,
          mode: queryParams.mode,
          status: queryParams.status,
          createdFrom: queryParams.createdFrom,
          createdTo: queryParams.createdTo,
          q: queryParams.q,
        },
        {
          onSuccess: () => toast.success('CSV downloaded successfully.'),
          onError: () => toast.error('Failed to download CSV. Please try again.'),
        },
      )
    } else {
      exportReport(
        {
          report_type: 'DEPOSIT_PAYOUT',
          filters: {
            merchant_id: queryParams.merchantId,
            mode: queryParams.mode,
            status: queryParams.status,
            created_from: queryParams.createdFrom,
            created_to: queryParams.createdTo,
            q: queryParams.q,
          },
        },
        {
          onSuccess: () => toast.success('Export initiated. View in Generated Reports.'),
          onError: () => toast.error('Failed to initiate export. Please try again.'),
        },
      )
    }
  }

  const { data, isLoading, isFetching, refetch } = useDeposits(queryParams)
  const items = data?.data.items ?? []
  const pagination = data?.meta.pagination ?? {
    page: filters.page,
    perPage: filters.perPage,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  }

  const columns: ColumnDef<Deposit>[] = useMemo(
    () => [
      {
        key: 'sno',
        header: 'S.No',
        skeletonWidth: 'w-8',
        width: '60px',
        cell: (_row, index) => (
          <span className="text-sm">
            {(pagination.page - 1) * pagination.perPage + (index ?? 0) + 1}
          </span>
        ),
      },
      ...(isAdmin
        ? [
            {
              key: 'merchant',
              header: 'Merchant',
              skeletonWidth: 'w-28',
              cell: (row: Deposit) => (
                <div className="flex flex-col gap-1">
                  <span className="text-sm capitalize">{row.merchantName || '-'}</span>
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      router.push(rolePath(`/merchants/${row.merchantId}`))
                    }}
                    className="text-xs text-status-green hover:underline cursor-pointer w-fit"
                  >
                    {row.merchantCode}
                  </button>
                </div>
              ),
            },
          ]
        : []),
      {
        key: 'depositId',
        header: 'Deposit ID',
        skeletonWidth: 'w-28',
        cell: row => (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              setViewingDeposit(row)
            }}
            className="text-sm text-status-green hover:underline cursor-pointer"
          >
            {row.transactionCode || row.id.slice(0, 8)}
          </button>
        ),
      },
      {
        key: 'reference',
        header: 'Reference (UTR)',
        skeletonWidth: 'w-28',
        cell: row => <span className="text-sm">{row.reference || '-'}</span>,
      },
      {
        key: 'dateTime',
        header: 'Date & Time',
        skeletonWidth: 'w-28',
        cell: row => {
          const { time, date } = formatDateTime(row.createdAt)
          return (
            <div className="text-sm leading-relaxed">
              <p>{time}</p>
              <p className="text-muted-foreground">{date}</p>
            </div>
          )
        },
      },
      {
        key: 'amount',
        header: 'Amount',
        skeletonWidth: 'w-24',
        cell: row => <span className="text-sm">{formatINR(row.amount)}</span>,
      },
      {
        key: 'mode',
        header: 'Mode',
        skeletonWidth: 'w-16',
        cell: row => <span className="text-sm">{row.mode}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        skeletonWidth: 'w-24',

        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => <StatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        skeletonWidth: 'w-16',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => (
          <Button
            size="sm"
            className="bg-button-bg text-primary-foreground hover:bg-button-bg/90 rounded-md px-4 text-sm font-normal"
            onClick={() => setViewingDeposit(row)}
          >
            View
          </Button>
        ),
      },
    ],
    [pagination, isAdmin, setViewingDeposit, router, rolePath],
  )

  return (
    <div className="min-w-0 overflow-hidden space-y-5">
      {/* Stat Cards */}
      <DepositStatCards />

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
          <div className="flex flex-col gap-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-3.5 sm:flex sm:flex-wrap sm:items-center">
              {/* Status Select */}
              <Select value={filters.statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="!h-12 w-full sm:w-auto border-[0.5px] border-foreground/20 bg-secondary px-6">
                  <SelectValue
                    placeholder={
                      <>
                        <span className="sm:hidden">Status</span>
                        <span className="hidden sm:inline">Select status</span>
                      </>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {DEPOSIT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Merchant Select — admin only */}
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
                  placeholder={
                    <>
                      <span className="sm:hidden">Merchant</span>
                      <span className="hidden sm:inline">Select merchant</span>
                    </>
                  }
                />
              )}

              {/* Mode Select */}
              <Select value={filters.modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="!h-12 w-full sm:w-auto border-[0.5px] border-foreground/20 bg-secondary px-6">
                  <SelectValue
                    placeholder={
                      <>
                        <span className="sm:hidden">Mode</span>
                        <span className="hidden sm:inline">Select Mode</span>
                      </>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {DEPOSIT_MODES.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
              {canCreate && isMerchant && (
                <Button
                  onClick={openCreateDeposit}
                  className="h-12 gap-3.5 !px-5 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
                >
                  <AppIcon icon={FileText} color="primary-foreground" />
                  Request Deposit
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Data Table Card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <DataTable
          columns={columns}
          data={items}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          emptyMessage={
            filters.search ||
            filters.statusFilter ||
            filters.modeFilter ||
            filters.merchantFilter ||
            filters.dateFrom
              ? 'No deposit transactions found matching your filters.'
              : 'No deposit transactions found.'
          }
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="mt-8">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={pp => {
                setPerPage(pp)
                setPage(1)
              }}
              itemLabel="deposit transactions"
            />
          </div>
        )}
      </div>

      {/* Detail side panel — controlled by store */}
      <DepositTransactionDetailsSheet />

      {/* Create deposit modal — controlled by store */}
      {canCreate && isMerchant && <CreateDepositModal />}
    </div>
  )
}
