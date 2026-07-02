'use client'

import { cn } from '@/lib/core/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormFooter } from '@/components/shared/form-footer'

const SIZE_CLASSES = {
  sm: 'sm:max-w-[425px]',
  md: 'sm:max-w-md',
  'md-lg': 'sm:max-w-[600px]',
  lg: 'sm:max-w-[47.5rem]',
} as const

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: string
  children: React.ReactNode
  formId: string
  isPending: boolean
  submitLabel: string
  pendingLabel: string
  submitDisabled?: boolean
  size?: 'sm' | 'md' | 'md-lg' | 'lg'
  scrollable?: boolean
  showCloseButton?: boolean
  className?: string
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  formId,
  isPending,
  submitLabel,
  pendingLabel,
  submitDisabled,
  size = 'sm',
  scrollable,
  showCloseButton = true,
  className,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          'gap-8 border border-border/60 px-8 py-6 shadow-[0px_6px_18px_-8px_rgba(10,23,41,0.06)] dark:border-white/20 dark:shadow-[0px_8px_24px_rgba(255,255,255,0.06)]',
          SIZE_CLASSES[size],
          scrollable && 'max-h-[90vh] overflow-y-auto',
          className,
        )}
      >
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-medium text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
        <FormFooter
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
          submitDisabled={submitDisabled}
          formId={formId}
        />
      </DialogContent>
    </Dialog>
  )
}
