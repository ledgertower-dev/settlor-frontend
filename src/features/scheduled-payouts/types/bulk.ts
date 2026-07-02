/**
 * Bulk Scheduled Payouts types — raw API shapes (snake_case; service returns
 * res.data.data as-is). One CSV/XLSX row → one ONE_TIME scheduled payout.
 */

export type SchedBatchStatus = 'PROCESSING' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED'
export type SchedProcessingMode = 'SYNC' | 'ASYNC'
export type SchedRowStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
export type SchedPaymentMode = 'IMPS' | 'NEFT' | 'RTGS'

// ── #2 validate (dry run) ──────────────────────────────────────────────
export interface SchedValidateRow {
  row: number // 1-based data-row number (header excluded)
  payment_mode: SchedPaymentMode
  wallet_code: string
  amount: number // display units
  trigger_time: string // "YYYY-MM-DD HH:MM" (IST)
  beneficiary_name: string
  beneficiary_account_number: string
  beneficiary_ifsc: string
  bank_name: string
  remarks: string
  reference_id?: string
}

export interface SchedValidateWallet {
  wallet_code: string
  wallet_id: string
  wallet_balance?: number // current available (advisory, may be absent)
  scheduled_total: number // sum scheduled against this wallet in the file
}

export interface SchedValidateFieldError {
  field: string // "row_<n>.<field>", e.g. "row_5.trigger_time"
  message: string
}

export interface BulkScheduledValidateResponse {
  valid: boolean // false ⇒ blocking errors[] present
  total_rows: number
  total_amount: number
  currency: string // "INR"
  duplicate: boolean // same file already uploaded → Confirm would 409
  wallets: SchedValidateWallet[] // per-wallet money summary (informational only)
  rows: SchedValidateRow[] // echoes EVERY parsed row (render even if invalid)
  errors: SchedValidateFieldError[]
}

// ── #3 upload / #4 status ──────────────────────────────────────────────
export interface BulkScheduledBatchResponse {
  batch_id: string
  batch_code: string // e.g. "STR-BSP-..."
  status: SchedBatchStatus
  processing_mode: SchedProcessingMode
  file_name: string
  total_rows: number
  success_count: number
  failure_count: number
  total_amount: number
  currency: string
  result_ready: boolean // true ⇒ #5 result CSV available
  completed_at?: string
  created_at: string
  // NOTE: no top-level wallet_id (rows may target different wallets)
}

export interface BulkScheduledBatchRow {
  row: number
  status: SchedRowStatus
  failure_reason?: string
  scheduled_payout_id?: string // the created ONE_TIME rule on success
  payment_mode: SchedPaymentMode
  wallet_code: string
  amount: number
  trigger_time: string // "YYYY-MM-DD HH:MM"
  beneficiary_name: string
  beneficiary_account_number: string
  beneficiary_ifsc: string
  bank_name: string
  reference_id?: string
}

export interface BulkScheduledBatchDetailResponse extends BulkScheduledBatchResponse {
  rows: BulkScheduledBatchRow[]
}

export const SCHED_TERMINAL_STATUSES: SchedBatchStatus[] = [
  'COMPLETED',
  'PARTIALLY_COMPLETED',
  'FAILED',
]

export function isSchedTerminal(status?: SchedBatchStatus): boolean {
  return !!status && SCHED_TERMINAL_STATUSES.includes(status)
}
