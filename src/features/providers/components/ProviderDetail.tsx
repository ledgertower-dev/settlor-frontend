'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { CircleUser, Copy, Settings, User, type LucideIcon } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { PillTabs } from '@/components/shared/pill-tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useProvider } from '../model/use-providers'
import { ProviderOverviewTab } from './ProviderOverviewTab'
import { ProviderChannelsTab } from './ProviderChannelsTab'
import { ProviderVirtualAccountsTab } from './ProviderVirtualAccountsTab'

interface ProviderDetailProps {
  providerId: string
}

const TABS = ['overview', 'channels', 'virtualAccounts'] as const
type Tab = (typeof TABS)[number]
const VALID_TABS = new Set<string>(TABS)

export function ProviderDetail({ providerId }: ProviderDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlTab = searchParams.get('tab')
  const activeTab: Tab = urlTab && VALID_TABS.has(urlTab) ? (urlTab as Tab) : 'overview'

  const handleTabChange = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const { data: provider, isLoading, isError } = useProvider(providerId)

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        <Skeleton className="h-[4.5rem] w-full rounded-md" />
        <Skeleton className="h-14 w-64 rounded-full" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    )
  }

  if (isError || !provider) {
    return (
      <div className="space-y-3.5">
        <div className="flex items-center justify-center rounded-md border-[0.5px] border-foreground/20 bg-card p-12">
          <p className="text-sm text-muted-foreground">Provider not found</p>
        </div>
      </div>
    )
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(provider.providerIdDisplay)
    toast.success('Provider ID copied to clipboard')
  }

  const tabConfig: { value: Tab; label: string; icon: LucideIcon }[] = [
    { value: 'overview', label: 'Overview', icon: User },
    { value: 'channels', label: 'Channels', icon: Settings },
    { value: 'virtualAccounts', label: 'Virtual Accounts', icon: CircleUser },
  ]

  return (
    <div className="space-y-3.5">
      {/* Header card */}
      <div className="flex items-center gap-4 overflow-hidden rounded-md border-[0.5px] border-foreground/20 bg-card p-5 shadow-[var(--shadow-card)] dark:bg-card">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-button-bg text-sm font-medium text-primary-foreground">
          {provider.shortCode?.slice(0, 2).toUpperCase() || provider.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-1 items-center gap-3">
          <h1 className="text-xl text-foreground">{provider.name}</h1>
          <span className="rounded border border-status-teal px-2 py-0.5 text-xs text-status-teal">
            {provider.type === 'BANK' ? 'Bank' : provider.type === 'PSP' ? 'PSP' : provider.type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {provider.providerIdDisplay}
          </span>
          <button
            onClick={handleCopyId}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon icon={Copy} size="lg" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <PillTabs tabs={tabConfig} value={activeTab} onValueChange={handleTabChange} />

      {/* Tab content */}
      {activeTab === 'overview' ? (
        <ProviderOverviewTab provider={provider} />
      ) : activeTab === 'channels' ? (
        <ProviderChannelsTab providerId={providerId} />
      ) : (
        <ProviderVirtualAccountsTab providerId={providerId} />
      )}
    </div>
  )
}
