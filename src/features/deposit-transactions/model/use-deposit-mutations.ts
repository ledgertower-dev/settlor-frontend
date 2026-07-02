import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  depositTransactionsService,
  type CreateDepositRequest,
} from '../api/deposit-transactions.api'
import { virtualAccountsService } from '../api/virtual-accounts.api'
import { depositKeys } from './use-deposit-transactions'

export const virtualAccountKeys = {
  all: ['virtualAccounts'] as const,
  me: () => [...virtualAccountKeys.all, 'me'] as const,
}

export function useMyVirtualAccounts(enabled: boolean = true) {
  return useQuery({
    queryKey: virtualAccountKeys.me(),
    queryFn: () => virtualAccountsService.getMyVirtualAccounts(),
    enabled,
  })
}

export const bankAccountKeys = {
  all: ['myBankAccounts'] as const,
  byPurpose: (purpose: string) => [...bankAccountKeys.all, purpose] as const,
}

export function useMyBankAccounts(purpose: string, enabled: boolean = true) {
  return useQuery({
    queryKey: bankAccountKeys.byPurpose(purpose),
    queryFn: () => virtualAccountsService.getMyBankAccounts(purpose),
    enabled,
  })
}

export function useCreateDeposit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDepositRequest) => depositTransactionsService.createDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depositKeys.all })
    },
  })
}
