export interface Provider {
  id: string
  name: string
  code: string
  type: string
  status: string
  providerIdDisplay: string
  service: string
  shortCode: string
  description: string
}

export interface ProviderChannel {
  id: string
  name: string
  status: string
  webhookUrl: string
  webhookSecretMasked: string
  apiKeyMasked: string
  usedByMerchants: number
}

export interface ProviderVirtualAccount {
  id: string
  providerId: string
  providerName: string
  providerLabel: string
  vaCode: string
  label: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  accountType: string
  entryMode: string
  status: string
  assignmentStatus: string
  createdAt: string
  updatedAt: string
  merchantId?: string
  merchantName?: string
  merchantCode?: string
}

export interface ProviderDetail extends Provider {}
