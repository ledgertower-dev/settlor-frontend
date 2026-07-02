'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { usePermission } from '@/features/access/hooks/usePermission'
import { Input } from '@/components/ui/input'
import {
  useWebhooks,
  useUpdateWebhooks,
  useWebhookEvents,
  useEventSubscriptions,
  useUpdateEventSubscriptions,
} from '../model/use-merchant-security'

interface MerchantUrlTabProps {
  merchantId: string
}

const cardClassName =
  'overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6'
const inputClassName = 'h-12 rounded-md border-[0.4px] border-foreground/20 bg-secondary px-6'

export function MerchantUrlTab({ merchantId }: MerchantUrlTabProps) {
  const canUpdate = usePermission('merchants:settings:update')
  const webhooksQuery = useWebhooks(merchantId)
  const updateWebhooksMutation = useUpdateWebhooks()

  const webhookEventsQuery = useWebhookEvents()
  const subscriptionsQuery = useEventSubscriptions(merchantId)
  const updateSubscriptionsMutation = useUpdateEventSubscriptions()

  const [payoutCallbackUrl, setPayoutCallbackUrl] = useState('')
  const [depositCallbackUrl, setDepositCallbackUrl] = useState('')
  const [adminCallbackUrl, setAdminCallbackUrl] = useState('')
  const [subscribedEventIds, setSubscribedEventIds] = useState<string[]>([])

  /* eslint-disable react-hooks/set-state-in-effect -- sync server data to local form state */
  useEffect(() => {
    if (webhooksQuery.data) {
      setPayoutCallbackUrl(webhooksQuery.data.payoutCallbackUrl)
      setDepositCallbackUrl(webhooksQuery.data.depositCallbackUrl)
      setAdminCallbackUrl(webhooksQuery.data.adminCallbackUrl)
    }
  }, [webhooksQuery.data])

  useEffect(() => {
    if (subscriptionsQuery.data) {
      setSubscribedEventIds(subscriptionsQuery.data.subscribedEventIds)
    }
  }, [subscriptionsQuery.data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCancel = () => {
    if (webhooksQuery.data) {
      setPayoutCallbackUrl(webhooksQuery.data.payoutCallbackUrl)
      setDepositCallbackUrl(webhooksQuery.data.depositCallbackUrl)
      setAdminCallbackUrl(webhooksQuery.data.adminCallbackUrl)
    }
    if (subscriptionsQuery.data) {
      setSubscribedEventIds(subscriptionsQuery.data.subscribedEventIds)
    }
  }

  const handleToggleEvent = (eventId: string) => {
    setSubscribedEventIds(prev =>
      prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId],
    )
  }

  const handleSave = () => {
    const webhookPromise = updateWebhooksMutation.mutateAsync({
      merchantId,
      data: {
        payout_callback_url: payoutCallbackUrl,
        deposit_callback_url: depositCallbackUrl,
        admin_callback_url: adminCallbackUrl,
      },
    })

    const subscriptionsPromise = updateSubscriptionsMutation.mutateAsync({
      merchantId,
      data: { event_ids: subscribedEventIds },
    })

    Promise.all([webhookPromise, subscriptionsPromise])
      .then(() => toast.success('Webhook settings updated successfully'))
      .catch(error => toast.error(getErrorMessage(error)))
  }

  const isPending = updateWebhooksMutation.isPending || updateSubscriptionsMutation.isPending
  const availableEvents = webhookEventsQuery.data ?? []
  const isLoadingEvents = webhookEventsQuery.isLoading || subscriptionsQuery.isLoading

  return (
    <div className={cardClassName}>
      <div className="flex flex-col gap-8">
        {/* Row 1: Two side-by-side inputs */}
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="flex flex-1 flex-col gap-3.5">
            <label className="text-sm text-foreground">Payout Webhook</label>
            <Input
              value={payoutCallbackUrl}
              onChange={e => setPayoutCallbackUrl(e.target.value)}
              placeholder="Enter payout webhook"
              className={inputClassName}
              disabled={isPending || !canUpdate}
            />
          </div>
          <div className="flex flex-1 flex-col gap-3.5">
            <label className="text-sm text-foreground">Deposit Webhook</label>
            <Input
              value={depositCallbackUrl}
              onChange={e => setDepositCallbackUrl(e.target.value)}
              placeholder="Enter deposit webhook"
              className={inputClassName}
              disabled={isPending || !canUpdate}
            />
          </div>
        </div>

        {/* Row 2: Full-width input */}
        <div className="flex flex-col gap-3.5">
          <label className="text-sm text-foreground">Admin Payout Webhook</label>
          <Input
            value={adminCallbackUrl}
            onChange={e => setAdminCallbackUrl(e.target.value)}
            placeholder="Enter admin payout webhook"
            className={inputClassName}
            disabled={isPending || !canUpdate}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-foreground/10" />

        {/* Event Subscriptions */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Event Subscriptions</p>
            <p className="mt-1 text-xs text-foreground/50">
              Choose which payment events trigger webhook notifications.
            </p>
          </div>

          {isLoadingEvents ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[52px] animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : availableEvents.length === 0 ? (
            <div className="rounded-md border-[0.4px] border-foreground/20 bg-secondary px-4 py-5 text-sm text-foreground/50">
              No event types are currently available.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableEvents.map(event => {
                const isChecked = subscribedEventIds.includes(event.id)
                return (
                  <label
                    key={event.id}
                    className="flex cursor-pointer items-center justify-between rounded-md border-[0.4px] border-foreground/20 bg-secondary px-4 py-3.5 transition-colors hover:bg-secondary/80"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-foreground">{event.name}</span>
                      {event.description && (
                        <span className="text-xs text-foreground/50">{event.description}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isChecked}
                      aria-label={`Toggle ${event.name}`}
                      disabled={isPending || !canUpdate}
                      onClick={() => handleToggleEvent(event.id)}
                      className={[
                        'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none disabled:opacity-50',
                        isChecked ? 'bg-button-bg' : 'bg-foreground/20',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'absolute top-0.5 h-4 w-4 rounded-full bg-primary-foreground shadow-sm transition-transform duration-200',
                          isChecked ? 'left-[18px]' : 'left-0.5',
                        ].join(' ')}
                      />
                    </button>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {canUpdate && (
        <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:justify-end">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="h-[42px] w-full sm:w-[160px] rounded-md bg-muted text-sm text-button-bg transition-colors hover:bg-muted/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="h-[42px] w-full sm:w-[160px] rounded-md bg-button-bg px-2 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
