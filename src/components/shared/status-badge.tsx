import { cn } from '@/lib/core/utils'

const STATUS_STYLES: Record<
  string,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  INITIATED: {
    label: 'Initiated',
    dotColor: 'bg-status-teal',
    bgColor: 'bg-status-teal/15',
    textColor: 'text-status-teal',
  },
  PROCESSING: {
    label: 'Processing',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  SUCCESS: {
    label: 'Success',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  FAILED: {
    label: 'Failed',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
  REVERSED: {
    label: 'Reversed',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
  EXPIRED: {
    label: 'Expired',
    dotColor: 'bg-status-dark',
    bgColor: 'bg-status-dark/10',
    textColor: 'text-status-dark',
  },
  ACTIVE: {
    label: 'Active',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  INACTIVE: {
    label: 'Inactive',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
  APPROVED: {
    label: 'Approved',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  PENDING: {
    label: 'Pending',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  ARCHIVED: {
    label: 'Archived',
    dotColor: 'bg-status-dark',
    bgColor: 'bg-status-dark/10',
    textColor: 'text-status-dark',
  },
  REJECTED: {
    label: 'Rejected',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
  REVERTED: {
    label: 'Reverted',
    dotColor: 'bg-status-dark',
    bgColor: 'bg-status-dark/10',
    textColor: 'text-status-dark',
  },
  COMPLETED: {
    label: 'Completed',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  READY: {
    label: 'Ready',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  UPCOMING: {
    label: 'Upcoming',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  PAYOUT_REJECTED: {
    label: 'Payout Rejected',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
  DEPOSIT_APPROVED: {
    label: 'Deposit Approved',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  ENABLED: {
    label: 'Enabled',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  DISABLED: {
    label: 'Disabled',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  PAUSED: {
    label: 'Paused',
    dotColor: 'bg-status-orange',
    bgColor: 'bg-status-orange/15',
    textColor: 'text-status-orange',
  },
  CANCELLED: {
    label: 'Cancelled',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
  DRAFT: {
    label: 'Draft',
    dotColor: 'bg-status-dark',
    bgColor: 'bg-status-dark/10',
    textColor: 'text-status-dark',
  },
  BANK: {
    label: 'Bank',
    dotColor: 'bg-status-teal',
    bgColor: 'bg-status-teal/15',
    textColor: 'text-status-teal',
  },
  PSP: {
    label: 'PSP',
    dotColor: 'bg-status-teal',
    bgColor: 'bg-status-teal/15',
    textColor: 'text-status-teal',
  },
  RECURRING: {
    label: 'Recurring',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green/10',
    textColor: 'text-status-green',
  },
  ONE_TIME: {
    label: 'One time',
    dotColor: 'bg-muted-foreground',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
  },
  FREE: {
    label: 'Free',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  IN_USE: {
    label: 'In Use',
    dotColor: 'bg-status-dark',
    bgColor: 'bg-status-dark/10',
    textColor: 'text-status-dark',
  },
  CREDIT: {
    label: 'Credit',
    dotColor: 'bg-status-green',
    bgColor: 'bg-status-green-bg',
    textColor: 'text-status-green',
  },
  DEBIT: {
    label: 'Debit',
    dotColor: 'bg-status-red',
    bgColor: 'bg-status-red-bg',
    textColor: 'text-status-red',
  },
}

const UNKNOWN_STYLE = {
  label: '',
  dotColor: 'bg-muted-foreground',
  bgColor: 'bg-muted-foreground/10',
  textColor: 'text-muted-foreground',
}

interface StatusBadgeProps {
  status: string
  className?: string
  variant?: 'default' | 'plain' | 'pill'
}

export function StatusBadge({ status, className, variant = 'default' }: StatusBadgeProps) {
  if (!status) return null
  const known = STATUS_STYLES[status]
  const s = known ?? { ...UNKNOWN_STYLE, label: status.charAt(0) + status.slice(1).toLowerCase() }

  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex h-5 items-center rounded-full px-3.5 text-xs',
          s.bgColor,
          s.textColor,
          className,
        )}
      >
        {s.label}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex h-7 min-w-[110px] items-center justify-center rounded-lg px-3',
        variant === 'default' ? 'gap-2' : '',
        s.bgColor,
        className,
      )}
    >
      {variant === 'default' && (
        <span className={cn('size-2 shrink-0 rounded-full', s.dotColor)} aria-hidden />
      )}
      <span className={cn('truncate text-sm capitalize', s.textColor)}>{s.label}</span>
    </div>
  )
}
