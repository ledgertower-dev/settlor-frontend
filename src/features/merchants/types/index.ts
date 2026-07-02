// Merchant status from API
export type MerchantStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED' | 'REJECTED'

// Primary wallet from merchant list response
export interface MerchantPrimaryWallet {
  providerName: string
  providerCode: string
  currency: string
  balance: number
  status: string
}

// Merchant from GET /merchants list
export interface Merchant {
  id: string
  code: string // Display code (e.g. "MER-B1C52B3530A20DE6")
  name: string
  email: string
  phone?: string
  balance?: number
  primaryWallet?: MerchantPrimaryWallet
  accountType: string
  status: MerchantStatus
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
}

// Merchant detail from GET /merchants/{id}
export interface MerchantDetail extends Merchant {
  dob?: string
  gender?: string
  address?: string
}

// Tab filter type
export type MerchantTab = 'approved' | 'new-request' | 'pending' | 'blocked' | 'rejected'

// Map tab to API status
export const TAB_STATUS_MAP: Record<MerchantTab, MerchantStatus> = {
  approved: 'ACTIVE',
  'new-request': 'PENDING',
  pending: 'PENDING',
  blocked: 'BLOCKED',
  rejected: 'REJECTED',
}

// Map tabs to kyc_status query param (only for tabs that need it)
export const TAB_KYC_STATUS_MAP: Partial<Record<MerchantTab, string>> = {
  'new-request': 'UNDER_REVIEW',
  pending: 'CHANGES_REQUESTED',
}

import type { PaginationFilters } from '@/lib/types/pagination.types'

// Filters for the merchants list
export interface MerchantFilters extends PaginationFilters {
  tab: MerchantTab
}
