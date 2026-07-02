'use client'

import { AppIcon } from '@/components/shared/app-icon'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, Lock, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AccessDeniedProps {
  /** Custom title - defaults to "Access Denied" */
  title?: string
  /** Custom message - defaults to standard permission message */
  message?: string
  /** Resource name for context (e.g., "dashboard", "stores") */
  resource?: string
  /** Show back button - defaults to true */
  showBackButton?: boolean
  /** Show contact admin info - defaults to true */
  showContactInfo?: boolean
  /** Custom action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Compact mode for inline display */
  compact?: boolean
}

/**
 * AccessDenied Component
 *
 * Displays a friendly permission denied message when users attempt
 * to access resources they don't have permission for.
 *
 * @example
 * // Basic usage
 * <AccessDenied />
 *
 * @example
 * // With resource context
 * <AccessDenied resource="stores" />
 *
 * @example
 * // Compact inline version
 * <AccessDenied compact message="You don't have access to this data." />
 */
export function AccessDenied({
  title = 'Access Denied',
  message,
  resource,
  showBackButton = true,
  showContactInfo = true,
  action,
  compact = false,
}: AccessDeniedProps) {
  const router = useRouter()

  const defaultMessage = resource
    ? `You don't have permission to access ${resource}. Contact your administrator if you need access.`
    : `You don't have permission to access this resource. Contact your administrator if you need access.`

  const displayMessage = message || defaultMessage

  // Compact version for inline display
  if (compact) {
    return (
      <Alert>
        <AppIcon icon={Lock} size="sm" />
        <AlertDescription>{displayMessage}</AlertDescription>
      </Alert>
    )
  }

  // Full version with card styling
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <AppIcon icon={Lock} size="lg" color="destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{displayMessage}</p>
        </div>

        {showContactInfo && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AppIcon icon={Mail} size="sm" color="muted" />
            <span>Need access? Contact your system administrator</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="inline-flex h-[42px] w-[160px] items-center justify-center gap-2 rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              <AppIcon icon={ArrowLeft} size="sm" color="primary-foreground" />
              Go Back
            </button>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex h-[42px] w-[160px] items-center justify-center rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Inline access denied alert for use within components
 */
export function AccessDeniedAlert({
  message = "You don't have permission to access this resource.",
}: {
  message?: string
}) {
  return (
    <Alert variant="destructive">
      <AppIcon icon={Lock} size="sm" />
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
