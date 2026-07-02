import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type {
  AvailableProvider,
  AvailableVirtualAccount,
  MerchantProvider,
  RoutingRule,
  WalletOverview,
} from '../types/merchant-provider.types'

// Backend response shapes (snake_case)

interface BackendSupportedRail {
  rail: string
  is_supported: boolean
  is_enabled: boolean
}

interface BackendAvailableProvider {
  id: string
  code: string
  name: string
  kind: string
  service: string
  short_code?: string
  description?: string
  already_configured?: boolean
  supported_rails?: BackendSupportedRail[]
}

interface BackendAvailableVirtualAccount {
  id: string
  provider_id: string
  label: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  status: string
}

interface AvailableProvidersResponse {
  success: boolean
  data: BackendAvailableProvider[]
}

interface AvailableVirtualAccountsResponse {
  success: boolean
  data: BackendAvailableVirtualAccount[]
}

interface BackendWalletOverviewSummary {
  wallet_balance: number
  wallet_count: number
  in_flight_holds: number
  lifetime_payout_count: number
  lifetime_payout_amount: number
  commission_paid: number
  default_wallet_id: string
  default_provider_config_id: string
}

interface BackendWalletBreakdown {
  provider_config_id: string
  wallet_id: string
  provider_id: string
  provider_name: string
  virtual_account_id: string
  is_default: boolean
  balance: number
  hold: number
  payout_count: number
  payout_volume: number
  commission_paid: number
  status: string
}

interface WalletOverviewResponse {
  success: boolean
  data: {
    summary: BackendWalletOverviewSummary
    wallets: BackendWalletBreakdown[]
  }
}

export interface AddProviderConfigData {
  provider_id: string
  virtual_account_id: string
  reconciliation_mode: string
}

interface BackendRoutingRule {
  id: string
  provider_channel_id: string
  name: string
  rails: string[]
  commission_type: string
  commission_value: number
  gst_mode: string
  gst_percent_bps: number
  min_amount: number
  max_amount: number
  priority: number
  is_active: boolean
}

interface BackendProviderConfiguration {
  id: string
  provider_id: string
  provider_code: string
  provider_name: string
  virtual_account_id: string
  virtual_account_label: string
  has_virtual_account_mapping: boolean
  wallet_id: string
  wallet_code: string
  status: 'ENABLED' | 'DISABLED'
  reconciliation_mode: string
  daily_amount_limit: number
  is_default: boolean
  source: string
  enabled_at?: string
  created_at: string
  updated_at: string
  routing_rules?: BackendRoutingRule[]
}

interface ProviderConfigurationsResponse {
  success: boolean
  data: BackendProviderConfiguration[]
}

interface RoutingRulesResponse {
  success: boolean
  data: BackendRoutingRule[]
}

export interface UpdateProviderConfigStatusData {
  status: 'ENABLED' | 'DISABLED'
  disabled_reason?: string
}

interface AddProviderConfigResponse {
  success: boolean
  data: unknown
}

export interface AddRoutingRuleData {
  provider_channel_id: string
  name: string
  rails: string[]
  commission_type: string
  commission_value: number
  gst_mode: string
  gst_percent_bps: number
  min_amount: number
  max_amount: number
  priority: number
  is_active: boolean
}

export type UpdateRoutingRuleData = Partial<AddRoutingRuleData>

function transformRoutingRule(b: BackendRoutingRule): RoutingRule {
  return {
    id: b.id,
    providerChannelId: b.provider_channel_id,
    name: b.name,
    rails: b.rails,
    commissionType: b.commission_type as RoutingRule['commissionType'],
    commissionValue: b.commission_value,
    gstMode: b.gst_mode as RoutingRule['gstMode'],
    gstPercentBps: b.gst_percent_bps,
    minAmount: b.min_amount,
    maxAmount: b.max_amount,
    priority: b.priority,
    isActive: b.is_active,
  }
}

function transformProvider(b: BackendAvailableProvider): AvailableProvider {
  return {
    id: b.id,
    code: b.code,
    name: b.name,
    kind: b.kind,
    service: b.service,
    shortCode: b.short_code,
    description: b.description,
    alreadyConfigured: b.already_configured ?? false,
    supportedRails: (b.supported_rails ?? []).map(r => ({
      rail: r.rail,
      isSupported: r.is_supported,
      isEnabled: r.is_enabled,
    })),
  }
}

function transformVirtualAccount(b: BackendAvailableVirtualAccount): AvailableVirtualAccount {
  return {
    id: b.id,
    providerId: b.provider_id,
    label: b.label,
    bankName: b.bank_name,
    accountHolderName: b.account_holder_name,
    accountNumber: b.account_number,
    ifsc: b.ifsc,
    status: b.status,
  }
}

function transformProviderConfiguration(b: BackendProviderConfiguration): MerchantProvider {
  return {
    id: b.id,
    providerId: b.provider_id,
    providerCode: b.provider_code,
    providerName: b.provider_name,
    virtualAccountId: b.virtual_account_id,
    virtualAccountLabel: b.virtual_account_label,
    hasVirtualAccountMapping: b.has_virtual_account_mapping,
    walletId: b.wallet_id,
    walletCode: b.wallet_code,
    status: b.status,
    reconciliationMode: b.reconciliation_mode,
    dailyAmountLimit: b.daily_amount_limit ?? 0,
    isDefault: b.is_default,
    source: b.source,
    enabledAt: b.enabled_at,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    routingRules: (b.routing_rules ?? []).map(transformRoutingRule),
  }
}

function transformWalletOverview(data: WalletOverviewResponse['data']): WalletOverview {
  return {
    summary: {
      walletBalance: data.summary.wallet_balance,
      walletCount: data.summary.wallet_count,
      inFlightHolds: data.summary.in_flight_holds,
      lifetimePayoutCount: data.summary.lifetime_payout_count,
      lifetimePayoutAmount: data.summary.lifetime_payout_amount,
      commissionPaid: data.summary.commission_paid,
      defaultWalletId: data.summary.default_wallet_id,
      defaultProviderConfigId: data.summary.default_provider_config_id,
    },
    wallets: data.wallets.map(w => ({
      providerConfigId: w.provider_config_id,
      walletId: w.wallet_id,
      providerId: w.provider_id,
      providerName: w.provider_name,
      virtualAccountId: w.virtual_account_id,
      isDefault: w.is_default,
      balance: w.balance,
      hold: w.hold,
      payoutCount: w.payout_count,
      payoutVolume: w.payout_volume,
      commissionPaid: w.commission_paid,
      status: w.status,
    })),
  }
}

class MerchantProviderConfigService {
  async getWalletOverview(merchantId: string): Promise<WalletOverview> {
    try {
      const response = await apiClient.get<WalletOverviewResponse>(
        `/merchants/${merchantId}/wallet-overview`,
      )
      return transformWalletOverview(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getProviderConfigurations(merchantId: string): Promise<MerchantProvider[]> {
    try {
      const response = await apiClient.get<ProviderConfigurationsResponse>(
        `/merchants/${merchantId}/provider-configurations`,
      )
      return response.data.data.map(transformProviderConfiguration)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getAvailableProviders(merchantId: string): Promise<AvailableProvider[]> {
    try {
      const response = await apiClient.get<AvailableProvidersResponse>(
        `/merchants/${merchantId}/provider-configurations/available-providers`,
      )
      return response.data.data.map(transformProvider)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getAvailableVirtualAccounts(
    merchantId: string,
    providerId: string,
  ): Promise<AvailableVirtualAccount[]> {
    try {
      const response = await apiClient.get<AvailableVirtualAccountsResponse>(
        `/merchants/${merchantId}/provider-configurations/available-virtual-accounts`,
        { params: { provider_id: providerId } },
      )
      return response.data.data.map(transformVirtualAccount)
    } catch (error) {
      throwApiError(error)
    }
  }

  async setDefaultWallet(
    merchantId: string,
    providerConfigId: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${providerConfigId}/default`,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateProviderConfigStatus(
    merchantId: string,
    configId: string,
    data: UpdateProviderConfigStatusData,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/status`,
        data,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateVirtualAccount(
    merchantId: string,
    configId: string,
    virtualAccountId: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/virtual-account`,
        { virtual_account_id: virtualAccountId },
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async removeVirtualAccount(merchantId: string, configId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/virtual-account`,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateReconciliationMode(
    merchantId: string,
    configId: string,
    reconciliationMode: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/reconciliation-mode`,
        { reconciliation_mode: reconciliationMode },
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateDailyAmountLimit(
    merchantId: string,
    configId: string,
    dailyAmountLimit: number,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/daily-amount-limit`,
        { daily_amount_limit: dailyAmountLimit },
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async getRoutingRules(merchantId: string, configId: string): Promise<RoutingRule[]> {
    try {
      const response = await apiClient.get<RoutingRulesResponse>(
        `/merchants/${merchantId}/provider-configurations/${configId}/routing-rules`,
      )
      return response.data.data.map(transformRoutingRule)
    } catch (error) {
      throwApiError(error)
    }
  }

  async addProviderConfiguration(
    merchantId: string,
    data: AddProviderConfigData,
  ): Promise<AddProviderConfigResponse> {
    try {
      const response = await apiClient.post<AddProviderConfigResponse>(
        `/merchants/${merchantId}/provider-configurations`,
        data,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }
  async addRoutingRule(
    merchantId: string,
    configId: string,
    data: AddRoutingRuleData,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/routing-rules`,
        data,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateRoutingRule(
    merchantId: string,
    configId: string,
    ruleId: string,
    data: UpdateRoutingRuleData,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/routing-rules/${ruleId}`,
        data,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async deleteRoutingRule(
    merchantId: string,
    configId: string,
    ruleId: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `/merchants/${merchantId}/provider-configurations/${configId}/routing-rules/${ruleId}`,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const merchantProviderConfigService = new MerchantProviderConfigService()
