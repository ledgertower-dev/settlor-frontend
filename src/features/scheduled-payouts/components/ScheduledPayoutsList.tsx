'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Ban, Clock, Plus, Repeat, Upload } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { PillTabs } from '@/components/shared/pill-tabs'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/core/utils'
import { formatINR, formatDateTime } from '@/lib/core/format'

import { useResourcePermissions } from '@/features/access/model'
import { usePermissionError } from '@/lib/api/use-permission-error'
import { AccessDeniedAlert } from '@/components/shared/access-denied'
import { useScheduledPayouts } from '../model/use-scheduled-payouts'
import {
  useScheduledPayoutsPaginationStore,
  useScheduledPayoutsModalStore,
  useRunHistoryStore,
} from '../model/scheduled-payouts-ui-store'
import type { ScheduledPayoutListItem, ScheduledPayoutTab } from '../types'
import { RefreshButton } from '@/components/shared/refresh-button'
import { CreateScheduledPayoutDrawer } from './CreateScheduledPayoutDrawer'
import { ScheduledPayoutActions } from './ScheduledPayoutActions'
import { RunHistoryDrawer } from './RunHistoryDrawer'
import { BulkScheduledUploadModal } from './BulkScheduledUploadModal'

const TABS: { value: ScheduledPayoutTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'one_time', label: 'One time' },
]

function ScheduleIcon({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return (
      <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[11px] bg-status-red/10">
        <AppIcon icon={Ban} color="red" />
      </span>
    )
  }
  if (status === 'PAUSED') {
    return (
      <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[11px] bg-muted">
        <AppIcon icon={Clock} color="default" />
      </span>
    )
  }
  return (
    <span className="flex size-[46px] shrink-0 items-center justify-center rounded-[11px] bg-status-green/10">
      <AppIcon icon={Repeat} color="green" />
    </span>
  )
}

/** Truncates a name and shows the full value in a tooltip only when it overflows
 *  — matches DataTable's built-in TruncateCell behavior. */
function TruncatedName({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [tip, setTip] = useState('')
  const show = () => {
    const el = ref.current
    if (el && el.scrollWidth > el.clientWidth) setTip(el.textContent || '')
  }
  return (
    <Tooltip open={!!tip}>
      <TooltipTrigger asChild>
        <span
          ref={ref}
          className="truncate text-sm font-medium text-foreground"
          onPointerEnter={show}
          onPointerLeave={() => setTip('')}
        >
          {text}
        </span>
      </TooltipTrigger>
      {tip && (
        <TooltipContent side="top" variant="native" className="cursor-text select-text">
          {tip}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

export function ScheduledPayoutsList() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const { canCreate, canUpdate } = useResourcePermissions('scheduled-payouts')

  const { filters, setTypeFilter, setPage, setPerPage } = useScheduledPayoutsPaginationStore()

  const {
    showCreateDrawer,
    editPayoutId,
    openCreateDrawer,
    closeDrawer,
    showBulkModal,
    openBulkModal,
    closeBulkModal,
  } = useScheduledPayoutsModalStore()

  const { historyPayoutId, openRunHistory } = useRunHistoryStore()

  // The URL (?tab=) is the single source of truth; the store mirrors it so the
  // query/page-reset follow. Driving both the store and URL from the click
  // handler races the router's async URL update and snaps the tab back.
  const tabParam = searchParams.get('tab')
  const activeTab =
    tabParam && ['all', 'recurring', 'one_time'].includes(tabParam) ? tabParam : 'all'

  useEffect(() => {
    if (activeTab !== filters.typeFilter) setTypeFilter(activeTab)
  }, [activeTab, filters.typeFilter, setTypeFilter])

  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === activeTab) return // no-op when the active tab is re-clicked
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'all') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      const qs = params.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [activeTab, searchParams, router, pathname],
  )

  const queryParams = useMemo(
    () => ({
      q: filters.search || undefined,
      page: filters.page,
      per_page: filters.perPage,
      type: filters.typeFilter !== 'all' ? filters.typeFilter : undefined,
      status:
        filters.statusFilter && filters.statusFilter !== 'all' ? filters.statusFilter : undefined,
    }),
    [filters],
  )

  const { data, isLoading, isFetching, error, refetch } = useScheduledPayouts(queryParams)
  const { isPermissionDenied, permissionMessage } = usePermissionError(error)

  // Lightweight queries to get counts for inactive tabs only
  const { data: recurringCount } = useScheduledPayouts(
    { per_page: 1, page: 1, type: 'recurring' },
    { enabled: filters.typeFilter !== 'recurring' },
  )
  const { data: oneTimeCount } = useScheduledPayouts(
    { per_page: 1, page: 1, type: 'one_time' },
    { enabled: filters.typeFilter !== 'one_time' },
  )
  const { data: allCount } = useScheduledPayouts(
    { per_page: 1, page: 1 },
    { enabled: filters.typeFilter !== 'all' },
  )

  const payouts = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const tabCounts: Record<string, number | undefined> = {
    all: filters.typeFilter === 'all' ? pagination?.total : allCount?.meta?.pagination?.total,
    recurring:
      filters.typeFilter === 'recurring'
        ? pagination?.total
        : recurringCount?.meta?.pagination?.total,
    one_time:
      filters.typeFilter === 'one_time' ? pagination?.total : oneTimeCount?.meta?.pagination?.total,
  }

  const columns: ColumnDef<ScheduledPayoutListItem>[] = useMemo(
    () => [
      {
        key: 'schedule',
        header: 'Schedule',
        skeletonWidth: 'w-56',
        noTruncate: true,
        cell: row => {
          return (
            <div className="flex min-w-0 items-center gap-3.5">
              <ScheduleIcon status={row.status} />
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <TruncatedName text={row.name} />
                  <span className="shrink-0">
                    <StatusBadge
                      status={row.frequency === 'ONE_TIME' ? 'ONE_TIME' : 'RECURRING'}
                      variant="pill"
                    />
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{row.paymentMode}</span>
              </div>
            </div>
          )
        },
      },
      {
        key: 'recipient',
        header: 'Recipients',
        skeletonWidth: 'w-28',
        cellClassName: 'align-top',
        cell: row => <span className="text-sm font-medium">{row.recipient}</span>,
      },
      {
        key: 'amount',
        header: 'Amount',
        skeletonWidth: 'w-24',
        cellClassName: 'align-top',
        cell: row => <span className="text-sm font-bold">{formatINR(row.amount)}</span>,
      },
      {
        key: 'frequency',
        header: 'Frequency',
        skeletonWidth: 'w-28',
        cellClassName: 'align-top',
        cell: row => <span className="text-sm">{row.frequencyLabel.replace(/·/g, '-')}</span>,
      },
      {
        key: 'nextRunDate',
        header: 'Next run date',
        skeletonWidth: 'w-24',
        cellClassName: 'align-top',
        cell: row => {
          if (!row.nextRunAt) return <span className="text-sm">—</span>
          const { date, time } = formatDateTime(row.nextRunAt)
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{date}</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          )
        },
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
        key: 'history',
        header: 'History',
        skeletonWidth: 'w-20',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => (
          <Button
            size="sm"
            className="h-8 rounded-md bg-button-bg px-3 text-xs text-primary-foreground hover:bg-button-bg/90"
            onClick={() => openRunHistory(row.id)}
          >
            View
          </Button>
        ),
      },
      ...(canUpdate
        ? [
            {
              key: 'actions',
              header: 'Actions',
              skeletonWidth: 'w-8',
              headerClassName: 'text-center',
              cellClassName: 'text-center',
              width: '80px',
              noTruncate: true,
              cell: row => <ScheduledPayoutActions payout={row} />,
            } satisfies ColumnDef<ScheduledPayoutListItem>,
          ]
        : []),
    ],
    [openRunHistory, canUpdate],
  )

  if (error && isPermissionDenied) {
    return (
      <div className="m-6">
        <AccessDeniedAlert message={permissionMessage} />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-5 overflow-hidden">
      {/* Tabs — standalone, outside the card */}
      <PillTabs
        tabs={TABS.map(t => ({
          ...t,
          label: tabCounts[t.value] != null ? `${t.label} (${tabCounts[t.value]})` : t.label,
        }))}
        value={activeTab as ScheduledPayoutTab}
        onValueChange={handleTabChange}
      />

      <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 pb-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Scheduled Payouts</h2>
            <p className="text-sm text-muted-foreground">
              One-time and recurring payouts you&apos;ve set up to run automatically
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
            {canCreate && (
              <Button variant="outline" className="h-12 gap-3.5" onClick={openBulkModal}>
                <AppIcon icon={Upload} size="sm" />
                Bulk Upload
              </Button>
            )}
            {canCreate && (
              <Button
                onClick={openCreateDrawer}
                className="h-12 gap-3.5 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
              >
                <AppIcon icon={Plus} color="primary-foreground" />
                Create scheduled payout
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={payouts}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          emptyMessage={
            filters.search
              ? 'No scheduled payouts found matching your search.'
              : 'No scheduled payouts found.'
          }
          containerClassName="rounded-md shadow-none border-0 [&_tr>td:first-child]:!pl-0"
        />

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="pt-6">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={pp => {
                setPerPage(pp)
                setPage(1)
              }}
              itemLabel="scheduled payouts"
            />
          </div>
        )}
      </div>

      {/* Create/Edit Drawer */}
      <CreateScheduledPayoutDrawer
        open={showCreateDrawer}
        editPayoutId={editPayoutId}
        onOpenChange={open => {
          if (!open) closeDrawer()
        }}
      />

      {/* Run History Drawer */}
      <RunHistoryDrawer payoutId={historyPayoutId} />

      {/* Bulk Upload Modal */}
      <BulkScheduledUploadModal
        open={showBulkModal}
        onOpenChange={open => {
          if (!open) closeBulkModal()
        }}
      />
    </div>
  )
}
