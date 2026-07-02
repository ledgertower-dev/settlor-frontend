'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { ArrowRight, Calendar as CalendarIcon, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthErrorAlert } from './AuthErrorAlert'
import { OtpVerifyCard } from './OtpVerifyCard'
import { RegistrationStepper } from './RegistrationStepper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useAuthStore } from '../model/auth.store'
import { authService } from '../api/auth.api'
import { signupSchema, type SignupFormData } from '../schemas/signup.schema'
import { extractValidationErrors } from '@/lib/api/types'
import { logger } from '@/lib/core/logger'
import { getErrorMessage } from '@/lib/api/error-handler'

const FIELD_MAP: Record<string, keyof SignupFormData> = {
  phone: 'mobile',
  name: 'name',
  email: 'email',
  password: 'password',
  gender: 'gender',
  dob: 'dob',
  address: 'address',
}

const inputClassName =
  'h-11 px-4 rounded-[0.375rem] border-[0.025rem] border-auth-input-border bg-auth-input-bg text-md font-medium text-auth-form-text shadow-[var(--auth-input-shadow)] placeholder:text-auth-form-text/40 focus-visible:ring-[1px] focus-visible:ring-auth-form-text/30 focus-visible:border-auth-form-text/40 sm:h-[3.25rem] sm:px-6'

const labelClassName = 'text-sm font-bold text-auth-form-muted sm:text-base 2xl:text-lg'

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredUser, setRegisteredUser] = useState<{
    userId: string
    email: string
  } | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const { register: registerUser, isLoading, clearError: clearStoreError } = useAuthStore()

  // Clear any leftover errors from other auth pages (e.g. login)
  useEffect(() => {
    clearStoreError()
  }, [clearStoreError])

  const {
    register,
    handleSubmit,
    control,
    setError: setFieldError,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setError(null)
    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.mobile,
        password: data.password,
        gender: data.gender
          ? (data.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER')
          : undefined,
        dob: data.dob || undefined,
        address: data.address || undefined,
      })
      setRegisteredUser({ userId: response.user.id, email: response.user.email })
    } catch (err) {
      // Handle backend validation errors (422)
      const validationErrors = extractValidationErrors(err)
      if (validationErrors.length > 0) {
        validationErrors.forEach(({ field, message }) => {
          const formField = FIELD_MAP[field] || field
          if (formField in signupSchema.shape) {
            setFieldError(formField as keyof SignupFormData, { message })
          }
        })
      } else {
        setError(getErrorMessage(err))
        logger.error('Signup failed', { error: String(err) })
      }
    }
  }

  const handleVerifyEmail = async (otp: string) => {
    if (!registeredUser) return
    setIsVerifying(true)
    setVerifyError(null)
    try {
      const result = await authService.verifyRegistrationOtp({
        email: registeredUser.email,
        otp,
      })
      toast.success('Email verified successfully. Please complete your KYC.')
      router.push(`/auth/kyc?token=${encodeURIComponent(result.kycToken)}`)
    } catch (err) {
      setVerifyError(getErrorMessage(err))
      setIsVerifying(false)
      throw err
    }
  }

  const handleResendVerification = async () => {
    if (!registeredUser) return
    setVerifyError(null)
    try {
      await authService.resendRegistrationOtp({ email: registeredUser.email })
    } catch (err) {
      setVerifyError(getErrorMessage(err))
      throw err
    }
  }

  // Show OTP verification after successful registration
  if (registeredUser) {
    return (
      <OtpVerifyCard
        description={
          <>
            Enter OTP sent to{' '}
            <span className="font-medium text-auth-form-text">{registeredUser.email}</span>
          </>
        }
        expiresInSeconds={600}
        onVerify={handleVerifyEmail}
        onResend={handleResendVerification}
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

  return (
    <div className={`flex flex-1 flex-col ${className ?? ''}`} {...props}>
      {/* Center — form content */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col gap-8 sm:gap-10 2xl:gap-[2.875rem]">
          {/* Header */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[2.25rem] lg:text-[2.875rem] 2xl:text-[3.25rem]">
              Create an Account
            </h1>
            <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
              Enter your personal data to create your account
            </p>
          </div>

          {/* Stepper */}
          <RegistrationStepper currentStep={1} />

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6 sm:gap-8 2xl:gap-8"
          >
            {error && <AuthErrorAlert message={error} />}

            <div className="flex flex-col gap-4 sm:gap-[1.125rem]">
              {/* Name + Mobile — stack on mobile, row on sm+ */}
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
                <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                  <Label htmlFor="name" className={labelClassName}>
                    Name<span className="-ml-1 text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter Name"
                    className={inputClassName}
                    {...register('name')}
                    aria-invalid={errors.name ? 'true' : 'false'}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                  <Label htmlFor="mobile" className={labelClassName}>
                    Mobile<span className="-ml-1 text-destructive">*</span>
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="Enter Mobile"
                    maxLength={10}
                    onInput={e => {
                      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')
                    }}
                    className={inputClassName}
                    {...register('mobile')}
                    aria-invalid={errors.mobile ? 'true' : 'false'}
                  />
                  {errors.mobile && (
                    <p className="text-xs text-destructive">{errors.mobile.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="email" className={labelClassName}>
                  Email<span className="-ml-1 text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Email"
                  className={inputClassName}
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {/* Address */}
              <div className="flex flex-col gap-2.5 sm:gap-3.5">
                <Label htmlFor="address" className={labelClassName}>
                  Address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Enter Address"
                  className={inputClassName}
                  {...register('address')}
                  aria-invalid={errors.address ? 'true' : 'false'}
                />
                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address.message}</p>
                )}
              </div>

              {/* Gender + DOB — stack on mobile, row on sm+ */}
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-3.5 sm:items-start">
                <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                  <Label htmlFor="gender" className={labelClassName}>
                    Gender
                  </Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger
                          className={cn(
                            inputClassName,
                            'w-full data-[size=default]:h-11 text-auth-form-text [&>span[data-placeholder]]:text-auth-form-text/40 sm:data-[size=default]:h-[3.25rem] data-[state=open]:ring-[1px] data-[state=open]:ring-auth-form-text/30 data-[state=open]:border-auth-form-text/40',
                          )}
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <p className="text-xs text-destructive">{errors.gender.message}</p>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2.5 sm:gap-3.5">
                  <Label htmlFor="dob" className={labelClassName}>
                    DOB
                  </Label>
                  <Controller
                    name="dob"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              inputClassName,
                              'flex items-center justify-between w-full text-left data-[state=open]:ring-[1px] data-[state=open]:ring-auth-form-text/30 data-[state=open]:border-auth-form-text/40',
                              !field.value && 'text-auth-form-text/40',
                            )}
                          >
                            <span className={cn(!field.value && 'text-auth-form-text/40')}>
                              {field.value
                                ? new Date(field.value).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })
                                : 'dd/mm/yyyy'}
                            </span>
                            <AppIcon icon={CalendarIcon} className="text-auth-form-muted" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={date => {
                              field.onChange(
                                date
                                  ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                  : '',
                              )
                            }}
                            captionLayout="dropdown"
                            startMonth={new Date(1930, 0)}
                            endMonth={
                              new Date(new Date().getFullYear() - 18, new Date().getMonth())
                            }
                            defaultMonth={
                              field.value
                                ? new Date(field.value)
                                : new Date(new Date().getFullYear() - 18, new Date().getMonth())
                            }
                            disabled={date =>
                              date >
                              new Date(
                                new Date().getFullYear() - 18,
                                new Date().getMonth(),
                                new Date().getDate(),
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.dob && <p className="text-xs text-destructive">{errors.dob.message}</p>}
                </div>
              </div>

              {/* Password + Confirm Password — always stacked */}
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-col gap-2.5 sm:gap-3.5">
                  <Label htmlFor="password" className={labelClassName}>
                    Password<span className="-ml-1 text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="***********"
                      className={cn(inputClassName, 'pr-12')}
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
                <div className="flex flex-col gap-2.5 sm:gap-3.5">
                  <Label htmlFor="confirmPassword" className={labelClassName}>
                    Confirm Password<span className="-ml-1 text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="***********"
                      className={cn(inputClassName, 'pr-12')}
                      {...register('confirmPassword')}
                      aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer sm:right-6"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <AppIcon icon={Eye} className="text-auth-form-muted" />
                      ) : (
                        <AppIcon icon={EyeOff} className="text-auth-form-muted" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Register button */}
            <Button
              type="submit"
              variant={null}
              disabled={isLoading}
              className="group w-full h-11 gap-2.5 rounded-full bg-auth-cta text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:text-base 2xl:text-xl"
            >
              {isLoading ? 'Registering...' : 'Register'}
              {!isLoading && (
                <AppIcon
                  icon={ArrowRight}
                  size="sm"
                  stroke="bold"
                  className="text-auth-cta-text transition-transform group-hover:translate-x-1"
                />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer — pinned to bottom */}
      <div className="mt-auto flex flex-col items-center justify-center gap-1 pt-6 sm:flex-row sm:gap-2 sm:pt-8 text-sm sm:text-base 2xl:text-lg">
        <span className="font-medium text-auth-form-subtle">Already have an account ?</span>
        <Link
          href="/auth/login"
          className="font-bold text-auth-primary transition-opacity hover:opacity-70"
        >
          Login
        </Link>
      </div>
    </div>
  )
}
