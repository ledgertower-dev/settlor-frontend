'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../../schemas/bank-account.schema'
import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'

export function ChangePasswordSection() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true)
    try {
      await apiClient.post('/auth/change-password', {
        new_password: data.password,
      })
      toast.success('Password updated successfully')
      form.reset()
      setShowPassword(false)
      setShowConfirmPassword(false)
    } catch (error) {
      try {
        throwApiError(error)
      } catch (parsed) {
        toast.error(parsed instanceof Error ? parsed.message : 'Failed to update password')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8">
          {/* Title + Fields */}
          <div className="flex flex-col gap-8">
            <p className="text-xl text-foreground">Change Password</p>

            {/* Password + Confirm side by side */}
            <div className="flex items-start gap-3.5">
              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm font-normal text-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="***********"
                          className="h-12 rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
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
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm font-normal text-foreground">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="***********"
                          className="h-12 rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
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
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[2.625rem] w-[10rem] rounded-md bg-button-bg text-sm capitalize text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                form.reset()
                setShowPassword(false)
                setShowConfirmPassword(false)
              }}
              className="h-[2.625rem] w-[10rem] rounded-md bg-muted text-sm text-button-bg transition-colors hover:bg-muted/80"
            >
              Cancel
            </button>
          </div>
        </form>
      </Form>
    </div>
  )
}
