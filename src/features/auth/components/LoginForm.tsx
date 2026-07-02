'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthErrorAlert, AuthPendingAlert } from './AuthErrorAlert'
import { OtpVerifyCard } from './OtpVerifyCard'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { useAuthStore } from '../model/auth.store'
import { authService } from '../api/auth.api'
import { accountTypeToRolePrefix } from '@/hooks/use-role-prefix'
import { logger } from '@/lib/core/logger'
import { getErrorMessage } from '@/lib/api/error-handler'
import { loginSchema, type LoginFormData } from '../schemas/login.schema'
import { TwoFactorVerify } from './TwoFactorVerify'
import type { TwoFactorChallenge } from '../types'

/* ── Figma token reference ──
 * Geist SemiBold 600 52px 1% → title
 * Satoshi Medium 500 18px   → subtitle, labels, links
 * Satoshi Bold 700 18px     → field labels, "Create an account"
 * Geist SemiBold 600 20px 1% → button text
 *
 * Panel: bg #EFF3FF, shadow -10px -56px 54px rgba(23,45,121,0.1)
 * Inputs: h52, px-24 py-14, bg white/4, border 0.4px black/20, radius 6, shadow 0 2px 4px black/5
 * Button: h52+, rounded-full #99FF00, text #000
 * ────────────────────────────────── */

/**
 * Reads `returnUrl` from the current URL and returns it only if it's a safe
 * internal path (guards against open-redirects to external/protocol-relative URLs).
 */
function getSafeReturnUrl(): string | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('returnUrl')
  // Must be an app-internal absolute path: starts with "/" but not "//" or "/\".
  if (!raw || !/^\/(?![/\\])/.test(raw)) return null
  return raw
}

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null)
  const [emailVerify, setEmailVerify] = useState<{ email: string } | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const { login, isLoading, error, errorCode, errorMeta, clearError } = useAuthStore()

  // Clear any leftover errors from other auth pages (e.g. register)
  useEffect(() => {
    clearError()
  }, [clearError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleLoginSuccess = (result: { mustChangePassword: boolean }) => {
    if (result.mustChangePassword) {
      router.push('/auth/change-password')
    } else {
      const currentUser = useAuthStore.getState().user
      const role = accountTypeToRolePrefix(currentUser?.accountType)
      // Honour the returnUrl set by the proxy on session expiry/logout, else dashboard.
      router.push(getSafeReturnUrl() ?? `/${role}/dashboard`)
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    try {
      const result = await login(data)

      if (result.requires2FA) {
        setTwoFactorChallenge(result.challenge)
      } else {
        handleLoginSuccess({ mustChangePassword: result.mustChangePassword })
      }
    } catch (error) {
      const code = useAuthStore.getState().errorCode
      const meta = useAuthStore.getState().errorMeta
      const kycToken = meta?.kyc_token as string | undefined

      if (code === 'AUTH_KYC_INCOMPLETE' && kycToken) {
        setTimeout(() => {
          router.push(`/auth/kyc?token=${encodeURIComponent(kycToken)}`)
        }, 2000)
        return
      }
      if (code === 'AUTH_KYC_CHANGES_REQUESTED' && kycToken) {
        setTimeout(() => {
          router.push(`/auth/kyc/resubmit?token=${encodeURIComponent(kycToken)}`)
        }, 2000)
        return
      }
      if (code === 'AUTH_EMAIL_NOT_VERIFIED') {
        setEmailVerify({ email: data.email })
        return
      }

      logger.error('Login failed', { error: String(error) })
    }
  }

  // Email verification OTP screen
  if (emailVerify) {
    const handleVerifyEmail = async (otp: string) => {
      setIsVerifying(true)
      setVerifyError(null)
      try {
        const result = await authService.verifyRegistrationOtp({
          email: emailVerify.email,
          otp,
        })
        router.push(`/auth/kyc?token=${encodeURIComponent(result.kycToken)}`)
      } catch (err) {
        setVerifyError(getErrorMessage(err))
        setIsVerifying(false)
        throw err
      }
    }

    const handleResend = async () => {
      setVerifyError(null)
      try {
        await authService.resendRegistrationOtp({ email: emailVerify.email })
      } catch (err) {
        setVerifyError(getErrorMessage(err))
        throw err
      }
    }

    return (
      <OtpVerifyCard
        description={
          <>
            Enter OTP sent to{' '}
            <span className="font-medium text-auth-form-text">{emailVerify.email}</span>
          </>
        }
        expiresInSeconds={600}
        onVerify={handleVerifyEmail}
        onResend={handleResend}
        isLoading={isVerifying}
        error={verifyError}
        onClearError={() => setVerifyError(null)}
        footer={
          <div className="mt-auto flex flex-col items-center justify-center gap-1 pt-6 sm:flex-row sm:gap-2 sm:pt-8">
            <span className="text-sm font-medium text-auth-form-subtle sm:text-base 2xl:text-lg">
              Already have an account ?
            </span>
            <Link
              href="/auth/login"
              className="text-sm font-bold text-auth-primary transition-opacity hover:opacity-70 sm:text-base 2xl:text-lg"
            >
              Login
            </Link>
          </div>
        }
      />
    )
  }

  if (twoFactorChallenge) {
    return <TwoFactorVerify challenge={twoFactorChallenge} onSuccess={handleLoginSuccess} />
  }

  return (
    <div className={`flex flex-1 flex-col ${className ?? ''}`} {...props}>
      {/* Center — form content */}
      <div className="flex flex-1 flex-col justify-center">
        {/* Title block */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[2.25rem] lg:text-[2.875rem] 2xl:text-[3.25rem]">
            Login
          </h1>
          <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
            Please enter your details to sign in
          </p>
        </div>

        {/* Form block */}
        <div className="mt-8 sm:mt-10 lg:mt-[2.875rem]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-8 sm:gap-10 lg:gap-[2.875rem]">
              {/* Fields area */}
              <div className="flex flex-col gap-5 sm:gap-6">
                {error &&
                  (errorCode === 'AUTH_KYC_UNDER_REVIEW' ? (
                    <AuthPendingAlert data-test-id="login-error-alert" />
                  ) : (
                    <AuthErrorAlert message={error} data-test-id="login-error-alert" />
                  ))}

                {/* Inputs */}
                <div className="flex flex-col gap-4 sm:gap-[1.125rem]">
                  {/* Email field */}
                  <div className="flex flex-col gap-2.5 sm:gap-3.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-bold leading-none text-auth-form-muted sm:text-base 2xl:text-lg"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      className="h-11 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg px-4 py-3 text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/40 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6 sm:py-3.5"
                      {...register('email')}
                      aria-invalid={errors.email ? 'true' : 'false'}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="flex flex-col gap-2.5 sm:gap-3.5">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold leading-none text-auth-form-muted sm:text-base 2xl:text-lg"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="***********"
                        className="h-11 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg px-4 py-3 pr-12 text-md font-medium text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/60 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6 sm:py-3.5 sm:pr-14 "
                        {...register('password')}
                        aria-invalid={errors.password ? 'true' : 'false'}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer sm:right-6"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <AppIcon icon={Eye} className="text-auth-form-muted" />
                        ) : (
                          <AppIcon icon={EyeOff} className="text-auth-form-muted" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                {/* Remember me + Forgot password */}
                <div className="flex items-center justify-end gap-3 sm:gap-3.5">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-medium leading-none text-auth-form-text transition-opacity hover:opacity-70 sm:text-base 2xl:text-lg"
                  >
                    Forgot Password ?
                  </Link>
                </div>
              </div>

              {/* Sign In button */}
              <Button
                type="submit"
                variant={null}
                disabled={isLoading}
                className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta px-8 py-3 text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:px-[2.875rem] sm:py-3.5 sm:text-base 2xl:text-xl"
              >
                {isLoading ? 'Logging in...' : 'Login'}
                {!isLoading && (
                  <AppIcon
                    icon={ArrowRight}
                    size="sm"
                    stroke="bold"
                    className="text-auth-cta-text transition-transform group-hover:translate-x-1"
                  />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer — pinned to bottom */}
      <div className="flex flex-col items-center justify-center gap-1 pt-6 sm:flex-row sm:gap-2 sm:pt-8">
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
    </div>
  )
}
