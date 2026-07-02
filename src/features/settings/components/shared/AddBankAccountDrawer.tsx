'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { bankAccountSchema, type BankAccountFormData } from '../../schemas/bank-account.schema'
import { INPUT_CLASSNAME } from '@/lib/core/styles'

interface AddBankAccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: (data: BankAccountFormData) => Promise<void>
  defaultValues?: BankAccountFormData
}

const emptyDefaults: BankAccountFormData = {
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifsc: '',
  accountType: 'SAVINGS',
}

export function AddBankAccountDrawer({
  open,
  onOpenChange,
  title,
  onSubmit,
  defaultValues,
}: AddBankAccountDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: defaultValues ?? emptyDefaults,
  })

  // Reset form when drawer opens/closes or defaultValues change
  useEffect(() => {
    if (open) {
      form.reset(defaultValues ?? emptyDefaults)
    }
  }, [open, defaultValues, form])

  const handleClose = () => {
    form.reset(emptyDefaults)
    onOpenChange(false)
  }

  const handleSubmit = async (data: BankAccountFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      handleClose()
    } catch {
      // Parent handles toast on error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title={title}
      formId="add-bank-account-form"
      isPending={isSubmitting}
      submitLabel="Save Account"
      pendingLabel="Saving..."
    >
      <Form {...form}>
        <form
          id="add-bank-account-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">Bank Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter bank name"
                    className={INPUT_CLASSNAME}
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">
                  Account Holder&apos;s Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter account holder's name"
                    className={INPUT_CLASSNAME}
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">
                  Account Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter account number"
                    className={INPUT_CLASSNAME}
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ifsc"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">IFSC Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter IFSC code"
                    className={INPUT_CLASSNAME}
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">Account Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                  <FormControl>
                    <SelectTrigger
                      size="lg"
                      className="w-full rounded-md border-[0.4px] border-foreground/40 bg-secondary pl-6 pr-3.5"
                    >
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="CURRENT">Current</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDrawer>
  )
}
