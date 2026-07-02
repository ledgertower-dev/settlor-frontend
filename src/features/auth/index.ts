// Auth components
export { LoginForm } from './components/LoginForm'
export { SignupForm } from './components/SignupForm'
export { ConfirmationCard } from './components/ConfirmationCard'
export { BlockedCard } from './components/BlockedCard'
export { AuthGuard } from './components/AuthGuard'

// Auth hooks (Zustand-based)
export { useLogin, useLogout, useChangePassword, useAuthStatus } from './model/use-auth.hooks'

// Profile hooks (TanStack Query-based)
export {
  useCurrentUser,
  useUpdateProfile,
  useChangePasswordMutation,
  profileKeys,
} from './model/use-profile'

// Auth store
export { useAuthStore } from './model/auth.store'

// Re-export types
export type { User } from '@/lib/types/api-types'
export type {
  LoginRequest,
  LoginResult,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorChallenge,
  TwoFactorVerifyRequest,
  TwoFactorResendRequest,
  RegistrationOtpVerifyRequest,
  RegistrationOtpResendRequest,
} from './types'

export { AuthErrorAlert, AuthPendingAlert } from './components/AuthErrorAlert'
