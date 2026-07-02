import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  walletAdjustmentsService,
  type GetAllAdjustmentsParams,
  type GetAdjustmentsParams,
} from '../api/wallet-adjustments.api'
import type { CreateAdjustmentPayload } from '../types'

export const walletAdjustmentKeys = {
  all: ['wallet-adjustments'] as const,
  allList: (params: object) => [...walletAdjustmentKeys.all, 'all-list', params] as const,
  list: (merchantId: string, walletId: string, params: object) =>
    [...walletAdjustmentKeys.all, 'list', merchantId, walletId, params] as const,
  merchantWallets: (merchantId: string) =>
    [...walletAdjustmentKeys.all, 'merchant-wallets', merchantId] as const,
}

/** Wallets for a merchant (drawer wallet selector) */
export function useMerchantWallets(merchantId: string | null) {
  return useQuery({
    queryKey: walletAdjustmentKeys.merchantWallets(merchantId ?? ''),
    queryFn: () => walletAdjustmentsService.getMerchantWallets(merchantId!),
    enabled: !!merchantId,
  })
}

/** All adjustment logs (admin page table) */
export function useAllAdjustments(params?: GetAllAdjustmentsParams) {
  return useQuery({
    queryKey: walletAdjustmentKeys.allList(params ?? {}),
    queryFn: () => walletAdjustmentsService.getAllAdjustments(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

/** Adjustments for a specific merchant wallet */
export function useAdjustmentLog(
  merchantId: string | null,
  walletId: string | null,
  params?: GetAdjustmentsParams,
) {
  return useQuery({
    queryKey: walletAdjustmentKeys.list(merchantId ?? '', walletId ?? '', params ?? {}),
    queryFn: () => walletAdjustmentsService.getAdjustments(merchantId!, walletId!, params),
    enabled: !!merchantId && !!walletId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      walletId,
      payload,
    }: {
      merchantId: string
      walletId: string
      payload: CreateAdjustmentPayload
    }) => walletAdjustmentsService.createAdjustment(merchantId, walletId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletAdjustmentKeys.all })
    },
  })
}
