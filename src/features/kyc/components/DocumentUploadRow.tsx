'use client'

import { CircleCheck, Upload, X, type LucideIcon } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/core/utils'
import type { DocUploadState } from '../types'

interface DocumentUploadRowProps {
  docType: string
  label: string
  upload: DocUploadState | undefined
  /** Read-only status label shown instead of upload controls (e.g. "Approved", "Pending review") */
  readOnlyStatus?: { label: string; icon: LucideIcon; colorClass: string }
  /** Rejection remarks shown below the label */
  rejectionRemarks?: string
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  onRetry: () => void
  onBrowse: () => void
  setFileInputRef: (el: HTMLInputElement | null) => void
}

export function DocumentUploadRow({
  label,
  upload,
  readOnlyStatus,
  rejectionRemarks,
  onFileSelect,
  onFileRemove,
  onRetry,
  onBrowse,
  setFileInputRef,
}: DocumentUploadRowProps) {
  const isInProgress =
    upload?.status === 'presigning' ||
    upload?.status === 'uploading' ||
    upload?.status === 'confirming'

  const showUploadControls = !readOnlyStatus

  return (
    <div className="flex flex-col gap-2 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg px-4 py-3 shadow-[var(--auth-input-shadow)] sm:px-6 sm:py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium text-auth-form-text/60 sm:text-base 2xl:text-lg">
            {label}
          </span>
          {rejectionRemarks && (
            <div className="flex items-start gap-2 rounded border border-status-red/20 bg-status-red/5 px-2.5 py-1.5 mt-0.5">
              <span className="shrink-0 text-xs leading-[1.125rem] font-semibold text-status-red">
                Reason:
              </span>
              <span className="text-xs leading-[1.125rem] text-status-red/80">
                {rejectionRemarks}
              </span>
            </div>
          )}
        </div>

        {/* Read-only status (approved / pending) */}
        {readOnlyStatus && (
          <div className="flex items-center gap-1.5 shrink-0">
            {(() => {
              const StatusIcon = readOnlyStatus.icon
              return (
                <AppIcon icon={StatusIcon} className={cn('size-4', readOnlyStatus.colorClass)} />
              )
            })()}
            <span className={`text-xs font-medium sm:text-sm ${readOnlyStatus.colorClass}`}>
              {readOnlyStatus.label}
            </span>
          </div>
        )}

        {/* Upload controls */}
        {showUploadControls && (
          <>
            {/* Hidden file input */}
            <input
              type="file"
              ref={setFileInputRef}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) onFileSelect(file)
              }}
            />

            {/* idle: Upload button */}
            {!upload && (
              <button
                type="button"
                onClick={onBrowse}
                className="flex shrink-0 items-center gap-1.5 rounded-[0.375rem] border border-auth-primary h-8 px-2 py-1.5"
              >
                <AppIcon icon={Upload} className="text-auth-primary" />
                <span className="text-sm font-bold text-auth-primary sm:text-base">Upload</span>
              </button>
            )}

            {/* in-progress: filename + percentage */}
            {isInProgress && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="max-w-[120px] truncate text-xs font-medium text-auth-form-text sm:max-w-[160px] sm:text-sm">
                  {upload.file.name}
                </span>
                <span className="text-xs font-medium text-auth-form-muted">{upload.progress}%</span>
              </div>
            )}

            {/* done: filename + green check + remove */}
            {upload?.status === 'done' && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="max-w-[120px] truncate text-xs font-medium text-auth-form-text sm:max-w-[160px] sm:text-sm">
                  {upload.file.name}
                </span>
                <AppIcon icon={CircleCheck} color="green" size="sm" />
                <button
                  type="button"
                  onClick={onFileRemove}
                  className="text-destructive transition-opacity hover:opacity-70"
                >
                  <AppIcon icon={X} size="sm" />
                </button>
              </div>
            )}

            {/* error: filename + Failed + Retry + remove */}
            {upload?.status === 'error' && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="max-w-[100px] truncate text-xs font-medium text-auth-form-text sm:max-w-[120px] sm:text-sm">
                  {upload.file.name}
                </span>
                <span className="text-xs font-medium text-destructive">Failed</span>
                <button
                  type="button"
                  onClick={onRetry}
                  className="text-xs font-bold text-auth-primary hover:underline"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={onFileRemove}
                  className="text-destructive transition-opacity hover:opacity-70"
                >
                  <AppIcon icon={X} size="sm" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress bar for in-progress uploads */}
      {isInProgress && <Progress value={upload.progress} className="h-1.5" />}
    </div>
  )
}
