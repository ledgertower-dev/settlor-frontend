import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  providersService,
  type AddChannelData,
  type UpdateChannelData,
  type AddVirtualAccountData,
} from '../api/providers.api'

export const providerKeys = {
  all: ['providers'] as const,
  list: () => [...providerKeys.all, 'list'] as const,
  detail: (id: string) => [...providerKeys.all, 'detail', id] as const,
  channels: (id: string) => [...providerKeys.all, 'channels', id] as const,
  virtualAccounts: (id: string) => [...providerKeys.all, 'virtual-accounts', id] as const,
}

export function useProviders() {
  return useQuery({
    queryKey: providerKeys.list(),
    queryFn: () => providersService.getProviders(),
  })
}

export function useProvider(providerId: string) {
  return useQuery({
    queryKey: providerKeys.detail(providerId),
    queryFn: () => providersService.getProvider(providerId),
    enabled: !!providerId,
  })
}

export function useProviderChannels(providerId: string) {
  return useQuery({
    queryKey: providerKeys.channels(providerId),
    queryFn: () => providersService.getChannels(providerId),
    enabled: !!providerId,
  })
}

export function useProviderVirtualAccounts(providerId: string) {
  return useQuery({
    queryKey: providerKeys.virtualAccounts(providerId),
    queryFn: () => providersService.getVirtualAccounts(providerId),
    enabled: !!providerId,
  })
}

export function useUpdateProviderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      providerId,
      status,
      disabledReason,
    }: {
      providerId: string
      status: 'ACTIVE' | 'INACTIVE'
      disabledReason?: string
    }) => providersService.updateProviderStatus(providerId, status, disabledReason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerKeys.detail(variables.providerId),
      })
      queryClient.invalidateQueries({
        queryKey: providerKeys.list(),
      })
      // Also refresh merchant provider configurations that reference this provider
      queryClient.invalidateQueries({
        queryKey: ['merchantProviderConfig'],
      })
    },
  })
}

export function useUpdateChannelStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      providerId,
      channelId,
      status,
    }: {
      providerId: string
      channelId: string
      status: 'ACTIVE' | 'INACTIVE'
    }) => providersService.updateChannelStatus(providerId, channelId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerKeys.channels(variables.providerId),
      })
    },
  })
}

export function useAddChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: AddChannelData }) =>
      providersService.addChannel(providerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerKeys.channels(variables.providerId),
      })
    },
  })
}

export function useUpdateChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      providerId,
      channelId,
      data,
    }: {
      providerId: string
      channelId: string
      data: UpdateChannelData
    }) => providersService.updateChannel(providerId, channelId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerKeys.channels(variables.providerId),
      })
    },
  })
}

export function useAddVirtualAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ providerId, data }: { providerId: string; data: AddVirtualAccountData }) =>
      providersService.addVirtualAccount(providerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerKeys.virtualAccounts(variables.providerId),
      })
    },
  })
}

export function useImportVirtualAccounts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ providerId, csvContent }: { providerId: string; csvContent: string }) =>
      providersService.importVirtualAccounts(providerId, csvContent),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerKeys.virtualAccounts(variables.providerId),
      })
    },
  })
}
