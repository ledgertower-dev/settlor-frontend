'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, CheckCircle2, AlertTriangle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'
import { getErrorMessage } from '@/lib/api/error-handler'
import { formatINR } from '@/lib/core/format'
import { checkBulkColumns, bulkFileError } from '@/lib/core/csv'
import {
  BulkSelectStep,
  BulkProcessingStep,
  BulkReviewErrors,
  RowsTable,
  Stat,
  StatusDot,
  batchTone,
  rowStatusTone,
  errorRowSet,
  groupErrors,
  rowErrorMap,
  fileLevelErrors,
  bulkColumnMessages,
} from '@/components/shared/bulk-upload'

import {
  useValidateBulk,
  useUploadBulk,
  useBulkBatch,
  useDownloadBulkTemplate,
  useDownloadBulkResult,
} from '../model/use-bulk-payouts'
import { isBulkTerminal, type BulkValidateResponse } from '../types/bulk'

type Step = 'select' | 'review' | 'processing' | 'done'

const cancelBtn =
  'flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-foreground/40 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50'
const submitBtn =
  'flex h-11 flex-1 items-center justify-center rounded-md bg-button-bg text-sm font-semibold text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50'

// "Wallet ID" / "Wallet Code" are interchangeable — either one satisfies the column.
const MANDATORY_FIELDS: (string | string[])[] = [
  'Payment Mode',
  ['Wallet ID', 'Wallet Code'],
  'Amount',
  'Beneficiary Name',
  'Beneficiary Account Number',
  'Beneficiary IFSC',
  'Bank Name',
  'Remarks',
]
const OPTIONAL_FIELDS = ['Beneficiary Address', 'Reference ID']
const MANDATORY_COLUMNS = MANDATORY_FIELDS.map(f => (Array.isArray(f) ? f.join(' / ') : f)).join(
  ' · ',
)

const TITLES: Record<Step, string> = {
  select: 'Bulk Payout Upload',
  review: 'Review payouts',
  processing: 'Processing payouts',
  done: 'Bulk payout result',
}

const DESCRIPTIONS: Record<Step, string> = {
  select: 'Upload a filled template to initiate multiple payouts at once.',
  review: 'Review the parsed rows before confirming.',
  processing: 'Your payouts are being processed.',
  done: 'Processing complete.',
}

interface BulkUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkUploadModal({ open, onOpenChange }: BulkUploadModalProps) {
  const [step, setStep] = useState<Step>('select')
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState<BulkValidateResponse | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const templateMut = useDownloadBulkTemplate()
  const validateMut = useValidateBulk()
  const uploadMut = useUploadBulk()
  const resultMut = useDownloadBulkResult()
  const batchQuery = useBulkBatch(batchId, step === 'processing' || step === 'done')
  const batch = batchQuery.data ?? null

  const effectiveStep: Step = step === 'processing' && isBulkTerminal(batch?.status) ? 'done' : step
  const busy = validateMut.isPending || uploadMut.isPending

  const close = () => {
    if (busy) return
    onOpenChange(false)
    setTimeout(() => {
      setStep('select')
      setFile(null)
      setReport(null)
      setBatchId(null)
      setValidationErrors([])
    }, 200)
  }

  const onFileSelected = (picked: File) => {
    setFile(picked)
    setReport(null)
    const basics = bulkFileError(picked)
    setValidationErrors(basics ? [basics] : [])
  }

  const removeFile = () => {
    setFile(null)
    setReport(null)
    setValidationErrors([])
  }

  const handleTemplate = async () => {
    try {
      await templateMut.mutateAsync()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleValidate = async () => {
    if (!file) return
    setValidationErrors([])
    // Fail fast on the client: unrecognised/missing columns or empty values (CSV only).
    const check = await checkBulkColumns(file, MANDATORY_FIELDS, OPTIONAL_FIELDS)
    if (check) {
      const messages = bulkColumnMessages(check)
      if (messages.length > 0) {
        setValidationErrors(messages)
        return
      }
    }
    try {
      const r = await validateMut.mutateAsync(file)
      setReport(r)
      setStep('review')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const canConfirm =
    report?.valid === true && !report.duplicate && report.balance?.sufficient !== false

  const handleConfirm = async () => {
    if (!file || !canConfirm) return
    try {
      const { batch: created, async } = await uploadMut.mutateAsync({
        file,
        idempotencyKey: crypto.randomUUID(),
      })
      setBatchId(created.batch_id)
      setStep(async ? 'processing' : 'done')
    } catch (err) {
      toast.error(getErrorMessage(err))
      setStep('select')
      setReport(null)
    }
  }

  const handleResult = async () => {
    if (!batchId) return
    try {
      await resultMut.mutateAsync(batchId)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const errors = report?.errors ?? []
  const errorRows = errorRowSet(errors)
  const errorGroups = groupErrors(errors)
  const rowErrors = rowErrorMap(errors)
  const fileErrors = fileLevelErrors(errors)
  const hasFileError = fileErrors.length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) close()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] gap-8 overflow-y-auto border border-border/60 px-8 py-6 shadow-[0px_6px_18px_-8px_rgba(10,23,41,0.06)] sm:max-w-[47.5rem] dark:border-white/20 dark:shadow-[0px_8px_24px_rgba(255,255,255,0.06)]"
      >
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-medium text-foreground">
            {TITLES[effectiveStep]}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {DESCRIPTIONS[effectiveStep]}
          </DialogDescription>
        </DialogHeader>

        {/* ── select ─────────────────────────────────────────────────── */}
        {effectiveStep === 'select' && (
          <BulkSelectStep
            file={file}
            validationErrors={validationErrors}
            mandatoryColumns={MANDATORY_COLUMNS}
            templatePending={templateMut.isPending}
            validatePending={validateMut.isPending}
            onFileSelected={onFileSelected}
            onRemoveFile={removeFile}
            onDownloadTemplate={handleTemplate}
            onValidate={handleValidate}
            onCancel={close}
          />
        )}

        {/* ── review ─────────────────────────────────────────────────── */}
        {effectiveStep === 'review' && report && (
          <div className="flex min-w-0 flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total rows" value={String(report.total_rows)} />
              <Stat label="Total amount" value={formatINR(report.total_amount)} />
              <Stat
                label="Wallet Balance"
                value={report.balance ? formatINR(report.balance.wallet_balance) : '—'}
              />
              <Stat
                label="After Upload"
                value={report.balance ? formatINR(report.balance.after_wallet_balance) : '—'}
                tone={
                  report.balance
                    ? report.balance.sufficient
                      ? 'text-status-green'
                      : 'text-status-red'
                    : undefined
                }
              />
            </div>

            {report.duplicate && (
              <div className="flex items-center gap-2 rounded-md border-[0.4px] border-status-orange bg-status-orange/10 px-4 py-3 text-sm text-status-orange">
                <AppIcon icon={AlertTriangle} size="sm" />
                This exact file was already uploaded — confirming would be rejected as a duplicate.
              </div>
            )}

            <BulkReviewErrors
              groups={errorGroups}
              errorRowCount={errorRows.size}
              totalRows={report.total_rows}
            />

            <RowsTable
              headers={[
                '',
                '#',
                'Mode',
                'Wallet',
                'Amount',
                'Beneficiary',
                'Account',
                'IFSC',
                'Bank',
              ]}
              rows={report.rows.map(r => {
                // A row is flagged if it has field errors OR the whole file is a
                // duplicate (Confirm is blocked either way).
                const flagged = errorRows.has(r.row) || hasFileError || report.duplicate
                const tips = errorRows.has(r.row)
                  ? (rowErrors.get(r.row) ?? [])
                  : hasFileError
                    ? fileErrors
                    : report.duplicate
                      ? ['Duplicate file — this exact file was already uploaded']
                      : []
                return {
                  key: r.row,
                  highlight: flagged,
                  cells: [
                    <StatusDot key="dot" flagged={flagged} tips={tips} />,
                    r.row,
                    r.payment_mode,
                    r.wallet_code,
                    formatINR(r.amount),
                    r.beneficiary_name,
                    r.beneficiary_account_number,
                    r.beneficiary_ifsc,
                    r.bank_name,
                  ],
                }
              })}
            />

            <div className="flex items-stretch gap-2">
              <button
                type="button"
                className={cancelBtn}
                onClick={() => setStep('select')}
                disabled={uploadMut.isPending}
              >
                Back
              </button>
              <button
                type="button"
                className={submitBtn}
                onClick={handleConfirm}
                disabled={!canConfirm || uploadMut.isPending}
              >
                {uploadMut.isPending
                  ? 'Submitting…'
                  : `Confirm ${report.total_rows} ${report.total_rows === 1 ? 'payout' : 'payouts'}`}
              </button>
            </div>
          </div>
        )}

        {/* ── processing ─────────────────────────────────────────────── */}
        {effectiveStep === 'processing' && (
          <BulkProcessingStep
            isError={batchQuery.isError}
            progressText={
              batch
                ? `${batch.success_count + batch.failure_count} / ${batch.total_rows} processed`
                : 'This can take a moment for large files.'
            }
            errorMessage="We couldn’t fetch the status. Your payouts may still be processing in the background — check the payouts list shortly."
            onClose={close}
          />
        )}

        {/* ── done ───────────────────────────────────────────────────── */}
        {effectiveStep === 'done' && (
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm',
                  batchTone(batch?.status),
                )}
              >
                <AppIcon
                  icon={batch?.status === 'COMPLETED' ? CheckCircle2 : AlertTriangle}
                  size="sm"
                />
                {batch?.status?.replace(/_/g, ' ') ?? 'Done'}
              </span>
              {batch?.batch_code && (
                <span className="text-xs text-muted-foreground">{batch.batch_code}</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Total" value={String(batch?.total_rows ?? 0)} />
              <Stat
                label="Success"
                value={String(batch?.success_count ?? 0)}
                tone="text-status-green"
              />
              <Stat
                label="Failed"
                value={String(batch?.failure_count ?? 0)}
                tone={batch?.failure_count ? 'text-status-red' : undefined}
              />
            </div>

            {batch && batch.rows.length > 0 && (
              <RowsTable
                headers={[
                  '#',
                  'Status',
                  'Detail',
                  'Mode',
                  'Amount',
                  'Beneficiary',
                  'Account',
                  'IFSC',
                  'Bank',
                ]}
                rows={batch.rows.map(r => ({
                  key: r.row,
                  cells: [
                    r.row,
                    <span key="s" className={cn('font-medium', rowStatusTone(r.status))}>
                      {r.status}
                    </span>,
                    r.status === 'SUCCESS' ? (r.transaction_id ?? '—') : (r.failure_reason ?? '—'),
                    r.payment_mode,
                    formatINR(r.amount),
                    r.beneficiary_name,
                    r.beneficiary_account_number,
                    r.beneficiary_ifsc,
                    r.bank_name,
                  ],
                }))}
              />
            )}

            <div className="flex items-stretch gap-2">
              {batch?.result_ready && (
                <button
                  type="button"
                  className={cancelBtn}
                  onClick={handleResult}
                  disabled={resultMut.isPending}
                >
                  <AppIcon icon={Download} size="sm" />
                  {resultMut.isPending ? 'Downloading…' : 'Download result'}
                </button>
              )}
              <button type="button" className={submitBtn} onClick={close}>
                Done
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
