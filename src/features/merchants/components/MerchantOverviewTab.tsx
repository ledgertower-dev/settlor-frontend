'use client'

import { useState } from 'react'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { usePermission } from '@/features/access/hooks/usePermission'
import type { MerchantDetail } from '../types'
import { formatINR, type MerchantWalletBreakdown } from '../types/merchant-provider.types'
import { useWalletOverview, useSetDefaultWallet } from '../model/use-merchant-provider-config'

interface MerchantOverviewTabProps {
  merchantId: string
  merchant: MerchantDetail
}

export function MerchantOverviewTab({ merchantId, merchant }: MerchantOverviewTabProps) {
  const canUpdateSettings = usePermission('merchants:settings:update')
  const isAccepted = merchant.status === 'ACTIVE' || merchant.status === 'BLOCKED'
  const { data: walletOverview, isLoading } = useWalletOverview(merchantId)
  const setDefaultWallet = useSetDefaultWallet()
  const [confirmTarget, setConfirmTarget] = useState<MerchantWalletBreakdown | null>(null)

  const handleConfirmSetDefault = () => {
    if (!confirmTarget) return
    setDefaultWallet.mutate(
      { merchantId, providerConfigId: confirmTarget.providerConfigId },
      {
        onSuccess: () => {
          toast.success('Default wallet updated')
          setConfirmTarget(null)
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const columns: ColumnDef<MerchantWalletBreakdown>[] = [
    {
      key: 'provider',
      header: 'Provider',
      cell: row => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-md bg-button-bg text-xs font-medium text-primary-foreground">
            {row.providerName
              .split(' ')
              .map(w => w[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{row.providerName}</p>
            <p className="text-xs text-muted-foreground">{row.walletId}</p>
          </div>
        </div>
      ),
      skeletonWidth: 'w-40',
    },
    {
      key: 'virtualAccount',
      header: 'Virtual Account',
      cell: row => <span className="text-sm text-foreground">{row.virtualAccountId}</span>,
      skeletonWidth: 'w-28',
    },
    {
      key: 'balance',
      header: 'Balance',
      cell: row => <span className="text-sm text-foreground">{formatINR(row.balance)}</span>,
      skeletonWidth: 'w-24',
    },
    {
      key: 'hold',
      header: 'Hold',
      cell: row => <span className="text-sm text-foreground">{formatINR(row.hold)}</span>,
      skeletonWidth: 'w-20',
    },
    {
      key: 'payouts',
      header: 'Payouts',
      cell: row => (
        <div>
          <p className="text-sm font-semibold text-foreground">{formatINR(row.payoutVolume)}</p>
          <p className="text-xs text-muted-foreground">{row.payoutCount} payouts</p>
        </div>
      ),
      skeletonWidth: 'w-28',
    },
    {
      key: 'commission',
      header: 'Commission',
      cell: row => <span className="text-sm text-foreground">{formatINR(row.commissionPaid)}</span>,
      skeletonWidth: 'w-24',
    },
    {
      key: 'status',
      header: 'Status',
      cell: row => <StatusBadge status={row.status} />,
      skeletonWidth: 'w-24',
    },
    ...(canUpdateSettings
      ? [
          {
            key: 'action' as const,
            header: 'Action',
            cell: (row: MerchantWalletBreakdown) =>
              row.isDefault ? (
                <span className="inline-flex h-7 items-center gap-2 rounded-full border border-status-green px-3 text-sm font-medium text-status-green">
                  Primary wallet
                </span>
              ) : (
                <Button
                  size="sm"
                  className="h-8 bg-button-bg text-xs text-primary-foreground hover:bg-button-bg/90"
                  disabled={setDefaultWallet.isPending}
                  onClick={() => setConfirmTarget(row)}
                >
                  Set as primary
                </Button>
              ),
            skeletonWidth: 'w-24' as const,
          },
        ]
      : []),
  ]

  const summary = walletOverview?.summary
  const wallets = walletOverview?.wallets ?? []

  const metrics = [
    {
      label: 'Wallet Balance',
      value: summary ? formatINR(summary.walletBalance) : '-',
      subtitle: summary
        ? `Across ${summary.walletCount} wallet${summary.walletCount !== 1 ? 's' : ''}`
        : '',
    },
    {
      label: 'IN-Flight Hold',
      value: summary ? formatINR(summary.inFlightHolds) : '-',
      subtitle: 'Pending settlement',
    },
    {
      label: 'Lifetime Payouts',
      value: summary ? summary.lifetimePayoutCount.toString() : '-',
      subtitle: summary ? `${formatINR(summary.lifetimePayoutAmount)} processed` : '',
    },
    {
      label: 'Commission Paid',
      value: summary ? formatINR(summary.commissionPaid) : '-',
      subtitle: 'Platform fees lifetime',
    },
  ]

  return (
    <div className="space-y-3.5">
      {isAccepted && (
        <>
          {/* Overview Card */}
          <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5">
              <h3 className="text-lg font-medium text-foreground">Recent transaction</h3>
              <p className="text-sm text-muted-foreground">Latest payout activity</p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map(m =>
                isLoading ? (
                  <div
                    key={m.label}
                    className="flex flex-col gap-3.5 rounded-[10px] border border-table-row-border bg-table-header-bg px-6 py-[18px]"
                  >
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-3.5 w-36" />
                  </div>
                ) : (
                  <div
                    key={m.label}
                    className="@container flex flex-col gap-3.5 rounded-[10px] border border-table-row-border bg-table-header-bg px-6 py-[18px] shadow-[0px_12px_32px_-8px_rgba(10,23,41,0.05)]"
                  >
                    <p className="text-lg font-medium text-muted-foreground">{m.label}</p>
                    <p className="break-all text-[min(1.5rem,12cqi)] font-semibold text-foreground">
                      {m.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{m.subtitle}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Per-Wallet Breakdown */}
          <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-5 text-lg font-medium text-foreground">Per-Wallet Breakdown</h3>
            <DataTable
              columns={columns}
              data={wallets}
              rowKey={row => row.walletId}
              isLoading={isLoading}
              emptyMessage="No wallets configured"
              containerClassName="border-0 shadow-none bg-transparent rounded-none"
            />
          </div>

          {/* Set Primary Wallet Confirmation */}
          <ConfirmDialog
            open={!!confirmTarget}
            onOpenChange={open => !open && setConfirmTarget(null)}
            title="Set as primary wallet?"
            description={
              <>
                This will make{' '}
                <span className="font-medium text-foreground">{confirmTarget?.providerName}</span>{' '}
                the primary wallet for this merchant. All new payouts will default to this wallet.
              </>
            }
            confirmLabel="Confirm"
            pendingLabel="Updating..."
            variant="confirm"
            isPending={setDefaultWallet.isPending}
            onConfirm={handleConfirmSetDefault}
          />
        </>
      )}
    </div>
  )
}
