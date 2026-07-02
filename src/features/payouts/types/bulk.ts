/**
 * Bulk Payouts types — raw API shapes (snake_case; the service returns
 * res.data.data as-is, no camelCase transform).
 */

export type BulkBatchStatus = 'PROCESSING' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED'
export type BulkProcessingMode = 'SYNC' | 'ASYNC'
export type BulkRowStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
export type BulkPaymentMode = 'IMPS' | 'NEFT' | 'RTGS'

// ── #2 validate (dry run) ──────────────────────────────────────────────
export interface BulkValidateRow {
  row: number // 1-based row number in the file
  payment_mode: BulkPaymentMode
  wallet_code: string
  amount: number // display units
  beneficiary_name: string
  beneficiary_account_number: string
  beneficiary_ifsc: string
  bank_name: string
  remarks: string
  reference_id?: string
}

export interface BulkValidateFieldError {
  field: string // "row_<n>.<field>", e.g. "row_6.beneficiary_ifsc"
  message: string
}

export interface BulkValidateBalance {
  total_amount: number
  wallet_balance: number // current available wallet balance
  after_wallet_balance: number // wallet_balance − total_amount (may be negative)
  sufficient: boolean
}

export interface BulkValidateResponse {
  valid: boolean // false ⇒ blocking errors[] present
  total_rows: number
  total_amount: number
  currency: string // "INR"
  wallet_code?: string
  wallet_id?: string // only once rows pass field validation
  duplicate: boolean // same file already uploaded → Confirm would 409
  balance?: BulkValidateBalance // only once rows pass field validation
  rows: BulkValidateRow[] // echoes EVERY parsed row (render even if invalid)
  errors: BulkValidateFieldError[]
}

// ── #3 upload / #4 status ──────────────────────────────────────────────
export interface BulkBatchResponse {
  batch_id: string
  batch_code: string // e.g. "BLK-1S..."
  status: BulkBatchStatus
  processing_mode: BulkProcessingMode
  file_name: string
  total_rows: number
  success_count: number
  failure_count: number
  total_amount: number
  currency: string
  wallet_id: string
  result_ready: boolean // true ⇒ #5 result CSV available
  completed_at?: string
  created_at: string
}

export interface BulkBatchRow {
  row: number
  status: BulkRowStatus
  failure_reason?: string // e.g. "INSUFFICIENT_BALANCE"
  transaction_id?: string
  payment_mode: BulkPaymentMode
  amount: number
  beneficiary_name: string
  beneficiary_account_number: string
  beneficiary_ifsc: string
  bank_name: string
  reference_id?: string
}

export interface BulkBatchDetailResponse extends BulkBatchResponse {
  rows: BulkBatchRow[]
}

export const BULK_TERMINAL_STATUSES: BulkBatchStatus[] = [
  'COMPLETED',
  'PARTIALLY_COMPLETED',
  'FAILED',
]

export function isBulkTerminal(status?: BulkBatchStatus): boolean {
  return !!status && BULK_TERMINAL_STATUSES.includes(status)
}
