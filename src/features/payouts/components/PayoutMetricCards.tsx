'use client'

import { BadgeCheck, CircleCheckBig, Gauge, Play, Wallet, type LucideIcon } from 'lucide-react'

import { MetricCard } from '@/components/shared/metric-card'
import { useDashboardSummary } from '@/features/dashboard/model'
import { formatINR } from '@/lib/core/format'
import type { DashboardSummary } from '@/features/dashboard/types/dashboard.types'

interface CardConfig {
  label: string
  sublabel?: string
  icon: LucideIcon
  getValue: (data: DashboardSummary) => string
  getCount?: (data: DashboardSummary) => string
}

const CARD_CONFIG: CardConfig[] = [
  {
    label: 'Payout Wallet Balance',
    icon: Wallet,
    getValue: d => formatINR(d.walletBalance?.amount ?? 0),
  },
  {
    label: 'Success Payout',
    sublabel: '(Excluding Fees)',
    icon: CircleCheckBig,
    getValue: d => formatINR(d.successPayout?.amount ?? 0),
    getCount: d => `${d.successPayout?.count ?? 0} Transactions`,
  },
  {
    label: 'Processing Payout',
    icon: Gauge,
    getValue: d => formatINR(d.processingPayout?.amount ?? 0),
    getCount: d => `${d.processingPayout?.count ?? 0} Transactions`,
  },
  {
    label: 'Initiated Payout',
    icon: Play,
    getValue: d => formatINR(d.initiatedPayout?.amount ?? 0),
    getCount: d => `${d.initiatedPayout?.count ?? 0} Transactions`,
  },
  {
    label: 'Payout Fees',
    icon: BadgeCheck,
    getValue: d => formatINR(d.payoutFees?.amount ?? 0),
  },
]

export function PayoutMetricCards() {
  const { data, isLoading } = useDashboardSummary()

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {CARD_CONFIG.map(card => (
        <MetricCard
          key={card.label}
          icon={card.icon}
          label={card.label}
          sublabel={card.sublabel}
          amount={data ? card.getValue(data) : '₹ 0.00'}
          transactionCount={
            card.getCount ? (data ? card.getCount(data) : '0 Transactions') : undefined
          }
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
