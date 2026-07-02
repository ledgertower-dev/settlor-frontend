'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

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

import type { WhitelistBankAccount } from '../types/merchant-security.types'
import { useUpdateBankAccount } from '../model/use-merchant-security'
import {
  whitelistAccountSchema,
  type WhitelistAccountFormData,
} from '../schemas/merchant-security.schema'
import { getErrorMessage } from '@/lib/api/error-handler'
import { INPUT_CLASSNAME } from '@/lib/core/styles'

interface ViewWhitelistAccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
  account: WhitelistBankAccount | null
}

export function ViewWhitelistAccountDrawer({
  open,
  onOpenChange,
  merchantId,
  account,
}: ViewWhitelistAccountDrawerProps) {
  const updateMutation = useUpdateBankAccount()

  const form = useForm<WhitelistAccountFormData>({
    resolver: zodResolver(whitelistAccountSchema),
    defaultValues: {
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'SAVINGS',
    },
  })

  useEffect(() => {
    if (account) {
      form.reset({
        bankName: account.bankName,
        accountHolderName: account.accountHolderName,
        accountNumber: account.accountNumber,
        ifscCode: account.ifsc,
        accountType: account.accountType,
      })
    }
  }, [account, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = async (data: WhitelistAccountFormData) => {
    if (!account) return

    try {
      await updateMutation.mutateAsync({
        merchantId,
        bankAccountId: account.id,
        data: {
          bank_name: data.bankName,
          account_holder_name: data.accountHolderName,
          account_number: data.accountNumber,
          ifsc: data.ifscCode,
          account_type: data.accountType,
        },
      })
      toast.success('Whitelist account updated successfully')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title="View Whitelist Account"
      formId="view-whitelist-account-form"
      isPending={updateMutation.isPending}
      submitLabel="Update"
      pendingLabel="Updating..."
    >
      <Form {...form}>
        <form
          id="view-whitelist-account-form"
          onSubmit={form.handleSubmit(onSubmit)}
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
                    disabled={updateMutation.isPending}
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
                    disabled={updateMutation.isPending}
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
                    disabled={updateMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ifscCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">IFSC Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter IFSC code"
                    className={INPUT_CLASSNAME}
                    {...field}
                    disabled={updateMutation.isPending}
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={updateMutation.isPending}
                >
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
