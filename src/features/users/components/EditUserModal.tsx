'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { FormDialog } from '@/components/shared/form-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useResourcePermissions } from '@/features/access/model'
import { useRoles } from '@/features/roles'
import { useUpdateUser } from '../model/use-users'
import type { User, UpdateUserFormData } from '../types'
import { DeactivateUserDialog } from './DeactivateUserDialog'
import { editUserSchema } from '../schemas/edit-user.schema'
import { getErrorMessage } from '@/lib/api/error-handler'

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function EditUserModal({ open, onOpenChange, user }: EditUserModalProps) {
  const { canUpdate } = useResourcePermissions('users')
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'active' | 'inactive' | null>(null)

  const { data: rolesData } = useRoles({ perPage: 100 })
  const roles = rolesData?.data?.items ?? []

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      role_id: user.roleId ?? '',
      status: user.status === 'active' ? 'active' : 'inactive',
    },
  })

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        role_id: user.roleId ?? '',
        status: user.status === 'active' ? 'active' : 'inactive',
      })
    }
  }, [user, form])

  // Use mutation hook without options - we'll handle success/error in onSubmit
  const updateUser = useUpdateUser()

  const onSubmit = async (data: UpdateUserFormData) => {
    if (!canUpdate) {
      toast.error("You don't have permission to update users")
      return
    }

    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data: {
          name: data.name,
          role_id: data.role_id,
          status: data.status,
        },
      })
      toast.success('User updated successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Edit User"
        description={`Update user information for ${user.email}`}
        formId="edit-user-form"
        isPending={updateUser.isPending}
        submitLabel="Update User"
        pendingLabel="Updating..."
        submitDisabled={!canUpdate}
        size="md"
      >
        <Form {...form}>
          <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      disabled={!canUpdate || updateUser.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!canUpdate || updateUser.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value: 'active' | 'inactive') => {
                      // Show confirmation dialog when changing from active to inactive
                      if (field.value === 'active' && value === 'inactive') {
                        setPendingStatus(value)
                        setShowDeactivateDialog(true)
                      } else {
                        field.onChange(value)
                      }
                    }}
                    value={field.value}
                    disabled={!canUpdate || updateUser.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </FormDialog>

      <DeactivateUserDialog
        userName={user.name}
        userEmail={user.email}
        open={showDeactivateDialog}
        onOpenChange={open => {
          setShowDeactivateDialog(open)
          if (!open) {
            setPendingStatus(null)
          }
        }}
        onConfirm={() => {
          if (pendingStatus) {
            form.setValue('status', pendingStatus)
          }
          setShowDeactivateDialog(false)
          setPendingStatus(null)
        }}
      />
    </>
  )
}
