/**
 * Deposit Transaction Types
 */

// ============================================================================
// Status / Mode
// ============================================================================

export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVERTED'
export type DepositMode = 'MANUAL' | 'AUTO'

// ============================================================================
// Core Interface — normalized from backend snake_case to camelCase
// ============================================================================

export interface DepositFromBank {
  bankAccountId: string
}

export interface Deposit {
  id: string
  transactionCode: string
  merchantId: string
  merchantName: string
  merchantCode: string
  status: DepositStatus
  mode: DepositMode
  amount: number
  currency: string
  reference: string
  fromBank: DepositFromBank | null
  virtualAccountId: string
  screenshotUploadId: string
  screenshotUrl: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Filter / Pagination Params
// ============================================================================

export interface GetDepositsParams {
  status?: DepositStatus
  mode?: DepositMode
  /** Admin-only: scope to a specific merchant. */
  merchantId?: string
  q?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  perPage?: number
  sort?: 'created_at' | 'amount' | 'status'
  order?: 'asc' | 'desc'
}

// ============================================================================
// Backwards-compat aliases
// ============================================================================

export type DepositTransactionStatus = DepositStatus
export type DepositTransaction = Deposit
export type DepositTransactionListParams = GetDepositsParams
