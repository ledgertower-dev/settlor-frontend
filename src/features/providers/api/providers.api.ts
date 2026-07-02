import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type { Provider, ProviderChannel, ProviderVirtualAccount } from '../types'

// Backend response shapes (snake_case)

interface BackendProvider {
  id: string
  name: string
  code: string
  type: string
  status: string
  provider_id_display: string
  service: string
  short_code: string
  description: string
}

interface BackendChannel {
  id: string
  name: string
  status: string
  webhook_url: string
  webhook_secret_masked: string
  api_key_masked: string
  used_by_merchants: number
}

interface BackendVirtualAccount {
  id: string
  provider_id: string
  provider_name: string
  provider_label: string
  va_code: string
  label: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  account_type: string
  entry_mode: string
  status: string
  assignment_status: string
  created_at: string
  updated_at: string
  merchant_id?: string
  merchant_name?: string
  merchant_code?: string
}

interface ProvidersListResponse {
  success: boolean
  data: BackendProvider[]
}

interface ProviderDetailResponse {
  success: boolean
  data: BackendProvider
}

interface ChannelsListResponse {
  success: boolean
  data: BackendChannel[]
}

interface VirtualAccountsResponse {
  success: boolean
  data: BackendVirtualAccount[]
  meta?: {
    pagination: {
      total: number
      per_page: number
      current_page: number
      last_page: number
    }
  }
}

export interface AddChannelData {
  name: string
  webhook_url: string
  webhook_secret: string
  api_key: string
  status: string
}

export interface UpdateChannelData {
  name?: string
  webhook_url?: string
  webhook_secret?: string
  api_key?: string
  status?: string
}

export interface AddVirtualAccountData {
  account_number: string
  ifsc: string
}

function transformProvider(b: BackendProvider): Provider {
  return {
    id: b.id,
    name: b.name,
    code: b.code,
    type: b.type,
    status: b.status,
    providerIdDisplay: b.provider_id_display,
    service: b.service,
    shortCode: b.short_code,
    description: b.description,
  }
}

function transformChannel(b: BackendChannel): ProviderChannel {
  return {
    id: b.id,
    name: b.name,
    status: b.status,
    webhookUrl: b.webhook_url,
    webhookSecretMasked: b.webhook_secret_masked,
    apiKeyMasked: b.api_key_masked,
    usedByMerchants: b.used_by_merchants,
  }
}

function transformVirtualAccount(b: BackendVirtualAccount): ProviderVirtualAccount {
  return {
    id: b.id,
    providerId: b.provider_id,
    providerName: b.provider_name,
    providerLabel: b.provider_label,
    vaCode: b.va_code,
    label: b.label,
    bankName: b.bank_name,
    accountHolderName: b.account_holder_name,
    accountNumber: b.account_number,
    ifsc: b.ifsc,
    accountType: b.account_type,
    entryMode: b.entry_mode,
    status: b.status,
    assignmentStatus: b.assignment_status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    merchantId: b.merchant_id,
    merchantName: b.merchant_name,
    merchantCode: b.merchant_code,
  }
}

class ProvidersService {
  async getProviders(): Promise<Provider[]> {
    try {
      const response = await apiClient.get<ProvidersListResponse>('/providers')
      return response.data.data.map(transformProvider)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getProvider(providerId: string): Promise<Provider> {
    try {
      const response = await apiClient.get<ProviderDetailResponse>(`/providers/${providerId}`)
      return transformProvider(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getChannels(providerId: string): Promise<ProviderChannel[]> {
    try {
      const response = await apiClient.get<ChannelsListResponse>(
        `/providers/${providerId}/channels`,
      )
      return response.data.data.map(transformChannel)
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateChannelStatus(
    providerId: string,
    channelId: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/providers/${providerId}/channels/${channelId}/status`,
        { status },
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async getVirtualAccounts(
    providerId: string,
    perPage = 20,
  ): Promise<{ data: ProviderVirtualAccount[]; meta?: VirtualAccountsResponse['meta'] }> {
    try {
      const response = await apiClient.get<VirtualAccountsResponse>(
        `/providers/${providerId}/virtual-accounts`,
        { params: { per_page: perPage } },
      )
      return {
        data: response.data.data.map(transformVirtualAccount),
        meta: response.data.meta,
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async addChannel(providerId: string, data: AddChannelData): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `/providers/${providerId}/channels`,
        data,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateChannel(
    providerId: string,
    channelId: string,
    data: UpdateChannelData,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/providers/${providerId}/channels/${channelId}`,
        data,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async addVirtualAccount(
    providerId: string,
    data: AddVirtualAccountData,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `/providers/${providerId}/virtual-accounts`,
        data,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateProviderStatus(
    providerId: string,
    status: 'ACTIVE' | 'INACTIVE',
    disabledReason?: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/providers/${providerId}/status`,
        { status, disabled_reason: disabledReason },
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async importVirtualAccounts(
    providerId: string,
    csvContent: string,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `/providers/${providerId}/virtual-accounts/import`,
        { csv_content: csvContent },
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const providersService = new ProvidersService()
