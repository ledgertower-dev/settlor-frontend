'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// TODO: uncomment when OTP feature is enabled
// import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'

import { useRole, useUpdateRolePermissions, useDeleteRole } from '../model/use-roles'
import { usePermissions, useResourcePermissions } from '@/features/access/model'
import { useRolesUIStore } from '../model/roles-ui-store'
import { PermissionCheckbox } from './PermissionCheckbox'
import { logger } from '@/lib/core/logger'
import type { Permission } from '@/lib/types/api-types'
import { getErrorMessage } from '@/lib/api/error-handler'

interface PermissionGroup {
  resource: string
  permissions: Permission[]
}

interface RoleDetailProps {
  roleId: string
}

export function RoleDetail({ roleId }: RoleDetailProps) {
  const router = useRouter()
  const rolePath = useRolePath()
  const { canUpdate, canDelete } = useResourcePermissions('roles')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { permissionChanges, setPermissionChanges, resetPermissionChanges } = useRolesUIStore()

  // Reset permission changes when navigating to a different role
  React.useEffect(() => {
    resetPermissionChanges()
  }, [roleId, resetPermissionChanges])

  const {
    data: roleResponse,
    isLoading: roleLoading,
    error: roleError,
  } = useRole(roleId, { enabled: !isDeleting })
  const { data: allPermissions = [], isLoading: allPermissionsLoading } = usePermissions('ADMIN')

  const role = roleResponse?.data.role
  const rolePermissionIds: Set<string> = React.useMemo(
    () => new Set(roleResponse?.data.permissionIds ?? []),
    [roleResponse?.data.permissionIds],
  )

  const updatePermissionsMutation = useUpdateRolePermissions()
  const deleteRoleMutation = useDeleteRole()

  const handleDeleteRole = () => {
    setIsDeleting(true)
    deleteRoleMutation.mutate(roleId, {
      onSuccess: () => {
        toast.success('Role deleted successfully')
        router.push(rolePath('/roles'))
      },
      onError: error => {
        setIsDeleting(false)
        toast.error(getErrorMessage(error))
        logger.error('Error deleting role', { error: String(error) })
      },
    })
  }

  // Group permissions by resource
  const permissionGroups: PermissionGroup[] = React.useMemo(() => {
    const groups = (allPermissions || []).reduce(
      (acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = []
        }
        acc[permission.resource].push(permission)
        return acc
      },
      {} as Record<string, Permission[]>,
    )

    return Object.entries(groups).map(([resource, permissions]) => ({
      resource,
      permissions,
    }))
  }, [allPermissions])

  // Check if permission is assigned
  const isPermissionAssigned = (permissionId: string): boolean => {
    if (permissionId in permissionChanges) {
      return permissionChanges[permissionId]
    }
    return rolePermissionIds.has(permissionId)
  }

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string) => {
    if (!canUpdate || !role?.permissionsEditable) return

    const currentState = isPermissionAssigned(permissionId)
    setPermissionChanges({
      ...permissionChanges,
      [permissionId]: !currentState,
    })
  }

  // Select all permissions
  const handleSelectAll = () => {
    if (!canUpdate || !role?.permissionsEditable) return
    const changes: Record<string, boolean> = { ...permissionChanges }
    ;(allPermissions || []).forEach(p => {
      changes[p.id] = true
    })
    setPermissionChanges(changes)
  }

  // Deselect all permissions
  const handleDeselectAll = () => {
    if (!canUpdate || !role?.permissionsEditable) return
    const changes: Record<string, boolean> = { ...permissionChanges }
    ;(allPermissions || []).forEach(p => {
      changes[p.id] = false
    })
    setPermissionChanges(changes)
  }

  // Save permission changes
  const savePermissionChanges = async () => {
    if (!canUpdate || !role || !role.permissionsEditable) return

    const updatedPermissionIds = (allPermissions || [])
      .map(p => p.id)
      .filter(id => {
        if (id in permissionChanges) {
          return permissionChanges[id]
        }
        return rolePermissionIds.has(id)
      })

    updatePermissionsMutation.mutate(
      { id: role.id, data: { permissionIds: updatedPermissionIds } },
      {
        onSuccess: () => {
          resetPermissionChanges()
          toast.success('Permissions updated successfully')
          router.push(rolePath('/roles'))
        },
        onError: error => {
          toast.error(getErrorMessage(error))
          logger.error('Error updating permissions', { error: String(error) })
        },
      },
    )
  }

  // Count actual changes
  const actualChangesCount = React.useMemo(() => {
    return Object.entries(permissionChanges).filter(([permissionId, newValue]) => {
      const wasOriginallyAssigned = rolePermissionIds.has(permissionId)
      return newValue !== wasOriginallyAssigned
    }).length
  }, [permissionChanges, rolePermissionIds])

  const hasChanges = actualChangesCount > 0
  const loading = roleLoading || allPermissionsLoading
  const isSaving = updatePermissionsMutation.isPending

  if (loading) {
    return <DetailSkeleton />
  }

  if (roleError || !role) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{roleError?.message || 'Role not found'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-foreground">{role.name}</h1>
          {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
        </div>
        {canDelete && !role.isSystemLocked && (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={deleteRoleMutation.isPending}
              onClick={() => setDeleteDialogOpen(true)}
              className="h-11 rounded-md border-destructive px-6 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
            </Button>
            <ConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title="Delete Role"
              description={
                <>
                  Are you sure you want to delete <strong>{role.name}</strong>? This action cannot
                  be undone. All users assigned to this role will lose their permissions.
                </>
              }
              confirmLabel="Delete"
              variant="danger"
              isPending={deleteRoleMutation.isPending}
              onConfirm={handleDeleteRole}
            />
          </>
        )}
      </div>

      {/* System role warning */}
      {role.isSystemLocked && !role.permissionsEditable && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AppIcon icon={Lock} size="sm" className="text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            This is a system role and cannot be modified or deleted. System roles are protected to
            ensure system integrity.
          </AlertDescription>
        </Alert>
      )}

      {/* Role Information */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <h2 className="mb-6 text-lg font-medium text-foreground">Role Information</h2>
        <div className="lg:w-1/2">
          <Input
            id="roleName"
            value={role.name}
            readOnly
            className="h-[44px] rounded-md border-[0.4px] border-foreground/20 bg-muted px-6 text-sm"
          />
        </div>
      </div>

      {/* Permissions */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-medium text-foreground">Permissions</h2>
            <p className="text-sm text-muted-foreground">Manage role permissions</p>
          </div>
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={!canUpdate || !role.permissionsEditable}
              className="rounded-md border border-foreground/20 px-6 py-1.5 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={!canUpdate || !role.permissionsEditable}
              className="rounded-md border border-foreground/20 px-6 py-1.5 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Permission Groups */}
        <div className="space-y-3.5">
          {permissionGroups.map(group => (
            <PermissionModule
              key={group.resource}
              group={group}
              isPermissionAssigned={isPermissionAssigned}
              onToggle={handlePermissionToggle}
              onSelectAllGroup={ids => {
                if (!canUpdate || !role.permissionsEditable) return
                const changes: Record<string, boolean> = { ...permissionChanges }
                ids.forEach(id => {
                  changes[id] = true
                })
                setPermissionChanges(changes)
              }}
              onDeselectAllGroup={ids => {
                if (!canUpdate || !role.permissionsEditable) return
                const changes: Record<string, boolean> = { ...permissionChanges }
                ids.forEach(id => {
                  changes[id] = false
                })
                setPermissionChanges(changes)
              }}
              disabled={!canUpdate || !role.permissionsEditable}
            />
          ))}
        </div>
      </div>

      {/* Save / Cancel */}
      {hasChanges && (
        <div className="flex justify-end gap-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetPermissionChanges()}
            disabled={isSaving}
            className="h-11 rounded-md px-8 text-sm"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={savePermissionChanges}
            disabled={isSaving}
            className="h-11 rounded-md bg-button-bg px-8 text-sm text-primary-foreground hover:bg-button-bg/90"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}

// --- Permission Module Card ---

function PermissionModule({
  group,
  isPermissionAssigned,
  onToggle,
  onSelectAllGroup,
  onDeselectAllGroup,
  disabled,
}: {
  group: PermissionGroup
  isPermissionAssigned: (id: string) => boolean
  onToggle: (id: string) => void
  onSelectAllGroup: (permissionIds: string[]) => void
  onDeselectAllGroup: (permissionIds: string[]) => void
  disabled: boolean
}) {
  const allSelected = group.permissions.every(p => isPermissionAssigned(p.id))

  return (
    <div className="rounded-[10px] border-[0.5px] border-foreground/10 p-6">
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium capitalize text-foreground">{group.resource}</h3>
          <button
            type="button"
            onClick={() =>
              allSelected
                ? onDeselectAllGroup(group.permissions.map(p => p.id))
                : onSelectAllGroup(group.permissions.map(p => p.id))
            }
            disabled={disabled}
            className="rounded-md border border-foreground/20 bg-card px-4 py-1 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="flex flex-wrap gap-3.5">
          {group.permissions.map(permission => {
            const checked = isPermissionAssigned(permission.id)
            return (
              <PermissionCheckbox
                key={permission.id}
                permission={permission}
                checked={checked}
                onToggle={() => onToggle(permission.id)}
                disabled={disabled}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- Skeleton ---

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <Skeleton className="mb-6 h-5 w-32" />
        <Skeleton className="h-[44px] w-1/2" />
      </div>
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <Skeleton className="mb-6 h-5 w-40" />
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border-[0.5px] border-foreground/10 p-6">
              <Skeleton className="mb-3.5 h-4 w-28" />
              <div className="flex flex-wrap gap-3.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-[52px] w-[calc(25%-10.5px)] rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
