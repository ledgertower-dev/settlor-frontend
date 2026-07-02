'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { AuthErrorAlert } from './AuthErrorAlert'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

interface OtpVerifyCardProps {
  /** Content shown above the OTP input describing where the code was sent */
  description: React.ReactNode
  /** Countdown start in seconds */
  expiresInSeconds: number
  /** Called when user submits the 6-digit code */
  onVerify: (code: string) => Promise<void>
  /** Called when user clicks Resend. If undefined, resend button is hidden */
  onResend?: () => Promise<void>
  /** External loading state */
  isLoading: boolean
  /** External error message */
  error: string | null
  /** Clear the external error */
  onClearError: () => void
  /** Optional footer content below the card */
  footer?: React.ReactNode
}

const otpSlotClassName =
  'size-10 rounded-[0.625rem] border border-auth-input-border bg-auth-surface text-base font-semibold text-auth-form-text shadow-[var(--auth-input-shadow)] font-[family-name:var(--font-geist-sans)] data-[active=true]:ring-0 data-[active=true]:border-auth-form-text/40 sm:size-12 sm:text-xl 2xl:size-16 2xl:text-[2rem]'

export function OtpVerifyCard({
  description,
  expiresInSeconds,
  onVerify,
  onResend,
  isLoading,
  error,
  onClearError,
  footer,
}: OtpVerifyCardProps) {
  const [code, setCode] = useState('')
  const [expiryCountdown, setExpiryCountdown] = useState(expiresInSeconds)
  const [resendCountdown, setResendCountdown] = useState(30)

  // Code expiry timer
  useEffect(() => {
    if (expiryCountdown <= 0) return

    const timer = setInterval(() => {
      setExpiryCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [expiryCountdown])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCountdown <= 0) return

    const timer = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCountdown])

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) return

    onClearError()
    try {
      await onVerify(code)
    } catch {
      // Error handled externally
    }
  }, [code, onVerify, onClearError])

  const handleResend = async () => {
    if (!onResend) return
    onClearError()
    try {
      await onResend()
      setResendCountdown(30)
      setExpiryCountdown(expiresInSeconds)
    } catch {
      // Error handled externally
    }
  }

  const handleCodeComplete = useCallback(
    (value: string) => {
      setCode(value)
      if (value.length === 6) {
        onClearError()
        onVerify(value).catch(() => {})
      }
    },
    [onVerify, onClearError],
  )

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Center — OTP card */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-center justify-center self-stretch rounded-[0.875rem] border-[0.4px] border-auth-input-border bg-auth-input-bg px-4 py-10 shadow-[var(--auth-input-shadow)] sm:px-6 2xl:px-6 2xl:py-14">
          <div className="flex w-full flex-col items-center gap-8 sm:gap-10 2xl:gap-[2.875rem]">
            {/* Title */}
            <h1 className="text-center text-xl font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-2xl 2xl:text-[2rem]">
              Verify to continue
            </h1>

            {/* Error */}
            {error && <AuthErrorAlert message={error} />}

            {/* OTP section */}
            <div className="flex w-full flex-col gap-5 sm:gap-6 2xl:gap-6">
              {/* Description */}
              <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
                {description}
              </p>

              {/* OTP Input */}
              <InputOTP maxLength={6} value={code} onChange={handleCodeComplete}>
                <InputOTPGroup className="flex-wrap gap-2 sm:gap-2.5 2xl:gap-3.5">
                  <InputOTPSlot index={0} className={otpSlotClassName} />
                  <InputOTPSlot index={1} className={otpSlotClassName} />
                  <InputOTPSlot index={2} className={otpSlotClassName} />
                  <InputOTPSlot index={3} className={otpSlotClassName} />
                  <InputOTPSlot index={4} className={otpSlotClassName} />
                  <InputOTPSlot index={5} className={otpSlotClassName} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Timer + Resend row */}
            {onResend ? (
              <div className="flex w-full items-center justify-between gap-3.5">
                {expiryCountdown > 0 ? (
                  <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
                    OTP expires in {formatCountdown(expiryCountdown)}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-destructive sm:text-base 2xl:text-lg">
                    OTP expired
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0}
                  className="text-sm font-medium text-auth-form-text transition-opacity hover:opacity-70 disabled:text-auth-form-subtle disabled:cursor-not-allowed disabled:hover:opacity-100 sm:text-base 2xl:text-lg"
                >
                  {resendCountdown > 0
                    ? `Resend in ${formatCountdown(resendCountdown)}`
                    : 'Resend OTP'}
                </button>
              </div>
            ) : (
              <>
                {expiryCountdown > 0 && (
                  <p className="text-sm font-medium text-auth-form-muted sm:text-base 2xl:text-lg">
                    Code expires in {formatCountdown(expiryCountdown)}
                  </p>
                )}
                {expiryCountdown <= 0 && (
                  <p className="text-sm font-medium text-destructive sm:text-base 2xl:text-lg">
                    Code has expired
                  </p>
                )}
              </>
            )}

            {/* Button */}
            <Button
              variant={null}
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
              className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:text-base 2xl:text-xl"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
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
        </div>
      </div>

      {/* Footer — pinned to bottom */}
      {footer}
    </div>
  )
}
