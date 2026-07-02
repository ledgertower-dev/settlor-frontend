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
import { StatusBadge } from '@/components/shared/status-badge'

import type { WhitelistIP } from '../types/merchant-security.types'
import { useUpdateWhitelistIP } from '../model/use-merchant-security'
import {
  editWhitelistIPSchema,
  type EditWhitelistIPFormData,
} from '../schemas/merchant-security.schema'
import { getErrorMessage } from '@/lib/api/error-handler'
import { INPUT_CLASSNAME } from '@/lib/core/styles'

interface ViewWhitelistIPDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
  whitelistIP: WhitelistIP | null
}

export function ViewWhitelistIPDrawer({
  open,
  onOpenChange,
  merchantId,
  whitelistIP,
}: ViewWhitelistIPDrawerProps) {
  const updateMutation = useUpdateWhitelistIP()

  const form = useForm<EditWhitelistIPFormData>({
    resolver: zodResolver(editWhitelistIPSchema),
    defaultValues: {
      ipAddress: '',
      description: '',
      type: 'PLATFORM',
    },
  })

  useEffect(() => {
    if (whitelistIP) {
      form.reset({
        ipAddress: whitelistIP.ipAddress,
        description: whitelistIP.description,
        type: whitelistIP.type as 'PLATFORM' | 'API_TRANSACTIONS',
      })
    }
  }, [whitelistIP, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = async (data: EditWhitelistIPFormData) => {
    if (!whitelistIP) return

    try {
      await updateMutation.mutateAsync({
        merchantId,
        whitelistId: whitelistIP.id,
        data: {
          ip_address: data.ipAddress,
          description: data.description,
          type: data.type,
        },
      })
      toast.success('Whitelist IP updated successfully')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title="View Whitelist IP"
      formId="view-whitelist-ip-form"
      isPending={updateMutation.isPending}
      submitLabel="Update"
      pendingLabel="Updating..."
    >
      <Form {...form}>
        <form
          id="view-whitelist-ip-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">IP Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter IP address"
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">Description</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter description"
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">
                  Whitelisting Type
                </FormLabel>
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
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PLATFORM">Platform</SelectItem>
                    <SelectItem value="API_TRANSACTIONS">API Transactions</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <span className="text-sm font-normal text-foreground">Status</span>
            <div className="mt-2">
              <StatusBadge status={whitelistIP?.status ?? 'PENDING'} variant="plain" />
            </div>
          </div>
        </form>
      </Form>
    </FormDrawer>
  )
}
