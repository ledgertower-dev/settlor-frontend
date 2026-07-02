'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

import { usePermissions } from '@/features/access/model'
import { useCreateRole } from '../model/use-roles'
import { PermissionCheckbox } from './PermissionCheckbox'
import { logger } from '@/lib/core/logger'
import type { Permission } from '@/lib/types/api-types'

interface PermissionGroup {
  resource: string
  permissions: Permission[]
}

export function CreateRole() {
  const router = useRouter()
  const rolePath = useRolePath()
  const createRoleMutation = useCreateRole()

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = React.useState<Set<string>>(new Set())
  const [errors, setErrors] = React.useState<{ name?: string; permissions?: string }>({})

  const { data: allPermissions = [], isLoading: permissionsLoading } = usePermissions('ADMIN')

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

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissionIds(prev => {
      const next = new Set(prev)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: undefined }))
    }
  }

  const handleSelectAll = () => {
    setSelectedPermissionIds(new Set((allPermissions || []).map(p => p.id)))
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: undefined }))
    }
  }

  const handleDeselectAll = () => {
    setSelectedPermissionIds(new Set())
  }

  const handleSubmit = () => {
    const newErrors: { name?: string; permissions?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    } else if (name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters'
    }

    if (selectedPermissionIds.size === 0) {
      newErrors.permissions = 'At least one permission must be selected'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    createRoleMutation.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        account_type: 'ADMIN',
        permission_ids: Array.from(selectedPermissionIds),
      },
      {
        onSuccess: () => {
          toast.success('Role created successfully')
          router.push(rolePath('/roles'))
        },
        onError: (error: unknown) => {
          let errorMessage = 'Failed to create role'

          if (error && typeof error === 'object') {
            if ('response' in error && error.response && typeof error.response === 'object') {
              const response = error.response as { status?: number }
              if (response.status === 409) {
                errorMessage =
                  'A role with this name already exists. Please choose a different name.'
              }
            } else if (
              'code' in error &&
              (error.code === 'CONFLICT' || error.code === 'DUPLICATE_RESOURCE')
            ) {
              errorMessage = 'A role with this name already exists. Please choose a different name.'
            } else if ('message' in error && typeof error.message === 'string') {
              errorMessage = error.message
            }
          } else if (error instanceof Error) {
            errorMessage = error.message
          }

          toast.error(errorMessage)
          logger.error('Error creating role', { error: String(error) })
        },
      },
    )
  }

  const isSaving = createRoleMutation.isPending

  if (permissionsLoading) {
    return <CreateRoleSkeleton />
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold text-foreground">Create Role</h1>
        <p className="text-sm text-muted-foreground">Define a new role and assign permissions</p>
      </div>

      {/* Role Information */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <h2 className="mb-6 text-lg font-medium text-foreground">Role Information</h2>
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="roleName" className="text-sm font-normal text-foreground">
              Name
            </Label>
            <Input
              id="roleName"
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
              }}
              placeholder="e.g., Content Editor"
              disabled={isSaving}
              className="h-[44px] rounded-md border-[0.4px] border-foreground/20 bg-muted px-6 text-sm"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roleDescription" className="text-sm font-normal text-foreground">
              Description
            </Label>
            <Input
              id="roleDescription"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this role can do..."
              disabled={isSaving}
              className="h-[44px] rounded-md border-[0.4px] border-foreground/20 bg-muted px-6 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-end justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-medium text-foreground">Permissions</h2>
            {errors.permissions ? (
              <p className="text-xs text-destructive">{errors.permissions}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Select permissions for this role</p>
            )}
          </div>
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isSaving}
              className="rounded-md border border-foreground/20 px-6 py-1.5 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={isSaving}
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
              selectedIds={selectedPermissionIds}
              onToggle={handlePermissionToggle}
              onSelectAllGroup={ids => {
                setSelectedPermissionIds(prev => {
                  const next = new Set(prev)
                  ids.forEach(id => next.add(id))
                  return next
                })
                if (errors.permissions) {
                  setErrors(prev => ({ ...prev, permissions: undefined }))
                }
              }}
              onDeselectAllGroup={ids => {
                setSelectedPermissionIds(prev => {
                  const next = new Set(prev)
                  ids.forEach(id => next.delete(id))
                  return next
                })
              }}
              disabled={isSaving}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="h-11 rounded-md bg-button-bg px-8 text-sm text-primary-foreground hover:bg-button-bg/90"
        >
          {isSaving ? 'Creating...' : 'Create Role'}
        </Button>
      </div>
    </div>
  )
}

// --- Permission Module Card ---

function PermissionModule({
  group,
  selectedIds,
  onToggle,
  onSelectAllGroup,
  onDeselectAllGroup,
  disabled,
}: {
  group: PermissionGroup
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAllGroup: (permissionIds: string[]) => void
  onDeselectAllGroup: (permissionIds: string[]) => void
  disabled: boolean
}) {
  const allSelected = group.permissions.every(p => selectedIds.has(p.id))

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
            const checked = selectedIds.has(permission.id)
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

function CreateRoleSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <Skeleton className="mb-6 h-5 w-32" />
        <div className="grid grid-cols-2 gap-3.5">
          <Skeleton className="h-[44px] w-full" />
          <Skeleton className="h-[44px] w-full" />
        </div>
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
