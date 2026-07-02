'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, CircleCheck, CircleX, Eye, EyeOff } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { AuthErrorAlert } from './AuthErrorAlert'
import { useAuthStore } from '../model/auth.store'
import { accountTypeToRolePrefix } from '@/hooks/use-role-prefix'
import { logger } from '@/lib/core/logger'
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../schemas/change-password.schema'

interface PasswordRequirement {
  label: string
  met: boolean
}

export function ChangePasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { changePassword, isLoading, error, clearError, user } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const newPassword = watch('newPassword', '')

  const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 12 characters', met: newPassword.length >= 12 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'One number', met: /[0-9]/.test(newPassword) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(newPassword) },
  ]

  const onSubmit = async (data: ChangePasswordFormData) => {
    clearError()
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })

      const role = accountTypeToRolePrefix(user?.accountType)
      router.push(`/${role}/dashboard`)
    } catch (error) {
      logger.error('Change password failed', { error: String(error) })
    }
  }

  if (!user) {
    router.push('/auth/login')
    return null
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
              Change password
            </h1>
            <p className="text-sm font-medium text-auth-form-muted sm:text-base">
              Please update your password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-8 sm:gap-10">
              <div className="flex flex-col gap-4 sm:gap-[1.125rem]">
                {error && <AuthErrorAlert message={error} />}

                {/* Current Password */}
                <div className="flex flex-col gap-2.5 sm:gap-3.5">
                  <label
                    htmlFor="currentPassword"
                    className="text-sm font-bold leading-none text-auth-form-muted sm:text-base"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="***********"
                      className="h-11 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg px-4 py-3 pr-12 text-md font-medium text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/60 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6 sm:py-3.5 sm:pr-14"
                      {...register('currentPassword')}
                      aria-invalid={errors.currentPassword ? 'true' : 'false'}
                    />
                    <EyeToggle
                      show={showCurrentPassword}
                      onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                    />
                  </div>
                  {errors.currentPassword && (
                    <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

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

                {/* Password Requirements */}
                {newPassword && (
                  <div className="flex flex-col gap-1.5">
                    {passwordRequirements.map((requirement, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                        {requirement.met ? (
                          <AppIcon icon={CircleCheck} color="green" className="size-3.5" />
                        ) : (
                          <AppIcon icon={CircleX} className="size-3.5 text-auth-form-muted" />
                        )}
                        <span
                          className={requirement.met ? 'text-status-green' : 'text-auth-form-muted'}
                        >
                          {requirement.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Confirm Password */}
                <div className="flex flex-col gap-2.5 sm:gap-3.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-bold leading-none text-auth-form-muted sm:text-base"
                  >
                    Confirm New Password
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
                {isLoading ? 'Updating...' : 'Update Password'}
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
    </div>
  )
}
