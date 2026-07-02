'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { maintenanceSchema, type MaintenanceFormData } from '../../schemas/maintenance.schema'
import { useUpdateMaintenanceSchedule } from '../../model/use-maintenance'
import { getErrorMessage } from '@/lib/api/error-handler'
import type { MaintenanceSchedule } from '../../types'

const inputClassName =
  'h-12 rounded-md border-[0.4px] border-foreground/40 bg-secondary pl-6 pr-3.5'

interface ViewMaintenanceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: MaintenanceSchedule | null
}

function toDateValue(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeValue(iso: string): string {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

export function ViewMaintenanceDrawer({
  open,
  onOpenChange,
  schedule,
}: ViewMaintenanceDrawerProps) {
  const updateMutation = useUpdateMaintenanceSchedule()
  const isCompleted = schedule?.status === 'COMPLETED'
  const isInProgress = schedule?.status === 'IN_PROGRESS'

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

  useEffect(() => {
    if (schedule) {
      form.reset({
        name: schedule.name,
        description: schedule.description,
        ipAddress: schedule.ipAddress,
        fromDate: toDateValue(schedule.fromAt),
        fromTime: toTimeValue(schedule.fromAt),
        toDate: toDateValue(schedule.toAt),
        toTime: toTimeValue(schedule.toAt),
      })
    }
  }, [schedule, form])

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = async (data: MaintenanceFormData) => {
    if (!schedule) return

    try {
      if (isInProgress) {
        // Only to_at can be changed when IN_PROGRESS
        const to_at = new Date(`${data.toDate}T${data.toTime}:00`).toISOString()
        await updateMutation.mutateAsync({
          id: schedule.id,
          data: { to_at },
        })
      } else {
        const from_at = new Date(`${data.fromDate}T${data.fromTime}:00`).toISOString()
        const to_at = new Date(`${data.toDate}T${data.toTime}:00`).toISOString()
        await updateMutation.mutateAsync({
          id: schedule.id,
          data: {
            name: data.name,
            description: data.description || undefined,
            ip_address: data.ipAddress || undefined,
            from_at,
            to_at,
          },
        })
      }
      toast.success('Maintenance schedule updated successfully')
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:w-[640px] sm:max-w-[640px] [&>button]:hidden"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="text-lg font-medium text-foreground">View Maintenance</h2>
            <button
              type="button"
              onClick={handleClose}
              className="cursor-pointer rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <AppIcon icon={X} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Status Display */}
            <div className="mb-6">
              <span className="text-sm font-normal text-foreground">Status</span>
              <div className="mt-2">
                <StatusBadge status={schedule?.status ?? 'UPCOMING'} variant="plain" />
              </div>
            </div>

            <Form {...form}>
              <form
                id="view-maintenance-form"
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
                          disabled={isCompleted || isInProgress || updateMutation.isPending}
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
                      <FormLabel className="text-sm font-normal text-foreground">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter description"
                          className={inputClassName}
                          {...field}
                          disabled={isCompleted || isInProgress || updateMutation.isPending}
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
                      <FormLabel className="text-sm font-normal text-foreground">
                        IP Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter IP address"
                          className={inputClassName}
                          {...field}
                          disabled={isCompleted || isInProgress || updateMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* From Date & Time */}
                <div className="flex gap-3.5">
                  <FormField
                    control={form.control}
                    name="fromDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-sm font-normal text-foreground">
                          From Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className={inputClassName}
                            {...field}
                            disabled={isCompleted || isInProgress || updateMutation.isPending}
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
                        <FormLabel className="text-sm font-normal text-foreground">
                          From Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className={inputClassName}
                            {...field}
                            disabled={isCompleted || isInProgress || updateMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* To Date & Time */}
                <div className="flex gap-3.5">
                  <FormField
                    control={form.control}
                    name="toDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-sm font-normal text-foreground">
                          To Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className={inputClassName}
                            {...field}
                            disabled={isCompleted || updateMutation.isPending}
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
                        <FormLabel className="text-sm font-normal text-foreground">
                          To Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            className={inputClassName}
                            {...field}
                            disabled={isCompleted || updateMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* Footer */}
          {!isCompleted && (
            <div className="flex gap-6 border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={updateMutation.isPending}
                size="xl"
                className="flex-1 bg-muted text-accent-dark hover:bg-muted/80"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="view-maintenance-form"
                disabled={updateMutation.isPending}
                size="xl"
                className="flex-1 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
