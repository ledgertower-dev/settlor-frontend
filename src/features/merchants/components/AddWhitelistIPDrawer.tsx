'use client'

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

import { useCreateWhitelistIP } from '../model/use-merchant-security'
import { whitelistIPSchema, type WhitelistIPFormData } from '../schemas/merchant-security.schema'
import { getErrorMessage } from '@/lib/api/error-handler'
import { INPUT_CLASSNAME } from '@/lib/core/styles'

interface AddWhitelistIPDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
}

export function AddWhitelistIPDrawer({
  open,
  onOpenChange,
  merchantId,
}: AddWhitelistIPDrawerProps) {
  const createMutation = useCreateWhitelistIP()

  const form = useForm<WhitelistIPFormData>({
    resolver: zodResolver(whitelistIPSchema),
    defaultValues: {
      ipAddress: '',
      description: '',
      type: 'PLATFORM',
    },
  })

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = async (data: WhitelistIPFormData) => {
    try {
      await createMutation.mutateAsync({
        merchantId,
        data: {
          ip_address: data.ipAddress,
          description: data.description,
          type: data.type,
          is_active: true,
        },
      })
      toast.success('Whitelist IP added successfully')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title="Add Whitelist IP"
      formId="add-whitelist-ip-form"
      isPending={createMutation.isPending}
      submitLabel="Add Whitelist IP"
      pendingLabel="Adding..."
    >
      <Form {...form}>
        <form
          id="add-whitelist-ip-form"
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
                    disabled={createMutation.isPending}
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
                    disabled={createMutation.isPending}
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
                  defaultValue={field.value}
                  disabled={createMutation.isPending}
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
        </form>
      </Form>
    </FormDrawer>
  )
}
