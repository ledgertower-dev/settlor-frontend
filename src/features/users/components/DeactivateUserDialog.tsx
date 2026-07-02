'use client'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface DeactivateUserDialogProps {
  userName: string
  userEmail: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
}

export function DeactivateUserDialog({
  userName,
  userEmail,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: DeactivateUserDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Deactivate User"
      description="Are you sure you want to deactivate this user? This user will not be able to log in until their account is reactivated."
      confirmLabel="Deactivate User"
      pendingLabel="Deactivating..."
      variant="danger"
      isPending={isPending}
      onConfirm={onConfirm}
    >
      <div className="space-y-1.5 rounded-md border border-foreground/10 bg-secondary/50 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-foreground">User:</span>{' '}
          <span className="text-sm text-muted-foreground">{userName}</span>
        </div>
        <div>
          <span className="text-sm font-medium text-foreground">Email:</span>{' '}
          <span className="text-sm text-muted-foreground">{userEmail}</span>
        </div>
      </div>
    </ConfirmDialog>
  )
}
