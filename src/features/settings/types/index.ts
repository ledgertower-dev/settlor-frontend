export interface TwoFactorStatus {
  twoFaEnabled: boolean
  twoFaMethod: string
  twoFaEnforced: boolean
  canDisable: boolean
  authAppConfigured: boolean
  maskedEmail: string
}

export interface AuthAppSetupResponse {
  challengeId: string
  otpauthUri: string
  qrCodeDataUrl: string
  expiresInSeconds: number
}

export interface AuthAppConfirmRequest {
  challengeId: string
  code: string
}

export interface SwitchMethodRequest {
  twoFaMethod: string
  authenticatorCode: string
}

export interface WhitelistBankAccount {
  id: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  accountType: string
  status: string
  rejectionReason?: string
  approvalRemarks?: string
}

export interface WhitelistBankAccountRequest {
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  accountType: string
}

export interface ApiCredentials {
  id: string
  apiKey: string
  saltKey: string | null
  saltKeyFingerprint: string | null
  status: string
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  lastUsedAt: string | null
}

export interface VirtualAccountAssignment {
  id: string
  merchantId: string
  merchantName: string
  merchantCode: string
  merchantEmail: string
  assignedBy: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VirtualAccountAdmin {
  id: string
  label: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  accountType: string
  entryMode: string
  status: string
  providerId: string
  providerName: string
  providerLabel: string
  createdAt: string
  updatedAt: string
  assignments: VirtualAccountAssignment[]
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

export interface MaintenanceSchedule {
  id: string
  name: string
  description: string
  ipAddress: string
  fromAt: string
  toAt: string
  status: string
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}
