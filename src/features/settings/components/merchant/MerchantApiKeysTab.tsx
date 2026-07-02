'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { Info, TriangleAlert, Copy } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'

import { settingsApiService } from '../../api/settings.api'
import type { ApiCredentials } from '../../types'

function formatUpdatedOn(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  const year = d.getFullYear()
  const hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  return `Updated On ${day} ${month} ${year} ${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`
}

function getDaysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function MerchantApiKeysTab() {
  const [apiCredentials, setApiCredentials] = useState<ApiCredentials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showKeysDialog, setShowKeysDialog] = useState(false)
  const [regeneratedCredentials, setRegeneratedCredentials] = useState<ApiCredentials | null>(null)

  const fetchCredentials = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await settingsApiService.getApiCredentials()
      setApiCredentials(data)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }

  const handleRegenerate = async () => {
    setShowConfirmDialog(false)
    try {
      setIsRegenerating(true)
      const newCredentials = await settingsApiService.rotateApiCredentials()
      setApiCredentials(newCredentials)
      setRegeneratedCredentials(newCredentials)
      setShowKeysDialog(true)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCloseKeysDialog = () => {
    setShowKeysDialog(false)
    setRegeneratedCredentials(null)
  }

  const daysLeft = apiCredentials ? getDaysUntilExpiry(apiCredentials.expiresAt) : null

  return (
    <>
      <div className="overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6">
        <div className="flex flex-col gap-8">
          {/* Header: Title + Banner on left, Re-generate on right */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-6">
              <p className="text-xl text-foreground">API Keys</p>
              <div className="flex items-center gap-3.5 rounded-[4px] bg-info-banner p-3.5">
                <AppIcon icon={Info} size="lg" color="teal" />
                <span className="text-sm text-status-teal">
                  {daysLeft !== null
                    ? `Note: This regeneration code must be used within 90 days of issuance, Expiring in ${daysLeft} days`
                    : 'Note: This regeneration code must be used within 90 days of issuance'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isRegenerating || isLoading}
              className="h-[2.625rem] w-[10rem] shrink-0 rounded-md bg-button-bg text-sm capitalize text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
            >
              {isRegenerating ? 'Regenerating...' : 'Re-generate'}
            </button>
          </div>

          {/* API Key + Salt Key cards side by side */}
          <div className="flex gap-3.5">
            <KeyCard
              title="API Key"
              value={apiCredentials?.apiKey}
              updatedAt={apiCredentials?.updatedAt}
              isLoading={isLoading}
              onCopy={() => apiCredentials && handleCopy(apiCredentials.apiKey, 'API Key')}
            />
            <KeyCard
              title="Salt key"
              value={apiCredentials?.saltKey ?? apiCredentials?.saltKeyFingerprint ?? undefined}
              updatedAt={apiCredentials?.updatedAt}
              isLoading={isLoading}
              onCopy={() =>
                apiCredentials &&
                handleCopy(
                  apiCredentials.saltKey ?? apiCredentials.saltKeyFingerprint ?? '',
                  'Salt Key',
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Confirm Regeneration Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Regenerate API Keys?"
        description="This will invalidate your current API keys and generate new ones. Any integrations using the existing keys will stop working immediately."
        confirmLabel="Re-generate"
        variant="confirm"
        isPending={isRegenerating}
        pendingLabel="Regenerating..."
        onConfirm={handleRegenerate}
      />

      {/* Regenerated Keys Dialog */}
      <RegeneratedKeysDialog
        open={showKeysDialog}
        onClose={handleCloseKeysDialog}
        credentials={regeneratedCredentials}
        onCopy={handleCopy}
      />
    </>
  )
}

function RegeneratedKeysDialog({
  open,
  onClose,
  credentials,
  onCopy,
}: {
  open: boolean
  onClose: () => void
  credentials: ApiCredentials | null
  onCopy: (value: string, label: string) => void
}) {
  if (!credentials) return null

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">API Keys Regenerated</DialogTitle>
          <DialogDescription className="sr-only">
            Your new API keys have been generated. Save them now.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Warning banner */}
          <div className="flex items-start gap-3 rounded-md bg-status-orange/10 p-3.5">
            <AppIcon icon={TriangleAlert} size="lg" color="orange" />
            <p className="text-sm text-status-orange">
              Please save these keys somewhere safe. Once you close this dialog, the salt key will
              be masked and cannot be retrieved again.
            </p>
          </div>

          {/* API Key */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">API Key</p>
            <div className="flex items-center gap-2 overflow-hidden rounded-md border border-foreground/20 bg-secondary px-4 py-2.5">
              <span className="min-w-0 flex-1 break-all text-sm text-status-green">
                {credentials.apiKey}
              </span>
              <button
                onClick={() => onCopy(credentials.apiKey, 'API Key')}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <AppIcon icon={Copy} size="lg" />
              </button>
            </div>
          </div>

          {/* Salt Key */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Salt Key</p>
            <div className="flex items-center gap-2 overflow-hidden rounded-md border border-foreground/20 bg-secondary px-4 py-2.5">
              <span className="min-w-0 flex-1 break-all text-sm text-status-green">
                {credentials.saltKey ?? credentials.saltKeyFingerprint ?? '****'}
              </span>
              <button
                onClick={() =>
                  onCopy(credentials.saltKey ?? credentials.saltKeyFingerprint ?? '', 'Salt Key')
                }
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <AppIcon icon={Copy} size="lg" />
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-button-bg text-primary-foreground hover:bg-button-bg/90"
          >
            I have saved my keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function KeyCard({
  title,
  value,
  updatedAt,
  isLoading,
  onCopy,
}: {
  title: string
  value?: string
  updatedAt?: string
  isLoading?: boolean
  onCopy: () => void
}) {
  return (
    <div className="min-w-0 flex-1 overflow-hidden rounded-md border-[0.5px] border-foreground/20 bg-secondary p-6 shadow-[var(--shadow-card)]">
      <div className="flex min-w-0 flex-col gap-6">
        <p className="text-xl text-foreground">{title}</p>
        <div className="flex flex-col gap-6">
          {isLoading ? (
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          ) : (
            updatedAt && (
              <p className="text-sm capitalize text-foreground">{formatUpdatedOn(updatedAt)}</p>
            )
          )}
          <div className="flex items-center gap-2 rounded-md border border-foreground/20 bg-card px-6 py-1.5">
            {isLoading ? (
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            ) : (
              <span className="min-w-0 truncate text-sm font-medium capitalize text-status-green">
                {value ?? '****'}
              </span>
            )}
            <button
              onClick={onCopy}
              disabled={isLoading}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <AppIcon icon={Copy} className="size-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
