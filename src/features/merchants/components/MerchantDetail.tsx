'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import {
  BookUser,
  Calendar,
  Link as LinkIcon,
  type LucideIcon,
  Mail,
  Mars,
  Phone,
  Settings,
  Settings2,
  ShieldCheck,
  User,
  UserCheck,
  Venus,
} from 'lucide-react'
import { toast } from 'sonner'

import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'

import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

import { useMerchantDetail, useUpdateMerchantStatus } from '../model/use-merchants'
import { getErrorMessage } from '@/lib/api/error-handler'
import { useMerchantsUIStore } from '../model/merchants-ui-store'
import { useResourcePermissions } from '@/features/access/model'
import { usePermission } from '@/features/access/hooks/usePermission'
import { MerchantSecurityTab } from './MerchantSecurityTab'
import { MerchantUrlTab } from './MerchantUrlTab'
import { MerchantOverviewTab } from './MerchantOverviewTab'
import { MerchantProviderConfigTab } from './MerchantProviderConfigTab'
import { MerchantKycTab } from './MerchantKycTab'
import { MerchantSupportTab } from './MerchantSupportTab'

interface MerchantDetailProps {
  merchantId: string
}

const ALL_SUB_TABS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'overview', label: 'Details', icon: User },
  { value: 'kyc', label: 'KYC', icon: Settings },
  { value: 'providers', label: 'Provider Configuration', icon: Settings2 },
  { value: 'support', label: 'Support Member', icon: UserCheck },
  { value: 'security', label: 'Security', icon: ShieldCheck },
  { value: 'url', label: 'URL Settings', icon: LinkIcon },
]

const KYC_ONLY_TABS = new Set(['kyc'])

type SubTab = (typeof ALL_SUB_TABS)[number]['value']

export function MerchantDetail({ merchantId }: MerchantDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rolePath = useRolePath()
  const { data, isLoading, error } = useMerchantDetail(merchantId)
  const updateStatus = useUpdateMerchantStatus()
  const setTab = useMerchantsUIStore(s => s.setTab)
  const { canRead: canReadSupport } = useResourcePermissions('merchant-support')
  const { canRead: canReadKyc } = useResourcePermissions('kyc')
  const { canRead: canReadSettings, canUpdate: canUpdateSettings } =
    useResourcePermissions('merchant-settings')
  const canUpdateMerchant = usePermission('merchants:update')
  const [confirmAction, setConfirmAction] = useState<
    'approve' | 'reject' | 'block' | 'unblock' | null
  >(null)
  const [remarks, setRemarks] = useState('')

  const fromParam = searchParams.get('from')
  const urlTab = searchParams.get('tab') as SubTab | null
  const VALID_TABS = new Set(ALL_SUB_TABS.map(t => t.value))

  const [activeTab, setActiveTabState] = useState<SubTab>(() => {
    if (urlTab && VALID_TABS.has(urlTab)) return urlTab
    if (fromParam === 'new-request' || fromParam === 'pending') return 'kyc'
    return 'overview'
  })

  const setActiveTab = useCallback(
    (tab: SubTab) => {
      setActiveTabState(tab)
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  // Sync from URL changes
  useEffect(() => {
    if (urlTab && VALID_TABS.has(urlTab) && urlTab !== activeTab) {
      setActiveTabState(urlTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTab])

  const merchant = data?.data
  const showAllTabs = merchant?.status === 'ACTIVE' || merchant?.status === 'BLOCKED'
  const isKycOnly = fromParam === 'new-request' || fromParam === 'pending'
  const isRejected = merchant?.status === 'REJECTED'

  const visibleTabs = useMemo(() => {
    let tabs = isRejected
      ? []
      : showAllTabs
        ? ALL_SUB_TABS
        : isKycOnly
          ? ALL_SUB_TABS.filter(t => KYC_ONLY_TABS.has(t.value))
          : ALL_SUB_TABS
    if (!canReadSupport) tabs = tabs.filter(t => t.value !== 'support')
    if (!canReadKyc) tabs = tabs.filter(t => t.value !== 'kyc')
    if (!canReadSettings)
      tabs = tabs.filter(
        t =>
          t.value !== 'overview' &&
          t.value !== 'security' &&
          t.value !== 'url' &&
          t.value !== 'providers',
      )
    return tabs
  }, [showAllTabs, isKycOnly, isRejected, canReadSupport, canReadKyc, canReadSettings])

  // Fall back to first visible tab if active tab is no longer visible
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t.value === activeTab)) {
      setActiveTab(visibleTabs[0].value as SubTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabs, activeTab])

  const needsRemarks = confirmAction === 'reject' || confirmAction === 'block'

  const handleStatusUpdate = async () => {
    if (!merchant || !confirmAction) return
    if (needsRemarks && !remarks.trim()) return

    const statusMap = {
      approve: 'ACTIVE',
      reject: 'REJECTED',
      block: 'BLOCKED',
      unblock: 'ACTIVE',
    } as const
    const toastMap = {
      approve: 'Merchant approved successfully',
      reject: 'Merchant rejected successfully',
      block: 'Merchant blocked successfully',
      unblock: 'Merchant unblocked successfully',
    }

    try {
      await updateStatus.mutateAsync({
        id: merchant.id,
        status: statusMap[confirmAction],
        remarks: remarks.trim() || undefined,
      })
      toast.success(toastMap[confirmAction])
      const targetTab =
        confirmAction === 'approve'
          ? 'approved'
          : confirmAction === 'reject'
            ? 'rejected'
            : 'blocked'
      setTab(targetTab)
      router.push(rolePath(`/merchants?tab=${targetTab}`))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setConfirmAction(null)
      setRemarks('')
    }
  }

  const handleDialogClose = () => {
    setConfirmAction(null)
    setRemarks('')
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading || !merchant) {
    return <DetailSkeleton />
  }

  const showReject = merchant.status === 'PENDING'

  return (
    <div className="space-y-3.5">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-[10px] border border-table-row-border bg-card shadow-[0px_12px_32px_-8px_rgba(10,23,41,0.05)]">
        <div className="p-6">
          {/* Actions — absolute top-right */}
          {canUpdateMerchant && (
            <div className="absolute right-6 top-6 flex gap-2">
              {merchant.status === 'ACTIVE' && (
                <button
                  onClick={() => setConfirmAction('block')}
                  className="h-[1.875rem] w-[8.375rem] rounded-md bg-status-red/10 text-sm text-status-red transition-colors hover:bg-status-red/20"
                >
                  Block
                </button>
              )}
              {merchant.status === 'BLOCKED' && (
                <button
                  onClick={() => setConfirmAction('unblock')}
                  className="h-[1.875rem] w-[8.375rem] rounded-md bg-status-green/10 text-sm text-status-green transition-colors hover:bg-status-green/20"
                >
                  Unblock
                </button>
              )}
              {/* <button className="h-[1.875rem] w-[8.375rem] rounded-md bg-table-header-bg text-sm text-muted-foreground transition-colors hover:bg-accent">
                Edit
              </button> */}
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            {/* Avatar */}
            <div className="flex h-[7.8125rem] w-[7.9375rem] shrink-0 items-center justify-center overflow-hidden rounded-md bg-status-teal/10">
              <AppIcon icon={User} color="green" className="size-16" />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3.5">
              <h2 className="text-2xl font-semibold capitalize text-foreground">{merchant.name}</h2>

              <div className="flex flex-wrap gap-x-16 gap-y-3.5">
                {/* Column 1: Email + Phone */}
                <div className="flex flex-col gap-3.5">
                  <InfoItem icon={Mail} value={merchant.email} />
                  <InfoItem icon={Phone} value={merchant.phone} />
                </div>

                {/* Column 2: DOB + Gender */}
                <div className="flex flex-col gap-3.5">
                  <InfoItem
                    icon={Calendar}
                    value={
                      merchant.dob
                        ? new Date(merchant.dob).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : undefined
                    }
                  />
                  <InfoItem
                    icon={
                      merchant.gender?.toLowerCase() === 'male'
                        ? Mars
                        : merchant.gender?.toLowerCase() === 'female'
                          ? Venus
                          : User
                    }
                    value={merchant.gender}
                  />
                </div>

                {/* Column 3: Address */}
                <div className="flex h-full items-start">
                  <div className="flex max-w-[22rem] items-center gap-3">
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-table-header-bg">
                      <AppIcon icon={BookUser} color="muted" />
                    </div>
                    <span className="max-w-[18rem] text-sm leading-normal text-muted-foreground">
                      {merchant.address || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      {visibleTabs.length > 0 && (
        <div className="flex h-14 w-fit max-w-full items-center overflow-x-auto rounded-full border border-transparent dark:border-input bg-card p-1.5 shadow-[var(--shadow-card)]">
          {visibleTabs.map(tab => {
            const isActive = activeTab === tab.value
            const Icon = tab.icon
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-tab-active text-tab-active-foreground' : 'text-foreground',
                )}
              >
                <AppIcon
                  icon={Icon}
                  className={cn(
                    'size-5',
                    isActive ? 'text-tab-active-foreground' : 'text-muted-foreground',
                  )}
                />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && canReadSettings ? (
        <MerchantOverviewTab merchantId={merchantId} merchant={merchant} />
      ) : activeTab === 'kyc' && canReadKyc ? (
        <MerchantKycTab
          merchantId={merchantId}
          onRejectUser={
            showReject && canUpdateMerchant ? () => setConfirmAction('reject') : undefined
          }
        />
      ) : activeTab === 'providers' && canReadSettings ? (
        <MerchantProviderConfigTab merchantId={merchantId} />
      ) : activeTab === 'security' && canReadSettings ? (
        <MerchantSecurityTab merchantId={merchantId} />
      ) : activeTab === 'url' && canReadSettings ? (
        <MerchantUrlTab merchantId={merchantId} />
      ) : activeTab === 'support' && canReadSupport ? (
        <MerchantSupportTab merchantId={merchantId} />
      ) : null}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={open => {
          if (!open) handleDialogClose()
        }}
        title={
          confirmAction === 'approve'
            ? 'Approve Merchant'
            : confirmAction === 'reject'
              ? 'Reject Merchant'
              : confirmAction === 'block'
                ? 'Block Merchant'
                : 'Unblock Merchant'
        }
        description={
          confirmAction === 'approve'
            ? `Are you sure you want to approve ${merchant.name}? They will gain active merchant access.`
            : confirmAction === 'reject'
              ? `Are you sure you want to reject ${merchant.name}? Their account will be blocked.`
              : confirmAction === 'block'
                ? `Are you sure you want to block ${merchant.name}? They will lose access to their account.`
                : `Are you sure you want to unblock ${merchant.name}? They will regain access to their account.`
        }
        confirmLabel={
          confirmAction === 'approve'
            ? 'Approve'
            : confirmAction === 'reject'
              ? 'Reject'
              : confirmAction === 'block'
                ? 'Block'
                : 'Unblock'
        }
        pendingLabel="Processing..."
        variant={confirmAction === 'reject' || confirmAction === 'block' ? 'danger' : 'confirm'}
        isPending={updateStatus.isPending}
        confirmDisabled={needsRemarks && !remarks.trim()}
        onConfirm={handleStatusUpdate}
      >
        <Textarea
          placeholder={needsRemarks ? 'Remarks (required)' : 'Remarks (optional)'}
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          className="min-h-[5rem] resize-none border-foreground/40 bg-secondary text-sm"
        />
      </ConfirmDialog>
    </div>
  )
}

// --- Sub-components ---

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

function DetailSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="rounded-[10px] border border-table-row-border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
          <Skeleton className="h-[7.8125rem] w-[7.9375rem] rounded-md" />
          <div className="flex flex-col gap-3.5">
            <Skeleton className="h-7 w-48" />
            <div className="flex flex-wrap gap-x-16 gap-y-3.5">
              <div className="flex flex-col gap-3.5">
                <Skeleton className="h-[34px] w-52" />
                <Skeleton className="h-[34px] w-40" />
              </div>
              <div className="flex flex-col gap-3.5">
                <Skeleton className="h-[34px] w-36" />
                <Skeleton className="h-[34px] w-28" />
              </div>
              <Skeleton className="h-[34px] w-64" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-[3.875rem] w-fit min-w-[32rem] rounded-full" />
      <div className="space-y-4 rounded-[10px] bg-card p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-[13.75rem]" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}
