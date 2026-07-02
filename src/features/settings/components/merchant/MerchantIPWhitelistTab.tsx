'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/core/utils'
import { Button } from '@/components/ui/button'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/core/format'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/api/error-handler'

import type { WhitelistIP } from '../../types'
import { useMeWhitelistIPs, useDeleteMeWhitelistIP } from '../../model/use-ip-whitelist'
import { AddIPWhitelistDrawer } from './AddIPWhitelistDrawer'
import { ViewIPWhitelistDrawer } from './ViewIPWhitelistDrawer'

const TYPE_LABELS: Record<string, string> = {
  PLATFORM: 'Platform',
  API_TRANSACTIONS: 'Transactions',
}

const STATUS_TABS = [
  { value: 'active', label: 'Active' },
  { value: 'requested', label: 'Requested' },
] as const

type StatusFilter = (typeof STATUS_TABS)[number]['value']

export function MerchantIPWhitelistTab() {
  const [status, setStatus] = useState<StatusFilter>('active')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [selectedIP, setSelectedIP] = useState<WhitelistIP | null>(null)
  const [deleteIP, setDeleteIP] = useState<WhitelistIP | null>(null)

  const deleteMutation = useDeleteMeWhitelistIP()

  const queryParams = useMemo(() => ({ page, per_page: perPage, status }), [page, perPage, status])

  const { data, isLoading, isFetching } = useMeWhitelistIPs(queryParams)

  const items = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const handleStatusChange = (newStatus: StatusFilter) => {
    setStatus(newStatus)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteIP) return
    try {
      await deleteMutation.mutateAsync(deleteIP.id)
      toast.success('Whitelist IP deleted successfully')
      setDeleteIP(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const columns: ColumnDef<WhitelistIP>[] = useMemo(
    () => [
      {
        key: 'ipAddress',
        header: 'IP Address',
        skeletonWidth: 'w-28',
        cell: row => <span className="text-sm">{row.ipAddress}</span>,
      },
      {
        key: 'type',
        header: 'Type',
        skeletonWidth: 'w-24',
        cell: row => <span className="text-sm">{TYPE_LABELS[row.type] ?? row.type}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        skeletonWidth: 'w-32',
        cell: row => <span className="text-sm">{row.description || '-'}</span>,
      },
      {
        key: 'createdAt',
        header: 'Created At',
        skeletonWidth: 'w-36',
        cell: row => <span className="text-sm">{formatDate(row.createdAt)}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        skeletonWidth: 'w-24',

        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => <StatusBadge status={row.status} variant="plain" />,
      },
      {
        key: 'actions',
        header: 'Actions',
        skeletonWidth: 'w-16',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => (
          <Button
            size="sm"
            className="bg-button-bg text-primary-foreground hover:bg-button-bg/90 rounded-md px-4 text-sm font-normal"
            onClick={() => setSelectedIP(row)}
          >
            View
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <div className="overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6">
      <div className="space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">IP Whitelist</h2>
          <button
            onClick={() => setShowAddDrawer(true)}
            className="h-12 w-[12.5rem] rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
          >
            Add
          </button>
        </div>

        {/* Sub-tabs: Active / Requested */}
        <div className="flex items-center w-fit rounded-full bg-muted p-1.5">
          {STATUS_TABS.map(tab => {
            const isActive = status === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-tab-active text-tab-active-foreground' : 'text-foreground',
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={items}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={perPage}
          emptyMessage="No whitelist IPs found."
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <DataTablePagination
            pagination={pagination}
            onPageChange={setPage}
            onPerPageChange={p => {
              setPerPage(p)
              setPage(1)
            }}
          />
        )}
      </div>

      {/* Add Drawer */}
      <AddIPWhitelistDrawer
        open={showAddDrawer}
        onOpenChange={setShowAddDrawer}
        onSuccess={() => {
          setStatus('requested')
          setPage(1)
        }}
      />

      {/* View/Edit Drawer */}
      <ViewIPWhitelistDrawer
        open={!!selectedIP}
        onOpenChange={open => {
          if (!open) setSelectedIP(null)
        }}
        whitelistIP={selectedIP}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteIP}
        onOpenChange={open => {
          if (!open) setDeleteIP(null)
        }}
        title="Delete Whitelist IP"
        description={`Are you sure you want to delete the IP "${deleteIP?.ipAddress}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
