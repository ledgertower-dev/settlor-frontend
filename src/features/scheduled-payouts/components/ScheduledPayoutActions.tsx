'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ban, EllipsisVertical, Pause, Play, SquarePen } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useResourcePermissions } from '@/features/access/model'
import {
  usePauseScheduledPayout,
  useResumeScheduledPayout,
  useCancelScheduledPayout,
} from '../model/use-scheduled-payouts'
import { useScheduledPayoutsModalStore } from '../model/scheduled-payouts-ui-store'
import type { ScheduledPayoutListItem } from '../types'

interface ScheduledPayoutActionsProps {
  payout: ScheduledPayoutListItem
}

export function ScheduledPayoutActions({ payout }: ScheduledPayoutActionsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const { openEditDrawer } = useScheduledPayoutsModalStore()
  const { canUpdate, canDelete } = useResourcePermissions('scheduled-payouts')
  const pauseMutation = usePauseScheduledPayout()
  const resumeMutation = useResumeScheduledPayout()
  const cancelMutation = useCancelScheduledPayout()

  if (payout.status === 'CANCELLED') return null
  if (!canUpdate && !canDelete) return null

  const handlePause = () => {
    pauseMutation.mutate(payout.id, {
      onSuccess: () => toast.success('Schedule paused'),
      onError: () => toast.error('Failed to pause schedule'),
    })
  }

  const handleResume = () => {
    resumeMutation.mutate(payout.id, {
      onSuccess: () => toast.success('Schedule resumed'),
      onError: () => toast.error('Failed to resume schedule'),
    })
  }

  const handleCancel = () => {
    cancelMutation.mutate(payout.id, {
      onSuccess: () => {
        toast.success('Schedule cancelled')
        setShowCancelDialog(false)
      },
      onError: () => toast.error('Failed to cancel schedule'),
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-10 items-center justify-center rounded-md bg-accent text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
            onClick={e => e.stopPropagation()}
          >
            <AppIcon icon={EllipsisVertical} size="sm" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] rounded-[10px] p-2.5 space-y-0">
          {canUpdate && (
            <DropdownMenuItem icon={SquarePen} showBorder onClick={() => openEditDrawer(payout.id)}>
              Edit
            </DropdownMenuItem>
          )}

          {canUpdate && payout.status === 'ACTIVE' && (
            <DropdownMenuItem
              icon={Pause}
              iconBg="bg-status-orange/10"
              iconColor="text-status-orange"
              showBorder
              onClick={handlePause}
            >
              Pause
            </DropdownMenuItem>
          )}

          {canUpdate && payout.status === 'PAUSED' && (
            <DropdownMenuItem
              icon={Play}
              iconBg="bg-status-green/10"
              iconColor="text-status-green"
              showBorder
              onClick={handleResume}
            >
              Resume
            </DropdownMenuItem>
          )}

          {canDelete && payout.status !== 'PROCESSING' && (
            <DropdownMenuItem
              icon={Ban}
              iconBg="bg-status-red/10"
              iconColor="text-status-red"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancel Schedule?"
        description={`Are you sure you want to cancel "${payout.name}"? This action cannot be undone and no further payouts will be executed.`}
        cancelLabel="Keep Schedule"
        confirmLabel="Yes, Cancel"
        pendingLabel="Cancelling..."
        variant="danger"
        isPending={cancelMutation.isPending}
        onConfirm={handleCancel}
      />
    </>
  )
}
