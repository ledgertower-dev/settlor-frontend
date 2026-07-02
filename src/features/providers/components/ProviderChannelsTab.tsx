'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { RadioButton } from '@/components/shared/radio-button'
import { FormDialog } from '@/components/shared/form-dialog'
import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/shared/status-badge'
import { Copy, Plus } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermission } from '@/features/access/hooks/usePermission'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { ProviderChannel } from '../types'
import {
  useProviderChannels,
  useUpdateChannelStatus,
  useAddChannel,
  useUpdateChannel,
} from '../model/use-providers'
import { channelSchema, type ChannelFormData } from '../schemas/channel.schema'

interface ProviderChannelsTabProps {
  providerId: string
}

export function ProviderChannelsTab({ providerId }: ProviderChannelsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ProviderChannel | null>(null)
  const canManage = usePermission('providers:manage')

  const { data: channels = [], isLoading } = useProviderChannels(providerId)

  const handleAddClick = () => {
    setEditingChannel(null)
    setDialogOpen(true)
  }

  const handleEditClick = (channel: ProviderChannel) => {
    setEditingChannel(channel)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-[2.625rem] w-32 rounded-md" />
        </div>
        <div className="space-y-3.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Channels</h2>
            <p className="text-sm text-muted-foreground">
              Manage channels and their credentials for this provider
            </p>
          </div>
          {canManage && (
            <button
              onClick={handleAddClick}
              className="flex h-[2.625rem] items-center gap-2 rounded-md bg-button-bg px-4 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              <AppIcon icon={Plus} size="sm" color="primary-foreground" />
              Add channel
            </button>
          )}
        </div>

        {/* Channel cards or empty state */}
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border-[0.5px] border-foreground/10 p-12">
            <p className="text-sm text-muted-foreground">
              No channels configured for this provider
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {channels.map(channel => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                providerId={providerId}
                onEdit={handleEditClick}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </div>

      <ChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        providerId={providerId}
        channel={editingChannel}
      />
    </>
  )
}

function ChannelCard({
  channel,
  providerId,
  onEdit,
  canManage,
}: {
  channel: ProviderChannel
  providerId: string
  onEdit: (channel: ProviderChannel) => void
  canManage: boolean
}) {
  const updateStatus = useUpdateChannelStatus()

  const handleToggle = (checked: boolean) => {
    const newStatus = checked ? 'ACTIVE' : 'INACTIVE'
    updateStatus.mutate(
      { providerId, channelId: channel.id, status: newStatus },
      {
        onSuccess: () =>
          toast.success(`Channel ${newStatus === 'ACTIVE' ? 'enabled' : 'disabled'}`),
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const { copy: handleCopy } = useCopyToClipboard()

  return (
    <div className="rounded-md border-[0.5px] border-foreground/10">
      {/* Channel header */}
      <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-foreground">{channel.name}</p>
          <StatusBadge status={channel.status} />
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <Switch
              variant="green"
              size="lg"
              checked={channel.status === 'ACTIVE'}
              onCheckedChange={handleToggle}
              disabled={updateStatus.isPending}
            />
          )}
          {canManage && (
            <button
              onClick={() => onEdit(channel)}
              className="rounded-md border border-foreground/20 px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Credentials */}
      <div className="flex flex-col gap-4 p-5">
        <CredentialRow
          label="Webhook URL"
          value={channel.webhookUrl}
          onCopy={() => handleCopy(channel.webhookUrl, 'Webhook URL')}
        />
        <CredentialRow
          label="Webhook Secret"
          value={channel.webhookSecretMasked}
          masked
          onCopy={() => handleCopy(channel.webhookSecretMasked, 'Webhook Secret')}
        />
        <CredentialRow
          label="API Key"
          value={channel.apiKeyMasked}
          masked
          onCopy={() => handleCopy(channel.apiKeyMasked, 'API Key')}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-foreground/10 px-5 py-3">
        <p className="text-xs text-muted-foreground">
          Used by <span className="font-medium text-foreground">{channel.usedByMerchants}</span>{' '}
          merchants
        </p>
      </div>
    </div>
  )
}

function CredentialRow({
  label,
  value,
  masked = false,
  onCopy,
}: {
  label: string
  value: string
  masked?: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center gap-4">
      <p className="w-32 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-foreground/20 bg-secondary px-4 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-accent-dark">
          {value || '-'}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {masked && <span className="text-xs text-muted-foreground">Masked</span>}
          <button
            onClick={onCopy}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon icon={Copy} size="lg" />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Add / Edit Channel Dialog ---

const labelStyles = 'text-sm font-normal capitalize text-foreground'
const inputStyles =
  '!h-12 border-[0.4px] border-foreground/40 bg-secondary px-6 text-sm placeholder:text-muted-foreground'

function ChannelDialog({
  open,
  onOpenChange,
  providerId,
  channel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerId: string
  channel: ProviderChannel | null
}) {
  const isEdit = !!channel

  const addChannel = useAddChannel()
  const updateChannel = useUpdateChannel()
  const isSubmitting = addChannel.isPending || updateChannel.isPending

  const form = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: {
      name: '',
      webhookUrl: '',
      webhookSecret: '',
      apiKey: '',
      status: 'ACTIVE',
    },
  })

  useEffect(() => {
    if (channel && open) {
      form.reset({
        name: channel.name,
        webhookUrl: channel.webhookUrl,
        webhookSecret: '',
        apiKey: '',
        status: channel.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      })
    }
  }, [channel, open, form])

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      form.reset({
        name: '',
        webhookUrl: '',
        webhookSecret: '',
        apiKey: '',
        status: 'ACTIVE',
      })
    }, 300)
  }

  const onSubmit = async (data: ChannelFormData) => {
    try {
      if (isEdit && channel) {
        await updateChannel.mutateAsync({
          providerId,
          channelId: channel.id,
          data: {
            name: data.name.trim(),
            webhook_url: data.webhookUrl?.trim() || undefined,
            webhook_secret: data.webhookSecret?.trim() || undefined,
            api_key: data.apiKey?.trim() || undefined,
            status: data.status,
          },
        })
        toast.success('Channel updated')
      } else {
        await addChannel.mutateAsync({
          providerId,
          data: {
            name: data.name.trim(),
            webhook_url: data.webhookUrl?.trim() ?? '',
            webhook_secret: data.webhookSecret?.trim() ?? '',
            api_key: data.apiKey?.trim() ?? '',
            status: data.status,
          },
        })
        toast.success('Channel added')
      }
      handleClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={o => (!o ? handleClose() : null)}
      title={isEdit ? 'Edit channel' : 'Add channel'}
      description={
        isEdit
          ? 'Update channel credentials and configuration'
          : 'Configure a new channel for this provider'
      }
      formId="channel-form"
      isPending={isSubmitting}
      submitLabel={isEdit ? 'Save changes' : 'Add channel'}
      pendingLabel={isEdit ? 'Saving...' : 'Adding...'}
      size="md-lg"
      scrollable
      showCloseButton={false}
      className="!px-6"
    >
      <Form {...form}>
        <form
          id="channel-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Channel A - Primary"
                    className={inputStyles}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Webhook URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." className={inputStyles} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="webhookSecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Webhook Secret</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={isEdit ? 'Leave blank to keep current' : 'whsec_...'}
                    className={inputStyles}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>API Key</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={isEdit ? 'Leave blank to keep current' : 'ak_live_...'}
                    className={inputStyles}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyles}>Status</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-6">
                    <RadioButton
                      size="sm"
                      label="Active"
                      selected={field.value === 'ACTIVE'}
                      onSelect={() => field.onChange('ACTIVE')}
                    />
                    <RadioButton
                      size="sm"
                      label="Inactive"
                      selected={field.value === 'INACTIVE'}
                      onSelect={() => field.onChange('INACTIVE')}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
