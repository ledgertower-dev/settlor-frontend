/**
 * Authentication Types
 */

import type { User } from '@/lib/types/api-types'

export type { User }

// Token management types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresIn?: number
  refreshTokenExpiresIn?: number
}

// Authentication request/response types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  tokens?: AuthTokens
}

// Two-Factor Authentication types
export interface TwoFactorChallenge {
  challengeId: string
  expiresInSeconds: number
  maskedDestination: string
  message: string
  method: string
}

export interface TwoFactorVerifyRequest {
  challengeId: string
  code: string
}

export interface TwoFactorResendRequest {
  challengeId: string
}

export type LoginResult =
  | { requires2FA: false; mustChangePassword: boolean }
  | { requires2FA: true; challenge: TwoFactorChallenge }

export interface RegisterRequest {
  name: string
  email: string
  phone: string
  password: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  dob?: string
  address?: string
}

export interface RegisterResponse {
  message: string
  user: {
    id: string
    accountType: string
    code: string
    email: string
    name: string
    phone: string
    status: string
  }
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface RegistrationOtpVerifyRequest {
  email: string
  otp: string
}

export interface RegistrationOtpResendRequest {
  email: string
}
