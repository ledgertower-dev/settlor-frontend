'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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

import { revertTransactionSchema, type RevertTransactionFormData } from '../schemas'
import { useRevertDeposit } from '../model/use-deposit-transactions'
import { useDepositTransactionsPanelStore } from '../model/deposit-transactions-ui-store'
import { getErrorMessage } from '@/lib/api/error-handler'

interface DepositRevertFormProps {
  depositId: string
}

export function DepositRevertForm({ depositId }: DepositRevertFormProps) {
  const setRevertFormOpen = useDepositTransactionsPanelStore(s => s.setRevertFormOpen)
  const setViewingDeposit = useDepositTransactionsPanelStore(s => s.setViewingDeposit)
  const revertMutation = useRevertDeposit()

  const form = useForm<RevertTransactionFormData>({
    resolver: zodResolver(revertTransactionSchema),
    defaultValues: {
      email: '',
      password: '',
      reason: '',
    },
  })

  const handleCancel = () => {
    form.reset()
    setRevertFormOpen(false)
  }

  const onSubmit = async (data: RevertTransactionFormData) => {
    try {
      await revertMutation.mutateAsync({
        id: depositId,
        data: {
          email: data.email,
          password: data.password,
          reason: data.reason,
        },
      })
      toast.success('Reversion submitted')
      form.reset()
      setRevertFormOpen(false)
      setViewingDeposit(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const submitting = revertMutation.isPending

  return (
    <div className="flex flex-col gap-8 rounded-md bg-muted p-6">
      <p className="text-lg font-medium text-foreground">Revert Transaction</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="gap-3.5">
                <FormLabel className="text-sm font-normal capitalize text-foreground">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 border-[0.4px] border-foreground/40 bg-background"
                    {...field}
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
              <FormItem className="gap-3.5">
                <FormLabel className="text-sm font-normal capitalize text-foreground">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    className="h-12 border-[0.4px] border-foreground/40 bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reason */}
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem className="gap-3.5">
                <FormLabel className="text-sm font-normal capitalize text-foreground">
                  Reason for Reversion
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the reason for reverting this transaction"
                    className="min-h-[100px] resize-none border-[0.4px] border-foreground/40 bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Footer */}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="h-10.5 w-[160px] rounded-md border-[0.4px] border-foreground/40 bg-secondary text-sm text-accent-dark transition-colors hover:bg-accent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10.5 w-[160px] rounded-md bg-button-bg text-sm capitalize text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Revert'}
            </button>
          </div>
        </form>
      </Form>
    </div>
  )
}
