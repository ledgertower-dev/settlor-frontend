import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type { PaginatedResponse } from '@/lib/types/pagination.types'
import { normalizePaginationMeta } from '@/lib/api/api-utils'
import type {
  ApiCredentials,
  TwoFactorStatus,
  AuthAppSetupResponse,
  AuthAppConfirmRequest,
  SwitchMethodRequest,
  WhitelistBankAccount,
  WhitelistBankAccountRequest,
  VirtualAccountAdmin,
  VirtualAccountAssignment,
  WhitelistIP,
  MaintenanceSchedule,
} from '../types'

// Backend response shapes (snake_case)

interface Backend2FAStatus {
  two_fa_enabled: boolean
  two_fa_method: string
  two_fa_enforced: boolean
  can_disable: boolean
  auth_app_configured: boolean
  masked_email: string
}

interface Backend2FAStatusResponse {
  success: boolean
  data: Backend2FAStatus
}

interface BackendAuthAppSetup {
  challenge_id: string
  otpauth_uri: string
  qr_code_data_url: string
  expires_in_seconds: number
}

interface BackendAuthAppSetupResponse {
  success: boolean
  data: BackendAuthAppSetup
}

interface BackendConfirmResponse {
  success: boolean
  data: unknown
}

interface BackendSwitchMethodResponse {
  success: boolean
  data: unknown
}

interface BackendApiCredentials {
  id: string
  api_key: string
  salt_key?: string
  salt_key_fingerprint?: string
  status: string
  created_at: string
  updated_at: string
  expires_at: string | null
  last_used_at: string | null
}

interface BackendApiCredentialsResponse {
  success: boolean
  data: BackendApiCredentials
}

interface BackendWhitelistBankAccount {
  id: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  account_type: string
  status: string
  rejection_reason?: string
  approval_remarks?: string
}

interface BackendWhitelistBankListResponse {
  success: boolean
  data: BackendWhitelistBankAccount[]
  meta?: { page: number; per_page: number; total: number; total_pages: number }
}

interface BackendWhitelistBankResponse {
  success: boolean
  data: BackendWhitelistBankAccount
}

function transform2FAStatus(b: Backend2FAStatus): TwoFactorStatus {
  return {
    twoFaEnabled: b.two_fa_enabled,
    twoFaMethod: b.two_fa_method,
    twoFaEnforced: b.two_fa_enforced,
    canDisable: b.can_disable,
    authAppConfigured: b.auth_app_configured,
    maskedEmail: b.masked_email,
  }
}

function transformAuthAppSetup(b: BackendAuthAppSetup): AuthAppSetupResponse {
  return {
    challengeId: b.challenge_id,
    otpauthUri: b.otpauth_uri,
    qrCodeDataUrl: b.qr_code_data_url,
    expiresInSeconds: b.expires_in_seconds,
  }
}

function transformApiCredentials(b: BackendApiCredentials): ApiCredentials {
  return {
    id: b.id,
    apiKey: b.api_key,
    saltKey: b.salt_key ?? null,
    saltKeyFingerprint: b.salt_key_fingerprint ?? null,
    status: b.status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    expiresAt: b.expires_at,
    lastUsedAt: b.last_used_at,
  }
}

function transformWhitelistBankAccount(b: BackendWhitelistBankAccount): WhitelistBankAccount {
  return {
    id: b.id,
    bankName: b.bank_name,
    accountHolderName: b.account_holder_name,
    accountNumber: b.account_number,
    ifsc: b.ifsc,
    accountType: b.account_type,
    status: b.status,
    rejectionReason: b.rejection_reason,
    approvalRemarks: b.approval_remarks,
  }
}

function toWhitelistBankPayload(data: WhitelistBankAccountRequest) {
  return {
    bank_name: data.bankName,
    account_holder_name: data.accountHolderName,
    account_number: data.accountNumber,
    ifsc: data.ifsc,
    account_type: data.accountType,
  }
}

// --- Admin Virtual Accounts ---

interface BackendVirtualAccountAssignment {
  id: string
  merchant_id: string
  merchant_name: string
  merchant_code: string
  merchant_email: string
  assigned_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface BackendVirtualAccount {
  id: string
  label: string
  bank_name: string
  account_holder_name: string
  account_number: string
  ifsc: string
  account_type: string
  entry_mode: string
  status: string
  provider_id: string
  provider_name: string
  provider_label: string
  created_at: string
  updated_at: string
  assignments?: BackendVirtualAccountAssignment[]
}

interface BackendVirtualAccountPaginatedResponse {
  success: boolean
  data: BackendVirtualAccount[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

function transformAssignment(a: BackendVirtualAccountAssignment): VirtualAccountAssignment {
  return {
    id: a.id,
    merchantId: a.merchant_id,
    merchantName: a.merchant_name,
    merchantCode: a.merchant_code,
    merchantEmail: a.merchant_email,
    assignedBy: a.assigned_by,
    isActive: a.is_active,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }
}

function transformVirtualAccount(b: BackendVirtualAccount): VirtualAccountAdmin {
  return {
    id: b.id,
    label: b.label,
    bankName: b.bank_name,
    accountHolderName: b.account_holder_name,
    accountNumber: b.account_number,
    ifsc: b.ifsc,
    accountType: b.account_type,
    entryMode: b.entry_mode,
    status: b.status,
    providerId: b.provider_id,
    providerName: b.provider_name,
    providerLabel: b.provider_label,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    assignments: (b.assignments ?? []).map(transformAssignment),
  }
}

// --- Merchant IP Whitelist ---

interface BackendWhitelistIP {
  id: string
  ip_address: string
  type: string
  description: string
  is_active: boolean
  status: string
  created_at: string
  updated_at: string
}

interface BackendWhitelistIPListResponse {
  success: boolean
  data: {
    ip_whitelist_enabled: boolean
    items: BackendWhitelistIP[]
  }
  meta?: { page: number; per_page: number; total: number; total_pages: number }
}

interface BackendWhitelistIPResponse {
  success: boolean
  data: BackendWhitelistIP
}

function transformWhitelistIP(b: BackendWhitelistIP): WhitelistIP {
  return {
    id: b.id,
    ipAddress: b.ip_address,
    type: b.type,
    description: b.description,
    isActive: b.is_active,
    status: b.status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

class SettingsApiService {
  // 2FA

  async get2FAStatus(basePath: string): Promise<TwoFactorStatus> {
    try {
      const response = await apiClient.get<Backend2FAStatusResponse>(`${basePath}/2fa`)
      return transform2FAStatus(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async setupAuthApp(basePath: string): Promise<AuthAppSetupResponse> {
    try {
      const response = await apiClient.post<BackendAuthAppSetupResponse>(
        `${basePath}/auth-app/setup`,
      )
      return transformAuthAppSetup(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async confirmAuthApp(basePath: string, data: AuthAppConfirmRequest): Promise<void> {
    try {
      await apiClient.post<BackendConfirmResponse>(
        `${basePath}/auth-app/confirm`,
        {
          challenge_id: data.challengeId,
          code: data.code,
        },
        { _skipAuthRetry: true } as never,
      )
    } catch (error) {
      throwApiError(error)
    }
  }

  async switchMethod(basePath: string, data: SwitchMethodRequest): Promise<void> {
    try {
      await apiClient.patch<BackendSwitchMethodResponse>(
        `${basePath}/method`,
        {
          two_fa_method: data.twoFaMethod,
          authenticator_code: data.authenticatorCode,
        },
        { _skipAuthRetry: true } as never,
      )
    } catch (error) {
      throwApiError(error)
    }
  }

  // API Credentials

  async getApiCredentials(): Promise<ApiCredentials> {
    try {
      const response = await apiClient.get<BackendApiCredentialsResponse>('/me/api-credentials')
      return transformApiCredentials(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async rotateApiCredentials(): Promise<ApiCredentials> {
    try {
      const response = await apiClient.post<BackendApiCredentialsResponse>(
        '/me/api-credentials/rotate',
      )
      return transformApiCredentials(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  // Whitelist Bank Account CRUD

  async getWhitelistBankAccounts(params?: {
    page?: number
    per_page?: number
    scope?: string
  }): Promise<PaginatedResponse<WhitelistBankAccount>> {
    try {
      const response = await apiClient.get<BackendWhitelistBankListResponse>(
        '/me/settings/bank-accounts',
        { params: { scope: 'active', ...params } },
      )
      const items = response.data.data.map(transformWhitelistBankAccount)
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

  async createWhitelistBankAccount(
    data: WhitelistBankAccountRequest,
  ): Promise<WhitelistBankAccount> {
    try {
      const response = await apiClient.post<BackendWhitelistBankResponse>(
        '/me/settings/bank-accounts',
        toWhitelistBankPayload(data),
      )
      return transformWhitelistBankAccount(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getWhitelistBankAccount(id: string): Promise<WhitelistBankAccount> {
    try {
      const response = await apiClient.get<BackendWhitelistBankResponse>(
        `/me/settings/bank-accounts/${id}`,
      )
      return transformWhitelistBankAccount(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateWhitelistBankAccount(
    id: string,
    data: WhitelistBankAccountRequest,
  ): Promise<WhitelistBankAccount> {
    try {
      const response = await apiClient.patch<BackendWhitelistBankResponse>(
        `/me/settings/bank-accounts/${id}`,
        toWhitelistBankPayload(data),
      )
      return transformWhitelistBankAccount(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async deleteWhitelistBankAccount(id: string): Promise<void> {
    try {
      await apiClient.delete(`/me/settings/bank-accounts/${id}`)
    } catch (error) {
      throwApiError(error)
    }
  }

  // Admin Virtual Accounts

  async getVirtualAccounts(params: {
    providerId: string
    page: number
    perPage: number
    status?: string
    q?: string
  }): Promise<PaginatedResponse<VirtualAccountAdmin>> {
    try {
      const response = await apiClient.get<BackendVirtualAccountPaginatedResponse>(
        '/admin/virtual-accounts',
        {
          params: {
            provider_id: params.providerId,
            page: params.page,
            per_page: params.perPage,
            ...(params.status && { status: params.status }),
            ...(params.q && { q: params.q }),
          },
        },
      )
      return {
        data: {
          items: response.data.data.map(transformVirtualAccount),
        },
        meta: {
          pagination: normalizePaginationMeta(response.data.meta),
        },
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  // Merchant IP Whitelist

  async getWhitelistIPs(params?: {
    page?: number
    per_page?: number
    status?: string
  }): Promise<PaginatedResponse<WhitelistIP>> {
    try {
      const response = await apiClient.get<BackendWhitelistIPListResponse>(
        '/me/settings/ip-whitelists',
        { params },
      )
      const items = response.data.data.items.map(transformWhitelistIP)
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

  async createWhitelistIP(data: {
    ip_address: string
    description?: string
    type: string
  }): Promise<WhitelistIP> {
    try {
      const response = await apiClient.post<BackendWhitelistIPResponse>(
        '/me/settings/ip-whitelists',
        data,
      )
      return transformWhitelistIP(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateWhitelistIP(
    id: string,
    data: {
      ip_address: string
      description?: string
      type: string
    },
  ): Promise<WhitelistIP> {
    try {
      const response = await apiClient.patch<BackendWhitelistIPResponse>(
        `/me/settings/ip-whitelists/${id}`,
        data,
      )
      return transformWhitelistIP(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async deleteWhitelistIP(id: string): Promise<void> {
    try {
      await apiClient.delete(`/me/settings/ip-whitelists/${id}`)
    } catch (error) {
      throwApiError(error)
    }
  }

  // Webhooks

  async getWebhooks(): Promise<{
    payoutCallbackUrl: string
    depositCallbackUrl: string
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: {
          payout_callback_url?: string
          deposit_callback_url?: string
        }
      }>('/me/settings/webhooks')
      const d = response.data.data
      return {
        payoutCallbackUrl: d.payout_callback_url ?? '',
        depositCallbackUrl: d.deposit_callback_url ?? '',
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateWebhooks(data: {
    payout_callback_url?: string
    deposit_callback_url?: string
  }): Promise<void> {
    try {
      await apiClient.put('/me/settings/webhooks', data)
    } catch (error) {
      throwApiError(error)
    }
  }

  // Admin Maintenance

  async getMaintenanceSchedules(params?: {
    page?: number
    per_page?: number
    status?: string
  }): Promise<PaginatedResponse<MaintenanceSchedule>> {
    try {
      const response = await apiClient.get<BackendMaintenanceListResponse>('/admin/maintenance', {
        params,
      })
      const items = response.data.data.map(transformMaintenance)
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

  async createMaintenanceSchedule(data: CreateMaintenanceData): Promise<MaintenanceSchedule> {
    try {
      const response = await apiClient.post<BackendMaintenanceResponse>('/admin/maintenance', data)
      return transformMaintenance(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async updateMaintenanceSchedule(
    id: string,
    data: UpdateMaintenanceData,
  ): Promise<MaintenanceSchedule> {
    try {
      const response = await apiClient.patch<BackendMaintenanceResponse>(
        `/admin/maintenance/${id}`,
        data,
      )
      return transformMaintenance(response.data.data)
    } catch (error) {
      throwApiError(error)
    }
  }

  async deleteMaintenanceSchedule(id: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/maintenance/${id}`)
    } catch (error) {
      throwApiError(error)
    }
  }

  async getActiveMaintenance(): Promise<ActiveMaintenance | null> {
    try {
      const response = await apiClient.get<ActiveMaintenanceResponse>('/maintenance/active')
      if (response.status === 204 || !response.data?.data) return null
      const d = response.data.data
      return {
        id: d.id,
        name: d.name,
        description: d.description,
        fromAt: d.from_at,
        toAt: d.to_at,
        status: d.status,
      }
    } catch (error) {
      // 204 or network errors should not break the app
      return null
    }
  }
}

// --- Maintenance backend types ---

interface BackendMaintenance {
  id: string
  name: string
  description: string
  ip_address: string
  from_at: string
  to_at: string
  status: string
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

interface BackendMaintenanceListResponse {
  success: boolean
  data: BackendMaintenance[]
  meta?: { page: number; per_page: number; total: number; total_pages: number }
}

interface BackendMaintenanceResponse {
  success: boolean
  data: BackendMaintenance
}

function transformMaintenance(b: BackendMaintenance): MaintenanceSchedule {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    ipAddress: b.ip_address,
    fromAt: b.from_at,
    toAt: b.to_at,
    status: b.status,
    createdBy: b.created_by,
    updatedBy: b.updated_by,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }
}

export interface CreateMaintenanceData {
  name: string
  description?: string
  ip_address?: string
  from_at: string
  to_at: string
}

export interface UpdateMaintenanceData {
  name?: string
  description?: string
  ip_address?: string
  from_at?: string
  to_at?: string
}

export interface ActiveMaintenance {
  id: string
  name: string
  description: string
  fromAt: string
  toAt: string
  status: string
}

interface ActiveMaintenanceResponse {
  success: boolean
  data: {
    id: string
    name: string
    description: string
    from_at: string
    to_at: string
    status: string
  }
}

export const settingsApiService = new SettingsApiService()
