import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { normalizePaginationMeta } from '@/lib/api/api-utils'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import type { Provider, ProviderChannel } from '../types/merchant-traffic.types'

interface BackendProvider {
  id: string
  name: string
  label: string
}

interface ProvidersResponse {
  success: boolean
  data: BackendProvider[]
}

interface BackendProviderChannel {
  id: string
  provider_id: string
  provider_name: string
  provider_label: string
  label: string
  purpose: string
  status: string
  supported_payment_modes: string[]
}

interface ProviderChannelsResponse {
  success: boolean
  data: BackendProviderChannel[]
  meta?: { page: number; per_page: number; total: number; total_pages: number }
}

function transformProvider(b: BackendProvider): Provider {
  return {
    id: b.id,
    name: b.name,
    label: b.label,
  }
}

function transformProviderChannel(b: BackendProviderChannel): ProviderChannel {
  return {
    id: b.id,
    providerId: b.provider_id,
    providerName: b.provider_name,
    providerLabel: b.provider_label,
    label: b.label,
    purpose: b.purpose,
    status: b.status,
    supportedPaymentModes: b.supported_payment_modes,
  }
}

export interface CreateProviderChannelData {
  provider_id: string
  label: string
  purpose: string
  config: Record<string, string>
  encrypted_credentials: Record<string, string>
  supported_payment_modes: string[]
  status: string
}

class MerchantTrafficService {
  async getProviders(): Promise<Provider[]> {
    try {
      const response = await apiClient.get<ProvidersResponse>('/providers')
      return response.data.data.map(transformProvider)
    } catch (error) {
      throwApiError(error)
    }
  }

  async createProviderChannel(data: CreateProviderChannelData): Promise<ProviderChannel> {
    try {
      const response = await apiClient.post<{ success: boolean; data: BackendProviderChannel }>(
        '/provider-channels',
        data,
      )
      return transformProviderChannel(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getProviderChannels(
    providerId: string,
    params?: { page?: number; per_page?: number },
  ): Promise<PaginatedResponse<ProviderChannel>> {
    try {
      const response = await apiClient.get<ProviderChannelsResponse>('/provider-channels', {
        params: { provider_id: providerId, status: 'ACTIVE', ...params },
      })
      const items = response.data.data.map(transformProviderChannel)
      const meta = response.data.meta
      return {
        data: { items },
        meta: {
          pagination: meta
            ? normalizePaginationMeta(meta)
            : {
                page: params?.page ?? 1,
                perPage: params?.per_page ?? items.length,
                total: items.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
              },
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const merchantTrafficService = new MerchantTrafficService()
