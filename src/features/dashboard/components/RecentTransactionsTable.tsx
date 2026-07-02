'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { usePayouts, PayoutDetailDrawer } from '@/features/payouts'
import { formatINR, formatDateTime } from '@/lib/core/format'
import type { Payout } from '@/features/payouts/types'

function getColumns(onTxnClick: (payout: Payout) => void): ColumnDef<Payout>[] {
  return [
    {
      key: 'sno',
      header: 'S.No',
      cell: (_row, index) => (index ?? 0) + 1,
      skeletonWidth: 'w-6',
      width: '60px',
    },
    {
      key: 'txnId',
      header: 'Transaction ID',
      cell: row => (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onTxnClick(row)
          }}
          className="text-sm font-medium text-sidebar-active capitalize cursor-pointer hover:underline truncate max-w-full"
        >
          {row.code}
        </button>
      ),
      skeletonWidth: 'w-28',
    },
    {
      key: 'dateTime',
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
      skeletonWidth: 'w-32',
    },
    {
      key: 'utr',
      header: 'UTR',
      cell: row => row.externalReference || row.utr || '—',
      skeletonWidth: 'w-24',
    },
    {
      key: 'requestedAmount',
      header: 'Requested Amount',
      cell: row => formatINR(row.requestedAmount),
      skeletonWidth: 'w-20',
    },
    {
      key: 'fees',
      header: 'Fees',
      cell: row => formatINR(row.fees),
      skeletonWidth: 'w-16',
    },
    {
      key: 'status',
      header: 'Status',

      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: row => <StatusBadge status={row.status} />,
      skeletonWidth: 'w-20',
    },
  ]
}

export function RecentTransactionsTable() {
  const router = useRouter()
  const rolePath = useRolePath()
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null)
  const { data, isLoading } = usePayouts({ page: 1, per_page: 5 })

  const payouts = data?.data?.items ?? []

  const handleTxnClick = (payout: Payout) => {
    setSelectedPayoutId(payout.id)
  }

  const columns = getColumns(handleTxnClick)

  return (
    <div className="rounded-lg border border-transparent dark:border-input bg-card px-5.5 py-5 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium text-foreground">Recent Transactions</h2>
          <p className="text-sm text-muted-foreground">Latest payout activity</p>
        </div>
        <button
          type="button"
          onClick={() => router.push(rolePath('/payout-transactions'))}
          className="h-8.5 w-[106px] rounded-full border border-foreground/20 bg-secondary text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          View All
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={payouts}
        rowKey={row => row.id}
        isLoading={isLoading}
        loadingRows={5}
        emptyMessage="No recent payouts found."
        containerClassName="border-0 shadow-none bg-transparent rounded-none"
      />

      <PayoutDetailDrawer
        payoutId={selectedPayoutId}
        open={!!selectedPayoutId}
        onOpenChange={open => {
          if (!open) setSelectedPayoutId(null)
        }}
      />
    </div>
  )
}
