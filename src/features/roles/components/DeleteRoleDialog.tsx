'use client'

import React from 'react'
import { toast } from 'sonner'
import { Trash2, Lock, Users, TriangleAlert } from 'lucide-react'

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
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useResourcePermissions } from '@/features/access/model'
import { useDeleteRole } from '../model/use-roles'
import { logger } from '@/lib/core/logger'
import type { Role } from '../types'
import { getErrorMessage } from '@/lib/api/error-handler'

interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

export function DeleteRoleDialog({ open, onOpenChange, role }: DeleteRoleDialogProps) {
  const { canDelete: hasDeletePermission } = useResourcePermissions('roles')
  const deleteRoleMutation = useDeleteRole()

  const handleDelete = async () => {
    if (role.isSystemLocked) {
      toast.error('System roles cannot be deleted')
      return
    }

    if ((role.userCount ?? 0) > 0 || (role.teamCount ?? 0) > 0) {
      toast.error('Cannot delete role that is assigned to users or teams')
      return
    }

    if (!hasDeletePermission) {
      toast.error("You don't have permission to delete roles")
      return
    }

    try {
      await deleteRoleMutation.mutateAsync(role.id)
      toast.success('Role deleted successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
      logger.error('Error deleting role', { error: String(error) })
    }
  }

  const canDelete =
    !role.isSystemLocked &&
    (role.userCount ?? 0) === 0 &&
    (role.teamCount ?? 0) === 0 &&
    hasDeletePermission

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AppIcon icon={Trash2} color="destructive" />
            Delete Role
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the role and remove it from
            the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Info */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {role.isSystemLocked && (
                    <AppIcon icon={Lock} size="sm" className="text-amber-500" />
                  )}
                  <h3 className="font-medium">{role.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <AppIcon icon={Users} size="sm" />
                    <span>{role.userCount ?? 0} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AppIcon icon={Users} size="sm" />
                    <span>{role.teamCount ?? 0} teams</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Messages */}
          {role.isSystemLocked && (
            <Alert className="border-amber-200 bg-amber-50">
              <AppIcon icon={Lock} size="sm" className="text-amber-600" />
              <AlertDescription className="text-amber-800">
                This is a system role and cannot be deleted. System roles are protected to ensure
                system integrity.
              </AlertDescription>
            </Alert>
          )}

          {!role.isSystemLocked && ((role.userCount ?? 0) > 0 || (role.teamCount ?? 0) > 0) && (
            <Alert variant="destructive">
              <AppIcon icon={TriangleAlert} size="sm" />
              <AlertDescription>
                This role cannot be deleted because it is currently assigned to{' '}
                {role.userCount ?? 0} user(s) and {role.teamCount ?? 0} team(s). Please remove all
                assignments before deleting this role.
              </AlertDescription>
            </Alert>
          )}

          {!hasDeletePermission && (
            <Alert variant="destructive">
              <AppIcon icon={TriangleAlert} size="sm" />
              <AlertDescription>
                You don&apos;t have permission to delete roles. Contact your administrator.
              </AlertDescription>
            </Alert>
          )}

          {canDelete && (
            <Alert variant="destructive">
              <AppIcon icon={TriangleAlert} size="sm" />
              <AlertDescription>
                <strong>Warning:</strong> This action is permanent and cannot be undone. The role
                will be completely removed from the system.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-status-red text-white hover:bg-status-red/90"
            onClick={handleDelete}
            disabled={deleteRoleMutation.isPending || !canDelete}
          >
            {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
