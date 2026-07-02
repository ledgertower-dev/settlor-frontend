'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { useRolePath } from '@/hooks/use-role-prefix'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatINR, formatDateTime } from '@/lib/core/format'

import type { WalletAdjustment } from '../types'
import { RefreshButton } from '@/components/shared/refresh-button'
import { useAllAdjustments } from '../model/use-wallet-adjustments'
import { useWalletAdjustmentsUIStore } from '../model/wallet-adjustments-ui-store'
import { AddAdjustmentDrawer } from './AddAdjustmentDrawer'

export function WalletAdjustmentsPage() {
  const router = useRouter()
  const rolePath = useRolePath()
  const { filters, setPage, setPerPage, openDrawer } = useWalletAdjustmentsUIStore()

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      per_page: filters.perPage,
    }),
    [filters],
  )

  const { data, isLoading, isFetching, refetch } = useAllAdjustments(queryParams)

  const adjustments = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const columns: ColumnDef<WalletAdjustment>[] = useMemo(
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
        key: 'merchant',
        header: 'Merchant',
        skeletonWidth: 'w-28',
        cell: row => (
          <div className="flex flex-col gap-1">
            <span className="text-sm capitalize">{row.merchantName}</span>
            <button
              type="button"
              onClick={e => {
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
      {
        key: 'walletCode',
        header: 'Wallet',
        skeletonWidth: 'w-20',
        cell: row => <span className="text-sm">{row.walletCode}</span>,
      },
      {
        key: 'direction',
        header: 'Direction',
        skeletonWidth: 'w-24',
        noTruncate: true,
        cell: row => <StatusBadge status={row.direction} variant="plain" />,
      },
      {
        key: 'amount',
        header: 'Amount',
        skeletonWidth: 'w-20',
        cell: row => <span className="text-sm">{formatINR(row.amount)}</span>,
      },
      {
        key: 'remarks',
        header: 'Remarks',
        skeletonWidth: 'w-40',
        cell: row => <span className="text-sm">{row.remarks}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        skeletonWidth: 'w-20',

        noTruncate: true,
        cell: row => <StatusBadge status={row.status} />,
      },
      {
        key: 'createdAt',
        header: 'Date',
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
    ],
    [pagination, router, rolePath],
  )

  return (
    <div className="space-y-5">
      {/* Table card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        {/* Title + Add Adjustment */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Wallet Adjustments</h2>
            <p className="text-sm text-muted-foreground">
              View all wallet adjustment logs and create new adjustments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
            <button
              onClick={openDrawer}
              className="flex h-12 items-center gap-2 rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              <AppIcon icon={Plus} color="primary-foreground" />
              Add Adjustment
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={adjustments}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          emptyMessage="No adjustment logs found."
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
              }}
              itemLabel="adjustments"
            />
          </div>
        )}
      </div>

      {/* Add Adjustment Drawer */}
      <AddAdjustmentDrawer />
    </div>
  )
}
