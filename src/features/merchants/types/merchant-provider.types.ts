// --- Overview types ---

export interface WalletOverviewSummary {
  walletBalance: number
  walletCount: number
  inFlightHolds: number
  lifetimePayoutCount: number
  lifetimePayoutAmount: number
  commissionPaid: number
  defaultWalletId: string
  defaultProviderConfigId: string
}

export interface MerchantWalletBreakdown {
  providerConfigId: string
  walletId: string
  providerId: string
  providerName: string
  virtualAccountId: string
  isDefault: boolean
  balance: number
  hold: number
  payoutCount: number
  payoutVolume: number
  commissionPaid: number
  status: string
}

export interface WalletOverview {
  summary: WalletOverviewSummary
  wallets: MerchantWalletBreakdown[]
}

// --- Provider Configuration types ---

export interface RoutingRule {
  id: string
  providerChannelId: string
  name: string
  rails: string[]
  commissionType: 'PERCENT' | 'FLAT'
  commissionValue: number
  gstMode: 'INCLUDING_GST' | 'EXCLUDING_GST'
  gstPercentBps: number
  minAmount: number
  maxAmount: number
  priority: number
  isActive: boolean
}

export interface MerchantProvider {
  id: string
  providerId: string
  providerCode: string
  providerName: string
  virtualAccountId: string
  virtualAccountLabel: string
  hasVirtualAccountMapping: boolean
  walletId: string
  walletCode: string
  status: 'ENABLED' | 'DISABLED'
  reconciliationMode: string
  dailyAmountLimit: number
  isDefault: boolean
  source: string
  enabledAt?: string
  createdAt: string
  updatedAt: string
  routingRules: RoutingRule[]
}

// --- Available Provider (from catalog API) ---

export interface SupportedRail {
  rail: string
  isSupported: boolean
  isEnabled: boolean
}

export interface AvailableProvider {
  id: string
  code: string
  name: string
  kind: string
  service: string
  shortCode?: string
  description?: string
  alreadyConfigured: boolean
  supportedRails: SupportedRail[]
}

// --- Available Virtual Account (from API) ---

export interface AvailableVirtualAccount {
  id: string
  providerId: string
  label: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  status: string
}

/**
 * Format a number as Indian Rupee currency (₹1,34,900.00)
 */
export function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
