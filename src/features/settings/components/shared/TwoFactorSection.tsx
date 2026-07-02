'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { Info, ShieldAlert, Check, Copy } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'
import { settingsApiService } from '../../api/settings.api'
import type { TwoFactorStatus, AuthAppSetupResponse } from '../../types'

type SelectedMethod = 'EMAIL_TOTP' | 'AUTH_APP'

function isAuthAppMethod(method: string) {
  return method === 'AUTH_APP' || method === 'AUTH_APP_TOTP'
}

interface TwoFactorSectionProps {
  basePath: string
}

export function TwoFactorSection({ basePath }: TwoFactorSectionProps) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<SelectedMethod>('EMAIL_TOTP')
  const [setupData, setSetupData] = useState<AuthAppSetupResponse | null>(null)
  const [settingUp, setSettingUp] = useState(false)
  const [otpValues, setOtpValues] = useState<string[]>(Array.from({ length: 6 }, () => ''))
  const [submitting, setSubmitting] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const fetchStatus = useCallback(async () => {
    try {
      const data = await settingsApiService.get2FAStatus(basePath)
      setStatus(data)
      setSelectedMethod(isAuthAppMethod(data.twoFaMethod) ? 'AUTH_APP' : 'EMAIL_TOTP')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [basePath])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const resetOtp = () => {
    setOtpValues(Array.from({ length: 6 }, () => ''))
  }

  const handleMethodSelect = async (method: SelectedMethod) => {
    setSelectedMethod(method)
    resetOtp()
    setSetupData(null)

    // If selecting Auth App and it's not configured yet, trigger setup
    if (method === 'AUTH_APP' && status && !status.authAppConfigured) {
      setSettingUp(true)
      try {
        const data = await settingsApiService.setupAuthApp(basePath)
        setSetupData(data)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setSettingUp(false)
      }
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newValues = [...otpValues]
    newValues[index] = value.slice(-1)
    setOtpValues(newValues)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newValues = [...otpValues]
    for (let i = 0; i < 6; i++) {
      newValues[i] = pasted[i] || ''
    }
    setOtpValues(newValues)
    // Focus the next empty slot or the last one
    const nextEmpty = newValues.findIndex(v => !v)
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty
    inputRefs.current[focusIndex]?.focus()
  }

  const getOtpCode = () => otpValues.join('')

  const handleConfirmAuthApp = async () => {
    const code = getOtpCode()
    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }
    if (!setupData) return

    setSubmitting(true)
    try {
      await settingsApiService.confirmAuthApp(basePath, {
        challengeId: setupData.challengeId,
        code,
      })
      toast.success('Google Authenticator enabled successfully')
      resetOtp()
      setSetupData(null)
      await fetchStatus()
    } catch {
      toast.error('Invalid code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSwitchToEmail = async () => {
    const code = getOtpCode()
    if (code.length !== 6) {
      toast.error('Please enter your authenticator code')
      return
    }

    setSubmitting(true)
    try {
      await settingsApiService.switchMethod(basePath, {
        twoFaMethod: 'EMAIL_TOTP',
        authenticatorCode: code,
      })
      toast.success('Switched to Email 2FA successfully')
      resetOtp()
      await fetchStatus()
    } catch {
      toast.error('Invalid code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopySecret = () => {
    if (!setupData?.otpauthUri) return
    navigator.clipboard.writeText(setupData.otpauthUri)
    toast.success('Secret code copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3.5 overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6">
        <p className="text-xl capitalize text-foreground">
          Two-Factor Authentication (2FA) Settings
        </p>
        <div className="flex h-20 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading 2FA settings...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex flex-col gap-3.5 overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6">
        <p className="text-xl capitalize text-foreground">
          Two-Factor Authentication (2FA) Settings
        </p>
        <div className="flex h-20 items-center justify-center">
          <p className="text-sm text-muted-foreground">Failed to load 2FA settings</p>
        </div>
      </div>
    )
  }

  const isCurrentAuthApp = isAuthAppMethod(status.twoFaMethod)
  const isCurrentEmail = !isCurrentAuthApp
  const currentMethodLabel = isCurrentAuthApp ? 'Google Authenticator' : 'Email'
  const selectedEmail = selectedMethod === 'EMAIL_TOTP'
  const selectedAuthApp = selectedMethod === 'AUTH_APP'

  // Show action area?
  // Email selected + already EMAIL_TOTP → no button (just description)
  // Email selected + currently AUTH_APP → show OTP input + switch button
  // Auth App selected + not configured → show QR setup
  // Auth App selected + configured + already AUTH_APP → no button (just info)
  const showEmailSwitch = selectedEmail && isCurrentAuthApp
  const showAuthAppSetup = selectedAuthApp && !status.authAppConfigured
  const showAuthAppAlreadyActive = selectedAuthApp && status.authAppConfigured && isCurrentAuthApp

  return (
    <div className="flex flex-col gap-8 overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6">
      {/* Title + Banner */}
      <div className="flex flex-col gap-8">
        <p className="text-xl capitalize text-foreground">
          Two-Factor Authentication (2FA) Settings
        </p>
        {status.twoFaEnabled ? (
          <div className="flex items-center gap-3.5 rounded-[4px] bg-info-banner p-3.5">
            <AppIcon icon={Info} size="lg" color="teal" />
            <p className="text-sm text-status-teal">
              2FA is currently set to use {currentMethodLabel}
              {isCurrentEmail && status.maskedEmail && ` (${status.maskedEmail})`}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3.5 rounded-[4px] bg-status-orange/10 p-3.5">
            <AppIcon icon={ShieldAlert} size="lg" color="orange" />
            <p className="text-sm text-status-orange">
              Two-Factor Authentication is not enabled. Enable 2FA to add an extra layer of security
              to your account.
            </p>
          </div>
        )}
      </div>

      {/* Method Selection + Content — only when 2FA is enabled */}
      {status.twoFaEnabled && (
        <div className="flex flex-col gap-6">
          {/* Checkboxes */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleMethodSelect('EMAIL_TOTP')}
              className="flex items-center gap-3.5 rounded-md p-3.5"
            >
              <div
                className={cn(
                  'flex size-6 items-center justify-center rounded-[4.5px]',
                  selectedEmail
                    ? 'bg-status-green'
                    : 'border-[0.75px] border-muted-foreground bg-card',
                )}
              >
                <AppIcon
                  icon={Check}
                  className={cn('size-5', selectedEmail ? 'text-white' : 'text-foreground/15')}
                />
              </div>
              <span className="text-sm font-medium text-foreground">Email</span>
            </button>

            <button
              onClick={() => handleMethodSelect('AUTH_APP')}
              className="flex items-center gap-3.5 rounded-md p-3.5"
            >
              <div
                className={cn(
                  'flex size-6 items-center justify-center rounded-[4.5px]',
                  selectedAuthApp
                    ? 'bg-status-green'
                    : 'border-[0.75px] border-muted-foreground bg-card',
                )}
              >
                <AppIcon
                  icon={Check}
                  className={cn('size-5', selectedAuthApp ? 'text-white' : 'text-foreground/15')}
                />
              </div>
              <span className="text-sm font-medium text-foreground">Google Authenticator</span>
            </button>
          </div>

          {/* Email selected — already active */}
          {selectedEmail && isCurrentEmail && (
            <p className="text-sm text-foreground">
              A verification code will be sent to your registered email address each time you log
              in.
            </p>
          )}

          {/* Email selected — need to switch from Auth App */}
          {showEmailSwitch && (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-foreground">
                Enter your Google Authenticator code to switch to Email 2FA.
              </p>
              <OtpInput
                otpValues={otpValues}
                inputRefs={inputRefs}
                onChange={handleOtpChange}
                onKeyDown={handleOtpKeyDown}
                onPaste={handleOtpPaste}
              />
              <button
                onClick={handleSwitchToEmail}
                disabled={submitting}
                className="h-[2.625rem] w-[10rem] rounded-md bg-button-bg text-sm capitalize text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
              >
                {submitting ? 'Switching...' : 'Enable Email 2FA'}
              </button>
            </div>
          )}

          {/* Auth App selected — needs setup (not configured) */}
          {showAuthAppSetup && (
            <div className="flex flex-col gap-8">
              {settingUp ? (
                <p className="text-sm text-muted-foreground">Setting up authenticator...</p>
              ) : setupData ? (
                <>
                  {/* Step 1: QR Code */}
                  <div className="flex flex-col gap-6">
                    <p className="text-sm text-foreground">
                      <span className="mr-1">1.</span>
                      Scan This QR Code With Your Google Authenticator App.
                    </p>
                    <div className="w-fit rounded-md border border-foreground/20 bg-white p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={setupData.qrCodeDataUrl}
                        alt="QR Code for Google Authenticator"
                        className="size-[185px]"
                      />
                    </div>
                  </div>

                  {/* Secret Code */}
                  <div className="flex items-center gap-6">
                    <p className="text-sm text-foreground">Alternatively, Use The Code:</p>
                    <div className="flex items-center gap-2 rounded-md border border-foreground/20 px-6 py-1.5">
                      <span className="text-sm font-medium text-status-green break-all">
                        {setupData.otpauthUri}
                      </span>
                      <button onClick={handleCopySecret} className="shrink-0">
                        <AppIcon icon={Copy} size="lg" color="muted" />
                      </button>
                    </div>
                  </div>

                  {/* Step 2: OTP Input */}
                  <div className="flex flex-col gap-6">
                    <p className="text-sm text-foreground">
                      <span className="mr-1">2.</span>
                      Enter The Pin From Google Authenticator App:
                    </p>
                    <OtpInput
                      otpValues={otpValues}
                      inputRefs={inputRefs}
                      onChange={handleOtpChange}
                      onKeyDown={handleOtpKeyDown}
                      onPaste={handleOtpPaste}
                    />
                  </div>

                  {/* Enable Button */}
                  <button
                    onClick={handleConfirmAuthApp}
                    disabled={submitting}
                    className="h-[2.625rem] w-[10rem] rounded-md bg-button-bg text-sm capitalize text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
                  >
                    {submitting ? 'Enabling...' : 'Enable Google 2FA'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Failed to load setup. Please try selecting Google Authenticator again.
                </p>
              )}
            </div>
          )}

          {/* Auth App selected — already configured and active */}
          {showAuthAppAlreadyActive && (
            <p className="text-sm text-foreground">
              Google Authenticator is active. A code from your authenticator app is required each
              time you log in.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function OtpInput({
  otpValues,
  inputRefs,
  onChange,
  onKeyDown,
  onPaste,
}: {
  otpValues: string[]
  inputRefs: React.RefObject<(HTMLInputElement | null)[]>
  onChange: (index: number, value: string) => void
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-wrap gap-3.5">
      {otpValues.map((val, i) => (
        <input
          key={i}
          ref={el => {
            inputRefs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={e => onChange(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          onPaste={i === 0 ? onPaste : undefined}
          className="size-[2.875rem] rounded-md border border-foreground/20 bg-secondary text-center text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/30"
        />
      ))}
    </div>
  )
}
