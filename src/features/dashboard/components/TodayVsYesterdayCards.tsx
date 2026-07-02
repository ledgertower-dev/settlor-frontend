'use client'

import { Area, AreaChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/core/utils'
import { useTodayVsYesterday } from '../model/use-dashboard-metrics'
import { formatINR } from '@/lib/core/format'
import type { SparklineMetric } from '../types/dashboard.types'
import { STATUS_HEX } from '@/lib/constants/status'

// Soft downward card shadow shared by these stat cards.
const CARD_SHADOW = 'shadow-[0px_10px_28px_-12px_rgba(6,21,40,0.07)]'

const volumeConfig = {
  v: { label: 'Volume', color: STATUS_HEX.success },
} satisfies ChartConfig

const rateConfig = {
  v: { label: 'Rate', color: STATUS_HEX.failed },
} satisfies ChartConfig

/**
 * Total Volume + Failure Rate cards as bare grid children (no section title),
 * for the dashboard's bottom row alongside the status-split breakdown.
 */
export function DashboardVolumeRateCards() {
  const { data, isLoading } = useTodayVsYesterday()

  if (isLoading) {
    return (
      <>
        <SparklineCardSkeleton />
        <SparklineCardSkeleton />
      </>
    )
  }

  return (
    <>
      <SparklineCard
        title="Total Volume"
        metric={data?.volume}
        formatValue={v => formatINR(v)}
        formatYesterday={v => `vs ${formatINR(v)} yesterday`}
        subtitle="Successful payouts only"
        chartConfig={volumeConfig}
        positiveColor={STATUS_HEX.success}
        negativeColor={STATUS_HEX.failed}
      />
      <SparklineCard
        title="Failure Rate"
        metric={data?.failureRate}
        formatValue={v => `${parseFloat(v.toFixed(2))}%`}
        formatYesterday={v => `vs ${parseFloat(v.toFixed(2))}% yesterday`}
        subtitle="Failed / Total txns"
        chartConfig={rateConfig}
        positiveColor={STATUS_HEX.failed}
        negativeColor={STATUS_HEX.failed}
      />
    </>
  )
}

// --- Sparkline Card ---

interface SparklineCardProps {
  title: string
  metric?: SparklineMetric
  formatValue: (v: number) => string
  formatYesterday: (v: number) => string
  subtitle: string
  chartConfig: ChartConfig
  /** Line/fill colour when the trend is good. */
  positiveColor: string
  /** Line/fill colour when the trend is bad. */
  negativeColor: string
}

function SparklineCard({
  title,
  metric,
  formatValue,
  formatYesterday,
  subtitle,
  chartConfig,
  positiveColor,
  negativeColor,
}: SparklineCardProps) {
  const today = metric?.today ?? 0
  const yesterday = metric?.yesterday ?? 0
  const delta = metric?.delta ?? 0
  const isPositive = metric?.deltaIsGood ?? delta >= 0
  const chartColor = isPositive ? positiveColor : negativeColor
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
  const fillId = `fill-${title.replace(/\s/g, '')}`

  // Always render at least a flat baseline so the chart never renders empty.
  const points = metric?.sparkline?.length ? metric.sparkline : Array.from({ length: 7 }, () => 0)
  const chartData = points.map((v, i) => ({ d: String(i + 1), v }))

  // Drop the baseline below the lowest point so the gradient fills all the way
  // down to the bottom of the chart (not just to the data minimum).
  const maxV = Math.max(...points)
  const minV = Math.min(...points)
  const span = maxV - minV || Math.abs(maxV) || 1
  const floor = minV - span * 0.1

  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-4 overflow-visible rounded-md border border-transparent bg-card px-5.5 py-5 dark:border-input',
        CARD_SHADOW,
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Title + change badge */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium',
              isPositive
                ? 'bg-status-green/10 text-status-green'
                : 'bg-status-red/10 text-status-red',
            )}
          >
            <TrendIcon className="size-3" strokeWidth={2} />
            {delta >= 0 ? '+' : ''}
            {parseFloat(delta.toFixed(1))}%
          </span>
        </div>

        {/* Value + subtitle */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[1.75rem] font-semibold leading-none text-foreground">
            {formatValue(today)}
          </p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Area chart */}
      <ChartContainer
        config={chartConfig}
        className="h-[120px] w-full overflow-visible [&>svg]:overflow-visible [&_.recharts-surface]:overflow-visible [&_.recharts-wrapper]:overflow-visible"
      >
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 0, right: 0, left: 0, bottom: -16 }}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" hide />
          <YAxis hide domain={[floor, maxV]} />
          <Area
            type="basis"
            dataKey="v"
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#${fillId})`}
            baseValue={floor}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ChartContainer>

      {/* Yesterday comparison */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-sm text-muted-foreground">{formatYesterday(yesterday)}</p>
      </div>
    </div>
  )
}

function SparklineCardSkeleton() {
  return (
    <div
      className={cn(
        'flex flex-col justify-between rounded-md border border-transparent bg-card px-6 py-6 dark:border-input',
        CARD_SHADOW,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="mt-4 h-[106px] w-full" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  )
}
