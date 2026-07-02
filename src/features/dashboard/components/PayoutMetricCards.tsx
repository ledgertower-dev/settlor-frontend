'use client'

import { useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleCheckBig,
  Columns3Cog,
  StepForward,
  Undo2,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/core/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR } from '@/lib/core/format'
import { type DateFilterValue } from './DashboardDateFilter'
import { usePayoutCards } from '../model/use-dashboard-metrics'
import type { DashboardMetricParams } from '../types/dashboard.types'

interface PayoutCardConfig {
  key: 'success' | 'initiated' | 'failed' | 'processing'
  label: string
  icon: LucideIcon
}

const PAYOUT_CARD_CONFIG: PayoutCardConfig[] = [
  { key: 'success', label: 'Success Payout', icon: CircleCheckBig },
  { key: 'initiated', label: 'Initiated Payout', icon: StepForward },
  { key: 'failed', label: 'Failed Payout', icon: Undo2 },
  { key: 'processing', label: 'Processing Payout', icon: Columns3Cog },
]

export function DashboardPayoutCards({ dateFilter }: { dateFilter: DateFilterValue }) {
  const queryParams = useMemo<DashboardMetricParams>(
    () =>
      dateFilter.preset === 'all'
        ? { range: 'all' }
        : { created_from: dateFilter.from, created_to: dateFilter.to },
    [dateFilter],
  )

  const { data, isLoading } = usePayoutCards(queryParams)

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {PAYOUT_CARD_CONFIG.map(card => {
        const statusCard = data?.statusCards[card.key]
        const amount = statusCard?.amount ?? 0
        const delta = statusCard?.delta ?? 0
        const up = statusCard?.deltaIsGood ?? delta >= 0
        const comparisonLabel = statusCard?.comparisonLabel || 'vs last month'
        const Icon = card.icon

        return (
          <div
            key={card.key}
            className="@container flex flex-col gap-6 rounded-md border border-transparent dark:border-input bg-card px-5.5 py-5 shadow-[var(--shadow-card)]"
          >
            {/* Label + icon badge */}
            <div className="flex items-center gap-3.5">
              <p className="text-lg text-muted-foreground font-medium">{card.label}</p>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="size-5 text-foreground" strokeWidth={1.5} />
              </span>
            </div>

            {/* Amount */}
            {isLoading ? (
              <Skeleton className="h-10 w-36" />
            ) : (
              <p className="break-all text-[min(2.5rem,14cqi)] font-semibold leading-none text-foreground">
                {formatINR(amount)}
              </p>
            )}

            {/* Trend pill */}
            {isLoading ? (
              <Skeleton className="h-5 w-32 rounded-md" />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium',
                    up
                      ? 'bg-status-green/10 text-status-green'
                      : 'bg-status-red/10 text-status-red',
                  )}
                >
                  {up ? (
                    <ArrowUpRight className="size-3" strokeWidth={2} />
                  ) : (
                    <ArrowDownRight className="size-3" strokeWidth={2} />
                  )}
                  {delta >= 0 ? '+' : ''}
                  {parseFloat(delta.toFixed(1))}%
                </span>
                <span className="text-xs text-muted-foreground">{comparisonLabel}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
