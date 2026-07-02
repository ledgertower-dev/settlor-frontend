// Routing-rule fee preview returned by POST /api/v1/fee-rules/calculate.
// All monetary fields are in display rupees.
export interface FeeCalculation {
  merchantId: string
  amount: number
  fee: number
  netAmount: number
  currency: string
  commission: number
  gst: number
  routingRuleId: string
  providerConfigId: string
}
