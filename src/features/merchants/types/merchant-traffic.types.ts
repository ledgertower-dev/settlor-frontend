export interface Provider {
  id: string
  name: string
  label: string
}

export interface ProviderChannel {
  id: string
  providerId: string
  providerName: string
  providerLabel: string
  label: string
  purpose: string
  status: string
  supportedPaymentModes: string[]
}
