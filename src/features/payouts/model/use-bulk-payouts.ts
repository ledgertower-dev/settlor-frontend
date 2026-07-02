import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { bulkPayoutsService, type BulkUploadResult } from '../api/bulk-payouts.api'
import { isBulkTerminal } from '../types/bulk'
import { payoutKeys } from './use-payouts'

export const bulkPayoutKeys = {
  all: [...payoutKeys.all, 'bulk'] as const,
  batch: (id: string) => [...bulkPayoutKeys.all, 'batch', id] as const,
}

export function useDownloadBulkTemplate() {
  return useMutation({ mutationFn: () => bulkPayoutsService.downloadTemplate() })
}

export function useValidateBulk() {
  return useMutation({ mutationFn: (file: File) => bulkPayoutsService.validate(file) })
}

export function useUploadBulk() {
  const queryClient = useQueryClient()
  return useMutation<BulkUploadResult, Error, { file: File; idempotencyKey: string }>({
    mutationFn: ({ file, idempotencyKey }) => bulkPayoutsService.upload(file, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutKeys.lists() })
      queryClient.invalidateQueries({ queryKey: payoutKeys.balance() })
      queryClient.invalidateQueries({ queryKey: payoutKeys.wallets() })
    },
  })
}

/**
 * Poll a bulk batch until it reaches a terminal status, then stop.
 */
export function useBulkBatch(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bulkPayoutKeys.batch(id ?? ''),
    queryFn: () => bulkPayoutsService.getBatch(id as string),
    enabled: enabled && !!id,
    refetchInterval: query => (isBulkTerminal(query.state.data?.status) ? false : 2500),
  })
}

export function useDownloadBulkResult() {
  return useMutation({ mutationFn: (id: string) => bulkPayoutsService.downloadResult(id) })
}
