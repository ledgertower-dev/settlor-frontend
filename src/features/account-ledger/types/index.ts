/**
 * Account Ledger Types — wallet operations (combined payout + deposit view)
 */

export type LedgerTab = 'payout' | 'deposit' | 'all'
export type LedgerOrder = 'asc' | 'desc'

// Core interface — normalized from backend snake_case to camelCase
export interface LedgerEntry {
  date: string
  merchantId: string
  merchantName: string
  merchantCode: string
  transactionId: string
  mode: string
  transactionType: string
  amount: number
  serviceFees: number
  openingBalance: number
  closingBalance: number
  currency: string
}

// Filter / pagination params
export interface GetLedgerParams {
  tab?: LedgerTab
  /** Partial search over Transaction ID, Amount, and Merchant Name. */
  q?: string
  /** Admin-only: scope to a specific merchant (UUID). */
  merchantId?: string
  /** Filter to transactions routed through one provider (UUID). */
  providerId?: string
  /** RFC3339 lower bound on operation date. */
  dateFrom?: string
  /** RFC3339 upper bound on operation date. */
  dateTo?: string
  page?: number
  perPage?: number
  order?: LedgerOrder
}
