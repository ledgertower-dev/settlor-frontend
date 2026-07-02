'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { Calendar as CalendarIcon, ChevronDown, Download, Plus, Search, Upload } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'

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

import { RefreshButton } from '@/components/shared/refresh-button'
import { usePayouts, useExportPayoutsCSV } from '../model/use-payouts'
import { usePayoutsPaginationStore, usePayoutsModalStore } from '../model/payouts-ui-store'
import { useResourcePermissions, useCanPerformAction } from '@/features/access/model'
import { useAuthStore } from '@/features/auth'
import { useExportReport } from '@/features/reports'
import type { Payout } from '../types'
import { CreatePayoutModal } from './CreatePayoutModal'
import { BulkUploadModal } from './BulkUploadModal'
import { PayoutDetailDrawer } from './PayoutDetailDrawer'
import { formatINR, formatDateTime, formatISODate } from '@/lib/core/format'
import { PayoutMetricCards } from './PayoutMetricCards'

const PAYOUT_STATUSES = [
  { value: 'INITIATED', label: 'Initiated' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
]

const PAYMENT_MODES = [
  { value: 'IMPS', label: 'IMPS' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'RTGS', label: 'RTGS' },
  { value: 'UPI', label: 'UPI' },
]

export function PayoutsList() {
  const router = useRouter()
  const rolePath = useRolePath()
  const { canCreate } = useResourcePermissions('payouts')
  const canExport = useCanPerformAction('payouts', 'export')
  const { user } = useAuthStore()
  const isMerchant = user?.accountType === 'MERCHANT'
  const { mutate: exportReport, isPending: isExportingReport } = useExportReport()
  const { mutate: exportCSV, isPending: isExportingCSV } = useExportPayoutsCSV()
  const isExporting = isExportingReport || isExportingCSV

  const {
    filters,
    setSearch,
    setStatusFilter,
    setPaymentModeFilter,
    setDateFrom,
    setDateTo,
    setPage,
    setPerPage,
  } = usePayoutsPaginationStore()

  const {
    showCreateModal,
    showBulkModal,
    selectedPayoutId,
    openCreateModal,
    closeCreateModal,
    openBulkModal,
    closeBulkModal,
    openDetailDrawer,
    closeDetailDrawer,
  } = usePayoutsModalStore()

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

  const queryParams = useMemo(
    () => ({
      q: filters.search || undefined,
      page: filters.page,
      per_page: filters.perPage,
      status:
        filters.statusFilter && filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
      payment_mode:
        filters.paymentModeFilter && filters.paymentModeFilter !== 'all'
          ? filters.paymentModeFilter
          : undefined,
      created_from: filters.dateFrom || undefined,
      created_to: filters.dateTo || undefined,
    }),
    [filters],
  )

  function handleExport() {
    if (isMerchant) {
      exportCSV(
        {
          q: queryParams.q,
          status: queryParams.status,
          payment_mode: queryParams.payment_mode,
          created_from: queryParams.created_from,
          created_to: queryParams.created_to,
        },
        {
          onSuccess: () => toast.success('CSV downloaded successfully.'),
          onError: err => toast.error(getErrorMessage(err)),
        },
      )
    } else {
      exportReport(
        {
          report_type: 'PAYOUT_TRANSACTIONS',
          filters: {
            q: queryParams.q,
            status: queryParams.status,
            payment_mode: queryParams.payment_mode,
            created_from: queryParams.created_from,
            created_to: queryParams.created_to,
          },
        },
        {
          onSuccess: () => toast.success('Export initiated. View in Generated Reports.'),
          onError: err => toast.error(getErrorMessage(err)),
        },
      )
    }
  }

  const { data, isLoading, isFetching, refetch } = usePayouts(queryParams)

  const payouts = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const columns: ColumnDef<Payout>[] = useMemo(
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
        key: 'code',
        header: 'Transaction ID',
        skeletonWidth: 'w-28',
        cell: row => (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              openDetailDrawer(row.id)
            }}
            className="text-sm text-status-green hover:underline cursor-pointer"
          >
            {row.code}
          </button>
        ),
      },
      ...(!isMerchant
        ? [
            {
              key: 'merchant',
              header: 'Merchant',
              skeletonWidth: 'w-28',
              cell: (row: Payout) => (
                <div className="flex flex-col gap-1">
                  <span className="text-sm capitalize">{row.merchant.name}</span>
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      router.push(rolePath(`/merchants/${row.merchant.id}`))
                    }}
                    className="text-xs text-status-green hover:underline cursor-pointer w-fit"
                  >
                    {row.merchant.code}
                  </button>
                </div>
              ),
            },
          ]
        : []),
      {
        key: 'dateTime',
        header: 'Date & Time',
        skeletonWidth: 'w-28',
        cell: row => {
          const { time, date } = formatDateTime(row.createdAt)
          return (
            <div className="text-sm leading-relaxed">
              <p>{time}</p>
              <p>{date}</p>
            </div>
          )
        },
      },
      {
        key: 'utr',
        header: 'UTR',
        skeletonWidth: 'w-20',
        cell: row => <span className="text-sm">{row.externalReference || row.utr || '—'}</span>,
      },
      {
        key: 'account',
        header: 'Account',
        skeletonWidth: 'w-28',
        cell: row => <span className="text-sm">{row.beneficiary.account}</span>,
      },
      {
        key: 'requestedAmount',
        header: 'Requested Amount',
        skeletonWidth: 'w-24',
        cell: row => <span className="text-sm">{formatINR(row.requestedAmount)}</span>,
      },
      {
        key: 'fees',
        header: 'Fees',
        skeletonWidth: 'w-16',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => <span className="text-sm">{formatINR(row.fees)}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        skeletonWidth: 'w-20',

        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => <StatusBadge status={row.status} />,
      },
      {
        key: 'activity',
        header: 'Activity',
        skeletonWidth: 'w-16',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => (
          <Button
            size="sm"
            className="bg-button-bg text-primary-foreground hover:bg-button-bg/90 rounded-md px-4 text-sm font-normal"
            onClick={e => {
              e.stopPropagation()
              openDetailDrawer(row.id)
            }}
          >
            View
          </Button>
        ),
      },
    ],
    [pagination, openDetailDrawer, isMerchant, router, rolePath],
  )

  return (
    <div className="min-w-0 overflow-hidden space-y-5">
      {/* Metric Cards */}
      <PayoutMetricCards />

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
                        <span className="hidden sm:inline">Select Status</span>
                      </>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PAYOUT_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Payment Mode Select */}
              <Select value={filters.paymentModeFilter} onValueChange={setPaymentModeFilter}>
                <SelectTrigger className="!h-12 w-full sm:w-auto border-[0.5px] border-foreground/20 bg-secondary px-6">
                  <SelectValue placeholder="Payment Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {PAYMENT_MODES.map(m => (
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
              {canCreate && isMerchant && (
                <Button variant="outline" onClick={openBulkModal} className="h-12 !px-5 gap-3.5">
                  <AppIcon icon={Upload} size="sm" />
                  Bulk Upload
                </Button>
              )}
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
                  onClick={openCreateModal}
                  className="h-12 !px-5 gap-3.5 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
                >
                  <AppIcon icon={Plus} color="primary-foreground" />
                  Create Payout
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
          data={payouts}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          emptyMessage={
            filters.search ? 'No payouts found matching your search.' : 'No payouts found.'
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
              itemLabel="payouts"
            />
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <PayoutDetailDrawer
        payoutId={selectedPayoutId}
        open={!!selectedPayoutId}
        onOpenChange={open => {
          if (!open) closeDetailDrawer()
        }}
      />

      {/* Create Payout Modal */}
      <CreatePayoutModal
        open={showCreateModal}
        onOpenChange={open => {
          if (!open) closeCreateModal()
        }}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        open={showBulkModal}
        onOpenChange={open => {
          if (!open) closeBulkModal()
        }}
      />
    </div>
  )
}
