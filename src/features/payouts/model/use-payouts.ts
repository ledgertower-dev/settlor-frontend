import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payoutsService } from '../api/payouts.api'
import type { PayoutListParams, CreatePayoutRequest, StatusOverrideRequest } from '../types'

// ============================================================================
// Query Keys
// ============================================================================

export const payoutKeys = {
  all: ['payouts'] as const,
  lists: () => [...payoutKeys.all, 'list'] as const,
  list: (params: PayoutListParams) => [...payoutKeys.lists(), params] as const,
  details: () => [...payoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...payoutKeys.details(), id] as const,
  balance: () => [...payoutKeys.all, 'balance'] as const,
  wallets: () => ['me', 'wallets'] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

export function usePayouts(params?: PayoutListParams) {
  return useQuery({
    queryKey: payoutKeys.list(params ?? {}),
    queryFn: () => payoutsService.getPayouts(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useMyWallets(enabled: boolean = true) {
  return useQuery({
    queryKey: payoutKeys.wallets(),
    queryFn: () => payoutsService.getMyWallets(),
    enabled,
    staleTime: 0,
  })
}

export function usePayoutBalance() {
  return useQuery({
    queryKey: payoutKeys.balance(),
    queryFn: () => payoutsService.getBalance(),
    staleTime: 0,
  })
}

export function usePayout(id: string | null) {
  return useQuery({
    queryKey: payoutKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('Payout ID is required')
      return payoutsService.getPayout(id)
    },
    enabled: !!id,
    staleTime: 0,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useExportPayoutsCSV() {
  return useMutation({
    mutationFn: (params: Omit<PayoutListParams, 'page' | 'per_page'>) =>
      payoutsService.exportCSV(params),
  })
}

export function useCreatePayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePayoutRequest) => payoutsService.createPayout(data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: payoutKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: payoutKeys.balance() }),
        queryClient.invalidateQueries({ queryKey: payoutKeys.wallets() }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }),
      ])
    },
  })
}

export function useOverridePayoutStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payoutId, data }: { payoutId: string; data: StatusOverrideRequest }) =>
      payoutsService.overrideStatus(payoutId, data),
    onSuccess: async (_, { payoutId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: payoutKeys.detail(payoutId) }),
        queryClient.invalidateQueries({ queryKey: payoutKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: payoutKeys.balance() }),
      ])
    },
  })
}
