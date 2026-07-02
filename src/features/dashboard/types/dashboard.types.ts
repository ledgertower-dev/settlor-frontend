/**
 * Dashboard Types and Interfaces
 * Types for dashboard analytics and time ranges
 */

export type TimeRange = '7d' | '30d' | '90d' | '1y'

export type TrendDirection = 'up' | 'down' | 'neutral'

export type StatusType = 'active' | 'inactive' | 'warning' | 'critical'

// ============================================================================
// Dashboard Metrics API Types
// ============================================================================

/** Common query params for dashboard metric endpoints */
export interface DashboardMetricParams {
  status?: string
  payment_mode?: string
  created_from?: string
  created_to?: string
  q?: string
  merchant_id?: string
  range?: string
}

/** GET /payouts/dashboard/metrics/summary — widgets section */
export interface DashboardSummary {
  walletBalance: {
    amount: number
    holdBalance: number
    availableBalance: number
    walletCount: number
    currency: string
  }
  successPayout: StatusCardEntry
  processingPayout: StatusCardEntry
  initiatedPayout: StatusCardEntry
  payoutFees: {
    amount: number
    platformFees: number
    gst: number
    txnCount: number
  }
}

/** GET /payouts/dashboard/metrics/today-vs-yesterday */
export interface SparklineMetric {
  today: number
  yesterday: number
  delta: number
  deltaUnit: string
  deltaIsGood: boolean
  sparkline: number[]
}

export interface TodayVsYesterdayData {
  dataSource: string
  volume: SparklineMetric
  failureRate: SparklineMetric
}

/** GET /payouts/dashboard/metrics/payout-cards */
export interface StatusCardEntry {
  amount: number
  count: number
  // Trend fields — present on the payout-cards endpoint, absent on the summary widgets.
  comparisonAmount?: number
  /** Month-over-month % change. */
  delta?: number
  deltaUnit?: string
  /** Whether the change is a good thing (green) vs bad (red). */
  deltaIsGood?: boolean
  /** e.g. "vs last month". */
  comparisonLabel?: string
}

export interface PayoutCardsData {
  dataSource: string
  statusCards: {
    initiated: StatusCardEntry
    processing: StatusCardEntry
    success: StatusCardEntry
    failed: StatusCardEntry
  }
  fees: {
    totalFees: number
    platformFees: number
    gst: number
    txnCount: number
  }
}

/** GET /payouts/dashboard/metrics/status-volume */
export interface StatusVolumePoint {
  day: string
  initiated: number
  processing: number
  success: number
  failed: number
}

export interface StatusVolumeData {
  dataSource: string
  points: StatusVolumePoint[]
}

export interface StatusVolumeParams extends DashboardMetricParams {
  range?: string
}

/** GET /payouts/dashboard/metrics/status-split */
export interface StatusSplitEntry {
  count: number
  percent: number
}

export interface StatusSplitData {
  dataSource: string
  total: number
  initiated: StatusSplitEntry
  processing: StatusSplitEntry
  success: StatusSplitEntry
  failed: StatusSplitEntry
}

// --- My wallets (GET /me/wallets) — Account details card ---

export interface MerchantWallet {
  walletId: string
  walletCode: string
  currency: string
  balance: number
  holdBalance: number
  availableBalance: number
  fees: number
  status: string
  priority: number
  providerName: string
  providerCode: string
  vaCode: string | null
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  isDefault: boolean
}

/** One provider's contribution to the admin aggregate balance (GET /me/wallets). */
export interface ProviderContribution {
  providerId: string
  providerName: string
  providerCode: string
  balance: number
  percentage: number
}

export interface MyWalletsData {
  totalBalance: number
  fees: number
  primaryAccount: MerchantWallet | null
  otherAccounts: MerchantWallet[]
  wallets: MerchantWallet[]
  /** Per-provider balance breakdown — only populated for admin users. */
  providers: ProviderContribution[]
}
