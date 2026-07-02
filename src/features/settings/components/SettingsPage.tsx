'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore, useCurrentUser } from '@/features/auth'
import { usePermission } from '@/features/access/hooks/usePermission'
import {
  type LucideIcon,
  ShieldCheck,
  Wrench,
  CircleEllipsis,
  KeyRound,
  Landmark,
  Network,
  Link,
  User,
  Mail,
  Mars,
  Phone,
  Calendar,
  BookUser,
  Venus,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'

import { AccessDenied } from '@/components/shared/access-denied'
import { PillTabs } from '@/components/shared/pill-tabs'
import { AdminSecurityTab } from './admin/AdminSecurityTab'
import { MerchantSecurityTab } from './merchant/MerchantSecurityTab'
import { MerchantApiKeysTab } from './merchant/MerchantApiKeysTab'
import { MerchantBankAccountTab } from './merchant/MerchantBankAccountTab'
import { AdminMaintenanceTab } from './admin/AdminMaintenanceTab'
import { MerchantIPWhitelistTab } from './merchant/MerchantIPWhitelistTab'
import { MerchantWebhookTab } from './merchant/MerchantWebhookTab'

const ADMIN_TABS = [
  { value: 'security', label: 'Security', icon: ShieldCheck },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'others', label: 'Others', icon: CircleEllipsis },
]

const MERCHANT_TABS = [
  { value: 'security', label: 'Security', icon: ShieldCheck },
  { value: 'apiKeys', label: 'API Keys', icon: KeyRound },
  { value: 'settlementBank', label: 'Whitelist Bank account', icon: Landmark },
  { value: 'ipWhitelist', label: 'IP Whitelist', icon: Network },
  { value: 'webhooks', label: 'URL Settings', icon: Link },
]

const ADMIN_TAB_VALUES = new Set(ADMIN_TABS.map(t => t.value))
const MERCHANT_TAB_VALUES = new Set(MERCHANT_TABS.map(t => t.value))

export function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore(s => s.user)
  const canAccessSettings = usePermission(['admin_settings:security:read', 'maintenance:read'])
  const isMerchant = user?.accountType === 'MERCHANT'
  const tabs = isMerchant ? MERCHANT_TABS : ADMIN_TABS
  const validValues = isMerchant ? MERCHANT_TAB_VALUES : ADMIN_TAB_VALUES

  const urlTab = searchParams.get('tab')
  const activeTab = urlTab && validValues.has(urlTab) ? urlTab : 'security'

  const handleTabChange = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  if (!isMerchant && !canAccessSettings) {
    return <AccessDenied resource="settings" />
  }

  return (
    <div className="space-y-3.5">
      {/* Merchant: Profile section above tabs */}
      {isMerchant && <MerchantProfileSection />}

      {/* Tab Bar */}
      <PillTabs tabs={tabs} value={activeTab} onValueChange={handleTabChange} />

      {/* Tab Content */}
      {isMerchant ? (
        <MerchantTabContent activeTab={activeTab} />
      ) : (
        <AdminTabContent activeTab={activeTab} />
      )}
    </div>
  )
}

function AdminTabContent({ activeTab }: { activeTab: string }) {
  if (activeTab === 'security') {
    return <AdminSecurityTab />
  }
  if (activeTab === 'maintenance') {
    return <AdminMaintenanceTab />
  }

  const tabLabel = ADMIN_TABS.find(t => t.value === activeTab)?.label ?? activeTab
  return (
    <div className="flex items-center justify-center rounded-md border border-transparent dark:border-input bg-card p-12 shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{tabLabel} — Coming soon</p>
    </div>
  )
}

function MerchantTabContent({ activeTab }: { activeTab: string }) {
  if (activeTab === 'security') {
    return <MerchantSecurityTab />
  }
  if (activeTab === 'apiKeys') {
    return <MerchantApiKeysTab />
  }
  if (activeTab === 'settlementBank') {
    return <MerchantBankAccountTab />
  }
  if (activeTab === 'ipWhitelist') {
    return <MerchantIPWhitelistTab />
  }
  if (activeTab === 'webhooks') {
    return <MerchantWebhookTab />
  }
  const tabLabel = MERCHANT_TABS.find(t => t.value === activeTab)?.label ?? activeTab
  return (
    <div className="flex items-center justify-center rounded-md border border-transparent dark:border-input bg-card p-12 shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{tabLabel} — Coming soon</p>
    </div>
  )
}

function MerchantProfileSection() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading || !user) {
    return <ProfileSkeleton />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[10px] border border-table-row-border bg-card shadow-[0px_12px_32px_-8px_rgba(10,23,41,0.05)]">
        <div className="p-6">
          {/* Edit Profile button — absolute top-right */}
          {/* <button className="absolute right-6 top-6 h-[1.875rem] w-[8.375rem] rounded-md bg-table-header-bg text-sm capitalize text-muted-foreground transition-colors hover:bg-accent">
            Edit profile
          </button> */}

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            {/* Avatar */}
            <div className="flex h-[7.8125rem] w-[7.9375rem] shrink-0 items-center justify-center overflow-hidden rounded-md bg-status-teal/10">
              <AppIcon icon={User} color="green" className="size-16" />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3.5">
              <h2 className="text-2xl font-semibold capitalize text-foreground">{user.name}</h2>

              <div className="flex flex-wrap gap-x-16 gap-y-3.5">
                {/* Column 1: Email + Phone */}
                <div className="flex flex-col gap-3.5">
                  <InfoItem icon={Mail} value={user.email} />
                  <InfoItem icon={Phone} value={user.phone} />
                </div>

                {/* Column 2: DOB + Gender */}
                <div className="flex flex-col gap-3.5">
                  <InfoItem
                    icon={Calendar}
                    value={
                      user.dob
                        ? new Date(user.dob).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : undefined
                    }
                  />
                  <InfoItem
                    icon={
                      user.gender?.toLowerCase() === 'male'
                        ? Mars
                        : user.gender?.toLowerCase() === 'female'
                          ? Venus
                          : User
                    }
                    value={user.gender}
                  />
                </div>

                {/* Column 3: Address */}
                <div className="flex h-full items-start">
                  <div className="flex max-w-[22rem] items-center gap-3">
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-table-header-bg">
                      <AppIcon icon={BookUser} color="muted" />
                    </div>
                    <span className="max-w-[18rem] text-sm leading-normal text-muted-foreground">
                      {user.address || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  value,
  iconClassName,
}: {
  icon: LucideIcon
  value?: string
  iconClassName?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-table-header-bg">
        <AppIcon icon={Icon} color="muted" className={cn('size-5', iconClassName)} />
      </div>
      <span className="text-sm text-muted-foreground">{value || '-'}</span>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-32" />
      <div className="rounded-md border border-transparent dark:border-input p-6">
        <div className="flex gap-[1.6875rem]">
          <Skeleton className="h-[7.8125rem] w-[7.9375rem] rounded-md" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-16">
              <div className="flex flex-col gap-3.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex flex-col gap-3.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
