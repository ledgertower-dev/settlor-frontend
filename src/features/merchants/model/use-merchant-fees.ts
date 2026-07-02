import { useQuery } from '@tanstack/react-query'
import { merchantFeesService, type CalculateFeeData } from '../api/merchant-fees.api'

export const feeCalculationKeys = {
  all: ['feeCalculation'] as const,
  detail: (params: CalculateFeeData) =>
    [
      ...feeCalculationKeys.all,
      params.wallet_id,
      params.payment_mode,
      params.amount,
      params.merchant_id ?? '',
    ] as const,
}

/**
 * useCalculateFee returns the routing-rule fee preview for a payout.
 * Requires wallet_id + payment_mode + amount > 0; otherwise the query is
 * disabled and `data` is undefined.
 */
export function useCalculateFee(params: {
  amount: number
  walletId: string
  paymentMode: 'NEFT' | 'IMPS' | 'RTGS' | 'UPI' | ''
  merchantId?: string
}) {
  const ready = params.amount > 0 && params.walletId !== '' && params.paymentMode !== ''
  const query: CalculateFeeData = {
    amount: params.amount,
    wallet_id: params.walletId,
    payment_mode: ready ? (params.paymentMode as CalculateFeeData['payment_mode']) : 'NEFT',
    merchant_id: params.merchantId,
  }
  return useQuery({
    queryKey: feeCalculationKeys.detail(query),
    queryFn: () => merchantFeesService.calculate(query),
    enabled: ready,
    retry: false,
    staleTime: 0,
  })
}
