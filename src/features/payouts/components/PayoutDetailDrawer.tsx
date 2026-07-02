'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleX,
  Code,
  Copy,
  Lock,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/core/utils'
import { usePermission } from '@/features/access/hooks/usePermission'
import { StatusBadge } from '@/components/shared/status-badge'

import { formatINR, formatFullDateTime } from '@/lib/core/format'
import { useAuthStore } from '@/features/auth'
import { usePayout, payoutKeys } from '../model/use-payouts'
import type { PayoutDetail, PayoutTimeline } from '../types'
import { StatusOverrideDialog } from './StatusOverrideDialog'

interface PayoutDetailDrawerProps {
  payoutId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatShortDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatShortTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatTimelineDate(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  )
}

// ============================================================================
// Detail Row
// ============================================================================

function DetailRow({
  label,
  value,
  isLast = false,
  children,
}: {
  label: string
  value?: string
  isLast?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className={`flex items-center ${!isLast ? 'border-b border-foreground/15' : ''}`}>
      <p className="w-2/5 shrink-0 text-xs capitalize text-foreground/80">{label}</p>
      <div className="w-3/5 px-4 py-3.5 sm:px-6">
        {children ?? (
          <p className="text-sm font-semibold text-foreground/80 break-words">{value}</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Detail Section
// ============================================================================

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs uppercase text-muted-foreground">{title}</p>
      <div className="rounded-md border-[0.4px] border-foreground/40 bg-secondary px-4 py-3.5 sm:px-6">
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// Transaction Details Tab
// ============================================================================

function TransactionDetailsTab({ payout }: { payout: PayoutDetail }) {
  return (
    <div className="flex flex-col gap-[2.875rem]">
      {/* Transaction Info */}
      <DetailSection title="Transaction Info">
        <DetailRow label="Transaction ID" value={payout.code} />
        <DetailRow label="Requested Amount" value={formatINR(payout.requestedAmount)} />
        <DetailRow label="Fees" value={formatINR(payout.fees)} />
        <DetailRow label="Net Amount" value={formatINR(payout.netAmount)} />
        <DetailRow label="UTR" value={payout.externalReference || payout.utr || '—'} />
        <DetailRow label="Date & Time" value={formatFullDateTime(payout.createdAt)} />
        <DetailRow label="Status">
          <StatusBadge status={payout.status} />
        </DetailRow>
        <DetailRow label="Provider Status" isLast>
          {payout.providerStatus ? (
            <StatusBadge status={payout.providerStatus} />
          ) : (
            <p className="text-sm font-semibold text-foreground/80">—</p>
          )}
        </DetailRow>
      </DetailSection>

      {/* Merchant */}
      <DetailSection title="Merchant">
        <DetailRow label="Merchant" value={payout.merchant.name} />
        <DetailRow label="Merchant ID" value={payout.merchant.code || payout.merchant.id} />
        <DetailRow label="Callback URL" value={payout.merchant.callbackUrl || '—'} isLast />
      </DetailSection>

      {/* Beneficiary */}
      <DetailSection title="Beneficiary">
        <DetailRow label="Account Holder" value={payout.beneficiary.name} />
        <DetailRow label="Account Number" value={payout.beneficiary.account} />
        <DetailRow label="IFSC" value={payout.beneficiary.ifsc || '—'} />
        <DetailRow label="Bank" value={payout.beneficiary.bankName || '—'} />
        <DetailRow label="Transfer Mode" value={payout.paymentMode} isLast />
      </DetailSection>
    </div>
  )
}

// ============================================================================
// Event Timeline Tab
// ============================================================================

// deriveEventTitle computes the row title from event_type + to_status.
// Falls back to the status name for rows without event_type (older data).
function deriveEventTitle(event: PayoutTimeline): string {
  switch (event.eventType) {
    case 'provider_forward':
      return 'Request Forwarded To Bank'
    case 'provider_response':
      return 'Bank Response Received'
    case 'provider_delay':
      return 'Awaiting Bank'
    case 'merchant_callback':
      return 'Callback Sent To Merchant'
    case 'merchant_callback_retry':
      return 'Merchant Callback Retry'
    case 'merchant_callback_exhausted':
      return 'Merchant Callback Exhausted'
    case 'settlement':
      return event.remarks?.toLowerCase().includes('in transit')
        ? 'Settlement In Transit'
        : 'Settlement Complete'
    case 'manual_status_override':
      return 'Manual Status Override'
    case 'status_change':
    default:
      switch (event.toStatus) {
        case 'INITIATED':
          return 'Transaction Initiated'
        case 'PROCESSING':
          return 'Payout Processing'
        case 'SUCCESS':
          return 'Transaction Completed'
        case 'FAILED':
          return 'Transaction Failed'
        case 'REVERSED':
          return 'Transaction Reversed'
        case 'PENDING_APPROVAL':
          return 'Pending Approval'
        default:
          return event.toStatus || 'Status Change'
      }
  }
}

// iconForEvent picks the icon + color for the left rail.
function iconForEvent(event: PayoutTimeline): { icon: LucideIcon; color: string } {
  const kind = event.badge?.kind
  if (kind === 'danger' || event.toStatus === 'FAILED' || event.toStatus === 'REVERSED') {
    return {
      icon: CircleX,
      color: 'text-status-red',
    }
  }
  if (
    kind === 'warning' ||
    event.eventType === 'provider_delay' ||
    event.toStatus === 'PENDING_APPROVAL' ||
    event.eventType === 'manual_status_override'
  ) {
    return {
      icon: CircleAlert,
      color: 'text-status-orange',
    }
  }
  return {
    icon: CircleCheck,
    color: 'text-status-green',
  }
}

// formatStatusLabel renders "Processing" from "PROCESSING", "Pending Approval" from "PENDING_APPROVAL".
function formatStatusLabel(s: string): string {
  if (!s) return ''
  return s
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

// badgeClassName maps a badge kind to a Tailwind class combo.
function badgeClassName(kind?: string): string {
  switch (kind) {
    case 'success':
      return 'bg-status-green text-white'
    case 'danger':
      return 'bg-status-red text-white'
    case 'warning':
      return 'bg-status-orange text-white'
    case 'neutral':
    default:
      return 'bg-muted text-foreground'
  }
}

function EventTimelineTab({ timelines }: { timelines: PayoutTimeline[] }) {
  const canViewTimeline = usePermission('payouts:timeline:read')

  const [expandedJson, setExpandedJson] = useState<{
    index: number
    kind: 'request' | 'response'
  } | null>(null)

  if (!canViewTimeline) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-secondary px-6 py-12 text-center">
        <AppIcon icon={Lock} size="lg" color="muted" />
        <p className="text-sm font-medium text-foreground">Admins only</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          The detailed payout timeline exposes provider request and response payloads — it is
          restricted to users with the &ldquo;payout_timeline_viewer&rdquo; role.
        </p>
      </div>
    )
  }

  if (timelines.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No timeline events available.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-xs text-muted-foreground">Logs</p>
      <div className="rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 py-8">
        <div className="flex flex-col gap-[2.875rem]">
          {timelines.map((event, i) => {
            const { icon: Icon, color } = iconForEvent(event)
            const title = deriveEventTitle(event)
            const showFromTo =
              event.eventType === 'status_change' &&
              event.fromStatus &&
              event.fromStatus !== event.toStatus
            const isRequestOpen = expandedJson?.index === i && expandedJson.kind === 'request'
            const isResponseOpen = expandedJson?.index === i && expandedJson.kind === 'response'

            return (
              <div key={i} className="flex gap-3.5">
                <div className="shrink-0">
                  <AppIcon icon={Icon} className={cn('size-6', color)} />
                </div>

                <div className="flex flex-1 flex-col gap-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground/80">{title}</p>
                      {event.badge && (
                        <span
                          className={`inline-flex h-6 items-center rounded-full px-3 text-xs ${badgeClassName(event.badge.kind)}`}
                        >
                          {event.badge.label}
                        </span>
                      )}
                      {showFromTo && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                          {formatStatusLabel(event.fromStatus!)}
                          <AppIcon icon={ArrowRight} size="sm" />
                          {formatStatusLabel(event.toStatus)}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-foreground/80">
                      {formatTimelineDate(event.createdAt)}
                    </span>
                  </div>

                  {event.remarks && (
                    <p className="text-xs leading-normal text-foreground/80">{event.remarks}</p>
                  )}

                  {(event.request != null || event.response != null) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {event.request != null && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedJson(isRequestOpen ? null : { index: i, kind: 'request' })
                          }
                          aria-expanded={isRequestOpen}
                          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent cursor-pointer"
                        >
                          <AppIcon icon={Code} size="sm" />
                          View Payload (JSON)
                          {isRequestOpen ? (
                            <AppIcon icon={ChevronUp} size="sm" />
                          ) : (
                            <AppIcon icon={ChevronDown} size="sm" />
                          )}
                        </button>
                      )}
                      {event.response != null && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedJson(isResponseOpen ? null : { index: i, kind: 'response' })
                          }
                          aria-expanded={isResponseOpen}
                          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent cursor-pointer"
                        >
                          <AppIcon icon={Code} size="sm" />
                          View Response (JSON)
                          {isResponseOpen ? (
                            <AppIcon icon={ChevronUp} size="sm" />
                          ) : (
                            <AppIcon icon={ChevronDown} size="sm" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {isRequestOpen && <InlineJsonBlock data={event.request} />}
                  {isResponseOpen && <InlineJsonBlock data={event.response} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function InlineJsonBlock({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false)
  const pretty = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }, [data])

  const handleCopy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(pretty).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mt-1 rounded-md border border-border bg-muted/40">
      <div className="flex items-center justify-end border-b border-border px-3 py-1.5">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground/80 hover:bg-accent cursor-pointer"
        >
          {copied ? <AppIcon icon={Check} size="sm" /> : <AppIcon icon={Copy} size="sm" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="max-h-[50vh] overflow-auto p-4">
        <pre className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
          {pretty}
        </pre>
      </div>
    </div>
  )
}

// ============================================================================
// Main Drawer
// ============================================================================

export function PayoutDetailDrawer({ payoutId, open, onOpenChange }: PayoutDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details')
  const [overrideOpen, setOverrideOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: payout, isLoading } = usePayout(payoutId)
  const { user } = useAuthStore()
  const isMerchant = user?.accountType === 'MERCHANT'
  const canStatusOverride = usePermission('payouts:status_override')

  // Sync detail status back into list cache so the table updates in real-time
  useEffect(() => {
    if (!payout || !open) return
    queryClient.setQueriesData<{ data?: { items?: Array<{ id: string; status: string }> } }>(
      { queryKey: payoutKeys.lists() },
      oldData => {
        if (!oldData?.data?.items) return oldData
        const needsUpdate = oldData.data.items.some(
          item => item.id === payout.id && item.status !== payout.status,
        )
        if (!needsUpdate) return oldData
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(item =>
              item.id === payout.id ? { ...item, status: payout.status } : item,
            ),
          },
        }
      },
    )
  }, [payout, open, queryClient])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[590px] sm:max-w-[590px] flex flex-col p-0 [&>button]:hidden"
      >
        {isLoading || !payout ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-[2.875rem] overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-3.5">
                <p className="text-xl font-medium text-foreground">Transaction {payout.code}</p>
                <p className="text-sm capitalize text-foreground/80">
                  Merchant : {payout.merchant.name}
                </p>
                <p className="text-sm capitalize text-foreground/80">
                  {formatShortDate(payout.createdAt)} , {formatShortTime(payout.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
              >
                <AppIcon icon={X} />
              </button>
            </div>

            {/* Tab Bar */}
            {!isMerchant && (
              <div className="flex h-15 items-center gap-2.5 rounded-md bg-secondary p-2 dark:bg-muted/50">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`h-11 flex-1 rounded-md text-center text-sm sm:text-base transition-colors cursor-pointer ${
                    activeTab === 'details'
                      ? 'bg-button-bg text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Payout Transaction Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`h-11 flex-1 rounded-md text-center text-sm sm:text-base transition-colors cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'bg-button-bg text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Event Timeline
                </button>
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'details' || isMerchant ? (
              <TransactionDetailsTab payout={payout} />
            ) : (
              <EventTimelineTab timelines={payout.timelines} />
            )}

            {/* Status Override */}
            {canStatusOverride && (
              <button
                type="button"
                onClick={() => setOverrideOpen(true)}
                className="w-full rounded-md bg-button-bg py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-button-bg/90 cursor-pointer"
              >
                Status Override
              </button>
            )}
          </div>
        )}

        {canStatusOverride && payout && (
          <StatusOverrideDialog
            open={overrideOpen}
            onOpenChange={setOverrideOpen}
            payoutId={payout.id}
            currentStatus={payout.status}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
