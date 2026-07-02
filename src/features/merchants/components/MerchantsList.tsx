'use client'

import React, { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'

import { Check, Search } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { PillTabs } from '@/components/shared/pill-tabs'
import { ViewButton } from '@/components/shared/view-button'
import { RefreshButton } from '@/components/shared/refresh-button'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { usePermissionError } from '@/lib/api/use-permission-error'
import { AccessDeniedAlert } from '@/components/shared/access-denied'

import { formatINR } from '@/lib/core/format'
import { useRole } from '@/features/access/hooks/usePermission'
import { useMerchants } from '../model/use-merchants'
import { useMerchantsUIStore } from '../model/merchants-ui-store'
import { TAB_STATUS_MAP, TAB_KYC_STATUS_MAP } from '../types'
import type { MerchantTab, Merchant } from '../types'

// --- Tab config ---

const TABS: { value: MerchantTab; label: string }[] = [
  { value: 'approved', label: 'Approved' },
  { value: 'new-request', label: 'New Request' },
  { value: 'pending', label: 'Pending' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'rejected', label: 'Rejected' },
]

// --- Column definitions ---

function getApprovedColumns(
  onView: (id: string) => void,
  page: number,
  perPage: number,
): ColumnDef<Merchant>[] {
  return [
    {
      key: 'sno',
      header: 'S.No',
      cell: (_row, index) => (page - 1) * perPage + (index ?? 0) + 1,
      skeletonWidth: 'w-8',
      width: '60px',
    },
    {
      key: 'merchantId',
      header: 'Merchant ID',
      cell: row => <span className="text-sm">{row.code}</span>,
      skeletonWidth: 'w-32',
    },
    {
      key: 'name',
      header: 'Name',
      cell: row => (
        <div className="flex flex-col gap-1">
          <span className="capitalize">{row.name}</span>
          <span className="text-xs text-status-green">{row.email}</span>
        </div>
      ),
      skeletonWidth: 'w-28',
    },
    {
      key: 'service',
      header: 'Service',
      cell: row => {
        if (!row.primaryWallet) return '-'
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-full border border-status-green">
                <AppIcon icon={Check} color="green" stroke="bold" className="size-2.5" />
              </span>
              <span className="text-sm">Payout</span>
            </div>
            <span className="inline-flex h-5 w-fit items-center rounded-full border border-status-green/30 bg-status-green/10 px-4 text-xs text-status-green">
              {row.primaryWallet.providerCode}
            </span>
          </div>
        )
      },
      skeletonWidth: 'w-28',
    },
    {
      key: 'balance',
      header: 'Balance',
      cell: row => (row.balance != null ? formatINR(row.balance) : '-'),
      skeletonWidth: 'w-20',
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: row => <ViewButton onClick={() => onView(row.id)} />,
      skeletonWidth: 'w-20',
    },
  ]
}

function getRequestColumns(
  onView: (id: string) => void,
  page: number,
  perPage: number,
): ColumnDef<Merchant>[] {
  return [
    {
      key: 'sno',
      header: 'S.No',
      cell: (_row, index) => (page - 1) * perPage + (index ?? 0) + 1,
      skeletonWidth: 'w-8',
      width: '60px',
    },
    {
      key: 'name',
      header: 'Name',
      cell: row => <span className="capitalize">{row.name}</span>,
      skeletonWidth: 'w-28',
    },
    {
      key: 'email',
      header: 'Email',
      cell: row => row.email,
      skeletonWidth: 'w-40',
    },
    {
      key: 'mobile',
      header: 'Mobile Number',
      cell: row => row.phone ?? '-',
      skeletonWidth: 'w-28',
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: row => <ViewButton onClick={() => onView(row.id)} />,
      skeletonWidth: 'w-20',
    },
  ]
}

// --- Main component ---

const VALID_TABS = new Set<MerchantTab>([
  'approved',
  'new-request',
  'pending',
  'blocked',
  'rejected',
])

export function MerchantsList() {
  const router = useRouter()
  const rolePath = useRolePath()
  const searchParams = useSearchParams()
  const { filters, setTab, setSearch, setPage, setPerPage } = useMerchantsUIStore()
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setSearch)
  const isSupportMember = useRole('Support Member')
  const visibleTabs = useMemo(
    () => (isSupportMember ? TABS.filter(t => t.value === 'approved') : TABS),
    [isSupportMember],
  )

  const visibleTabValues = useMemo(() => new Set(visibleTabs.map(t => t.value)), [visibleTabs])

  // The URL (?tab=) is the single source of truth; the store mirrors it so the
  // query/page-reset follow. Falls back to the first accessible tab when the
  // URL tab is absent or not permitted. Driving both the store and the URL from
  // the click handler races the router's async URL update and snaps it back.
  const tabParam = searchParams.get('tab') as MerchantTab | null
  const activeTab: MerchantTab =
    tabParam && visibleTabValues.has(tabParam) ? tabParam : (visibleTabs[0]?.value ?? 'approved')

  useEffect(() => {
    if (activeTab !== filters.tab) setTab(activeTab)
  }, [activeTab, filters.tab, setTab])

  const handleTabChange = (tab: MerchantTab) => {
    if (tab === activeTab) return // no-op when the active tab is re-clicked
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const queryParams = useMemo(
    () => ({
      status: TAB_STATUS_MAP[filters.tab],
      kyc_status: TAB_KYC_STATUS_MAP[filters.tab],
      q: filters.search || undefined,
      page: filters.page,
      per_page: filters.perPage,
    }),
    [filters],
  )

  const { data, isLoading, isFetching, error, refetch } = useMerchants(queryParams)
  const { isPermissionDenied, permissionMessage } = usePermissionError(error)

  const merchants = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const handleView = (id: string) => {
    router.push(rolePath(`/merchants/${id}?from=${activeTab}`))
  }

  if (error && isPermissionDenied) {
    return (
      <div className="m-6">
        <AccessDeniedAlert message={permissionMessage} />
      </div>
    )
  }

  const columns =
    filters.tab === 'approved'
      ? getApprovedColumns(handleView, filters.page, filters.perPage)
      : getRequestColumns(handleView, filters.page, filters.perPage)

  return (
    <div className="space-y-5">
      <PillTabs tabs={visibleTabs} value={activeTab} onValueChange={handleTabChange} />

      {/* Table card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        {/* Title + Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Merchant List</h2>
            <p className="text-sm text-muted-foreground">Manage and view all merchants</p>
          </div>
          <div className="flex w-full items-center gap-3.5 sm:w-auto">
            <RefreshButton onRefresh={() => refetch()} isFetching={isFetching} />
            <label className="flex items-center gap-2 cursor-text rounded-[11px] bg-search-bg px-3.5 h-12 w-full sm:w-[280px]">
              <AppIcon icon={Search} size="sm" color="muted" />
              <input
                type="text"
                placeholder="Search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={merchants}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
          emptyMessage={
            filters.search
              ? 'No merchants found matching your search.'
              : filters.tab === 'approved'
                ? 'No approved merchants yet.'
                : 'No merchants in this category.'
          }
        />

        {/* Pagination */}
        {!isLoading && merchants.length > 0 && pagination && (
          <div className="mt-8">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              itemLabel="merchants"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// --- Shared sub-components ---
