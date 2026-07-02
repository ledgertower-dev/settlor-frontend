'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, UserCheck, X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useCanPerformAction } from '@/features/access/hooks/useCanPerformAction'
import { useAssignedSupportMembers, useAssignSupportMembers } from '../model/use-merchant-support'
import { AssignSupportMemberDrawer } from './AssignSupportMemberDrawer'
import type { SupportMember } from '../types/merchant-support.types'

interface MerchantSupportTabProps {
  merchantId: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function MerchantSupportTab({ merchantId }: MerchantSupportTabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<SupportMember | null>(null)
  const { data: assignedMembers, isLoading } = useAssignedSupportMembers(merchantId)
  const assignMutation = useAssignSupportMembers()
  const canAssign = useCanPerformAction('merchant-support', 'write')

  const handleRemove = async () => {
    if (!assignedMembers || !memberToRemove) return

    const remaining = assignedMembers.filter(m => m.id !== memberToRemove.id).map(m => m.id)

    try {
      await assignMutation.mutateAsync({ merchantId, supportUserIds: remaining })
      toast.success(`${memberToRemove.name} removed successfully`)
      setMemberToRemove(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Support Members</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage support members assigned to this merchant
            </p>
          </div>
          {canAssign && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex h-[2.625rem] shrink-0 items-center gap-3.5 rounded-md bg-button-bg px-6 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              <AppIcon icon={Plus} size="sm" color="primary-foreground" />
              Assign Support Member
            </button>
          )}
        </div>

        {/* Assigned Members Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : !assignedMembers || assignedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12">
              <AppIcon icon={UserCheck} className="size-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No support members assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignedMembers.map(member => (
                <div
                  key={member.id}
                  className="group flex items-center gap-3 rounded-md border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
                >
                  {/* Avatar */}
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-button-bg text-xs font-semibold text-primary-foreground">
                    {getInitials(member.name)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>

                  {/* Remove */}
                  {canAssign && (
                    <button
                      onClick={() => setMemberToRemove(member)}
                      aria-label={`Remove ${member.name} as support member`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <AppIcon icon={X} className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Drawer */}
      <AssignSupportMemberDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        merchantId={merchantId}
        assignedMembers={assignedMembers ?? []}
      />

      {/* Remove Confirmation */}
      <ConfirmDialog
        open={!!memberToRemove}
        onOpenChange={open => {
          if (!open) setMemberToRemove(null)
        }}
        title="Remove Support Member"
        description={`Are you sure you want to remove ${memberToRemove?.name}? They will no longer be assigned to this merchant.`}
        confirmLabel="Remove"
        pendingLabel="Removing..."
        variant="danger"
        isPending={assignMutation.isPending}
        onConfirm={handleRemove}
      />
    </div>
  )
}
