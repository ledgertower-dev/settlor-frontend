'use client'

import { DetailRow } from '@/components/shared/detail-row'
import { DetailSection } from '@/components/shared/detail-section'
import { StatusBadge } from '@/components/shared/status-badge'
import { Download, ExternalLink } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { formatINR, formatDateTime } from '@/lib/core/format'
import type { Deposit } from '../types'

interface DepositTransactionDetailsCardProps {
  tx: Deposit
}

export function DepositTransactionDetailsCard({ tx }: DepositTransactionDetailsCardProps) {
  const { time: createdTime, date: createdDate } = formatDateTime(tx.createdAt)
  const { time: updatedTime, date: updatedDate } = formatDateTime(tx.updatedAt)

  const handleDownload = async () => {
    try {
      const res = await fetch(tx.screenshotUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `screenshot-${tx.id}.${blob.type.split('/')[1] || 'png'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(tx.screenshotUrl, '_blank')
    }
  }

  return (
    <div className="flex flex-col gap-[2.875rem]">
      {/* Deposit Info */}
      <DetailSection title="Deposit Info">
        <DetailRow label="Merchant Name" value={tx.merchantName || '—'} />
        <DetailRow label="Merchant Code" value={tx.merchantCode || '—'} />
        <DetailRow label="Deposit ID">
          <p className="text-sm font-semibold text-foreground break-words">{tx.id}</p>
        </DetailRow>
        <DetailRow label="Reference (UTR)" value={tx.reference || '—'} />
        <DetailRow
          label="Amount"
          value={`${formatINR(tx.amount)}${tx.currency ? ` (${tx.currency})` : ''}`}
        />
        <DetailRow label="Mode" value={tx.mode} />
        <DetailRow label="From Bank Account" value={tx.fromBank?.bankAccountId ?? '—'} />
        <DetailRow label="Virtual Account" value={tx.virtualAccountId || '—'} />
        <DetailRow label="Status">
          <StatusBadge status={tx.status} />
        </DetailRow>
        {tx.screenshotUrl && (
          <DetailRow label="Screenshot">
            <div className="flex items-center gap-2">
              <a
                href={tx.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-foreground/20 bg-secondary px-2 py-1 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <AppIcon icon={ExternalLink} size="sm" />
                View
              </a>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-md border border-foreground/20 bg-secondary px-2 py-1 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <AppIcon icon={Download} size="sm" />
                Download
              </button>
            </div>
          </DetailRow>
        )}
        <DetailRow label="Created Date & Time" value={`${createdTime} ${createdDate}`} />
        <DetailRow label="Updated Date & Time" value={`${updatedTime} ${updatedDate}`} isLast />
      </DetailSection>
    </div>
  )
}
