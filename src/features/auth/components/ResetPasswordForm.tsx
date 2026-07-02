'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthErrorAlert } from './AuthErrorAlert'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { authService } from '../api/auth.api'
import { logger } from '@/lib/core/logger'
import { getErrorMessage } from '@/lib/api/error-handler'
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/reset-password.schema'

/**
 * Extract token from search params.
 * Supports both `?token=abc123` and `?tokenAbc123` (backend format).
 */
function extractToken(searchParams: URLSearchParams): string | null {
  const standard = searchParams.get('token')
  if (standard) return standard

  const fullQuery = searchParams.toString()
  const tokenMatch = fullQuery.match(/^token.([0-9a-f]+)=?$/i)
  if (tokenMatch) return tokenMatch[1]

  return null
}

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = extractToken(searchParams)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.')
      return
    }

    setError(null)
    setIsLoading(true)
    try {
      await authService.resetPassword({ token, newPassword: data.newPassword })
      toast.success('Password reset successfully. Please sign in with your new password.')
      router.push('/auth/login')
    } catch (err) {
      setError(getErrorMessage(err))
      logger.error('Reset password failed', { error: String(err) })
    } finally {
      setIsLoading(false)
    }
  }

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer sm:right-6"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        <AppIcon icon={Eye} className="text-auth-form-muted" />
      ) : (
        <AppIcon icon={EyeOff} className="text-auth-form-muted" />
      )}
    </button>
  )

  return (
    <div className={`flex flex-1 flex-col ${className ?? ''}`} {...props}>
      {/* Center — card */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col gap-6 rounded-[0.875rem] border border-auth-form-text/10 px-6 py-10 shadow-[1px_1px_100px_0px_rgba(0,0,0,0.05)] sm:gap-8 sm:py-14">
          {/* Title block */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-center text-xl font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[1.8rem] 2xl:text-[2rem]">
              Reset password
            </h1>
            <p className="text-sm font-medium text-auth-form-muted sm:text-base">
              Enter your new password
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-8 sm:gap-10">
              <div className="flex flex-col gap-4 sm:gap-[1.125rem]">
                {error && <AuthErrorAlert message={error} />}

                {/* New Password */}
                <div className="flex flex-col gap-2.5 sm:gap-3.5">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-bold leading-none text-auth-form-muted sm:text-base"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="***********"
                      className="h-11 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg px-4 py-3 pr-12 text-md font-medium text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/60 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6 sm:py-3.5 sm:pr-14"
                      {...register('newPassword')}
                      aria-invalid={errors.newPassword ? 'true' : 'false'}
                    />
                    <EyeToggle
                      show={showNewPassword}
                      onToggle={() => setShowNewPassword(!showNewPassword)}
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="text-xs text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-2.5 sm:gap-3.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-bold leading-none text-auth-form-muted sm:text-base"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="***********"
                      className="h-11 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg px-4 py-3 pr-12 text-md font-medium text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/60 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6 sm:py-3.5 sm:pr-14"
                      {...register('confirmPassword')}
                      aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    />
                    <EyeToggle
                      show={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant={null}
                disabled={isLoading}
                className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta px-8 py-3 text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:px-[2.875rem] sm:py-3.5 sm:text-base"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
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
        <span className="text-sm font-medium text-auth-form-subtle sm:text-base">
          Remember Password?
        </span>
        <Link
          href="/auth/login"
          className="text-sm font-bold text-auth-primary transition-opacity hover:opacity-70 sm:text-base"
        >
          Login
        </Link>
      </div>
    </div>
  )
}
