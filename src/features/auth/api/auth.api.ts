/**
 * Authentication API Service
 *
 * Connects to the application RBAC backend at localhost:3001
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import { logger } from '@/lib/core/logger'
import type {
  User,
  LoginRequest,
  LoginResponse,
  LoginResult,
  RegisterRequest,
  RegisterResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorChallenge,
  TwoFactorVerifyRequest,
  TwoFactorResendRequest,
} from '../types'

const ROLE_COOKIE = 'settlor_role'

function setRoleCookie(accountType: string) {
  if (typeof document === 'undefined') return
  const role = accountType.toLowerCase() === 'merchant' ? 'merchant' : 'admin'
  document.cookie = `${ROLE_COOKIE}=${role};path=/;SameSite=Lax`
}

function clearRoleCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${ROLE_COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

/**
 * API Response Types (matching backend format from docs)
 */
interface ApiSuccessResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp?: string
}

/**
 * Backend Response Types
 */
interface BackendLoginData {
  user: {
    id: string
    account_type: string
    code: string
    email: string
    name: string
    phone: string
    status: string
  }
  tokens: {
    access_token: string
    refresh_token: string
    expires_in: number
  }
}

interface Backend2FAChallenge {
  requires_2fa: true
  challenge_id: string
  expires_in_seconds: number
  masked_destination: string
  message: string
  method: string
}

interface BackendMeUser {
  id: string
  name: string
  email: string
  phone?: string
  account_type?: string
  code?: string
  status: string
  must_change_password?: boolean
  dob?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  avatar_url?: string
  email_verified?: boolean
  phone_verified?: boolean
  permissions?: string[]
  role?: { id: string; name: string }
  created_at?: string
  updated_at?: string
  admin_password_reset_notice?: {
    show: boolean
    message: string
  }
}

/**
 * Transform /auth/me backend user (snake_case) to frontend User (camelCase)
 */
function transformMeUser(backend: BackendMeUser): User {
  return {
    id: backend.id,
    email: backend.email,
    name: backend.name,
    status: backend.status === 'active' ? 'active' : 'inactive',
    phone: backend.phone,
    accountType: backend.account_type,
    code: backend.code,
    mustChangePassword: backend.must_change_password,
    dob: backend.dob,
    gender: backend.gender,
    address: backend.address,
    avatarUrl: backend.avatar_url,
    emailVerified: backend.email_verified,
    phoneVerified: backend.phone_verified,
    permissions: backend.permissions,
    role: backend.role,
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
    adminPasswordResetNotice: backend.admin_password_reset_notice,
  }
}

/**
 * Authentication Service
 */
class AuthService {
  /**
   * Login with email and password
   * Returns either a LoginResponse (direct login) or a TwoFactorChallenge (2FA required)
   */
  async login(
    credentials: LoginRequest,
  ): Promise<{ type: 'login'; data: LoginResponse } | { type: '2fa'; data: TwoFactorChallenge }> {
    try {
      const response = await apiClient.post<
        ApiSuccessResponse<BackendLoginData | Backend2FAChallenge>
      >('/auth/login', credentials)

      const responseData = response.data.data

      // Check if 2FA is required
      if ('requires_2fa' in responseData && responseData.requires_2fa) {
        return {
          type: '2fa',
          data: {
            challengeId: responseData.challenge_id,
            expiresInSeconds: responseData.expires_in_seconds,
            maskedDestination: responseData.masked_destination,
            message: responseData.message,
            method: responseData.method,
          },
        }
      }

      // Normal login response
      const { user } = responseData as BackendLoginData
      setRoleCookie(user.account_type)

      return {
        type: 'login',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            status: user.status === 'active' ? 'active' : 'inactive',
            accountType: user.account_type,
            code: user.code,
          },
        },
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Verify 2FA code and complete login
   */
  async verify2FA(data: TwoFactorVerifyRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<ApiSuccessResponse<BackendLoginData>>(
        '/auth/2fa/verify',
        { challenge_id: data.challengeId, code: data.code },
      )

      const { user } = response.data.data
      setRoleCookie(user.account_type)

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          status: user.status === 'active' ? 'active' : 'inactive',
          accountType: user.account_type,
          code: user.code,
        },
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Resend 2FA code
   */
  async resend2FA(data: TwoFactorResendRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
        '/auth/2fa/resend',
        { challenge_id: data.challengeId },
      )
      return response.data.data
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<
        ApiSuccessResponse<{
          user: {
            id: string
            account_type: string
            code: string
            email: string
            name: string
            phone: string
            status: string
          }
          message?: string
        }>
      >('/auth/register', data)

      const user = response.data.data.user

      return {
        message: response.data.data.message || response.data.message || 'Registration successful',
        user: {
          id: user.id,
          accountType: user.account_type,
          code: user.code,
          email: user.email,
          name: user.name,
          phone: user.phone,
          status: user.status,
        },
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      logger.error('Logout error', { error: String(error) })
    } finally {
      clearRoleCookie()
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response =
        await apiClient.get<ApiSuccessResponse<{ user: BackendMeUser } | BackendMeUser>>('/auth/me')

      const rawData = response.data.data
      const backendUser = 'user' in rawData ? rawData.user : rawData

      return transformMeUser(backendUser)
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Update current user profile
   */
  async updateMe(data: { name?: string; email?: string }): Promise<User> {
    try {
      const response = await apiClient.patch<ApiSuccessResponse<{ user: BackendMeUser }>>(
        '/auth/me',
        data,
      )

      return transformMeUser(response.data.data.user)
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', data)
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Request a password reset email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
        '/auth/forgot-password',
        data,
      )
      return response.data.data
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Reset password using token from email
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        token: data.token,
        new_password: data.newPassword,
      })
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Verify registration OTP → returns scoped kyc_token (1-hour TTL)
   * Request: { email, otp }
   */
  async verifyRegistrationOtp(data: {
    email: string
    otp: string
  }): Promise<{ message: string; kycToken: string }> {
    try {
      const response = await apiClient.post<
        ApiSuccessResponse<{ message: string; kyc_token: string }>
      >('/auth/register/verify-otp', { email: data.email, otp: data.otp })

      return {
        message: response.data.data.message,
        kycToken: response.data.data.kyc_token,
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Resend registration OTP (new 6-digit code, 10-minute TTL)
   * Request: { email }
   */
  async resendRegistrationOtp(data: { email: string }): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<ApiSuccessResponse<{ message: string }>>(
        '/auth/register/resend-otp',
        { email: data.email },
      )
      return response.data.data
    } catch (error: unknown) {
      throwApiError(error)
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
