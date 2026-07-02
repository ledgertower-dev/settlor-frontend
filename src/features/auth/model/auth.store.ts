import { create } from 'zustand'
import { authService } from '../api/auth.api'
import type {
  User,
  LoginRequest,
  LoginResult,
  RegisterRequest,
  RegisterResponse,
  ChangePasswordRequest,
  TwoFactorVerifyRequest,
  TwoFactorResendRequest,
} from '../types'
import { logger } from '@/lib/core/logger'

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  errorCode: string | null
  errorMeta: Record<string, unknown> | null

  // Actions
  login: (credentials: LoginRequest) => Promise<LoginResult>
  verify2FA: (data: TwoFactorVerifyRequest) => Promise<{ mustChangePassword: boolean }>
  resend2FA: (data: TwoFactorResendRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<RegisterResponse>
  changePassword: (data: ChangePasswordRequest) => Promise<void>
  getCurrentUser: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  setUser: (user: User) => void
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'An unexpected error occurred'
}

const getErrorCode = (error: unknown): string | null => {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code)
  }
  return null
}

const getErrorMeta = (error: unknown): Record<string, unknown> | null => {
  if (error && typeof error === 'object' && 'meta' in error) {
    return (error as { meta: Record<string, unknown> }).meta ?? null
  }
  return null
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // Initial State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  errorCode: null,
  errorMeta: null,

  // Actions
  login: async (credentials: LoginRequest): Promise<LoginResult> => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login(credentials)

      if (response.type === '2fa') {
        set({ isLoading: false, error: null })
        return { requires2FA: true, challenge: response.data }
      }

      const { user } = response.data

      set({
        user,
        isAuthenticated: true,
        error: null,
      })

      // Fetch full user profile (permissions, role, etc.) before redirecting
      try {
        const fullUser = await authService.getCurrentUser()
        set({ user: fullUser })
      } catch {
        // Non-critical — AuthGuard will retry
      }

      set({ isLoading: false })

      return { requires2FA: false, mustChangePassword: user.mustChangePassword || false }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      const errorCode = getErrorCode(error)
      const errorMeta = getErrorMeta(error)
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
        errorCode,
        errorMeta,
      })
      throw new Error(errorMessage)
    }
  },

  verify2FA: async (data: TwoFactorVerifyRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.verify2FA(data)
      const { user } = response

      set({
        user,
        isAuthenticated: true,
        error: null,
      })

      // Fetch full user profile (permissions, role, etc.) before redirecting
      try {
        const fullUser = await authService.getCurrentUser()
        set({ user: fullUser })
      } catch {
        // Non-critical — AuthGuard will retry
      }

      set({ isLoading: false })

      return { mustChangePassword: user.mustChangePassword || false }
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      set({ isLoading: false, error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  resend2FA: async (data: TwoFactorResendRequest) => {
    try {
      await authService.resend2FA(data)
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      set({ error: errorMessage })
      throw new Error(errorMessage)
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.register(data)
      set({ isLoading: false, error: null })
      return response
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      set({ isLoading: false, error: errorMessage })
      throw error
    }
  },

  changePassword: async (data: ChangePasswordRequest) => {
    set({ isLoading: true, error: null })
    try {
      await authService.changePassword(data)

      // Refresh user data to get updated mustChangePassword status
      await get().getCurrentUser()

      set({
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      set({
        isLoading: false,
        error: errorMessage,
      })
      throw new Error(errorMessage)
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true, error: null })
    try {
      const user = await authService.getCurrentUser()

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null })
    try {
      await authService.logout()
    } catch (error) {
      logger.error('Logout error', { error: String(error) })
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  clearError: () => {
    set({ error: null, errorCode: null, errorMeta: null })
  },

  setUser: (user: User) => {
    set({ user })
  },
}))
