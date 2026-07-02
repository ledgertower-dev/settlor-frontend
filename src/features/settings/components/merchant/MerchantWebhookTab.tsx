'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { Input } from '@/components/ui/input'
import { useMeWebhooks, useUpdateMeWebhooks } from '../../model/use-webhooks'

const cardClassName =
  'overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6'
const inputClassName =
  'h-12 rounded-md border border-transparent dark:border-input bg-secondary px-6'

export function MerchantWebhookTab() {
  const webhooksQuery = useMeWebhooks()
  const updateWebhooksMutation = useUpdateMeWebhooks()

  const [payoutCallbackUrl, setPayoutCallbackUrl] = useState('')
  const [depositCallbackUrl, setDepositCallbackUrl] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect -- sync server data to local form state */
  useEffect(() => {
    if (webhooksQuery.data) {
      setPayoutCallbackUrl(webhooksQuery.data.payoutCallbackUrl)
      setDepositCallbackUrl(webhooksQuery.data.depositCallbackUrl)
    }
  }, [webhooksQuery.data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCancel = () => {
    if (webhooksQuery.data) {
      setPayoutCallbackUrl(webhooksQuery.data.payoutCallbackUrl)
      setDepositCallbackUrl(webhooksQuery.data.depositCallbackUrl)
    }
  }

  const handleSave = () => {
    updateWebhooksMutation.mutate(
      {
        payout_callback_url: payoutCallbackUrl,
        deposit_callback_url: depositCallbackUrl,
      },
      {
        onSuccess: () => toast.success('Webhook settings updated successfully'),
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const isPending = updateWebhooksMutation.isPending

  return (
    <div className={cardClassName}>
      <div className="flex flex-col gap-8">
        {/* Row: Two side-by-side inputs */}
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="flex flex-1 flex-col gap-3.5">
            <label className="text-sm text-foreground">Payout Webhook</label>
            <Input
              value={payoutCallbackUrl}
              onChange={e => setPayoutCallbackUrl(e.target.value)}
              placeholder="Enter payout webhook"
              className={inputClassName}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-1 flex-col gap-3.5">
            <label className="text-sm text-foreground">Deposit Webhook</label>
            <Input
              value={depositCallbackUrl}
              onChange={e => setDepositCallbackUrl(e.target.value)}
              placeholder="Enter deposit webhook"
              className={inputClassName}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
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
    </div>
  )
}
