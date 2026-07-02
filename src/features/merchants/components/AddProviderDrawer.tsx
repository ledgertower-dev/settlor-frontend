'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, Search, TriangleAlert, X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'
import type { AvailableProvider } from '../types/merchant-provider.types'
import {
  useAvailableProviders,
  useAvailableVirtualAccounts,
  useAddProviderConfiguration,
  providerConfigKeys,
} from '../model/use-merchant-provider-config'

interface AddProviderDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
  onAdd: () => void
}

type Step = 1 | 2

export function AddProviderDrawer({
  open,
  onOpenChange,
  merchantId,
  onAdd,
}: AddProviderDrawerProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [vaAssignments, setVaAssignments] = useState<Record<string, { id: string; label: string }>>(
    {},
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  // Invalidate cached available VAs when drawer opens so newly created VAs appear
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({
        queryKey: [...providerConfigKeys.all, 'available-vas'],
      })
    }
  }, [open, queryClient])

  const { data: availableProviders, isLoading: isLoadingProviders } = useAvailableProviders(
    merchantId,
    open,
  )

  const addProviderConfig = useAddProviderConfiguration()

  const filteredProviders = useMemo(
    () =>
      (availableProviders ?? []).filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.kind.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [availableProviders, searchQuery],
  )

  const selectedProviders = useMemo(
    () => (availableProviders ?? []).filter(p => selectedIds.includes(p.id)),
    [availableProviders, selectedIds],
  )

  const assignedCount = selectedIds.filter(id => vaAssignments[id]).length

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep(1)
      setSelectedIds([])
      setVaAssignments({})
      setSearchQuery('')
    }, 300)
  }

  const handleToggleProvider = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const handleContinue = () => {
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleReview = () => {
    setShowReviewDialog(true)
  }

  const handleConfirmAdd = async () => {
    try {
      for (const provider of selectedProviders) {
        await addProviderConfig.mutateAsync({
          merchantId,
          data: {
            provider_id: provider.id,
            virtual_account_id: vaAssignments[provider.id].id,
            reconciliation_mode: 'MANUAL',
          },
        })
      }
      toast.success(
        `${selectedProviders.length} provider${selectedProviders.length > 1 ? 's' : ''} added`,
      )
      onAdd()
      setShowReviewDialog(false)
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:w-[640px] sm:max-w-[640px] [&>button]:hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-5">
          <h2 className="text-lg font-medium text-foreground">Add Provider</h2>
          <button
            onClick={handleClose}
            aria-label="Close drawer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon icon={X} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3 border-b border-foreground/10 px-6 pb-6 pt-2">
          <StepIndicator step={1} currentStep={step} label="Select providers" />
          <div className="h-px flex-1 bg-foreground/10" />
          <StepIndicator step={2} currentStep={step} label="Assign virtual accounts" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 ? (
            <Step1Content
              providers={filteredProviders}
              selectedIds={selectedIds}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggle={handleToggleProvider}
              isLoading={isLoadingProviders}
            />
          ) : (
            <Step2Content
              merchantId={merchantId}
              selectedProviders={selectedProviders}
              vaAssignments={vaAssignments}
              onVaChange={(providerId, va) =>
                setVaAssignments(prev => ({ ...prev, [providerId]: va }))
              }
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-foreground/10 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {step === 1
              ? `${selectedIds.length} selected`
              : `${assignedCount} of ${selectedIds.length} assigned`}
          </p>
          <div className="flex items-center gap-2.5">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="h-[2.625rem] rounded-md border border-foreground/20 px-5 text-sm text-foreground transition-colors hover:bg-accent"
              >
                Back
              </button>
            )}
            <button
              onClick={handleClose}
              className="h-[2.625rem] rounded-md border border-foreground/20 px-5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                onClick={handleContinue}
                disabled={selectedIds.length === 0}
                className="h-[2.625rem] rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleReview}
                disabled={assignedCount < selectedIds.length}
                className="h-[2.625rem] rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
              >
                Review
              </button>
            )}
          </div>
        </div>

        {/* Review Dialog */}
        <ReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          providers={selectedProviders}
          vaAssignments={vaAssignments}
          onConfirm={handleConfirmAdd}
          isSubmitting={addProviderConfig.isPending}
        />
      </SheetContent>
    </Sheet>
  )
}

// --- Step Indicator ---

function StepIndicator({
  step,
  currentStep,
  label,
}: {
  step: number
  currentStep: number
  label: string
}) {
  const isActive = currentStep >= step
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-xs font-medium',
          isActive ? 'bg-button-bg text-primary-foreground' : 'bg-secondary text-muted-foreground',
        )}
      >
        {step}
      </span>
      <span
        className={cn(
          'text-sm',
          isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </div>
  )
}

// --- Loading Skeleton ---

function ProviderSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 rounded-md border border-foreground/10 px-4 py-3.5"
        >
          <Skeleton className="size-4 rounded" />
          <Skeleton className="size-9 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Step 1: Select Providers ---

function Step1Content({
  providers,
  selectedIds,
  searchQuery,
  onSearchChange,
  onToggle,
  isLoading,
}: {
  providers: AvailableProvider[]
  selectedIds: string[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onToggle: (id: string) => void
  isLoading: boolean
}) {
  return (
    <div className="flex flex-col gap-3 p-6 pt-2">
      {/* Search */}
      <div className="relative">
        <AppIcon
          icon={Search}
          size="sm"
          color="muted"
          className="absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="h-12 w-full rounded-md border border-foreground/20 bg-transparent pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30"
        />
      </div>

      {/* Provider list */}
      {isLoading ? (
        <ProviderSkeleton />
      ) : (
        <div className="flex flex-col gap-2">
          {providers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No providers found</p>
          )}
          {providers.map(p => {
            const isSelected = selectedIds.includes(p.id)
            const initials = p.shortCode
              ? p.shortCode.slice(0, 2).toUpperCase()
              : p.name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .slice(0, 2)

            return (
              <div
                key={p.id}
                role={p.alreadyConfigured ? undefined : 'button'}
                onClick={p.alreadyConfigured ? undefined : () => onToggle(p.id)}
                className={cn(
                  'flex items-center gap-3.5 rounded-md border px-4 py-3.5 transition-colors',
                  p.alreadyConfigured
                    ? 'border-foreground/10 opacity-60'
                    : isSelected
                      ? 'border-button-bg bg-button-bg/5 cursor-pointer'
                      : 'border-foreground/20 hover:border-foreground/30 cursor-pointer',
                )}
              >
                {p.alreadyConfigured ? (
                  <div className="size-4" />
                ) : (
                  <Checkbox
                    variant="green"
                    checked={isSelected}
                    onCheckedChange={() => onToggle(p.id)}
                    onClick={e => e.stopPropagation()}
                  />
                )}

                <div className="flex size-9 items-center justify-center rounded-md bg-button-bg text-xs font-medium text-primary-foreground">
                  {initials}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <span className="rounded-md border border-foreground/20 px-2 py-0.5 text-xs text-muted-foreground">
                      {p.kind}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                  )}
                </div>

                {p.alreadyConfigured && (
                  <span className="text-xs text-muted-foreground">Already added</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// --- Step 2: Assign Virtual Accounts ---

function Step2Content({
  merchantId,
  selectedProviders,
  vaAssignments,
  onVaChange,
}: {
  merchantId: string
  selectedProviders: AvailableProvider[]
  vaAssignments: Record<string, { id: string; label: string }>
  onVaChange: (providerId: string, va: { id: string; label: string }) => void
}) {
  return (
    <div className="flex flex-col gap-4 p-6 pt-2">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-md border border-status-teal/30 bg-status-teal/5 px-4 py-3">
        <AppIcon icon={Info} size="sm" color="teal" className="mt-0.5" />
        <p className="text-xs text-status-teal">
          Pick an unassigned virtual account for each provider. This determines where deposits will
          be routed.
        </p>
      </div>

      {/* Provider VA cards */}
      {selectedProviders.map(p => (
        <ProviderVACard
          key={p.id}
          provider={p}
          merchantId={merchantId}
          selectedVA={vaAssignments[p.id]?.id || ''}
          onVaChange={va => onVaChange(p.id, va)}
        />
      ))}
    </div>
  )
}

function ProviderVACard({
  provider,
  merchantId,
  selectedVA,
  onVaChange,
}: {
  provider: AvailableProvider
  merchantId: string
  selectedVA: string
  onVaChange: (va: { id: string; label: string }) => void
}) {
  const { data: vaOptions, isLoading } = useAvailableVirtualAccounts(merchantId, provider.id, true)

  const initials = provider.shortCode
    ? provider.shortCode.slice(0, 2).toUpperCase()
    : provider.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)

  const handleVaSelect = (vaId: string) => {
    const va = (vaOptions ?? []).find(v => v.id === vaId)
    if (va) onVaChange({ id: va.id, label: va.label })
  }

  return (
    <div className="rounded-md border border-foreground/20 px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-button-bg text-xs font-medium text-primary-foreground">
          {initials}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{provider.name}</p>
          <span className="rounded-md border border-foreground/20 px-2 py-0.5 text-xs text-muted-foreground">
            {provider.kind}
          </span>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-12 w-full rounded-md" />
      ) : (
        <Select value={selectedVA} onValueChange={handleVaSelect}>
          <SelectTrigger className="!h-12 w-full">
            <SelectValue placeholder="Select virtual account" />
          </SelectTrigger>
          <SelectContent>
            {(vaOptions ?? []).length === 0 ? (
              <SelectItem value="__none" disabled>
                No virtual accounts available
              </SelectItem>
            ) : (
              (vaOptions ?? []).map(va => (
                <SelectItem key={va.id} value={va.id}>
                  {va.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

// --- Review Dialog ---

function ReviewDialog({
  open,
  onOpenChange,
  providers,
  vaAssignments,
  onConfirm,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  providers: AvailableProvider[]
  vaAssignments: Record<string, { id: string; label: string }>
  onConfirm: () => void
  isSubmitting: boolean
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Add ${providers.length} provider${providers.length > 1 ? 's' : ''}?`}
      description="Review the providers and virtual account assignments below."
      confirmLabel={`Yes, add provider${providers.length > 1 ? 's' : ''}`}
      pendingLabel="Adding..."
      variant="confirm"
      isPending={isSubmitting}
      onConfirm={onConfirm}
    >
      <div className="flex flex-col gap-3">
        {providers.map(p => {
          const initials = p.shortCode
            ? p.shortCode.slice(0, 2).toUpperCase()
            : p.name
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-md border border-foreground/20 px-4 py-3"
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-button-bg text-xs font-medium text-primary-foreground">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <span className="rounded-md border border-foreground/20 px-2 py-0.5 text-xs text-muted-foreground">
                    {p.kind}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {vaAssignments[p.id]?.label || 'No VA assigned'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-md border border-status-orange/30 bg-status-orange/5 px-4 py-3">
        <AppIcon icon={TriangleAlert} size="sm" color="orange" className="mt-0.5" />
        <p className="text-xs text-status-orange">
          Provider assignments are permanent. Once added and activated, they cannot be removed from
          this merchant.
        </p>
      </div>
    </ConfirmDialog>
  )
}
