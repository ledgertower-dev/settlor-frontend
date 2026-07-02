'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { AuthErrorAlert } from './AuthErrorAlert'
import { authService } from '../api/auth.api'
import { logger } from '@/lib/core/logger'
import { getErrorMessage } from '@/lib/api/error-handler'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '../schemas/forgot-password.schema'

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    setIsLoading(true)
    try {
      await authService.forgotPassword({ email: data.email })
      setIsSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
      logger.error('Forgot password failed', { error: String(err) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-1 flex-col ${className ?? ''}`} {...props}>
      {/* Center — card */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col gap-6 rounded-[0.875rem] border border-auth-form-text/10 px-6 py-10 shadow-[1px_1px_100px_0px_rgba(0,0,0,0.05)] sm:gap-8 sm:py-14">
          {/* Title block */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-center text-xl font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[1.8rem] 2xl:text-[2rem]">
              Forgot password
            </h1>
          </div>

          {isSuccess ? (
            <div className="flex flex-col gap-6 items-center">
              <Alert className="border-auth-primary/30 bg-auth-primary/10">
                <AlertDescription className="text-sm text-auth-primary">
                  Reset link sent to your email. Please check your inbox.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-8 sm:gap-10">
                <div className="flex flex-col gap-5 sm:gap-6">
                  {error && <AuthErrorAlert message={error} />}

                  <p className="text-center text-sm font-medium text-auth-form-muted sm:text-base">
                    Please enter your registered Email ID. You will receive a link to create a new
                    password via email.
                  </p>

                  <div className="flex flex-col gap-2.5 sm:gap-3.5">
                    <label
                      htmlFor="email"
                      className="text-sm font-bold leading-none text-auth-form-muted sm:text-base"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      className="h-11 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg px-4 py-3 text-md font-medium text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/40 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6 sm:py-3.5"
                      {...register('email')}
                      aria-invalid={errors.email ? 'true' : 'false'}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant={null}
                  disabled={isLoading}
                  className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta px-8 py-3 text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:px-[2.875rem] sm:py-3.5 sm:text-base"
                >
                  {isLoading ? 'Sending...' : 'Request Password Reset'}
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
          )}
        </div>
      </div>

      {/* Footer — pinned to bottom */}
      <div className="flex items-center justify-center gap-2 pt-6 sm:pt-8">
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
