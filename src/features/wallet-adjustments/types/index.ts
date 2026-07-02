export type AdjustmentDirection = 'CREDIT' | 'DEBIT'

export interface WalletAdjustment {
  id: string
  merchantId: string
  walletId: string
  direction: AdjustmentDirection
  amount: number
  currency: string
  remarks: string
  ledgerEntryId: number
  createdBy: string
  status: string
  createdAt: string
  merchantName: string
  merchantCode: string
  merchantEmail: string
  walletCode: string
}

export interface CreateAdjustmentPayload {
  direction: AdjustmentDirection
  amount: number
  remarks: string
}

export interface AdjustmentLogFilters {
  page: number
  perPage: number
}

export interface MerchantWallet {
  walletId: string
  walletCode: string
  name: string
  status: string
  currency: string
  providerName: string
  available: number
  hold: number
  balance: number
}
