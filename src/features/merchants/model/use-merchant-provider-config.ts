import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  merchantProviderConfigService,
  type AddProviderConfigData,
  type UpdateProviderConfigStatusData,
  type AddRoutingRuleData,
  type UpdateRoutingRuleData,
} from '../api/merchant-provider-config.api'

export const providerConfigKeys = {
  all: ['merchantProviderConfig'] as const,
  walletOverview: (merchantId: string) =>
    [...providerConfigKeys.all, 'wallet-overview', merchantId] as const,
  configurations: (merchantId: string) =>
    [...providerConfigKeys.all, 'configurations', merchantId] as const,
  availableProviders: (merchantId: string) =>
    [...providerConfigKeys.all, 'available-providers', merchantId] as const,
  availableVAs: (merchantId: string, providerId: string) =>
    [...providerConfigKeys.all, 'available-vas', merchantId, providerId] as const,
  routingRules: (merchantId: string, configId: string) =>
    [...providerConfigKeys.all, 'routing-rules', merchantId, configId] as const,
}

export function useWalletOverview(merchantId: string) {
  return useQuery({
    queryKey: providerConfigKeys.walletOverview(merchantId),
    queryFn: () => merchantProviderConfigService.getWalletOverview(merchantId),
    enabled: !!merchantId,
  })
}

export function useSetDefaultWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      providerConfigId,
    }: {
      merchantId: string
      providerConfigId: string
    }) => merchantProviderConfigService.setDefaultWallet(merchantId, providerConfigId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.walletOverview(variables.merchantId),
      })
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.configurations(variables.merchantId),
      })
    },
  })
}

export function useProviderConfigurations(merchantId: string) {
  return useQuery({
    queryKey: providerConfigKeys.configurations(merchantId),
    queryFn: () => merchantProviderConfigService.getProviderConfigurations(merchantId),
    enabled: !!merchantId,
  })
}

export function useAvailableProviders(merchantId: string, enabled: boolean) {
  return useQuery({
    queryKey: providerConfigKeys.availableProviders(merchantId),
    queryFn: () => merchantProviderConfigService.getAvailableProviders(merchantId),
    enabled: !!merchantId && enabled,
  })
}

export function useAvailableVirtualAccounts(
  merchantId: string,
  providerId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: providerConfigKeys.availableVAs(merchantId, providerId),
    queryFn: () =>
      merchantProviderConfigService.getAvailableVirtualAccounts(merchantId, providerId),
    enabled: !!merchantId && !!providerId && enabled,
  })
}

export function useRoutingRules(merchantId: string, configId: string) {
  return useQuery({
    queryKey: providerConfigKeys.routingRules(merchantId, configId),
    queryFn: () => merchantProviderConfigService.getRoutingRules(merchantId, configId),
    enabled: !!merchantId && !!configId,
  })
}

export function useUpdateProviderConfigStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      configId,
      data,
    }: {
      merchantId: string
      configId: string
      data: UpdateProviderConfigStatusData
    }) => merchantProviderConfigService.updateProviderConfigStatus(merchantId, configId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.configurations(variables.merchantId),
      })
    },
  })
}

export function useUpdateVirtualAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      configId,
      virtualAccountId,
    }: {
      merchantId: string
      configId: string
      virtualAccountId: string
    }) =>
      merchantProviderConfigService.updateVirtualAccount(merchantId, configId, virtualAccountId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.configurations(variables.merchantId),
      })
    },
  })
}

export function useRemoveVirtualAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, configId }: { merchantId: string; configId: string }) =>
      merchantProviderConfigService.removeVirtualAccount(merchantId, configId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.configurations(variables.merchantId),
      })
    },
  })
}

export function useUpdateReconciliationMode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      configId,
      reconciliationMode,
    }: {
      merchantId: string
      configId: string
      reconciliationMode: string
    }) =>
      merchantProviderConfigService.updateReconciliationMode(
        merchantId,
        configId,
        reconciliationMode,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.configurations(variables.merchantId),
      })
    },
  })
}

export function useUpdateDailyAmountLimit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      configId,
      dailyAmountLimit,
    }: {
      merchantId: string
      configId: string
      dailyAmountLimit: number
    }) =>
      merchantProviderConfigService.updateDailyAmountLimit(merchantId, configId, dailyAmountLimit),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.configurations(variables.merchantId),
      })
    },
  })
}

export function useAddProviderConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: string; data: AddProviderConfigData }) =>
      merchantProviderConfigService.addProviderConfiguration(merchantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.configurations(variables.merchantId),
      })
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.availableProviders(variables.merchantId),
      })
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.walletOverview(variables.merchantId),
      })
    },
  })
}

export function useAddRoutingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      configId,
      data,
    }: {
      merchantId: string
      configId: string
      data: AddRoutingRuleData
    }) => merchantProviderConfigService.addRoutingRule(merchantId, configId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.routingRules(variables.merchantId, variables.configId),
      })
    },
  })
}

export function useUpdateRoutingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      configId,
      ruleId,
      data,
    }: {
      merchantId: string
      configId: string
      ruleId: string
      data: UpdateRoutingRuleData
    }) => merchantProviderConfigService.updateRoutingRule(merchantId, configId, ruleId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.routingRules(variables.merchantId, variables.configId),
      })
    },
  })
}

export function useDeleteRoutingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      configId,
      ruleId,
    }: {
      merchantId: string
      configId: string
      ruleId: string
    }) => merchantProviderConfigService.deleteRoutingRule(merchantId, configId, ruleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: providerConfigKeys.routingRules(variables.merchantId, variables.configId),
      })
    },
  })
}
