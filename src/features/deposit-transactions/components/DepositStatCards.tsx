'use client'

import { CircleCheckBig, Play, Wallet } from 'lucide-react'
import { MetricCard } from '@/components/shared/metric-card'
import { useDepositMetrics } from '../model/use-deposit-transactions'

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function txLabel(count: number) {
  return `${count} Transaction${count !== 1 ? 's' : ''}`
}

export function DepositStatCards() {
  const { data: metrics, isLoading } = useDepositMetrics()

  const currency = metrics?.currency ?? 'INR'

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        icon={CircleCheckBig}
        label="Total Deposits"
        amount={formatAmount(metrics?.total.amount ?? 0, currency)}
        transactionCount={txLabel(metrics?.total.count ?? 0)}
        isLoading={isLoading}
      />
      <MetricCard
        icon={Play}
        label="Pending Deposits"
        amount={formatAmount(metrics?.pending.amount ?? 0, currency)}
        transactionCount={txLabel(metrics?.pending.count ?? 0)}
        isLoading={isLoading}
      />
      <MetricCard
        icon={Wallet}
        label="Reverted Deposits"
        amount={formatAmount(metrics?.reverted.amount ?? 0, currency)}
        transactionCount={txLabel(metrics?.reverted.count ?? 0)}
        isLoading={isLoading}
      />
    </div>
  )
}
