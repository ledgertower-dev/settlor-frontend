'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { FormDrawer } from '@/components/shared/form-drawer'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useCreateUser } from '../model/use-users'
import { useResourcePermissions } from '@/features/access/model'
import { UserFormFields } from './UserFormFields'
import type { CreateUserFormData } from '../types'
import { createUserSchema } from '../schemas/create-user.schema'
import { getErrorMessage } from '@/lib/api/error-handler'

interface CreateUserDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDrawer({ open, onOpenChange }: CreateUserDrawerProps) {
  const { canCreate } = useResourcePermissions('users')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role_id: '',
      password: '',
      confirmPassword: '',
    },
  })

  const handleClose = () => {
    form.reset()
    setShowPassword(false)
    setShowConfirmPassword(false)
    onOpenChange(false)
  }

  const createUser = useCreateUser()

  const onSubmit = async (data: CreateUserFormData) => {
    if (!canCreate) {
      toast.error("You don't have permission to create users")
      return
    }

    try {
      await createUser.mutateAsync({
        email: data.email,
        name: data.name,
        phone: data.phone,
        password: data.password,
        role_id: data.role_id,
      })
      toast.success('User created successfully')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title="Create user"
      width="sm:w-[590px] sm:max-w-[590px]"
      formId="create-user-form"
      isPending={createUser.isPending}
      submitLabel="Create user"
      pendingLabel="Creating..."
      submitDisabled={!canCreate}
    >
      <Form {...form}>
        <form id="create-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <UserFormFields form={form} disabled={createUser.isPending} loadRoles={open} />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      className="h-11 rounded-md border-[0.4px] border-foreground/40 bg-secondary pr-10"
                      {...field}
                      disabled={createUser.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="h-11 rounded-md border-[0.4px] border-foreground/40 bg-secondary pr-10"
                      {...field}
                      disabled={createUser.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
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
    </FormDrawer>
  )
}
