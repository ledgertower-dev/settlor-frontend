'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CircleCheck, Clock } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { AuthErrorAlert } from '@/features/auth'
import { kycService } from '../api/kyc.api'
import { getErrorMessage } from '@/lib/api/error-handler'
import { logger } from '@/lib/core/logger'
import { useDocumentUpload } from '../hooks/useDocumentUpload'
import { DocumentUploadRow } from './DocumentUploadRow'
import type { ResubmitApplicationResponse, ResubmitDocument } from '../types'

const labelClassName = 'text-sm font-bold text-auth-form-muted sm:text-base 2xl:text-lg'

type PageState = 'loading' | 'error' | 'no-resubmission' | 'ready'

export function KycResubmitForm() {
  const [pageState, setPageState] = useState<PageState>('loading')
  const [pageError, setPageError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [application, setApplication] = useState<ResubmitApplicationResponse | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const {
    docUploads,
    isAnyUploading,
    handleFileSelect,
    handleFileRemove,
    handleRetry,
    triggerFileInput,
    setFileInputRef,
  } = useDocumentUpload(token)

  useEffect(() => {
    if (!token) {
      setPageError('This link has expired or is invalid. Please contact support.')
      setPageState('error')
      return
    }

    kycService
      .getResubmitApplication(token)
      .then(res => {
        const hasRejected = res.documents.some(d => d.status === 'REJECTED')
        if (!hasRejected) {
          setPageState('no-resubmission')
          return
        }
        setApplication(res)
        setPageState('ready')
      })
      .catch(err => {
        logger.error('Failed to load resubmit application', { error: String(err) })
        const code = (err as Error & { code?: string }).code
        if (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED') {
          setPageError('This link has expired or is invalid. Please contact support.')
        } else {
          setPageError(getErrorMessage(err))
        }
        setPageState('error')
      })
  }, [token])

  const rejectedDocs = application?.documents.filter(d => d.status === 'REJECTED') ?? []
  const uploadedRejectedDocs = rejectedDocs.filter(d => docUploads[d.docType]?.status === 'done')
  const allRejectedUploaded =
    rejectedDocs.length > 0 && uploadedRejectedDocs.length === rejectedDocs.length

  const handleSubmit = async () => {
    if (!token || !application) return

    const docsToSubmit = Object.entries(docUploads)
      .filter(([, state]) => state.status === 'done' && state.uploadId)
      .map(([docType, state]) => ({
        doc_type: docType,
        upload_id: state.uploadId!,
      }))

    if (docsToSubmit.length === 0) return

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await kycService.resubmitDocuments(token, docsToSubmit)
      router.push('/auth/confirmation')
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      logger.error('Resubmit failed', { error: String(err) })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="flex flex-col gap-8 sm:gap-10 2xl:gap-[2.875rem]">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[2.25rem] lg:text-[2.5rem] 2xl:text-[3.25rem]">
            Resubmit Documents
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-auth-form-muted">Loading your application...</p>
        </div>
      </div>
    )
  }

  // Error state (invalid/expired token)
  if (pageState === 'error') {
    return (
      <div className="flex flex-col gap-8 sm:gap-10 2xl:gap-[2.875rem]">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[2.25rem] lg:text-[2.5rem] 2xl:text-[3.25rem]">
            Resubmit Documents
          </h1>
        </div>
        <AuthErrorAlert message={pageError ?? 'An unexpected error occurred.'} />
      </div>
    )
  }

  // No resubmission needed
  if (pageState === 'no-resubmission') {
    return (
      <div className="flex flex-col gap-8 sm:gap-10 2xl:gap-[2.875rem]">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[2.25rem] lg:text-[2.5rem] 2xl:text-[3.25rem]">
            Resubmit Documents
          </h1>
        </div>
        <div className="flex items-center gap-3 rounded-[0.375rem] border border-status-green/30 bg-status-green/5 px-4 py-3">
          <AppIcon icon={CircleCheck} color="green" />
          <p className="text-sm font-medium text-auth-form-text">
            No documents require resubmission.
          </p>
        </div>
      </div>
    )
  }

  // Ready — show the resubmit form
  const profile = application!.profile
  const documents = application!.documents

  return (
    <div className="flex flex-col gap-8 sm:gap-10 2xl:gap-[2.875rem]">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[2.25rem] lg:text-[2.5rem] 2xl:text-[3.25rem]">
          Resubmit Documents
        </h1>
        <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
          Please re-upload the documents that were flagged for revision.
        </p>
      </div>

      {submitError && <AuthErrorAlert message={submitError} />}

      {/* Business Information (read-only) */}
      <div className="flex flex-col gap-6">
        <h2 className="text-base font-medium leading-none text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-lg 2xl:text-lg">
          Business Information
        </h2>

        <div className="flex flex-col gap-4 sm:gap-[1.125rem]">
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
            <ReadOnlyField label="Business Type" value={profile.businessType} />
            <ReadOnlyField label="Business Email" value={profile.businessEmail} />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
            <ReadOnlyField label="Business Name" value={profile.businessName} />
            <ReadOnlyField label="Business Mobile" value={profile.businessMobile} />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
            <ReadOnlyField label="Website" value={profile.website || '-'} />
            <ReadOnlyField label="Company PAN" value={profile.companyPan} />
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3.5">
          <h2 className="text-base font-semibold leading-none text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-lg 2xl:text-lg">
            Documents Requiring Resubmission
          </h2>
          <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
            Re-upload documents marked as rejected. Approved and pending documents cannot be
            changed.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {documents.map(doc => (
            <DocumentUploadRow
              key={doc.id}
              docType={doc.docType}
              label={doc.label}
              upload={docUploads[doc.docType]}
              readOnlyStatus={getReadOnlyStatus(doc)}
              rejectionRemarks={doc.status === 'REJECTED' ? doc.rejectionRemarks : undefined}
              onFileSelect={file => handleFileSelect(doc.docType, file)}
              onFileRemove={() => handleFileRemove(doc.docType)}
              onRetry={() => handleRetry(doc.docType)}
              onBrowse={() => triggerFileInput(doc.docType)}
              setFileInputRef={el => setFileInputRef(doc.docType, el)}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="button"
        variant={null}
        disabled={isSubmitting || isAnyUploading || !allRejectedUploaded}
        onClick={handleSubmit}
        className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:text-base 2xl:text-xl"
      >
        {isSubmitting ? 'Resubmitting...' : 'Resubmit Documents'}
        {!isSubmitting && (
          <AppIcon
            icon={ArrowRight}
            size="sm"
            stroke="bold"
            className="text-auth-cta-text transition-transform group-hover:translate-x-1"
          />
        )}
      </Button>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
      <span className={labelClassName}>{label}</span>
      <p className="h-11 flex items-center px-4 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg text-md font-medium text-auth-form-text/70 sm:h-[3.25rem] sm:px-6">
        {value}
      </p>
    </div>
  )
}

function getReadOnlyStatus(doc: ResubmitDocument) {
  if (doc.status === 'APPROVED') {
    return { label: 'Approved', icon: CircleCheck, colorClass: 'text-status-green' }
  }
  if (doc.status !== 'REJECTED') {
    return { label: 'Pending review', icon: Clock, colorClass: 'text-auth-form-muted' }
  }
  return undefined
}
