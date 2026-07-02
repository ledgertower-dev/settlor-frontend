'use client'

import React from 'react'
import { cn } from '@/lib/core/utils'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmVariant = 'danger' | 'confirm' | 'success'

const variantStyles: Record<ConfirmVariant, string> = {
  danger: 'bg-button-bg text-primary-foreground hover:bg-button-bg/90',
  confirm: 'bg-button-bg text-primary-foreground hover:bg-button-bg/90',
  success: 'bg-button-bg text-primary-foreground hover:bg-button-bg/90',
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  isPending?: boolean
  pendingLabel?: string
  confirmDisabled?: boolean
  onConfirm: () => void
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isPending = false,
  pendingLabel,
  confirmDisabled = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogContent className="gap-6 border border-border/60 px-8 py-6 shadow-[0px_6px_18px_-8px_rgba(10,23,41,0.06)] dark:border-white/20 dark:shadow-[0px_8px_24px_rgba(255,255,255,0.06)] sm:max-w-[560px]">
          {/* Accessible title + description (visually hidden, screen reader only) */}
          <VisuallyHidden.Root>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </VisuallyHidden.Root>

          {/* Header */}
          <div className={cn('flex flex-col', children ? 'gap-1' : 'gap-3.5')}>
            <h2 className="text-xl font-medium text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {/* Custom content (e.g. textarea for remarks) */}
          {children}

          {/* Footer */}
          <div className="flex items-stretch gap-2 mt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-foreground/40 text-sm font-semibold text-foreground shadow-[0px_12px_32px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-accent disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending || confirmDisabled}
              className={cn(
                'flex h-11 flex-1 items-center justify-center rounded-md text-sm font-semibold shadow-[0px_12px_32px_0px_rgba(0,0,0,0.05)] transition-colors disabled:opacity-50',
                variantStyles[variant],
              )}
            >
              {isPending ? pendingLabel || confirmLabel : confirmLabel}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
