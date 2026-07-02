/**
 * Dashboard Metrics API Service
 *
 * Connects to payout dashboard metric endpoints
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { buildFilterQueryString } from '@/lib/api/api-utils'
import type {
  DashboardMetricParams,
  DashboardSummary,
  TodayVsYesterdayData,
  PayoutCardsData,
  StatusVolumeData,
  StatusVolumeParams,
  StatusSplitData,
  MyWalletsData,
  MerchantWallet,
} from '../types/dashboard.types'

interface BackendWallet {
  wallet_id: string
  wallet_code: string
  currency: string
  balance: number
  hold_balance: number
  available_balance: number
  fees: number
  status: string
  priority: number
  provider_name: string
  provider_code: string
  va_code: string | null
  bank_name?: string
  account_holder_name?: string
  account_number?: string
  ifsc?: string
  is_default: boolean
}

interface BackendProviderContribution {
  provider_id: string
  provider_name: string
  provider_code: string
  balance: number
  percentage: number
}

interface BackendMyWalletsData {
  total_balance: number
  fees: number
  primary_account: BackendWallet | null
  other_accounts: BackendWallet[]
  wallets: BackendWallet[]
  providers?: BackendProviderContribution[]
}

function toMerchantWallet(w: BackendWallet): MerchantWallet {
  return {
    walletId: w.wallet_id,
    walletCode: w.wallet_code,
    currency: w.currency,
    balance: w.balance,
    holdBalance: w.hold_balance,
    availableBalance: w.available_balance,
    fees: w.fees,
    status: w.status,
    priority: w.priority,
    providerName: w.provider_name,
    providerCode: w.provider_code,
    vaCode: w.va_code ?? null,
    bankName: w.bank_name ?? '',
    accountHolderName: w.account_holder_name ?? '',
    accountNumber: w.account_number ?? '',
    ifsc: w.ifsc ?? '',
    isDefault: w.is_default,
  }
}

// ============================================================================
// Backend Response Types
// ============================================================================

interface BackendResponse<T> {
  success: boolean
  data: T
}

interface BackendSummaryData {
  widgets: {
    wallet_balance: {
      amount: number
      hold_balance: number
      available_balance: number
      wallet_count: number
      currency: string
    }
    success_payout: { amount: number; count: number }
    processing_payout: { amount: number; count: number }
    initiated_payout: { amount: number; count: number }
    payout_fees: {
      amount: number
      platform_fees: number
      gst: number
      txn_count: number
    }
  }
}

interface BackendSparklineMetric {
  today: number
  yesterday: number
  delta: number
  delta_unit: string
  delta_is_good: boolean
  sparkline: number[]
}

interface BackendTodayVsYesterdayData {
  data_source: string
  volume?: BackendSparklineMetric
  // Absent on older backends that only return success_rate.
  failure_rate?: BackendSparklineMetric
}

interface BackendStatusCardEntry {
  amount: number
  count: number
  comparison_amount: number
  delta_percent: number
  delta_unit: string
  delta_is_good: boolean
  comparison_label: string
}

interface BackendPayoutCardsData {
  data_source: string
  status_cards: {
    initiated: BackendStatusCardEntry
    processing: BackendStatusCardEntry
    success: BackendStatusCardEntry
    failed: BackendStatusCardEntry
  }
  fees: {
    total_fees: number
    platform_fees: number
    gst: number
    txn_count: number
  }
}

interface BackendStatusVolumePoint {
  day: string
  initiated: number
  processing: number
  success: number
  failed: number
}

interface BackendStatusVolumeData {
  data_source: string
  points: BackendStatusVolumePoint[]
}

interface BackendStatusSplitEntry {
  count: number
  percent: number
}

interface BackendStatusSplitData {
  data_source: string
  total: number
  initiated: BackendStatusSplitEntry
  processing: BackendStatusSplitEntry
  success: BackendStatusSplitEntry
  failed: BackendStatusSplitEntry
}

// ============================================================================
// Query param builder
// ============================================================================

function buildDashboardQueryString(params?: DashboardMetricParams): string {
  if (!params) return ''
  return buildFilterQueryString({
    status: params.status,
    payment_mode: params.payment_mode,
    created_from: params.created_from ? `${params.created_from}T00:00:00Z` : undefined,
    created_to: params.created_to ? `${params.created_to}T23:59:59Z` : undefined,
    q: params.q,
    merchant_id: params.merchant_id,
    range: params.range,
  })
}

// ============================================================================
// Transform helpers
// ============================================================================

// Tolerant of a missing metric (e.g. a backend that doesn't yet return
// failure_rate) so the dashboard renders instead of throwing.
function transformSparklineMetric(b?: BackendSparklineMetric) {
  return {
    today: b?.today ?? 0,
    yesterday: b?.yesterday ?? 0,
    delta: b?.delta ?? 0,
    deltaUnit: b?.delta_unit ?? '%',
    deltaIsGood: b?.delta_is_good ?? false,
    sparkline: b?.sparkline ?? [],
  }
}

// ============================================================================
// Service
// ============================================================================

class DashboardMetricsService {
  /**
   * GET /payouts/dashboard/metrics/summary
   * Wallet balance widget
   */
  async getSummary(params?: DashboardMetricParams): Promise<DashboardSummary> {
    try {
      const url = `/payouts/dashboard/metrics/summary${buildDashboardQueryString(params)}`
      const response = await apiClient.get<BackendResponse<BackendSummaryData>>(url)
      const w = response.data.data.widgets
      const wb = w.wallet_balance
      return {
        walletBalance: {
          amount: wb.amount,
          holdBalance: wb.hold_balance,
          availableBalance: wb.available_balance,
          walletCount: wb.wallet_count,
          currency: wb.currency,
        },
        successPayout: w.success_payout,
        processingPayout: w.processing_payout,
        initiatedPayout: w.initiated_payout,
        payoutFees: {
          amount: w.payout_fees.amount,
          platformFees: w.payout_fees.platform_fees,
          gst: w.payout_fees.gst,
          txnCount: w.payout_fees.txn_count,
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * GET /payouts/dashboard/metrics/today-vs-yesterday
   * Today vs yesterday comparison cards
   */
  async getTodayVsYesterday(params?: DashboardMetricParams): Promise<TodayVsYesterdayData> {
    try {
      const url = `/payouts/dashboard/metrics/today-vs-yesterday${buildDashboardQueryString(params)}`
      const response = await apiClient.get<BackendResponse<BackendTodayVsYesterdayData>>(url)
      const d = response.data.data
      return {
        dataSource: d.data_source,
        volume: transformSparklineMetric(d.volume),
        failureRate: transformSparklineMetric(d.failure_rate),
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * GET /payouts/dashboard/metrics/payout-cards
   * Payout status cards and fees
   */
  async getPayoutCards(params?: DashboardMetricParams): Promise<PayoutCardsData> {
    try {
      const url = `/payouts/dashboard/metrics/payout-cards${buildDashboardQueryString(params)}`
      const response = await apiClient.get<BackendResponse<BackendPayoutCardsData>>(url)
      const d = response.data.data
      const toStatusCard = (c: BackendStatusCardEntry) => ({
        amount: c.amount,
        count: c.count,
        comparisonAmount: c.comparison_amount,
        delta: c.delta_percent,
        deltaUnit: c.delta_unit,
        deltaIsGood: c.delta_is_good,
        comparisonLabel: c.comparison_label,
      })
      return {
        dataSource: d.data_source,
        statusCards: {
          initiated: toStatusCard(d.status_cards.initiated),
          processing: toStatusCard(d.status_cards.processing),
          success: toStatusCard(d.status_cards.success),
          failed: toStatusCard(d.status_cards.failed),
        },
        fees: {
          totalFees: d.fees.total_fees,
          platformFees: d.fees.platform_fees,
          gst: d.fees.gst,
          txnCount: d.fees.txn_count,
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * GET /payouts/dashboard/metrics/status-volume
   * Status volume bar chart data (supports range param)
   */
  async getStatusVolume(params?: StatusVolumeParams): Promise<StatusVolumeData> {
    try {
      const url = `/payouts/dashboard/metrics/status-volume${buildDashboardQueryString(params)}`
      const response = await apiClient.get<BackendResponse<BackendStatusVolumeData>>(url)
      const d = response.data.data
      return {
        dataSource: d.data_source,
        points: d.points.map(p => ({
          day: p.day,
          initiated: p.initiated,
          processing: p.processing,
          success: p.success,
          failed: p.failed,
        })),
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * GET /payouts/dashboard/metrics/status-split
   * Status split donut chart data
   */
  async getStatusSplit(params?: DashboardMetricParams): Promise<StatusSplitData> {
    try {
      const url = `/payouts/dashboard/metrics/status-split${buildDashboardQueryString(params)}`
      const response = await apiClient.get<BackendResponse<BackendStatusSplitData>>(url)
      const d = response.data.data
      return {
        dataSource: d.data_source,
        total: d.total,
        initiated: d.initiated,
        processing: d.processing,
        success: d.success,
        failed: d.failed,
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * GET /me/wallets — payout wallets for the Account details card.
   */
  async getMyWallets(): Promise<MyWalletsData> {
    try {
      const response = await apiClient.get<BackendResponse<BackendMyWalletsData>>('/me/wallets')
      const d = response.data.data
      return {
        totalBalance: d.total_balance,
        fees: d.fees,
        primaryAccount: d.primary_account ? toMerchantWallet(d.primary_account) : null,
        otherAccounts: (d.other_accounts ?? []).map(toMerchantWallet),
        wallets: (d.wallets ?? []).map(toMerchantWallet),
        providers: (d.providers ?? []).map(p => ({
          providerId: p.provider_id,
          providerName: p.provider_name,
          providerCode: p.provider_code,
          balance: p.balance,
          percentage: p.percentage,
        })),
      }
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const dashboardMetricsService = new DashboardMetricsService()
