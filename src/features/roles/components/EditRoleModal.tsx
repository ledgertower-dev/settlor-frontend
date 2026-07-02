'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { FormDialog } from '@/components/shared/form-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useUpdateRole } from '../model/use-roles'
import type { Role } from '../types'
import { useResourcePermissions } from '@/features/access/model'
import { logger } from '@/lib/core/logger'
import { editRoleSchema, type EditRoleForm } from '../schemas/edit-role.schema'

interface EditRoleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role
}

export function EditRoleModal({ open, onOpenChange, role }: EditRoleModalProps) {
  const updateRoleMutation = useUpdateRole()
  const { canUpdate } = useResourcePermissions('roles')

  const form = useForm<EditRoleForm>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      name: role.name,
      description: role.description,
    },
  })

  // Update form when role changes
  useEffect(() => {
    form.reset({
      name: role.name,
      description: role.description,
    })
  }, [role, form])

  const onSubmit = async (data: EditRoleForm) => {
    if (role.isSystemLocked) {
      toast.error('System roles cannot be modified')
      return
    }
    if (!canUpdate) {
      toast.error("You don't have permission to update roles")
      return
    }

    updateRoleMutation.mutate(
      { id: role.id, data: { name: data.name, description: data.description } },
      {
        onSuccess: () => {
          toast.success('Role updated successfully')
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          let errorMessage = 'Failed to update role'

          // Check if it's a conflict error (duplicate role name)
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
          logger.error('Error updating role', { error: String(error) })
        },
      },
    )
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !updateRoleMutation.isPending) {
      form.reset({
        name: role.name,
        description: role.description,
      })
    }
    onOpenChange(newOpen)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={
        <span className="flex items-center gap-2">
          {role.isSystemLocked && <AppIcon icon={Lock} size="sm" className="text-amber-500" />}
          Edit Role
        </span>
      }
      description={`Update the role information. ${role.isSystemLocked ? 'System roles cannot be modified.' : ''}`}
      formId="edit-role-form"
      isPending={updateRoleMutation.isPending}
      submitLabel="Update Role"
      pendingLabel="Updating..."
      submitDisabled={role.isSystemLocked || !canUpdate}
      size="md"
    >
      {role.isSystemLocked && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AppIcon icon={Lock} size="sm" className="text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            This is a system role and cannot be modified. System roles are protected to ensure
            system integrity.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form id="edit-role-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Content Editor"
                      {...field}
                      disabled={updateRoleMutation.isPending || role.isSystemLocked || !canUpdate}
                    />
                  </FormControl>
                  <FormDescription>A unique name to identify this role</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this role can do..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={updateRoleMutation.isPending || role.isSystemLocked || !canUpdate}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear description of the role&apos;s purpose and responsibilities
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </FormDialog>
  )
}
