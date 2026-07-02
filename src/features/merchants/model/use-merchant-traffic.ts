import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantTrafficService } from '../api/merchant-traffic.api'
import { settingsApiService } from '@/features/settings'
import type { CreateProviderChannelData } from '../api/merchant-traffic.api'

export const providerKeys = {
  all: ['providers'] as const,
  list: () => [...providerKeys.all, 'list'] as const,
}

export const providerChannelKeys = {
  all: ['providerChannels'] as const,
  list: (providerId: string, params?: { page?: number; per_page?: number }) =>
    [...providerChannelKeys.all, 'list', providerId, params] as const,
}

// trafficKeys is retained as a query-cache namespace used by virtual-account
// admin views to invalidate cross-feature state after assign/unassign.
export const trafficKeys = {
  all: ['trafficSettings'] as const,
  detail: (merchantId: string) => [...trafficKeys.all, merchantId] as const,
}

export function useProviders() {
  return useQuery({
    queryKey: providerKeys.list(),
    queryFn: () => merchantTrafficService.getProviders(),
  })
}

export function useProviderChannels(
  providerId: string,
  params?: { page?: number; per_page?: number },
) {
  return useQuery({
    queryKey: providerChannelKeys.list(providerId, params),
    queryFn: () => merchantTrafficService.getProviderChannels(providerId, params),
    enabled: !!providerId,
  })
}

export function useCreateProviderChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProviderChannelData) =>
      merchantTrafficService.createProviderChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerChannelKeys.all })
    },
  })
}

const depositVAKeys = {
  all: ['depositVirtualAccounts'] as const,
  list: (providerId: string, page: number, status?: string, q?: string) =>
    [...depositVAKeys.all, providerId, page, status, q] as const,
}

export function useSearchVirtualAccounts(
  providerId: string,
  page: number = 1,
  status: string = 'ACTIVE',
  q?: string,
) {
  return useQuery({
    queryKey: depositVAKeys.list(providerId, page, status, q),
    queryFn: () =>
      settingsApiService.getVirtualAccounts({
        providerId,
        page,
        perPage: 20,
        status,
        q: q || undefined,
      }),
    enabled: !!providerId,
  })
}
