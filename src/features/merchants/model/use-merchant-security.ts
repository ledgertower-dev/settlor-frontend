import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantSecurityService } from '../api/merchant-security.api'
import type {
  CreateWhitelistIPData,
  UpdateWhitelistIPData,
  CreateBankAccountData,
  UpdateBankAccountData,
  UpdateWebhookData,
  UpdateEventSubscriptionsData,
} from '../api/merchant-security.api'

export const securityKeys = {
  all: ['securitySettings'] as const,
  detail: (merchantId: string) => [...securityKeys.all, merchantId] as const,
}

export const whitelistIPKeys = {
  all: ['whitelistIPs'] as const,
  lists: (merchantId: string) => [...whitelistIPKeys.all, 'list', merchantId] as const,
  list: (merchantId: string, params?: { page?: number; per_page?: number }) =>
    [...whitelistIPKeys.all, 'list', merchantId, params] as const,
}

export const bankAccountKeys = {
  all: ['bankAccounts'] as const,
  list: (
    merchantId: string,
    scope: 'active' | 'archived',
    params?: { page?: number; per_page?: number },
  ) => [...bankAccountKeys.all, 'list', merchantId, scope, params] as const,
}

export const webhookKeys = {
  all: ['webhooks'] as const,
  detail: (merchantId: string) => [...webhookKeys.all, merchantId] as const,
}

export const webhookEventKeys = {
  all: ['webhookEvents'] as const,
}

export const eventSubscriptionKeys = {
  all: ['eventSubscriptions'] as const,
  detail: (merchantId: string) => [...eventSubscriptionKeys.all, merchantId] as const,
}

export function useSecuritySettings(merchantId: string) {
  return useQuery({
    queryKey: securityKeys.detail(merchantId),
    queryFn: () => merchantSecurityService.getSecuritySettings(merchantId),
    enabled: !!merchantId,
  })
}

export function useWhitelistIPs(merchantId: string, params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: whitelistIPKeys.list(merchantId, params),
    queryFn: () => merchantSecurityService.getWhitelistIPs(merchantId, params),
    enabled: !!merchantId,
  })
}

export function useCreateWhitelistIP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: string; data: CreateWhitelistIPData }) =>
      merchantSecurityService.createWhitelistIP(merchantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: whitelistIPKeys.lists(variables.merchantId) })
    },
  })
}

export function useUpdateWhitelistIP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      whitelistId,
      data,
    }: {
      merchantId: string
      whitelistId: string
      data: UpdateWhitelistIPData
    }) => merchantSecurityService.updateWhitelistIP(merchantId, whitelistId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: whitelistIPKeys.lists(variables.merchantId) })
    },
  })
}

export function useSwitchWhitelistIP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, enabled }: { merchantId: string; enabled: boolean }) =>
      merchantSecurityService.switchWhitelistIP(merchantId, enabled),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: whitelistIPKeys.lists(variables.merchantId) })
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ merchantId, newPassword }: { merchantId: string; newPassword: string }) =>
      merchantSecurityService.resetPassword(merchantId, newPassword),
  })
}

export function useSwitch2FA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, enabled }: { merchantId: string; enabled: boolean }) =>
      merchantSecurityService.switch2FA(merchantId, enabled),
    onSuccess: (_data, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: securityKeys.detail(merchantId) })
    },
  })
}

export function useDeleteWhitelistIP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, whitelistId }: { merchantId: string; whitelistId: string }) =>
      merchantSecurityService.deleteWhitelistIP(merchantId, whitelistId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: whitelistIPKeys.lists(variables.merchantId) })
    },
  })
}

export function useUpdateWhitelistIPStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      whitelistId,
      data,
    }: {
      merchantId: string
      whitelistId: string
      data: {
        status: 'APPROVED' | 'REJECTED'
        approval_remarks?: string
        rejection_reason?: string
      }
    }) => merchantSecurityService.updateWhitelistIPStatus(merchantId, whitelistId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: whitelistIPKeys.lists(variables.merchantId) })
    },
  })
}

export function useBankAccounts(
  merchantId: string,
  scope: 'active' | 'archived' = 'active',
  params?: { page?: number; per_page?: number },
) {
  return useQuery({
    queryKey: bankAccountKeys.list(merchantId, scope, params),
    queryFn: () => merchantSecurityService.getBankAccounts(merchantId, scope, params),
    enabled: !!merchantId,
  })
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: string; data: CreateBankAccountData }) =>
      merchantSecurityService.createBankAccount(merchantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      bankAccountId,
      data,
    }: {
      merchantId: string
      bankAccountId: string
      data: UpdateBankAccountData
    }) => merchantSecurityService.updateBankAccount(merchantId, bankAccountId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
}

export function useArchiveBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      bankAccountId,
      archived,
    }: {
      merchantId: string
      bankAccountId: string
      archived: boolean
    }) => merchantSecurityService.archiveBankAccount(merchantId, bankAccountId, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
}

export function useUpdateBankAccountStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      bankAccountId,
      data,
    }: {
      merchantId: string
      bankAccountId: string
      data: {
        status: 'APPROVED' | 'REJECTED'
        approval_remarks?: string
        rejection_reason?: string
      }
    }) => merchantSecurityService.updateBankAccountStatus(merchantId, bankAccountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, bankAccountId }: { merchantId: string; bankAccountId: string }) =>
      merchantSecurityService.deleteBankAccount(merchantId, bankAccountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all })
    },
  })
}

export function useWebhooks(merchantId: string) {
  return useQuery({
    queryKey: webhookKeys.detail(merchantId),
    queryFn: () => merchantSecurityService.getWebhooks(merchantId),
    enabled: !!merchantId,
  })
}

export function useUpdateWebhooks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId, data }: { merchantId: string; data: UpdateWebhookData }) =>
      merchantSecurityService.updateWebhooks(merchantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.detail(variables.merchantId) })
    },
  })
}

export function useWebhookEvents() {
  return useQuery({
    queryKey: webhookEventKeys.all,
    queryFn: () => merchantSecurityService.getWebhookEvents(),
  })
}

export function useEventSubscriptions(merchantId: string) {
  return useQuery({
    queryKey: eventSubscriptionKeys.detail(merchantId),
    queryFn: () => merchantSecurityService.getEventSubscriptions(merchantId),
    enabled: !!merchantId,
  })
}

export function useUpdateEventSubscriptions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      data,
    }: {
      merchantId: string
      data: UpdateEventSubscriptionsData
    }) => merchantSecurityService.updateEventSubscriptions(merchantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: eventSubscriptionKeys.detail(variables.merchantId),
      })
    },
  })
}
