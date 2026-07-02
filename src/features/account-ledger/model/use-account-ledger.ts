import { useQuery, useMutation } from '@tanstack/react-query'

import { accountLedgerService } from '../api/account-ledger.api'
import type { GetLedgerParams } from '../types'

export const ledgerKeys = {
  all: ['ledger'] as const,
  list: (params: GetLedgerParams | undefined) => [...ledgerKeys.all, 'list', params ?? {}] as const,
}

/**
 * Fetch the account ledger list. Backend handles filtering/pagination/scoping.
 */
export function useLedger(params?: GetLedgerParams) {
  return useQuery({
    queryKey: ledgerKeys.list(params),
    queryFn: () => accountLedgerService.getLedger(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

/**
 * Export the account ledger as CSV (direct download). Uses the current list
 * filters/scoping via GET /ledger/export.
 */
export function useExportLedgerCSV() {
  return useMutation({
    mutationFn: (params: Omit<GetLedgerParams, 'page' | 'perPage'>) =>
      accountLedgerService.exportCSV(params),
  })
}
