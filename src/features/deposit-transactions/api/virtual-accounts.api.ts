/**
 * Virtual Accounts API Service
 *
 * Used by the deposit flow to get the merchant's active virtual accounts
 * (the "to" / beneficiary side of a deposit).
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'

interface BackendVirtualAccount {
  virtual_account_id: string
  label: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  account_type?: string
  va_code?: string
  provider_id: string
  provider_name: string
  provider_code: string
  wallet_id: string
  currency: string
  status: string
  is_default: boolean
  assigned_at: string
}

interface VirtualAccountsResponse {
  success: boolean
  data: BackendVirtualAccount[]
}

export interface VirtualAccount {
  id: string
  label: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  accountType?: string
  vaCode?: string
  providerId: string
  providerName: string
  providerCode: string
  walletId: string
  currency: string
  status: string
  isDefault: boolean
  assignedAt: string
}

function transformVirtualAccount(b: BackendVirtualAccount): VirtualAccount {
  return {
    id: b.virtual_account_id,
    label: b.label,
    bankName: b.bank_name,
    accountHolderName: b.account_holder_name,
    accountNumber: b.account_number,
    ifsc: b.ifsc,
    accountType: b.account_type,
    vaCode: b.va_code,
    providerId: b.provider_id,
    providerName: b.provider_name,
    providerCode: b.provider_code,
    walletId: b.wallet_id,
    currency: b.currency,
    status: b.status,
    isDefault: b.is_default,
    assignedAt: b.assigned_at,
  }
}

interface BackendBankAccount {
  id: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  account_type?: string
  status?: string
}

interface BankAccountsResponse {
  success: boolean
  data: BackendBankAccount[]
}

export interface MerchantBankAccount {
  id: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  accountType?: string
  status?: string
}

function transformBankAccount(b: BackendBankAccount): MerchantBankAccount {
  return {
    id: b.id,
    bankName: b.bank_name,
    accountHolderName: b.account_holder_name,
    accountNumber: b.account_number,
    ifsc: b.ifsc,
    accountType: b.account_type,
    status: b.status,
  }
}

class VirtualAccountsService {
  async getMyVirtualAccounts(): Promise<VirtualAccount[]> {
    try {
      const response = await apiClient.get<VirtualAccountsResponse>('/me/virtual-accounts')
      const items = Array.isArray(response.data?.data) ? response.data.data : []
      return items.map(transformVirtualAccount)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getMyBankAccounts(purpose: string): Promise<MerchantBankAccount[]> {
    try {
      const response = await apiClient.get<BankAccountsResponse>('/me/settings/bank-accounts', {
        params: { purpose, status: 'APPROVED' },
      })
      const items = Array.isArray(response.data?.data) ? response.data.data : []
      return items.map(transformBankAccount)
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const virtualAccountsService = new VirtualAccountsService()
