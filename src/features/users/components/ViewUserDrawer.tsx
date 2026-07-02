'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { DrawerLayout } from '@/components/shared/drawer-layout'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useUser, useUpdateUser } from '../model/use-users'
import { useResourcePermissions } from '@/features/access/model'
import { UserFormFields } from './UserFormFields'
import type { User } from '../types'
import { viewUserSchema, type ViewUserFormData } from '../schemas/view-user.schema'
import { getErrorMessage } from '@/lib/api/error-handler'

interface ViewUserDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function ViewUserDrawer({ open, onOpenChange, user }: ViewUserDrawerProps) {
  const { canUpdate } = useResourcePermissions('users')
  const updateUser = useUpdateUser()
  const [showPassword, setShowPassword] = useState(false)

  // Fetch fresh user detail with role info
  const { data: userDetail, isLoading: isLoadingUser } = useUser(open && user ? user.id : undefined)

  const form = useForm<ViewUserFormData>({
    resolver: zodResolver(viewUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role_id: '',
      password: '',
    },
  })

  // Populate form from list user immediately, then update with fresh detail
  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role_id: user.roleId || '',
        password: '',
      })
    }
  }, [open, user, form])

  useEffect(() => {
    if (userDetail?.user && open) {
      const u = userDetail.user
      form.reset({
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role_id: u.roleId || '',
        password: '',
      })
    }
  }, [userDetail, open, form])

  if (!user) return null

  const handleClose = () => {
    form.reset()
    setShowPassword(false)
    onOpenChange(false)
  }

  const onSubmit = async (data: ViewUserFormData) => {
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data: {
          name: data.name,
          ...(data.role_id ? { role_id: data.role_id } : {}),
          ...(data.password ? { password: data.password } : {}),
        },
      })
      toast.success('User updated successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const isDisabled = !canUpdate || updateUser.isPending || isLoadingUser

  return (
    <DrawerLayout
      open={open}
      onOpenChange={handleClose}
      title="User Details"
      width="sm:w-[590px] sm:max-w-[590px]"
      footer={
        <div className="flex gap-6 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateUser.isPending}
            size="xl"
            className="flex-1 bg-muted text-foreground hover:bg-muted/80"
          >
            Cancel
          </Button>
          {canUpdate && (
            <Button
              type="submit"
              form="edit-user-form"
              disabled={updateUser.isPending || isLoadingUser}
              size="xl"
              className="flex-1 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
            >
              {updateUser.isPending ? 'Updating...' : 'Update'}
            </Button>
          )}
        </div>
      }
    >
      <Form {...form}>
        <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <UserFormFields
            form={form}
            disabled={isDisabled}
            loadRoles={open}
            disabledFields={['email', 'phone']}
          />

          {/* Update Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">
                  Update Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Leave blank to keep current password"
                      className="h-11 rounded-md border-[0.4px] border-foreground/40 bg-secondary pr-10"
                      {...field}
                      disabled={isDisabled}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <AppIcon icon={Eye} color="muted" />
                      ) : (
                        <AppIcon icon={EyeOff} color="muted" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </DrawerLayout>
  )
}
