'use client'

import { useRef, useState } from 'react'
import { Upload, Download, FileText, X, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react'

import { cn } from '@/lib/core/utils'
import type { BulkErrorGroup } from './helpers'

const ACCEPT = '.csv,.xlsx'

const outlineBtn =
  'flex h-11 items-center justify-center rounded-md border border-foreground/40 px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent'
const primaryBtn =
  'flex h-11 items-center justify-center rounded-md bg-button-bg px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50'

interface BulkSelectStepProps {
  file: File | null
  validationErrors: string[]
  mandatoryColumns: string
  templatePending: boolean
  validatePending: boolean
  onFileSelected: (file: File) => void
  onRemoveFile: () => void
  onDownloadTemplate: () => void
  onValidate: () => void
  onCancel: () => void
}

/** Step 1 — drop zone / file card, template link, mandatory hint and error banner. */
export function BulkSelectStep({
  file,
  validationErrors,
  mandatoryColumns,
  templatePending,
  validatePending,
  onFileSelected,
  onRemoveFile,
  onDownloadTemplate,
  onValidate,
  onCancel,
}: BulkSelectStepProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const hasErrors = validationErrors.length > 0

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same / re-saved file
    if (picked) onFileSelected(picked)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const picked = e.dataTransfer.files?.[0]
    if (picked) onFileSelected(picked)
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {hasErrors && (
        <div className="rounded-md border-[0.4px] border-status-red/50 bg-status-red/5 p-5">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-5 shrink-0 text-status-red" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-status-red">
              We found problems in your file
            </span>
          </div>
          <p className="mt-1.5 text-xs text-status-red/80">
            Fix the rows below and re-upload, or download the latest template.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-xs text-status-red/90 marker:text-status-red">
            {validationErrors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {file ? (
        <div className="flex items-center gap-3 rounded-md border-[0.4px] border-foreground/25 px-5 py-4">
          <FileText className="size-6 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <span className="min-w-0 flex-1 truncate text-base text-foreground">{file.name}</span>
          {!hasErrors && (
            <button
              type="button"
              onClick={onRemoveFile}
              aria-label="Remove file"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center transition-colors',
            dragging
              ? 'border-ring bg-accent/40'
              : 'border-foreground/25 hover:border-foreground/40',
          )}
        >
          <span className="flex size-16 items-center justify-center rounded-full border border-foreground/20">
            <Upload className="size-6 text-status-teal" strokeWidth={1.5} />
          </span>
          <span className="text-base font-semibold text-foreground">
            Drop your filled template here, or click to browse
          </span>
          <span className="text-sm text-muted-foreground">
            Use the pre-configured template — required columns must match exactly.
          </span>
          <span className="text-xs text-muted-foreground">
            Accepted: .csv, .xlsx (CSV recommended)
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onInputChange}
      />

      {!hasErrors && (
        <>
          <button
            type="button"
            onClick={onDownloadTemplate}
            disabled={templatePending}
            className="mx-auto flex items-center gap-2 text-sm font-medium text-status-teal transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <Download className="size-4" strokeWidth={1.5} />
            {templatePending ? 'Downloading…' : 'Need the template? Download it'}
          </button>

          <div className="rounded-md bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Mandatory: </span>
            {mandatoryColumns}
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        {hasErrors && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 text-sm font-semibold text-foreground transition-opacity hover:opacity-70"
          >
            Choose another file
          </button>
        )}
        <button type="button" className={cn(outlineBtn, 'flex-1')} onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={cn(primaryBtn, 'flex-1')}
          onClick={onValidate}
          disabled={!file || validatePending || hasErrors}
        >
          {hasErrors ? 'Confirm Upload' : validatePending ? 'Validating…' : 'Validate & Preview'}
        </button>
      </div>
    </div>
  )
}

/** Step 3 — spinner with progress, or an error state if status polling fails. */
export function BulkProcessingStep({
  isError,
  progressText,
  errorMessage,
  onClose,
}: {
  isError: boolean
  progressText: string
  errorMessage: string
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      {isError ? (
        <>
          <AlertTriangle className="size-10 text-status-red" strokeWidth={1.5} />
          <span className="text-sm text-muted-foreground">{errorMessage}</span>
          <button type="button" className={cn(primaryBtn, 'flex-none')} onClick={onClose}>
            Close
          </button>
        </>
      ) : (
        <>
          <Loader2 className="size-10 animate-spin text-status-teal" strokeWidth={1.5} />
          <span className="text-sm text-muted-foreground">{progressText}</span>
        </>
      )}
    </div>
  )
}

/** Review-step grouped validation errors banner. */
export function BulkReviewErrors({
  groups,
  errorRowCount,
  totalRows,
}: {
  groups: BulkErrorGroup[]
  errorRowCount: number
  totalRows: number
}) {
  if (groups.length === 0) return null
  return (
    <div className="flex flex-col gap-3 rounded-md border-[0.4px] border-status-red/50 bg-status-red/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0 text-status-red" strokeWidth={1.5} />
        <span className="text-sm font-medium text-status-red">
          {errorRowCount > 0
            ? `${errorRowCount} of ${totalRows} rows need fixing`
            : 'This file can’t be processed'}{' '}
          — correct the file and re-upload.
        </span>
      </div>
      <ul className="flex max-h-36 flex-col gap-1.5 overflow-y-auto">
        {groups.slice(0, 8).map(g => (
          <li key={g.message} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-foreground">{g.message}</span>
            {g.rowLevel && (
              <span className="shrink-0 rounded-full bg-status-red/10 px-2 py-0.5 font-medium text-status-red">
                {g.count} {g.count === 1 ? 'row' : 'rows'}
              </span>
            )}
          </li>
        ))}
        {groups.length > 8 && (
          <li className="text-xs text-muted-foreground">+{groups.length - 8} more issue types</li>
        )}
      </ul>
    </div>
  )
}
