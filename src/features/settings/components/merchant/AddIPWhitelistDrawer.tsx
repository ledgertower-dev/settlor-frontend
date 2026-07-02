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

import { useCreateMeWhitelistIP } from '../../model/use-ip-whitelist'
import {
  whitelistIPSchema,
  type WhitelistIPFormData,
} from '@/features/merchants/schemas/merchant-security.schema'
import { getErrorMessage } from '@/lib/api/error-handler'
import { INPUT_CLASSNAME } from '@/lib/core/styles'

interface AddIPWhitelistDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddIPWhitelistDrawer({ open, onOpenChange, onSuccess }: AddIPWhitelistDrawerProps) {
  const createMutation = useCreateMeWhitelistIP()

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
        ip_address: data.ipAddress,
        description: data.description,
        type: data.type,
      })
      toast.success('Whitelist IP added successfully')
      handleClose()
      onSuccess?.()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title="Add Whitelist IP"
      formId="me-add-whitelist-ip-form"
      isPending={createMutation.isPending}
      submitLabel="Submit"
      pendingLabel="Submitting..."
    >
      <Form {...form}>
        <form
          id="me-add-whitelist-ip-form"
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
                    placeholder="Enter IP Address"
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
                    <SelectItem value="API_TRANSACTIONS">Transactions</SelectItem>
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
