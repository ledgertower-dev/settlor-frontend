'use client'

import { DrawerLayout } from '@/components/shared/drawer-layout'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatINR } from '@/lib/core/format'
import { cn } from '@/lib/core/utils'

import { useRunHistoryStore } from '../model/scheduled-payouts-ui-store'
import { useScheduledPayoutRunHistory } from '../model/use-scheduled-payouts'
import type { ScheduledPayoutRun } from '../types'

interface RunHistoryDrawerProps {
  payoutId: string | null
}

const STATUS_DOT_COLOR: Record<string, string> = {
  SUCCESS: 'bg-status-green',
  FAILED: 'bg-status-red',
  PROCESSING: 'bg-status-orange',
}

function formatRunDate(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`
}

function formatNextRunDate(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function formatNextIn(iso: string) {
  const now = new Date()
  const next = new Date(iso)
  const diffMs = next.getTime() - now.getTime()
  if (diffMs <= 0) return '—'
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

export function RunHistoryDrawer({ payoutId }: RunHistoryDrawerProps) {
  const { closeRunHistory } = useRunHistoryStore()
  const open = payoutId !== null

  const { data, isLoading } = useScheduledPayoutRunHistory(payoutId)

  const schedule = data?.schedule
  const runs = data?.runs ?? []
  const stats = data?.stats

  const handleOpenChange = (o: boolean) => {
    if (!o) closeRunHistory()
  }

  return (
    <DrawerLayout
      open={open}
      onOpenChange={handleOpenChange}
      title={`Run History — ${schedule?.name ?? 'Schedule'}`}
      footer={null}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-muted-foreground">Loading history...</span>
        </div>
      ) : (
        <div className="space-y-5 -mt-2">
          {/* Subtitle */}
          <p className="text-xs text-muted-foreground -mt-4">
            {schedule?.frequencyLabel} · {schedule?.recipient}
          </p>

          {/* Info Card */}
          <div className="rounded-lg border border-border p-5">
            <div className="grid grid-cols-2 gap-y-5 gap-x-6">
              <InfoItem label="Frequency" value={schedule?.frequencyLabel ?? '—'} />
              <InfoItem label="Recipient" value={schedule?.recipient ?? '—'} />
              <InfoItem
                label="Amount Per Run"
                value={schedule ? formatINR(schedule.amount) : '—'}
              />
              <InfoItem
                label="Next Run"
                value={schedule?.nextRunAt ? formatNextRunDate(schedule.nextRunAt) : '—'}
              />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 rounded-lg bg-secondary/70 border border-border overflow-hidden">
            <StatCell label="Total Runs" value={String(stats?.totalRuns ?? 0)} />
            <StatCell
              label="Successful"
              value={String(stats?.successful ?? 0)}
              valueClassName="text-status-green"
            />
            <StatCell
              label="Failed"
              value={String(stats?.failed ?? 0)}
              valueClassName="text-status-red"
            />
            <StatCell
              label="Next In"
              value={schedule?.nextRunAt ? formatNextIn(schedule.nextRunAt) : '—'}
              valueClassName="text-status-teal"
            />
          </div>

          {/* Past Runs */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">Past Runs</h3>

            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No run history available for this schedule.
              </p>
            ) : (
              <div className="relative">
                {/* Vertical connecting line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

                <div className="space-y-3">
                  {runs.map((run, idx) => (
                    <TimelineEntry key={`${run.transactionId}-${idx}`} run={run} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DrawerLayout>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-status-teal">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}

function StatCell({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col items-start gap-1 px-4 py-3 border-r border-border last:border-r-0">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn('text-2xl font-semibold text-foreground', valueClassName)}>{value}</span>
    </div>
  )
}

function TimelineEntry({ run }: { run: ScheduledPayoutRun }) {
  const dotColor = STATUS_DOT_COLOR[run.status] ?? 'bg-muted-foreground'

  return (
    <div className="relative flex items-start gap-3">
      {/* Dot */}
      <div
        className={cn(
          'relative z-10 mt-5 size-[22px] shrink-0 rounded-full border-[3px] border-background',
          dotColor,
        )}
      />

      {/* Card */}
      <div className="flex-1 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">{formatRunDate(run.ranAt)}</span>
          <StatusBadge status={run.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Amount: {formatINR(run.amount)}</span>
          {run.utr && <span>UTR: {run.utr}</span>}
          {run.transactionCode && <span>Tx: {run.transactionCode}</span>}
        </div>

        {run.failureReason && <p className="mt-2 text-xs text-status-red">{run.failureReason}</p>}
      </div>
    </div>
  )
}
