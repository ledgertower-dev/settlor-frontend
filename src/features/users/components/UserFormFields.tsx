'use client'

import type { UseFormReturn } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'

import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { rolesService } from '@/features/roles'

interface UserFormFieldsProps {
  form: UseFormReturn<any>
  disabled?: boolean
  loadRoles?: boolean
  disabledFields?: string[]
}

export function UserFormFields({
  form,
  disabled = false,
  loadRoles = true,
  disabledFields = [],
}: UserFormFieldsProps) {
  const { data: rolesData } = useQuery({
    queryKey: ['roles', 'list'],
    queryFn: async () => {
      const response = await rolesService.getRoles({ perPage: 100 })
      return response.data?.items || []
    },
    enabled: loadRoles,
  })

  const roles = rolesData || []

  return (
    <>
      {/* Name */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-normal text-foreground">Name</FormLabel>
            <FormControl>
              <Input
                className="h-11 rounded-md border-[0.4px] border-foreground/40 bg-secondary"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Email */}
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-normal text-foreground">Email</FormLabel>
            <FormControl>
              <Input
                className="h-11 rounded-md border-[0.4px] border-foreground/40 bg-secondary"
                {...field}
                disabled={disabled || disabledFields.includes('email')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Phone + Role — 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 items-start">
        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-foreground">Phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  maxLength={10}
                  onInput={e => {
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')
                  }}
                  className="h-11 rounded-md border-[0.4px] border-foreground/40 bg-secondary"
                  {...field}
                  disabled={disabled || disabledFields.includes('phone')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role */}
        <FormField
          control={form.control}
          name="role_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-normal text-foreground">Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger className="!h-11 w-full rounded-md border-[0.4px] border-foreground/40 bg-secondary">
                    <SelectValue placeholder="Select" />
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
      </div>
    </>
  )
}
