'use client'

import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'
import { Switch } from '@/components/ui/switch'
import { StatusBadge } from '@/components/shared/status-badge'
import { usePermission } from '@/features/access/hooks/usePermission'
import type { Provider } from '../types'
import { useUpdateProviderStatus } from '../model/use-providers'

interface ProviderOverviewTabProps {
  provider: Provider
}

export function ProviderOverviewTab({ provider }: ProviderOverviewTabProps) {
  const canManage = usePermission('providers:manage')
  const { mutate: updateStatus, isPending } = useUpdateProviderStatus()

  const isActive = provider.status === 'ACTIVE'

  const handleToggle = (checked: boolean) => {
    updateStatus(
      {
        providerId: provider.id,
        status: checked ? 'ACTIVE' : 'INACTIVE',
      },
      {
        onSuccess: () => {
          toast.success(`Provider ${checked ? 'enabled' : 'disabled'} successfully`)
        },
        onError: error => {
          toast.error(getErrorMessage(error))
        },
      },
    )
  }

  return (
    <div className="space-y-3.5">
      {/* Bank status card */}
      <div className="flex items-center justify-between rounded-md border-[0.5px] border-foreground/20 bg-card p-5 shadow-[var(--shadow-card)] dark:bg-card">
        <div>
          <p className="text-sm font-medium text-foreground">Provider status</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Enable or disable this provider across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={provider.status} />
          {canManage && (
            <Switch
              variant="green"
              size="lg"
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={isPending}
            />
          )}
        </div>
      </div>

      {/* Service card */}
      <div className="flex items-center justify-between rounded-md border-[0.5px] border-foreground/20 bg-card p-5 shadow-[var(--shadow-card)] dark:bg-card">
        <div>
          <p className="text-sm font-medium text-foreground">Service</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Service type supported by this provider
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-status-green px-3 py-1 text-sm text-status-green">
            {provider.service?.replace(/_/g, ' ') || '-'}
          </span>
        </div>
      </div>

      {/* Provider Details section */}
      <div className="rounded-md border-[0.5px] border-foreground/20 bg-card p-5 shadow-[var(--shadow-card)] dark:bg-card">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Provider Details
        </p>
        <div className="grid grid-cols-2 gap-3">
          <DetailCard label="Provider ID" value={provider.providerIdDisplay} />
          <DetailCard label="Name" value={provider.name} />
          <DetailCard label="Code" value={provider.code} />
          <DetailCard
            label="Type"
            value={
              provider.type === 'BANK' ? 'Bank' : provider.type === 'PSP' ? 'PSP' : provider.type
            }
          />
          <DetailCard label="Short Code" value={provider.shortCode || '-'} />
          <div className="col-span-2">
            <DetailCard label="Description" value={provider.description || '-'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm text-foreground">{value}</p>
    </div>
  )
}
