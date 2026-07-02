'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, EyeOff } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { statusOverrideSchema, type StatusOverrideFormData } from '../schemas'
import { useOverridePayoutStatus } from '../model/use-payouts'
import { useAuthStore } from '@/features/auth'
import { getErrorMessage } from '@/lib/api/error-handler'
import type { PayoutStatus, StatusOverrideStatus } from '../types'

interface StatusOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payoutId: string
  currentStatus: PayoutStatus
}

const ALL_STATUSES: { value: StatusOverrideStatus; label: string }[] = [
  { value: 'INITIATED', label: 'Initiated' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
]

export function StatusOverrideDialog({
  open,
  onOpenChange,
  payoutId,
  currentStatus,
}: StatusOverrideDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const { user } = useAuthStore()
  const { mutateAsync, isPending } = useOverridePayoutStatus()

  const form = useForm<StatusOverrideFormData>({
    resolver: zodResolver(statusOverrideSchema),
    defaultValues: {
      newStatus: undefined,
      password: '',
      reason: '',
    },
  })

  const availableStatuses = ALL_STATUSES.filter(s => s.value !== currentStatus)

  const handleClose = () => {
    if (isPending) return
    form.reset()
    setShowPassword(false)
    onOpenChange(false)
  }

  const handleSubmit = async (values: StatusOverrideFormData) => {
    try {
      await mutateAsync({
        payoutId,
        data: {
          new_status: values.newStatus,
          email: user?.email ?? '',
          password: values.password,
          reason: values.reason,
        },
      })
      toast.success('Payout status updated successfully')
      form.reset()
      setShowPassword(false)
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const labelStyles = 'text-sm font-normal capitalize'
  const inputStyles =
    '!h-12 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm placeholder:text-muted-foreground'
  const selectTriggerStyles =
    '!h-12 w-full border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm'

  return (
    <FormDialog
      open={open}
      onOpenChange={handleClose}
      title="Status Override"
      formId="status-override-form"
      isPending={isPending}
      submitLabel="Submit"
      pendingLabel="Submitting..."
      size="md"
      scrollable
      showCloseButton={false}
      className="sm:max-w-[480px] !px-5"
    >
      <Form {...form}>
        <form
          id="status-override-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          {/* New Status */}
          <FormField
            control={form.control}
            name="newStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  New Status<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                  <FormControl>
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reason */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Reason<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter reason for status override"
                    className="min-h-[6.25rem] resize-none border-[0.4px] border-foreground/40 bg-secondary px-6 py-3.5 text-sm"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>
                  Password<span className="-ml-1 text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="off"
                      className={`${inputStyles} pr-12`}
                      {...field}
                      disabled={isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
        </form>
      </Form>
    </FormDialog>
  )
}
