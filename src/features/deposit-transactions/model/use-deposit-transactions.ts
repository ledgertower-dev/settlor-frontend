import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  depositTransactionsService,
  type ApproveDepositRequest,
  type RejectDepositRequest,
  type RevertDepositRequest,
} from '../api/deposit-transactions.api'
import type { GetDepositsParams } from '../types'

export const depositKeys = {
  all: ['deposits'] as const,
  list: (params: GetDepositsParams | undefined) =>
    [...depositKeys.all, 'list', params ?? {}] as const,
  metrics: () => [...depositKeys.all, 'metrics'] as const,
}

export function useDepositMetrics() {
  return useQuery({
    queryKey: depositKeys.metrics(),
    queryFn: () => depositTransactionsService.getMetrics(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

/**
 * Fetch the deposits list. Backend handles all filtering/pagination/sorting.
 */
export function useDeposits(params?: GetDepositsParams) {
  return useQuery({
    queryKey: depositKeys.list(params),
    queryFn: () => depositTransactionsService.getDeposits(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useExportDepositsCSV() {
  return useMutation({
    mutationFn: (params: GetDepositsParams) => depositTransactionsService.exportCSV(params),
  })
}

export function useApproveDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveDepositRequest }) =>
      depositTransactionsService.approveDeposit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depositKeys.all })
    },
  })
}

export function useRejectDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectDepositRequest }) =>
      depositTransactionsService.rejectDeposit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depositKeys.all })
    },
  })
}

export function useRevertDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RevertDepositRequest }) =>
      depositTransactionsService.revertDeposit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depositKeys.all })
    },
  })
}
