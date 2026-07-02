import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantsService } from '../api/merchants.api'
import type { GetMerchantsParams } from '../api/merchants.api'
import type { MerchantStatus } from '../types'

export const merchantKeys = {
  all: ['merchants'] as const,
  list: (params: object) => [...merchantKeys.all, 'list', params] as const,
  details: () => [...merchantKeys.all, 'detail'] as const,
  detail: (id: string) => [...merchantKeys.details(), id] as const,
}

export function useMerchants(params?: GetMerchantsParams) {
  return useQuery({
    queryKey: merchantKeys.list(params ?? {}),
    queryFn: () => merchantsService.getMerchants(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useMerchantDetail(id: string) {
  return useQuery({
    queryKey: merchantKeys.detail(id),
    queryFn: () => merchantsService.getMerchantDetail(id),
    enabled: !!id,
  })
}

export function useUpdateMerchantStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
      remarks,
    }: {
      id: string
      status: MerchantStatus
      remarks?: string
    }) => merchantsService.updateMerchantStatus(id, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantKeys.all })
    },
  })
}
