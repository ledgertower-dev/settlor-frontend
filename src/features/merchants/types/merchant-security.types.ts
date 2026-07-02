export interface WebhookEvent {
  id: string
  name: string
  description?: string
}

export interface EventSubscriptions {
  subscribedEventIds: string[]
}

export interface WhitelistIP {
  id: string
  ipAddress: string
  type: string
  description: string
  isActive: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
}

export interface WhitelistBankAccount {
  id: string
  purpose: string
  entryMode: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  alternateAccountNumber?: string
  alternateIfsc?: string
  accountType: 'SAVINGS' | 'CURRENT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
  approvalRemarks: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}
