'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthErrorAlert } from '@/features/auth'

import { kycService } from '../api/kyc.api'
import { kycSchema, type KycFormData } from '../schemas/kyc.schema'
import { getErrorMessage } from '@/lib/api/error-handler'
import { logger } from '@/lib/core/logger'
import { useDocumentUpload } from '../hooks/useDocumentUpload'
import { DocumentUploadRow } from './DocumentUploadRow'
import type { DocumentType, KycSubmitPayload } from '../types'

const inputClassName =
  'h-11 px-4 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg text-md font-medium text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/40 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6'

const labelClassName = 'text-sm font-bold text-auth-form-muted sm:text-base 2xl:text-lg'

export function KycForm() {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const kycToken = searchParams.get('token')

  const {
    docUploads,
    isAnyUploading,
    handleFileSelect,
    handleFileRemove,
    handleRetry,
    triggerFileInput,
    setFileInputRef,
  } = useDocumentUpload(kycToken)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
  })

  useEffect(() => {
    if (!kycToken) {
      router.push('/auth/register')
      return
    }

    kycService
      .getDocumentTypes()
      .then(res => {
        setDocumentTypes(res.documents)
      })
      .catch(err => {
        logger.error('Failed to fetch document types', { error: String(err) })
        setError('Failed to load required documents. Please try again.')
      })
      .finally(() => {
        setDocumentsLoading(false)
      })
  }, [router, kycToken])

  const onSubmit = async (data: KycFormData) => {
    if (!kycToken) return

    // Check all required documents are uploaded successfully
    const missingDocs = documentTypes.filter(
      doc => doc.required && docUploads[doc.docType]?.status !== 'done',
    )
    if (missingDocs.length > 0) {
      setError(`Please upload all required documents: ${missingDocs.map(d => d.label).join(', ')}`)
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const payload: KycSubmitPayload = {
        business_type: data.businessType,
        business_name: data.businessName,
        business_email: data.businessEmail,
        business_mobile: data.businessMobile,
        ...(data.website ? { website: data.website } : {}),
        company_pan: data.companyPan,
        documents: Object.entries(docUploads)
          .filter(([, state]) => state.status === 'done' && state.uploadId)
          .map(([docType, state]) => ({
            doc_type: docType,
            upload_id: state.uploadId!,
          })),
      }

      await kycService.submitKyc(kycToken, payload)
      router.push('/auth/confirmation')
    } catch (err) {
      setError(getErrorMessage(err))
      logger.error('KYC submission failed', { error: String(err) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 sm:gap-10 2xl:gap-[2.875rem]">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[2.25rem] lg:text-[2.5rem] 2xl:text-[3.25rem]">
          Business Details &amp; KYC
        </h1>
        <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
          Tell us about your business and upload the required documents for verification.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-8 sm:gap-10 2xl:gap-[2.875rem]"
      >
        {error && <AuthErrorAlert message={error} />}

        {/* Business Information */}
        <div className="flex flex-col gap-6">
          <h2 className="text-base font-medium leading-none text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-lg 2xl:text-lg">
            Business Information
          </h2>

          <div className="flex flex-col gap-4 sm:gap-[1.125rem]">
            {/* Row 1: Business Type + Business Email */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
              <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="businessType" className={labelClassName}>
                  Business Type<span className="-ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="businessType"
                  type="text"
                  placeholder="e.g. Private Limited"
                  className={inputClassName}
                  {...register('businessType')}
                  aria-invalid={errors.businessType ? 'true' : 'false'}
                />
                {errors.businessType && (
                  <p className="text-xs text-destructive">{errors.businessType.message}</p>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="businessEmail" className={labelClassName}>
                  Business Email<span className="-ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="accounts@business.com"
                  className={inputClassName}
                  {...register('businessEmail')}
                  aria-invalid={errors.businessEmail ? 'true' : 'false'}
                />
                {errors.businessEmail && (
                  <p className="text-xs text-destructive">{errors.businessEmail.message}</p>
                )}
              </div>
            </div>

            {/* Row 2: Business Name + Business Mobile */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
              <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="businessName" className={labelClassName}>
                  Business Name<span className="-ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Registered business name"
                  className={inputClassName}
                  {...register('businessName')}
                  aria-invalid={errors.businessName ? 'true' : 'false'}
                />
                {errors.businessName && (
                  <p className="text-xs text-destructive">{errors.businessName.message}</p>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="businessMobile" className={labelClassName}>
                  Business Mobile<span className="-ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="businessMobile"
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  onInput={e => {
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')
                  }}
                  className={inputClassName}
                  {...register('businessMobile')}
                  aria-invalid={errors.businessMobile ? 'true' : 'false'}
                />
                {errors.businessMobile && (
                  <p className="text-xs text-destructive">{errors.businessMobile.message}</p>
                )}
              </div>
            </div>

            {/* Row 3: Website + Company PAN */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
              <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="website" className={labelClassName}>
                  Website
                </Label>
                <Input
                  id="website"
                  type="text"
                  placeholder="https://business.com"
                  className={inputClassName}
                  {...register('website')}
                  aria-invalid={errors.website ? 'true' : 'false'}
                />
                {errors.website && (
                  <p className="text-xs text-destructive">{errors.website.message}</p>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="companyPan" className={labelClassName}>
                  Company PAN<span className="-ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="companyPan"
                  type="text"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  onInput={e => {
                    e.currentTarget.value = e.currentTarget.value.toUpperCase()
                  }}
                  className={inputClassName}
                  {...register('companyPan')}
                  aria-invalid={errors.companyPan ? 'true' : 'false'}
                />
                {errors.companyPan && (
                  <p className="text-xs text-destructive">{errors.companyPan.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3.5">
            <h2 className="text-base font-semibold leading-none text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-lg 2xl:text-lg">
              Required Documents
            </h2>
            <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
              Upload clear, legible copies. All documents are mandatory.
            </p>
          </div>

          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-auth-form-muted">Loading document requirements...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {documentTypes.map(doc => (
                <DocumentUploadRow
                  key={doc.docType}
                  docType={doc.docType}
                  label={doc.label}
                  upload={docUploads[doc.docType]}
                  onFileSelect={file => handleFileSelect(doc.docType, file)}
                  onFileRemove={() => handleFileRemove(doc.docType)}
                  onRetry={() => handleRetry(doc.docType)}
                  onBrowse={() => triggerFileInput(doc.docType)}
                  setFileInputRef={el => setFileInputRef(doc.docType, el)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant={null}
          disabled={isSubmitting || isAnyUploading}
          className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:text-base 2xl:text-xl"
        >
          {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          {!isSubmitting && (
            <AppIcon
              icon={ArrowRight}
              size="sm"
              stroke="bold"
              className="text-auth-cta-text transition-transform group-hover:translate-x-1"
            />
          )}
        </Button>
      </form>
    </div>
  )
}
