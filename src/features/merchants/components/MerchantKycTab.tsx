'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { InfoRow } from '@/components/shared/info-row'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/core/utils'
import { getErrorMessage } from '@/lib/api/error-handler'
import { usePermission } from '@/features/access/hooks/usePermission'
import { isAxiosError } from 'axios'
import type { KycDocument } from '../types/merchant-kyc.types'
import {
  useMerchantKyc,
  useReviewDocument,
  useFinalizeApprove,
  useRequestResubmission,
} from '../model/use-merchant-kyc'
import { useMerchantsUIStore } from '../model/merchants-ui-store'

interface MerchantKycTabProps {
  merchantId: string
  onRejectUser?: () => void
}

export function MerchantKycTab({ merchantId, onRejectUser }: MerchantKycTabProps) {
  const router = useRouter()
  const rolePath = useRolePath()
  const setTab = useMerchantsUIStore(s => s.setTab)
  const canUpdate = usePermission('merchants:update')
  const { data, isLoading, error } = useMerchantKyc(merchantId)
  const reviewDocument = useReviewDocument()
  const finalizeApprove = useFinalizeApprove()
  const requestResubmission = useRequestResubmission()

  const [approveTarget, setApproveTarget] = useState<KycDocument | null>(null)
  const [rejectTarget, setRejectTarget] = useState<KycDocument | null>(null)
  const [rejectRemarks, setRejectRemarks] = useState('')
  const [confirmAction, setConfirmAction] = useState<'finalize' | 'resubmit' | null>(null)

  // Handle 404 — no KYC submission yet
  const is404 = error && isAxiosError(error) && error.response?.status === 404

  if (isLoading) {
    return <KycTabSkeleton />
  }

  if (is404 || (!data && !isLoading && !error)) {
    return (
      <div className="flex items-center justify-center rounded-[10px] border border-transparent dark:border-input bg-card p-12 shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted-foreground">No KYC application submitted yet</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-[10px] border border-transparent dark:border-input bg-card p-12 shadow-[var(--shadow-card)]">
        <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      </div>
    )
  }

  if (!data) return null

  const { profile, documents } = data
  const isUnderReview = profile.kycStatus === 'UNDER_REVIEW'
  const allApproved = documents.length > 0 && documents.every(d => d.status === 'APPROVED')
  const hasRejected = documents.some(d => d.status === 'REJECTED')

  const handleApproveDoc = () => {
    if (!approveTarget) return
    reviewDocument.mutate(
      { merchantId, docId: approveTarget.id, payload: { action: 'approve' } },
      {
        onSuccess: () => {
          toast.success(`${approveTarget.label} approved`)
          setApproveTarget(null)
        },
        onError: err => {
          toast.error(getErrorMessage(err))
          setApproveTarget(null)
        },
      },
    )
  }

  const handleRejectDoc = () => {
    if (!rejectTarget || !rejectRemarks.trim()) return
    reviewDocument.mutate(
      {
        merchantId,
        docId: rejectTarget.id,
        payload: { action: 'reject', remarks: rejectRemarks.trim() },
      },
      {
        onSuccess: () => {
          toast.success(`${rejectTarget.label} rejected`)
          setRejectTarget(null)
          setRejectRemarks('')
        },
        onError: err => toast.error(getErrorMessage(err)),
      },
    )
  }

  const handleFinalize = () => {
    finalizeApprove.mutate(
      { merchantId },
      {
        onSuccess: () => {
          toast.success('KYC finalized and merchant approved')
          setConfirmAction(null)
          setTab('approved')
          router.push(rolePath('/merchants?tab=approved'))
        },
        onError: err => {
          toast.error(getErrorMessage(err))
          setConfirmAction(null)
        },
      },
    )
  }

  const handleResubmission = () => {
    requestResubmission.mutate(
      { merchantId },
      {
        onSuccess: () => {
          toast.success('Resubmission requested')
          setConfirmAction(null)
          setTab('pending')
          router.push(rolePath('/merchants?tab=pending'))
        },
        onError: err => {
          toast.error(getErrorMessage(err))
          setConfirmAction(null)
        },
      },
    )
  }

  return (
    <div className="space-y-3.5">
      {/* Card 1 — Business Information */}
      <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Business Information</h3>
          {profile.submittedAt && (
            <span className="text-sm font-medium text-[#C1C1C1]">
              Submitted on{' '}
              {new Date(profile.submittedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <InfoRow label="Business Type" value={profile.businessType} hasBorder />
          <InfoRow label="Business Name" value={profile.businessName} hasBorder />
          <InfoRow label="Business Email" value={profile.businessEmail} hasBorder />
          <InfoRow label="Business Mobile" value={profile.businessMobile} hasBorder />
          <InfoRow label="Website" value={profile.website ?? '-'} hasBorder />
          <InfoRow label="Company PAN" value={profile.companyPan} />
        </div>
      </div>

      {/* Card 2 — Business Details & KYC */}
      <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Business Details & KYC</h3>
          {profile.submittedAt && (
            <span className="text-sm font-medium text-[#C1C1C1]">
              Submitted on{' '}
              {new Date(profile.submittedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3.5">
          {documents.map(doc => (
            <div key={doc.id} className="flex flex-col gap-2">
              <div className="flex h-[3.875rem] items-center justify-between rounded-[10px] bg-table-header-bg px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-sm font-medium capitalize text-muted-foreground">
                    {doc.label}
                  </span>
                  {doc.status !== 'PENDING' && profile.kycStatus !== 'APPROVED' && (
                    <StatusBadge status={doc.status} />
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {doc.viewUrl && (
                    <a
                      href={doc.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-[2.375rem] w-[8.75rem] items-center justify-center rounded-md bg-button-bg text-sm capitalize text-primary-foreground transition-colors hover:bg-button-bg/90"
                    >
                      View
                    </a>
                  )}

                  {isUnderReview && canUpdate && (
                    <>
                      {(doc.status === 'PENDING' || doc.status === 'APPROVED') && (
                        <button
                          onClick={() => setRejectTarget(doc)}
                          disabled={reviewDocument.isPending}
                          className="flex h-[2.375rem] w-[8.75rem] items-center justify-center rounded-md border border-foreground/20 text-sm text-status-red transition-colors hover:bg-status-red/10 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      {(doc.status === 'PENDING' || doc.status === 'REJECTED') && (
                        <button
                          onClick={() => setApproveTarget(doc)}
                          disabled={reviewDocument.isPending}
                          className="flex h-[2.375rem] w-[8.75rem] items-center justify-center rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {doc.status === 'REJECTED' && doc.rejectionRemarks && (
                <div className="flex items-start gap-2 rounded border border-status-red/20 bg-status-red/5 px-3 py-2">
                  <span className="shrink-0 text-xs leading-[1.125rem] font-semibold text-status-red">
                    Reason:
                  </span>
                  <span className="text-xs leading-[1.125rem] text-status-red/80">
                    {doc.rejectionRemarks}
                  </span>
                </div>
              )}
            </div>
          ))}

          {documents.length === 0 && (
            <p className="rounded-[10px] bg-table-header-bg py-8 text-center text-sm text-muted-foreground">
              No documents found
            </p>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {canUpdate && (isUnderReview || onRejectUser) && (
        <div className="flex flex-wrap items-center justify-end gap-3.5">
          {onRejectUser && (
            <button
              onClick={onRejectUser}
              className="h-[2.625rem] min-w-[8.75rem] rounded-md bg-status-red px-4 text-sm text-white transition-colors hover:bg-status-red/90"
            >
              Reject user
            </button>
          )}
          {isUnderReview && (
            <button
              onClick={() => setConfirmAction('resubmit')}
              disabled={!hasRejected || requestResubmission.isPending}
              className="h-[2.625rem] min-w-[8.75rem] rounded-md border border-button-bg px-4 text-sm text-button-bg transition-colors hover:bg-button-bg/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Request Resubmission
            </button>
          )}
          {isUnderReview && (
            <button
              onClick={() => setConfirmAction('finalize')}
              disabled={!allApproved || finalizeApprove.isPending}
              className="h-[2.625rem] min-w-[8.75rem] rounded-md bg-button-bg px-4 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Finalize &amp; Approve
            </button>
          )}
        </div>
      )}

      {/* Approve Document Confirmation */}
      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={open => {
          if (!open) setApproveTarget(null)
        }}
        title="Approve Document"
        description={`Are you sure you want to approve "${approveTarget?.label}"?`}
        confirmLabel="Approve"
        pendingLabel="Approving..."
        variant="confirm"
        isPending={reviewDocument.isPending}
        onConfirm={handleApproveDoc}
      />

      {/* Reject Document Confirmation */}
      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={open => {
          if (!open) {
            setRejectTarget(null)
            setRejectRemarks('')
          }
        }}
        title="Reject Document"
        description={`Provide a reason for rejecting "${rejectTarget?.label}". The merchant will see these remarks.`}
        confirmLabel="Reject"
        pendingLabel="Rejecting..."
        variant="danger"
        isPending={reviewDocument.isPending}
        confirmDisabled={!rejectRemarks.trim()}
        onConfirm={handleRejectDoc}
      >
        <Textarea
          placeholder="Rejection remarks (required)"
          value={rejectRemarks}
          onChange={e => setRejectRemarks(e.target.value)}
          className="min-h-[5rem] resize-none border-foreground/40 bg-secondary text-sm"
        />
      </ConfirmDialog>

      {/* Finalize Confirmation */}
      <ConfirmDialog
        open={confirmAction === 'finalize'}
        onOpenChange={() => setConfirmAction(null)}
        title="Finalize KYC Approval"
        description="All documents have been approved. This will finalize the KYC review and activate the merchant. This action cannot be undone."
        confirmLabel="Finalize & Approve"
        pendingLabel="Processing..."
        variant="confirm"
        isPending={finalizeApprove.isPending}
        onConfirm={handleFinalize}
      />

      {/* Request Resubmission Confirmation */}
      <ConfirmDialog
        open={confirmAction === 'resubmit'}
        onOpenChange={() => setConfirmAction(null)}
        title="Request Resubmission"
        description='The merchant will be notified to resubmit the rejected documents. Their KYC status will change to "Changes Requested".'
        confirmLabel="Request Resubmission"
        pendingLabel="Processing..."
        variant="confirm"
        isPending={requestResubmission.isPending}
        onConfirm={handleResubmission}
      />
    </div>
  )
}

function KycTabSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-3.5 flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex flex-col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center px-6 py-3.5',
                i < 5 && 'border-b border-table-row-border',
              )}
            >
              <Skeleton className="h-4 w-[12.5rem]" />
              <Skeleton className="ml-4 h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-3.5 flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex flex-col gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex h-[3.875rem] items-center justify-between rounded-[10px] bg-table-header-bg px-6"
            >
              <Skeleton className="h-4 w-[13.75rem]" />
              <Skeleton className="h-[2.375rem] w-[8.75rem] rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
