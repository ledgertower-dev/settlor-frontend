/**
 * Payout Types
 *
 * Types for the payouts feature matching the backend API
 */

// ============================================================================
// Payout Status & Payment Mode
// ============================================================================

export type PayoutStatus =
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REVERSED'
  | 'PENDING_APPROVAL'

export type PaymentMode = 'NEFT' | 'IMPS' | 'RTGS' | 'UPI'

// ============================================================================
// Backend Types (snake_case — raw API response)
// ============================================================================

export type TimelineEventType =
  | 'status_change'
  | 'provider_forward'
  | 'provider_response'
  | 'provider_delay'
  | 'merchant_callback'
  | 'merchant_callback_retry'
  | 'merchant_callback_exhausted'
  | 'settlement'
  | 'manual_status_override'

export type TimelineBadgeKind = 'success' | 'danger' | 'warning' | 'neutral'

export interface TimelineBadge {
  label: string
  kind: TimelineBadgeKind
}

export interface BackendTimeline {
  from_status?: string | null
  to_status: string
  remarks?: string
  created_at: string
  event_type?: TimelineEventType
  badge?: TimelineBadge
  request?: unknown
  response?: unknown
}

export interface BackendPayout {
  transaction_id: string
  transaction_code: string
  merchant_id: string
  merchant_name?: string
  merchant_code?: string
  status: string
  amount: number
  fee: number
  gst: number
  net_amount: number
  currency: string
  payment_mode: string
  // List response: flat beneficiary fields
  beneficiary_name?: string
  beneficiary_account?: string
  beneficiary_ifsc?: string
  beneficiary_address?: string
  bank_name?: string
  // Detail response: nested beneficiary object
  beneficiary?: {
    name: string
    account: string
    ifsc: string
    address: string
    bank_name: string
  }
  reference_id: string
  utr?: string | null
  external_ref?: string | null
  remarks?: string
  provider_status?: string | null
  created_at: string
  updated_at: string
  // Detail-only fields
  timelines?: BackendTimeline[]
  // Nested objects (if backend returns them in detail view)
  merchant?: { id: string; code: string; name: string }
}

export interface BackendPayoutsListResponse {
  success: boolean
  data: BackendPayout[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export interface BackendPayoutDetailResponse {
  success: boolean
  data: BackendPayout
}

// ============================================================================
// Frontend Types (camelCase — transformed for UI)
// ============================================================================

export interface PayoutBeneficiary {
  name: string
  account: string
  ifsc: string
  bankName: string
  address: string
}

export interface PayoutMerchant {
  id: string
  code: string
  name: string
  callbackUrl?: string
}

export interface PayoutTimeline {
  fromStatus: string | null
  toStatus: string
  remarks: string
  createdAt: string
  eventType?: TimelineEventType
  badge?: TimelineBadge
  request?: unknown
  response?: unknown
}

export interface Payout {
  id: string
  code: string
  status: PayoutStatus
  paymentMode: PaymentMode
  requestedAmount: number
  fees: number
  netAmount: number
  utr: string | null
  externalReference: string | null
  remarks: string
  referenceId: string
  providerStatus: string | null
  beneficiary: PayoutBeneficiary
  merchant: PayoutMerchant
  createdAt: string
  updatedAt: string
}

export interface PayoutDetail extends Payout {
  timelines: PayoutTimeline[]
}

// ============================================================================
// Request Types
// ============================================================================

export type StatusOverrideStatus = PayoutStatus

export interface StatusOverrideRequest {
  new_status: StatusOverrideStatus
  email: string
  password: string
  reason: string
}

export interface CreatePayoutRequest {
  amount: number
  bank_name: string
  beneficiary_account: string
  beneficiary_ifsc: string
  beneficiary_name: string
  beneficiary_address: string
  payment_mode: PaymentMode
  reference_id: string
  remarks: string
  wallet_id: string
}

export interface PayoutListParams {
  page?: number
  per_page?: number
  sort?: string
  order?: 'asc' | 'desc'
  status?: string
  payment_mode?: string
  created_from?: string
  created_to?: string
  q?: string
  merchant_id?: string
}

// ============================================================================
// Wallet Balance
// ============================================================================

export interface BackendPayoutBalance {
  available_balance: number
  balance: number
  currency: string
  hold_balance: number
  wallet_id: string
}

export interface BackendPayoutBalanceResponse {
  success: boolean
  data: {
    wallets: BackendPayoutBalance[]
  }
}

export interface PayoutBalance {
  availableBalance: number
  balance: number
  currency: string
  holdBalance: number
  walletId: string
}

// ============================================================================
// Merchant Wallets (GET /me/wallets)
// ============================================================================

export interface BackendMerchantWallet {
  wallet_id: string
  wallet_code: string
  currency: string
  balance: number
  available_balance: number
  hold_balance: number
  status: string
  priority: number
  provider_id: string
  provider_name: string
  provider_code: string
  virtual_account_id: string
  is_default: boolean
}

export interface BackendMerchantWalletsResponse {
  success: boolean
  data: {
    wallets: BackendMerchantWallet[]
  }
}

export interface MerchantWallet {
  id: string
  walletCode: string
  currency: string
  balance: number
  availableBalance: number
  holdBalance: number
  status: string
  priority: number
  providerId: string
  providerName: string
  providerCode: string
  virtualAccountId: string
  isDefault: boolean
}
