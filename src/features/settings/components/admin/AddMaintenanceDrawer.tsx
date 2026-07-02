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
import { DatePicker, TimePicker } from '@/components/shared/date-time-picker'
import { maintenanceSchema, type MaintenanceFormData } from '../../schemas/maintenance.schema'
import { useCreateMaintenanceSchedule } from '../../model/use-maintenance'
import { getErrorMessage } from '@/lib/api/error-handler'

const inputClassName =
  'h-12 rounded-md border-[0.4px] border-foreground/40 bg-secondary pl-6 pr-3.5'

interface AddMaintenanceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMaintenanceDrawer({ open, onOpenChange }: AddMaintenanceDrawerProps) {
  const createMutation = useCreateMaintenanceSchedule()

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      name: '',
      description: '',
      ipAddress: '',
      fromDate: '',
      fromTime: '',
      toDate: '',
      toTime: '',
    },
  })

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      const from_at = new Date(`${data.fromDate}T${data.fromTime}:00`).toISOString()
      const to_at = new Date(`${data.toDate}T${data.toTime}:00`).toISOString()

      await createMutation.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        ip_address: data.ipAddress || undefined,
        from_at,
        to_at,
      })
      toast.success('Maintenance schedule created successfully')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleClose}
      title="Add Maintenance"
      formId="add-maintenance-form"
      isPending={createMutation.isPending}
      submitLabel="Submit"
      pendingLabel="Submitting..."
    >
      <Form {...form}>
        <form
          id="add-maintenance-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter name"
                    className={inputClassName}
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
                    className={inputClassName}
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
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-normal text-foreground">IP Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter IP address"
                    className={inputClassName}
                    {...field}
                    disabled={createMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* From Date & Time */}
          <div className="flex items-start gap-3.5">
            <FormField
              control={form.control}
              name="fromDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm font-normal text-foreground">From Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="From date"
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fromTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm font-normal text-foreground">From Time</FormLabel>
                  <FormControl>
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* To Date & Time */}
          <div className="flex items-start gap-3.5">
            <FormField
              control={form.control}
              name="toDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm font-normal text-foreground">To Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="To date"
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-sm font-normal text-foreground">To Time</FormLabel>
                  <FormControl>
                    <TimePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={createMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </FormDrawer>
  )
}
