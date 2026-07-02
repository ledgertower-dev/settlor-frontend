'use client'

import { useState, useMemo, useEffect } from 'react'
import { Bar, BarChart, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/core/utils'
import { DashboardDateFilter, resolvePreset, type DateFilterValue } from './DashboardDateFilter'
import { useStatusVolume, useStatusSplit } from '../model/use-dashboard-metrics'
import type { DashboardMetricParams } from '../types/dashboard.types'

// Chart colours per the dashboard design (teal / blue / light-blue / grey).
const CHART_COLORS = {
  success: '#24C7A6',
  initiated: '#0043FF',
  processing: '#00A0FF',
  failed: '#C4CAD4',
} as const

const barChartConfig = {
  success: { label: 'Success Payout', color: CHART_COLORS.success },
  initiated: { label: 'Initiated Payout', color: CHART_COLORS.initiated },
  processing: { label: 'Processing Payout', color: CHART_COLORS.processing },
  failed: { label: 'Failed Payout', color: CHART_COLORS.failed },
} satisfies ChartConfig

// --- Period filter tabs ---

const PERIOD_OPTIONS = [
  { value: '3d', label: '3 Days' },
  { value: '5d', label: '5 Days' },
  { value: '7d', label: '7 Days' },
] as const

// --- Legend items ---

const BAR_LEGEND_ITEMS = [
  { key: 'success', label: 'Success Payout', color: CHART_COLORS.success },
  { key: 'initiated', label: 'Initiated Payout', color: CHART_COLORS.initiated },
  { key: 'processing', label: 'Processing Payout', color: CHART_COLORS.processing },
  { key: 'failed', label: 'Failed Payout', color: CHART_COLORS.failed },
]

const BREAKDOWN_ITEMS = [
  { key: 'initiated' as const, label: 'Initiated', color: CHART_COLORS.initiated },
  { key: 'success' as const, label: 'Success', color: CHART_COLORS.success },
  { key: 'processing' as const, label: 'Processing', color: CHART_COLORS.processing },
  { key: 'failed' as const, label: 'Failed', color: CHART_COLORS.failed },
]

// --- Format value as currency shorthand ---

function formatDay(raw: string): string {
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function formatShort(value: number): string {
  const trim = (n: number) => parseFloat(n.toFixed(1)).toString()
  if (value >= 10000000) return `${trim(value / 10000000)}Cr`
  if (value >= 100000) return `${trim(value / 100000)}L`
  if (value >= 1000) return `${trim(value / 1000)}K`
  return String(value)
}

// --- Custom Bar Tooltip (all statuses for the hovered day) ---

function BarChartCustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number }>
}) {
  if (!active || !payload?.length) return null
  const valueOf = (key: string) => payload.find(p => p.dataKey === key)?.value ?? 0

  return (
    <div className="flex w-60 flex-col gap-2 rounded-2xl border border-border/60 bg-card p-3 shadow-[var(--shadow-card)]">
      {BAR_LEGEND_ITEMS.map(item => (
        <div
          key={item.key}
          className="flex items-center justify-between gap-6 rounded-xl bg-muted px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="size-4 shrink-0 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-foreground">{item.label}</span>
          </div>
          <span className="text-base font-bold text-foreground">
            {formatShort(valueOf(item.key))}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- Rounded-top bar shape ---
// Stacked bars draw bottom→top in this order; the rounded top is applied to
// whichever segment is the topmost non-zero one for that day (so a success-only
// bar still gets a rounded top).
const STACK_ORDER = ['success', 'initiated', 'processing', 'failed'] as const

interface BarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
  payload?: Record<string, number>
  dataKey?: string
}

function RoundedTopBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  payload = {},
  dataKey,
}: BarShapeProps) {
  if (height <= 0) return null
  const topKey = [...STACK_ORDER].reverse().find(k => (payload[k] ?? 0) > 0)
  const r = dataKey === topKey ? Math.min(4, width / 2, height) : 0
  const d =
    r > 0
      ? `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`
      : `M${x},${y} h${width} v${height} h${-width} Z`
  return <path d={d} fill={fill} />
}

// --- Bar Chart ---

export function StatusSplitBarChart() {
  const [period, setPeriod] = useState('7d')

  // Side margins grow with screen width so the bars don't stretch apart on very
  // wide screens: tight below xl, 60 at xl, then scaling up (capped).
  const [vw, setVw] = useState(0)
  useEffect(() => {
    const apply = () => setVw(window.innerWidth)
    apply()
    // Debounce so we re-render once the resize settles, not on every event.
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(apply, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [])
  const sideMargin = vw < 1280 ? 15 : Math.min(280, 60 + Math.max(0, Math.round((vw - 1536) / 3)))

  const { data, isLoading } = useStatusVolume({ range: period })

  const barData = useMemo(() => {
    const points = data?.points ?? []
    if (points.length > 0) {
      return points.map(p => ({
        date: formatDay(p.day),
        initiated: p.initiated,
        success: p.success,
        processing: p.processing,
        failed: p.failed,
      }))
    }
    // Fallback: show zero-value bars so chart isn't blank
    const days = parseInt(period) || 7
    return Array.from({ length: days }, (_, i) => ({
      date: `Day ${i + 1}`,
      initiated: 0,
      success: 0,
      processing: 0,
      failed: 0,
    }))
  }, [data, period])

  return (
    <div className="flex h-full flex-col justify-between rounded-md border border-transparent dark:border-input bg-card px-5.5 py-5 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:justify-between gap-6 xl:gap-4 pb-6 xl:pb-0">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-foreground">Status split</p>
          <p className="text-sm text-foreground/50">Success vs failed</p>
        </div>

        {/* Period tabs */}
        <div className="flex w-fit items-center gap-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'rounded-full px-5 py-2 text-sm transition-colors',
                period === opt.value
                  ? 'bg-tab-active font-medium text-tab-active-foreground'
                  : 'text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart + Legend */}
      {isLoading ? (
        <Skeleton className="mt-4 h-[332px] w-full rounded-xl" />
      ) : (
        <div className="@container mt-4 flex flex-col gap-4 rounded-xl bg-secondary/50 p-4 pb-6">
          <ChartContainer
            config={barChartConfig}
            className="h-[300px] w-full overflow-visible [&_svg]:overflow-visible"
          >
            <BarChart
              accessibilityLayer
              data={barData}
              barCategoryGap="20%"
              margin={{ top: 10, right: sideMargin, left: sideMargin, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                className="text-sm"
              />
              <ChartTooltip cursor={false} content={<BarChartCustomTooltip />} />
              <Bar
                dataKey="success"
                stackId="a"
                fill="var(--color-success)"
                maxBarSize={56}
                shape={props => <RoundedTopBar {...props} dataKey="success" />}
              />
              <Bar
                dataKey="initiated"
                stackId="a"
                fill="var(--color-initiated)"
                maxBarSize={56}
                shape={props => <RoundedTopBar {...props} dataKey="initiated" />}
              />
              <Bar
                dataKey="processing"
                stackId="a"
                fill="var(--color-processing)"
                maxBarSize={56}
                shape={props => <RoundedTopBar {...props} dataKey="processing" />}
              />
              <Bar
                dataKey="failed"
                stackId="a"
                fill="var(--color-failed)"
                maxBarSize={56}
                shape={props => <RoundedTopBar {...props} dataKey="failed" />}
              />
            </BarChart>
          </ChartContainer>

          {/* Legend (inside the chart background) — 2x2 when narrow, 1 row when wide */}
          <div className="mx-auto grid w-fit grid-cols-2 gap-x-8 gap-y-3 pt-2 @[680px]:grid-cols-4">
            {BAR_LEGEND_ITEMS.map(item => (
              <div key={item.key} className="flex items-center gap-3.5">
                <span
                  className="size-3.5 shrink-0 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm text-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- Donut Chart ---

export function StatusSplitDonutChart() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(() => ({
    preset: 'today',
    ...resolvePreset('today'),
  }))

  const queryParams = useMemo<DashboardMetricParams>(
    () =>
      dateFilter.preset === 'all'
        ? { range: 'all' }
        : { created_from: dateFilter.from, created_to: dateFilter.to },
    [dateFilter],
  )

  const { data, isLoading } = useStatusSplit(queryParams)

  const total = data?.total ?? 0
  // Segments for the horizontal stacked bar (in display order).
  const segments = BREAKDOWN_ITEMS.map(item => ({
    ...item,
    pct: data?.[item.key]?.percent ?? 0,
    txn: data?.[item.key]?.count ?? 0,
  }))

  return (
    <div className="flex h-full flex-col justify-between rounded-md border border-transparent dark:border-input bg-card px-5.5 py-5 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-foreground">Status split</p>
          <p className="text-sm text-foreground/50">Payout distribution</p>
        </div>
        <DashboardDateFilter
          variant="minimal"
          className="w-fit max-w-full rounded-md border border-input shadow-[var(--shadow-card)]"
          onChange={setDateFilter}
        />
      </div>

      {/* Total + breakdown bar + legend */}
      <div className="mt-8 flex flex-col gap-8">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-full rounded-full" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-lg text-muted-foreground font-medium">Total txn</span>
              <span className="text-[2rem] font-semibold leading-none text-foreground">
                {total}
              </span>
            </div>

            {/* Horizontal stacked bar — flush segments, rounded outer ends */}
            <div className="flex h-3.5 w-full overflow-hidden rounded-full">
              {total > 0 ? (
                segments
                  .filter(s => s.pct > 0)
                  .map(s => (
                    <span
                      key={s.key}
                      className="h-full"
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    />
                  ))
              ) : (
                <span className="h-full w-full bg-secondary" />
              )}
            </div>

            {/* Legend list */}
            <div className="flex flex-col gap-4">
              {segments.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3.5 shrink-0 rounded"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm text-foreground">
                    {parseFloat(s.pct.toFixed(2))}% . {s.txn} txn
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
