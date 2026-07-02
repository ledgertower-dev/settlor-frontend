'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/core/utils'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { Plus } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { formatDate } from '@/lib/core/format'
import { getErrorMessage } from '@/lib/api/error-handler'
import { DEFAULT_PAGINATION } from '@/lib/types/pagination.types'
import type { MaintenanceSchedule } from '../../types'
import { useMaintenanceSchedules, useDeleteMaintenanceSchedule } from '../../model/use-maintenance'
import { AddMaintenanceDrawer } from './AddMaintenanceDrawer'
import { ViewMaintenanceDrawer } from './ViewMaintenanceDrawer'

const cardClassName =
  'rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
] as const

export function AdminMaintenanceTab() {
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MaintenanceSchedule | null>(null)
  const [deleteItem, setDeleteItem] = useState<MaintenanceSchedule | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState<number>(DEFAULT_PAGINATION.page)
  const [perPage, setPerPage] = useState<number>(DEFAULT_PAGINATION.perPage)

  const queryParams = useMemo(
    () => ({
      page,
      per_page: perPage,
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [page, perPage, statusFilter],
  )

  const { data, isLoading } = useMaintenanceSchedules(queryParams)
  const deleteMutation = useDeleteMaintenanceSchedule()

  const items = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const handleDelete = () => {
    if (!deleteItem) return
    deleteMutation.mutate(deleteItem.id, {
      onSuccess: () => {
        toast.success('Maintenance schedule deleted successfully')
        setDeleteItem(null)
      },
      onError: error => toast.error(getErrorMessage(error)),
    })
  }

  const columns: ColumnDef<MaintenanceSchedule>[] = useMemo(
    () => [
      {
        key: 'ipAddress',
        header: 'IP Address',
        cell: row => <span className="text-sm">{row.ipAddress || '-'}</span>,
        skeletonWidth: 'w-24',
      },
      {
        key: 'name',
        header: 'Name',
        cell: row => row.name,
        skeletonWidth: 'w-24',
      },
      {
        key: 'description',
        header: 'Description',
        cell: row => row.description || '-',
        skeletonWidth: 'w-32',
      },
      {
        key: 'fromAt',
        header: 'From Date & Time',
        cell: row => formatDate(row.fromAt),
        skeletonWidth: 'w-36',
      },
      {
        key: 'toAt',
        header: 'To Date & Time',
        cell: row => formatDate(row.toAt),
        skeletonWidth: 'w-36',
      },
      {
        key: 'createdAt',
        header: 'Created At',
        cell: row => formatDate(row.createdAt),
        skeletonWidth: 'w-36',
      },
      {
        key: 'status',
        header: 'Status',

        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => <StatusBadge status={row.status} variant="plain" />,
        skeletonWidth: 'w-24',
      },
      {
        key: 'actions',
        header: 'Actions',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setSelectedItem(row)}
              className="w-[70px] rounded-md bg-button-bg py-1.5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              View
            </button>
            {row.status !== 'COMPLETED' && (
              <button
                onClick={() => setDeleteItem(row)}
                className="w-[70px] rounded-md border border-foreground/20 py-1.5 text-sm text-status-red transition-colors hover:bg-status-red/10"
              >
                Delete
              </button>
            )}
          </div>
        ),
        skeletonWidth: 'w-16',
      },
    ],
    [],
  )

  return (
    <div className={cardClassName}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Server maintenance</h3>
          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex h-12 items-center gap-2 rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
          >
            <AppIcon icon={Plus} color="primary-foreground" />
            Add Maintenance
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center w-fit rounded-full border border-transparent dark:border-input bg-muted p-1.5">
          {STATUS_TABS.map(tab => {
            const isActive = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value)
                  setPage(DEFAULT_PAGINATION.page)
                }}
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={items}
          rowKey={row => row.id}
          isLoading={isLoading}
          emptyMessage="No maintenance schedules found."
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />

        {/* Pagination */}
        {!isLoading && pagination && (
          <DataTablePagination
            pagination={pagination}
            onPageChange={setPage}
            onPerPageChange={v => {
              setPerPage(v)
              setPage(DEFAULT_PAGINATION.page)
            }}
            itemLabel="schedules"
          />
        )}
      </div>

      {/* Add Maintenance Drawer */}
      <AddMaintenanceDrawer open={showAddDrawer} onOpenChange={setShowAddDrawer} />

      {/* View/Edit Maintenance Drawer */}
      <ViewMaintenanceDrawer
        open={!!selectedItem}
        onOpenChange={open => {
          if (!open) setSelectedItem(null)
        }}
        schedule={selectedItem}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={open => {
          if (!open) setDeleteItem(null)
        }}
        title="Delete Maintenance Schedule"
        description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
