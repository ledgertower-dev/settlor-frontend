'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/core/utils'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { DEFAULT_PAGINATION } from '@/lib/types/pagination.types'
import type { PaginationMeta } from '@/lib/types/pagination.types'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

import { settingsApiService } from '../../api/settings.api'
import type { WhitelistBankAccount } from '../../types'
import type { BankAccountFormData } from '../../schemas/bank-account.schema'
import { AddBankAccountDrawer } from '../shared/AddBankAccountDrawer'
import { getErrorMessage } from '@/lib/api/error-handler'

const STATUS_ICON_COLOR: Record<string, string> = {
  APPROVED: 'text-status-green',
  ACTIVE: 'text-status-green',
  REJECTED: 'text-status-red',
  PENDING: 'text-status-orange',
  ARCHIVED: 'text-status-dark',
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS: 'Savings',
  CURRENT: 'Current',
}

function getColumns(
  onEdit: (account: WhitelistBankAccount) => void,
  onDelete: (account: WhitelistBankAccount) => void,
): ColumnDef<WhitelistBankAccount>[] {
  return [
    {
      key: 'bankName',
      header: 'Bank Name',
      cell: row => row.bankName,
      skeletonWidth: 'w-36',
    },
    {
      key: 'accountHolderName',
      header: 'Account Name',
      cell: row => row.accountHolderName,
      skeletonWidth: 'w-28',
    },
    {
      key: 'accountNumber',
      header: 'Account Number',
      cell: row => row.accountNumber,
      skeletonWidth: 'w-28',
    },
    {
      key: 'ifsc',
      header: 'IFSC',
      cell: row => row.ifsc,
      skeletonWidth: 'w-24',
    },
    {
      key: 'accountType',
      header: 'Account Type',
      cell: row => ACCOUNT_TYPE_LABELS[row.accountType] ?? row.accountType,
      skeletonWidth: 'w-20',
    },
    {
      key: 'status',
      header: 'Status',

      cell: row => {
        const hasRemarks = row.rejectionReason || row.approvalRemarks
        if (!hasRemarks) return <StatusBadge status={row.status} variant="plain" />
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-fit cursor-help items-center gap-1.5">
                <StatusBadge status={row.status} variant="plain" />
                <AppIcon
                  icon={Info}
                  className={cn(
                    'size-5 shrink-0',
                    STATUS_ICON_COLOR[row.status] ?? 'text-muted-foreground',
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64">
              {row.rejectionReason && <p>Reason: {row.rejectionReason}</p>}
              {row.approvalRemarks && <p>Remarks: {row.approvalRemarks}</p>}
            </TooltipContent>
          </Tooltip>
        )
      },
      skeletonWidth: 'w-20',
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: row => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={e => {
              e.stopPropagation()
              onEdit(row)
            }}
            className="w-[70px] rounded-md bg-button-bg py-1.5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
          >
            Edit
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              onDelete(row)
            }}
            className="w-[70px] rounded-md border border-foreground/20 py-1.5 text-sm text-status-red transition-colors hover:bg-status-red/10"
          >
            Delete
          </button>
        </div>
      ),
      skeletonWidth: 'w-36',
    },
  ]
}

const cardClassName =
  'overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6'

export function MerchantBankAccountTab() {
  const [accounts, setAccounts] = useState<WhitelistBankAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDrawer, setShowDrawer] = useState(false)
  const [editingAccount, setEditingAccount] = useState<WhitelistBankAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<WhitelistBankAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState<number>(DEFAULT_PAGINATION.page)
  const [perPage, setPerPage] = useState<number>(DEFAULT_PAGINATION.perPage)
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)

  const fetchAccounts = useCallback(
    async (fetchPage = page, fetchPerPage = perPage) => {
      try {
        setIsLoading(true)
        const result = await settingsApiService.getWhitelistBankAccounts({
          page: fetchPage,
          per_page: fetchPerPage,
        })
        setAccounts(result.data.items)
        setPaginationMeta(result.meta.pagination)
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    },
    [page, perPage],
  )

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleAdd = async (data: BankAccountFormData) => {
    try {
      await settingsApiService.createWhitelistBankAccount({
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifsc: data.ifsc,
        accountType: data.accountType,
      })
      toast.success('Bank account added successfully')
      fetchAccounts()
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw new Error('Failed to add bank account')
    }
  }

  const handleEdit = async (data: BankAccountFormData) => {
    if (!editingAccount) return
    try {
      await settingsApiService.updateWhitelistBankAccount(editingAccount.id, {
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifsc: data.ifsc,
        accountType: data.accountType,
      })
      toast.success('Bank account updated successfully')
      setEditingAccount(null)
      fetchAccounts()
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw new Error('Failed to update bank account')
    }
  }

  const handleDelete = async () => {
    if (!deletingAccount) return
    try {
      setIsDeleting(true)
      await settingsApiService.deleteWhitelistBankAccount(deletingAccount.id)
      toast.success('Bank account deleted successfully')
      setDeletingAccount(null)
      fetchAccounts()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const drawerDefaultValues = editingAccount
    ? {
        bankName: editingAccount.bankName,
        accountHolderName: editingAccount.accountHolderName,
        accountNumber: editingAccount.accountNumber,
        ifsc: editingAccount.ifsc,
        accountType: editingAccount.accountType as 'SAVINGS' | 'CURRENT',
      }
    : undefined

  return (
    <div className={cardClassName}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg text-foreground">Whitelist Bank Account</h3>
        <button
          onClick={() => setShowDrawer(true)}
          className="h-12 w-[12.5rem] rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
        >
          Add Bank Account
        </button>
      </div>

      <div className="mt-8">
        <DataTable
          columns={getColumns(
            account => setEditingAccount(account),
            account => setDeletingAccount(account),
          )}
          data={accounts}
          rowKey={row => row.id}
          isLoading={isLoading}
          emptyMessage="No bank accounts found"
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
        />
      </div>

      {!isLoading && paginationMeta && (
        <div className="mt-4">
          <DataTablePagination
            pagination={paginationMeta}
            onPageChange={newPage => {
              setPage(newPage)
              fetchAccounts(newPage, perPage)
            }}
            onPerPageChange={v => {
              setPerPage(v)
              setPage(DEFAULT_PAGINATION.page)
              fetchAccounts(DEFAULT_PAGINATION.page, v)
            }}
            itemLabel="accounts"
          />
        </div>
      )}

      {/* Add drawer */}
      <AddBankAccountDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        title="Add Your Bank Account"
        onSubmit={handleAdd}
      />

      {/* Edit drawer */}
      <AddBankAccountDrawer
        open={!!editingAccount}
        onOpenChange={open => {
          if (!open) setEditingAccount(null)
        }}
        title="Edit Bank Account"
        onSubmit={handleEdit}
        defaultValues={drawerDefaultValues}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingAccount}
        onOpenChange={open => {
          if (!open) setDeletingAccount(null)
        }}
        title="Delete Bank Account"
        description={`Are you sure you want to delete the bank account "${deletingAccount?.bankName}" (${deletingAccount?.accountNumber})? This action cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="danger"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
