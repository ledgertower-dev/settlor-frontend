'use client'

import Link from 'next/link'
import { useAuthStore } from '../model/auth.store'
import { OtpVerifyCard } from './OtpVerifyCard'
import type { TwoFactorChallenge } from '../types'

interface TwoFactorVerifyProps {
  challenge: TwoFactorChallenge
  onSuccess: (result: { mustChangePassword: boolean }) => void
}

export function TwoFactorVerify({ challenge, onSuccess }: TwoFactorVerifyProps) {
  const { verify2FA, resend2FA, isLoading, error, clearError } = useAuthStore()

  const isAuthApp = challenge.method === 'AUTH_APP' || challenge.method === 'AUTH_APP_TOTP'

  const handleVerify = async (code: string) => {
    const result = await verify2FA({ challengeId: challenge.challengeId, code })
    onSuccess(result)
  }

  const handleResend = async () => {
    await resend2FA({ challengeId: challenge.challengeId })
  }

  const description = isAuthApp ? (
    'Enter the code from your Google Authenticator app'
  ) : (
    <>
      Enter OTP sent to{' '}
      <span className="font-medium text-auth-form-text">{challenge.maskedDestination}</span>
    </>
  )

  return (
    <OtpVerifyCard
      description={description}
      expiresInSeconds={challenge.expiresInSeconds}
      onVerify={handleVerify}
      onResend={!isAuthApp ? handleResend : undefined}
      isLoading={isLoading}
      error={error}
      onClearError={clearError}
      footer={
        <div className="mt-auto flex flex-col items-center justify-center gap-1 pt-6 sm:flex-row sm:gap-2 sm:pt-8">
          <span className="text-sm font-medium text-auth-form-subtle sm:text-base 2xl:text-lg">
            You don&apos;t have an account yet?
          </span>
          <Link
            href="/auth/register"
            className="text-sm font-bold text-auth-primary transition-opacity hover:opacity-70 sm:text-base 2xl:text-lg"
          >
            Create an account
          </Link>
        </div>
      }
    />
  )
}
