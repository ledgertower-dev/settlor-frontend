import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantKycService } from '../api/merchant-kyc.api'
import { merchantKeys } from './use-merchants'
import type { ReviewDocumentPayload } from '../types/merchant-kyc.types'

export const merchantKycKeys = {
  all: ['merchants', 'kyc'] as const,
  detail: (merchantId: string) => [...merchantKycKeys.all, merchantId] as const,
}

export function useMerchantKyc(merchantId: string) {
  return useQuery({
    queryKey: merchantKycKeys.detail(merchantId),
    queryFn: () => merchantKycService.getKycDetail(merchantId),
    enabled: !!merchantId,
  })
}

export function useReviewDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      docId,
      payload,
    }: {
      merchantId: string
      docId: string
      payload: ReviewDocumentPayload
    }) => merchantKycService.reviewDocument(merchantId, docId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: merchantKycKeys.detail(variables.merchantId),
      })
    },
  })
}

export function useFinalizeApprove() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId }: { merchantId: string }) =>
      merchantKycService.finalizeApprove(merchantId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: merchantKycKeys.detail(variables.merchantId),
      })
      queryClient.invalidateQueries({
        queryKey: merchantKeys.detail(variables.merchantId),
      })
      queryClient.invalidateQueries({
        queryKey: merchantKeys.all,
      })
    },
  })
}

export function useRequestResubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ merchantId }: { merchantId: string }) =>
      merchantKycService.requestResubmission(merchantId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: merchantKycKeys.detail(variables.merchantId),
      })
    },
  })
}
