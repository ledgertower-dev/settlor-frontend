import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { normalizePaginationMeta } from '@/lib/api/api-utils'
import type { PaginationMeta } from '@/lib/types/pagination.types'
import type {
  WhitelistIP,
  SecuritySettings,
  WhitelistBankAccount,
  WebhookEvent,
  EventSubscriptions,
} from '../types/merchant-security.types'

// Backend response shape (snake_case)
interface BackendWhitelistIP {
  id: string
  ip_address: string
  description: string
  type: string
  is_active: boolean
  status: string
  created_at: string
  updated_at: string
}

interface WhitelistIPListResponse {
  success: boolean
  data: {
    ip_whitelist_enabled: boolean
    items: BackendWhitelistIP[]
  }
  meta?: { page: number; per_page: number; total: number; total_pages: number }
}

interface WhitelistIPResponse {
  success: boolean
  data: BackendWhitelistIP
}

function transformWhitelistIP(b: BackendWhitelistIP): WhitelistIP {
  return {
    id: b.id,
    ipAddress: b.ip_address,
    description: b.description,
    type: b.type,
    isActive: b.is_active,
    status: b.status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

export interface CreateWhitelistIPData {
  ip_address: string
  description?: string
  type: string
  is_active: boolean
}

export interface UpdateWhitelistIPData {
  ip_address?: string
  description?: string
  type?: string
}

// Backend response shape for bank accounts (snake_case)
interface BackendBankAccount {
  id: string
  purpose: string
  entry_mode: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  alternate_account_number?: string
  alternate_ifsc?: string
  account_type: 'SAVINGS' | 'CURRENT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
  approval_remarks: string
  is_default: boolean
  created_at: string
  updated_at: string
}

interface BankAccountListResponse {
  success: boolean
  data: BackendBankAccount[]
  meta?: { page: number; per_page: number; total: number; total_pages: number }
}

interface BankAccountResponse {
  success: boolean
  data: BackendBankAccount
}

function transformBankAccount(b: BackendBankAccount): WhitelistBankAccount {
  return {
    id: b.id,
    purpose: b.purpose,
    entryMode: b.entry_mode,
    bankName: b.bank_name,
    accountHolderName: b.account_holder_name,
    accountNumber: b.account_number,
    ifsc: b.ifsc,
    alternateAccountNumber: b.alternate_account_number,
    alternateIfsc: b.alternate_ifsc,
    accountType: b.account_type,
    status: b.status,
    approvalRemarks: b.approval_remarks,
    isDefault: b.is_default,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

export interface CreateBankAccountData {
  purpose: string
  entry_mode: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  account_type: 'SAVINGS' | 'CURRENT'
  status: string
  approval_remarks?: string
  is_default: boolean
  alternate_account_number?: string
  alternate_ifsc?: string
}

export interface UpdateBankAccountData {
  bank_name?: string
  account_holder_name?: string
  account_number?: string
  ifsc?: string
  account_type?: 'SAVINGS' | 'CURRENT'
  status?: string
  approval_remarks?: string
  is_default?: boolean
  alternate_account_number?: string
  alternate_ifsc?: string
}

export interface WebhookSettings {
  payoutCallbackUrl: string
  depositCallbackUrl: string
  adminCallbackUrl: string
}

export interface UpdateWebhookData {
  payout_callback_url?: string
  deposit_callback_url?: string
  admin_callback_url?: string
}

export interface UpdateEventSubscriptionsData {
  event_ids: string[]
}

interface WebhookSettingsResponse {
  success: boolean
  data: {
    payout_callback_url?: string
    deposit_callback_url?: string
    admin_callback_url?: string
  }
}

interface BackendWebhookEvent {
  id: string
  name: string
  description?: string
}

interface WebhookEventsResponse {
  success: boolean
  data: BackendWebhookEvent[]
}

interface EventSubscriptionsResponse {
  success: boolean
  data: {
    event_ids: string[]
  }
}

interface SecuritySettingsResponse {
  success: boolean
  data: {
    two_fa_enabled: boolean
  }
}

class MerchantSecurityService {
  async getSecuritySettings(merchantId: string): Promise<SecuritySettings> {
    try {
      const response = await apiClient.get<SecuritySettingsResponse>(
        `/merchants/${merchantId}/settings/security`,
      )
      return {
        twoFactorEnabled: response.data.data.two_fa_enabled,
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async getWhitelistIPs(
    merchantId: string,
    params?: { page?: number; per_page?: number },
  ): Promise<{ items: WhitelistIP[]; ipWhitelistEnabled: boolean; pagination: PaginationMeta }> {
    try {
      const response = await apiClient.get<WhitelistIPListResponse>(
        `/merchants/${merchantId}/settings/ip-whitelists`,
        { params },
      )
      const items = response.data.data.items.map(transformWhitelistIP)
      const meta = response.data.meta
      return {
        items,
        ipWhitelistEnabled: response.data.data.ip_whitelist_enabled,
        pagination: meta
          ? normalizePaginationMeta(meta)
          : {
              page: params?.page ?? 1,
              perPage: params?.per_page ?? items.length,
              total: items.length,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async createWhitelistIP(merchantId: string, data: CreateWhitelistIPData): Promise<WhitelistIP> {
    try {
      const response = await apiClient.post<WhitelistIPResponse>(
        `/merchants/${merchantId}/settings/ip-whitelists`,
        data,
      )
      return transformWhitelistIP(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateWhitelistIP(
    merchantId: string,
    whitelistId: string,
    data: UpdateWhitelistIPData,
  ): Promise<WhitelistIP> {
    try {
      const response = await apiClient.patch<WhitelistIPResponse>(
        `/merchants/${merchantId}/settings/ip-whitelists/${whitelistId}`,
        data,
      )
      return transformWhitelistIP(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async switchWhitelistIP(merchantId: string, enabled: boolean): Promise<void> {
    try {
      await apiClient.patch(`/merchants/${merchantId}/settings/ip-whitelists/switch`, { enabled })
    } catch (error) {
      throwApiError(error)
    }
  }

  async resetPassword(merchantId: string, newPassword: string): Promise<void> {
    try {
      await apiClient.patch(`/merchants/${merchantId}/settings/security/password`, {
        new_password: newPassword,
      })
    } catch (error) {
      throwApiError(error)
    }
  }

  async switch2FA(merchantId: string, enabled: boolean): Promise<void> {
    try {
      await apiClient.patch(`/merchants/${merchantId}/settings/security/2fa`, { enabled })
    } catch (error) {
      throwApiError(error)
    }
  }

  async deleteWhitelistIP(merchantId: string, whitelistId: string): Promise<void> {
    try {
      await apiClient.delete(`/merchants/${merchantId}/settings/ip-whitelists/${whitelistId}`)
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateWhitelistIPStatus(
    merchantId: string,
    whitelistId: string,
    data: { status: 'APPROVED' | 'REJECTED'; approval_remarks?: string; rejection_reason?: string },
  ): Promise<WhitelistIP> {
    try {
      const response = await apiClient.patch<WhitelistIPResponse>(
        `/merchants/${merchantId}/settings/ip-whitelists/${whitelistId}/status`,
        data,
      )
      return transformWhitelistIP(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getBankAccounts(
    merchantId: string,
    scope: 'active' | 'archived' = 'active',
    params?: { page?: number; per_page?: number },
  ): Promise<{ data: { items: WhitelistBankAccount[] }; meta: { pagination: PaginationMeta } }> {
    try {
      const response = await apiClient.get<BankAccountListResponse>(
        `/merchants/${merchantId}/settings/bank-accounts`,
        { params: { scope, ...params } },
      )
      const items = response.data.data.map(transformBankAccount)
      const meta = response.data.meta
      return {
        data: { items },
        meta: {
          pagination: meta
            ? normalizePaginationMeta(meta)
            : {
                page: params?.page ?? 1,
                perPage: params?.per_page ?? items.length,
                total: items.length,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
              },
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async createBankAccount(
    merchantId: string,
    data: CreateBankAccountData,
  ): Promise<WhitelistBankAccount> {
    try {
      const response = await apiClient.post<BankAccountResponse>(
        `/merchants/${merchantId}/settings/bank-accounts`,
        data,
      )
      return transformBankAccount(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateBankAccount(
    merchantId: string,
    bankAccountId: string,
    data: UpdateBankAccountData,
  ): Promise<WhitelistBankAccount> {
    try {
      const response = await apiClient.patch<BankAccountResponse>(
        `/merchants/${merchantId}/settings/bank-accounts/${bankAccountId}`,
        data,
      )
      return transformBankAccount(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async archiveBankAccount(
    merchantId: string,
    bankAccountId: string,
    archived: boolean,
  ): Promise<void> {
    try {
      await apiClient.patch(
        `/merchants/${merchantId}/settings/bank-accounts/${bankAccountId}/archive`,
        { archived },
      )
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateBankAccountStatus(
    merchantId: string,
    bankAccountId: string,
    data: { status: 'APPROVED' | 'REJECTED'; approval_remarks?: string; rejection_reason?: string },
  ): Promise<WhitelistBankAccount> {
    try {
      const response = await apiClient.patch<BankAccountResponse>(
        `/merchants/${merchantId}/settings/bank-accounts/${bankAccountId}/status`,
        data,
      )
      return transformBankAccount(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async deleteBankAccount(merchantId: string, bankAccountId: string): Promise<void> {
    try {
      await apiClient.delete(`/merchants/${merchantId}/settings/bank-accounts/${bankAccountId}`)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getWebhooks(merchantId: string): Promise<WebhookSettings> {
    try {
      const response = await apiClient.get<WebhookSettingsResponse>(
        `/merchants/${merchantId}/settings/webhooks`,
      )
      const d = response.data.data
      return {
        payoutCallbackUrl: d.payout_callback_url ?? '',
        depositCallbackUrl: d.deposit_callback_url ?? '',
        adminCallbackUrl: d.admin_callback_url ?? '',
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateWebhooks(merchantId: string, data: UpdateWebhookData): Promise<void> {
    try {
      await apiClient.put(`/merchants/${merchantId}/settings/webhooks`, data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getWebhookEvents(): Promise<WebhookEvent[]> {
    try {
      const response = await apiClient.get<WebhookEventsResponse>('/webhook-events')
      return response.data.data.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
      }))
    } catch (error) {
      throwApiError(error)
    }
  }

  async getEventSubscriptions(merchantId: string): Promise<EventSubscriptions> {
    try {
      const response = await apiClient.get<EventSubscriptionsResponse>(
        `/merchants/${merchantId}/settings/webhooks/subscriptions`,
      )
      return {
        subscribedEventIds: response.data.data.event_ids ?? [],
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateEventSubscriptions(
    merchantId: string,
    data: UpdateEventSubscriptionsData,
  ): Promise<void> {
    try {
      await apiClient.put(`/merchants/${merchantId}/settings/webhooks/subscriptions`, data)
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const merchantSecurityService = new MerchantSecurityService()
