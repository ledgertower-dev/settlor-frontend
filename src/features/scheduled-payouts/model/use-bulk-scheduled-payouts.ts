import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  bulkScheduledPayoutsService,
  type BulkScheduledUploadResult,
} from '../api/bulk-scheduled-payouts.api'
import { isSchedTerminal } from '../types/bulk'
import { scheduledPayoutKeys } from './use-scheduled-payouts'

export const bulkScheduledKeys = {
  all: [...scheduledPayoutKeys.all, 'bulk'] as const,
  batch: (id: string) => [...bulkScheduledKeys.all, 'batch', id] as const,
}

export function useDownloadBulkScheduledTemplate() {
  return useMutation({ mutationFn: () => bulkScheduledPayoutsService.downloadTemplate() })
}

export function useValidateBulkScheduled() {
  return useMutation({ mutationFn: (file: File) => bulkScheduledPayoutsService.validate(file) })
}

export function useUploadBulkScheduled() {
  const queryClient = useQueryClient()
  return useMutation<BulkScheduledUploadResult, Error, { file: File; idempotencyKey: string }>({
    mutationFn: ({ file, idempotencyKey }) =>
      bulkScheduledPayoutsService.upload(file, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.lists() })
    },
  })
}

/**
 * Poll a bulk scheduled batch until it reaches a terminal status, then stop.
 */
export function useBulkScheduledBatch(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: bulkScheduledKeys.batch(id ?? ''),
    queryFn: () => bulkScheduledPayoutsService.getBatch(id as string),
    enabled: enabled && !!id,
    refetchInterval: query => (isSchedTerminal(query.state.data?.status) ? false : 2500),
  })
}

export function useDownloadBulkScheduledResult() {
  return useMutation({ mutationFn: (id: string) => bulkScheduledPayoutsService.downloadResult(id) })
}
