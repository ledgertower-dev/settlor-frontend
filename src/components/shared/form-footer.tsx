import { cn } from '@/lib/core/utils'
import { Button } from '@/components/ui/button'

interface FormFooterProps {
  onCancel: () => void
  isPending: boolean
  submitLabel: string
  pendingLabel: string
  /** Additional disable condition for the submit button (beyond isPending) */
  submitDisabled?: boolean
  /** Additional disable condition for the cancel button (beyond isPending) */
  cancelDisabled?: boolean
  /** Form ID — required when the submit button is outside the `<form>` element (drawers) */
  formId?: string
  /** Layout variant: 'modal' uses grid, 'drawer' adds border-top + flex */
  variant?: 'modal' | 'drawer'
  className?: string
}

export function FormFooter({
  onCancel,
  isPending,
  submitLabel,
  pendingLabel,
  submitDisabled,
  cancelDisabled,
  formId,
  variant = 'modal',
  className,
}: FormFooterProps) {
  const isDrawer = variant === 'drawer'

  return (
    <div
      className={cn(
        isDrawer ? 'flex gap-6 border-t border-border px-6 py-4' : 'flex items-stretch gap-2',
        className,
      )}
    >
      {isDrawer ? (
        <>
          <Button
            type="button"
            size="xl"
            className="flex-1 bg-muted text-foreground hover:bg-muted/80"
            onClick={onCancel}
            disabled={isPending || cancelDisabled}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            size="xl"
            className="flex-1 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
            disabled={isPending || submitDisabled}
          >
            {isPending ? pendingLabel : submitLabel}
          </Button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending || cancelDisabled}
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-foreground/40 text-sm font-semibold text-foreground shadow-[0px_12px_32px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isPending || submitDisabled}
            className="flex h-11 flex-1 items-center justify-center rounded-md bg-button-bg text-sm font-semibold text-primary-foreground shadow-[0px_12px_32px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-button-bg/90 disabled:opacity-50"
          >
            {isPending ? pendingLabel : submitLabel}
          </button>
        </>
      )}
    </div>
  )
}
