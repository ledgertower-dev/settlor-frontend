'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Download, Plus, Search } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

import { useResourcePermissions } from '@/features/access/model'
import { usePermissionError } from '@/lib/api/use-permission-error'
import { AccessDeniedAlert } from '@/components/shared/access-denied'
import { getErrorMessage } from '@/lib/api/error-handler'
import { formatDateTime } from '@/lib/core/format'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'

import {
  useBeneficiaries,
  useDeleteBeneficiary,
  useExportBeneficiariesCSV,
} from '../model/use-beneficiaries'
import {
  useBeneficiariesPaginationStore,
  useBeneficiariesModalStore,
} from '../model/beneficiaries-ui-store'
import type { Beneficiary } from '../types'
import { CreateBeneficiaryDrawer } from './CreateBeneficiaryDrawer'
import { BeneficiaryActions } from './BeneficiaryActions'

export function BeneficiariesList() {
  const { canCreate, canExport } = useResourcePermissions('beneficiaries')

  const { filters, setPage, setPerPage, setSearch } = useBeneficiariesPaginationStore()
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setSearch)

  const {
    showCreateDrawer,
    editBeneficiary,
    deleteTarget,
    openCreateDrawer,
    closeDrawer,
    closeDeleteConfirm,
  } = useBeneficiariesModalStore()

  const queryParams = useMemo(
    () => ({
      q: filters.search || undefined,
      page: filters.page,
      per_page: filters.perPage,
    }),
    [filters],
  )

  const { data, isLoading, isFetching, error } = useBeneficiaries(queryParams)
  const { isPermissionDenied, permissionMessage } = usePermissionError(error)

  const exportMutation = useExportBeneficiariesCSV()
  const deleteMutation = useDeleteBeneficiary()

  const beneficiaries = data?.data?.items ?? []
  const pagination = data?.meta?.pagination

  const handleExport = () => {
    exportMutation.mutate(undefined, {
      onSuccess: () => toast.success('CSV exported successfully'),
      onError: err => toast.error(getErrorMessage(err)),
    })
  }

  const columns: ColumnDef<Beneficiary>[] = useMemo(
    () => [
      {
        key: 'beneficiaryName',
        header: 'Beneficiary Name',
        skeletonWidth: 'w-36',
        cell: row => (
          <span className="text-sm font-medium text-foreground">{row.beneficiaryName}</span>
        ),
      },
      {
        key: 'accountNumber',
        header: 'Account Number',
        skeletonWidth: 'w-32',
        cell: row => <span className="text-sm">{row.accountNumber}</span>,
      },
      {
        key: 'ifsc',
        header: 'IFSC Code',
        skeletonWidth: 'w-24',
        cell: row => <span className="text-sm">{row.ifsc}</span>,
      },
      {
        key: 'bankName',
        header: 'Bank Name',
        skeletonWidth: 'w-32',
        cell: row => <span className="text-sm">{row.bankName}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        skeletonWidth: 'w-20',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        cell: row => <StatusBadge status={row.status} />,
      },
      {
        key: 'createdAt',
        header: 'Created At',
        skeletonWidth: 'w-20',
        cell: row => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.createdAt).date}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        skeletonWidth: 'w-8',
        headerClassName: 'text-center',
        cellClassName: 'text-center',
        width: '80px',
        noTruncate: true,
        cell: row => <BeneficiaryActions beneficiary={row} />,
      },
    ],
    [],
  )

  if (error && isPermissionDenied) {
    return (
      <div className="m-6">
        <AccessDeniedAlert message={permissionMessage} />
      </div>
    )
  }

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="flex flex-col gap-5">
        {/* Header Card */}
        <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 pb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-medium text-foreground">Beneficiary Management</h2>
              <p className="text-sm text-muted-foreground">
                Manage your saved bank beneficiaries for payout operations
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
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
              {canExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      disabled={exportMutation.isPending}
                      className="h-12 !px-5 gap-3.5 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
                    >
                      <AppIcon icon={Download} size="sm" color="primary-foreground" />
                      Export
                      <AppIcon icon={ChevronDown} size="sm" color="primary-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExport}>CSV</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {canCreate && (
                <Button
                  onClick={openCreateDrawer}
                  className="h-12 gap-3.5 bg-button-bg text-primary-foreground hover:bg-button-bg/90"
                >
                  <AppIcon icon={Plus} color="primary-foreground" />
                  Add Beneficiary
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-[10px] border border-transparent dark:border-input bg-card p-6 pb-8">
          <DataTable
            columns={columns}
            data={beneficiaries}
            rowKey={row => row.id}
            isLoading={isLoading || isFetching}
            loadingRows={filters.perPage}
            emptyMessage={
              filters.search
                ? 'No beneficiaries found matching your search.'
                : 'No beneficiaries found.'
            }
            containerClassName="border-0 shadow-none bg-transparent rounded-none"
          />

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="pt-6">
              <DataTablePagination
                pagination={pagination}
                onPageChange={setPage}
                onPerPageChange={pp => {
                  setPerPage(pp)
                  setPage(1)
                }}
                itemLabel="beneficiaries"
              />
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Drawer */}
      <CreateBeneficiaryDrawer
        open={showCreateDrawer}
        editBeneficiary={editBeneficiary}
        onOpenChange={open => {
          if (!open) closeDrawer()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) closeDeleteConfirm()
        }}
        title="Delete Beneficiary"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.beneficiaryName}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('Beneficiary deleted successfully')
              closeDeleteConfirm()
            },
            onError: err => toast.error(getErrorMessage(err)),
          })
        }}
      />
    </div>
  )
}
