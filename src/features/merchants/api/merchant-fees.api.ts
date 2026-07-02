import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type { FeeCalculation } from '../types/merchant-fees.types'

interface BackendFeeCalculation {
  merchant_id: string
  amount: number
  fee: number
  net_amount: number
  currency: string
  commission: number
  gst: number
  routing_rule_id: string
  provider_config_id: string
}

interface CalculateFeeResponse {
  success: boolean
  data: BackendFeeCalculation
}

export interface CalculateFeeData {
  amount: number
  wallet_id: string
  payment_mode: 'NEFT' | 'IMPS' | 'RTGS' | 'UPI'
  merchant_id?: string
}

class MerchantFeesService {
  async calculate(data: CalculateFeeData): Promise<FeeCalculation> {
    try {
      const response = await apiClient.post<CalculateFeeResponse>('/fee-rules/calculate', data)
      const d = response.data.data
      return {
        merchantId: d.merchant_id,
        amount: d.amount,
        fee: d.fee,
        netAmount: d.net_amount,
        currency: d.currency,
        commission: d.commission,
        gst: d.gst,
        routingRuleId: d.routing_rule_id,
        providerConfigId: d.provider_config_id,
      }
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const merchantFeesService = new MerchantFeesService()
