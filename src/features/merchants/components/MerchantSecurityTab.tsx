'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Check, EllipsisVertical, Eye, EyeOff, Info, Power, PowerOff, X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { cn } from '@/lib/core/utils'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import type { WhitelistIP, WhitelistBankAccount } from '../types/merchant-security.types'
import {
  useSecuritySettings,
  useWhitelistIPs,
  useSwitchWhitelistIP,
  useSwitch2FA,
  useResetPassword,
  useDeleteWhitelistIP,
  useUpdateWhitelistIPStatus,
  useBankAccounts,
  useArchiveBankAccount,
  useUpdateBankAccountStatus,
} from '../model/use-merchant-security'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '../schemas/merchant-security.schema'
import { AddWhitelistIPDrawer } from './AddWhitelistIPDrawer'
import { ViewWhitelistIPDrawer } from './ViewWhitelistIPDrawer'
import { AddWhitelistAccountDrawer } from './AddWhitelistAccountDrawer'
import { ViewWhitelistAccountDrawer } from './ViewWhitelistAccountDrawer'
import { getErrorMessage } from '@/lib/api/error-handler'
import { usePermission } from '@/features/access/hooks/usePermission'
import { DEFAULT_PAGINATION } from '@/lib/types/pagination.types'
import { formatDate } from '@/lib/core/format'

interface MerchantSecurityTabProps {
  merchantId: string
}

const cardClassName =
  'overflow-hidden rounded-md border border-transparent dark:border-input bg-card p-6'

const whitelistTypeLabels: Record<string, string> = {
  PLATFORM: 'Platform',
  API_TRANSACTIONS: 'Transactions',
}

// --- Column definitions ---

function getIPColumns(
  onView: (row: WhitelistIP) => void,
  onDelete: (row: WhitelistIP) => void,
  onApprove: (row: WhitelistIP) => void,
  onReject: (row: WhitelistIP) => void,
  canUpdate: boolean,
): ColumnDef<WhitelistIP>[] {
  return [
    {
      key: 'ipAddress',
      header: 'IP Address',
      cell: row => row.ipAddress,
      skeletonWidth: 'w-28',
    },
    {
      key: 'type',
      header: 'Type',
      cell: row => whitelistTypeLabels[row.type] ?? row.type,
      skeletonWidth: 'w-24',
    },
    {
      key: 'description',
      header: 'Description',
      cell: row => row.description,
      skeletonWidth: 'w-32',
    },
    {
      key: 'createdAt',
      header: 'Created At',
      cell: row => formatDate(row.createdAt),
      skeletonWidth: 'w-24',
    },
    {
      key: 'status',
      header: 'Status',
      cell: row => <StatusBadge status={row.status} variant="plain" />,
      skeletonWidth: 'w-20',
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: row => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onView(row)}
            className="w-[70px] rounded-md bg-button-bg py-1.5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
          >
            View
          </button>
          {canUpdate && row.status === 'PENDING' && (
            <>
              <button
                onClick={() => onApprove(row)}
                aria-label="Approve IP whitelist request"
                className="flex size-8 items-center justify-center rounded-md border border-foreground/20 text-status-green transition-colors hover:bg-status-green/10"
              >
                <AppIcon icon={Check} color="green" stroke="bold" />
              </button>
              <button
                onClick={() => onReject(row)}
                aria-label="Reject IP whitelist request"
                className="flex size-8 items-center justify-center rounded-md border border-foreground/20 transition-colors hover:bg-status-red/10"
              >
                <AppIcon icon={X} color="red" stroke="bold" />
              </button>
            </>
          )}
          {canUpdate && row.status !== 'PENDING' && (
            <button
              onClick={() => onDelete(row)}
              className="w-[70px] rounded-md border border-foreground/20 py-1.5 text-sm text-status-red transition-colors hover:bg-status-red/10"
            >
              Delete
            </button>
          )}
        </div>
      ),
      skeletonWidth: 'w-20',
    },
  ]
}

function getAccountColumns(
  onView: (row: WhitelistBankAccount) => void,
  onDisable: (row: WhitelistBankAccount) => void,
  onEnable: (row: WhitelistBankAccount) => void,
  onApprove: (row: WhitelistBankAccount) => void,
  onReject: (row: WhitelistBankAccount) => void,
  isArchivedTab: boolean,
  canUpdate: boolean,
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
      cell: row => row.accountType,
      skeletonWidth: 'w-20',
    },
    {
      key: 'status',
      header: 'Status',
      cell: row => <StatusBadge status={row.status} variant="plain" />,
      skeletonWidth: 'w-20',
    },
    {
      key: 'action',
      header: 'Action',
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      cell: row => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Open whitelist account actions menu"
                className="flex h-8 w-10 items-center justify-center rounded-md bg-accent text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
                onClick={e => e.stopPropagation()}
              >
                <AppIcon icon={EllipsisVertical} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] rounded-[10px] p-2.5 space-y-0">
              <DropdownMenuItem icon={Eye} showBorder={canUpdate} onClick={() => onView(row)}>
                View
              </DropdownMenuItem>

              {canUpdate && row.status === 'PENDING' && (
                <>
                  <DropdownMenuItem
                    icon={Check}
                    iconBg="bg-status-green/10"
                    iconColor="text-status-green"
                    showBorder
                    onClick={() => onApprove(row)}
                  >
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    icon={X}
                    iconBg="bg-status-red/10"
                    iconColor="text-status-red"
                    onClick={() => onReject(row)}
                  >
                    Reject
                  </DropdownMenuItem>
                </>
              )}

              {canUpdate && row.status !== 'PENDING' && isArchivedTab && (
                <DropdownMenuItem
                  icon={Power}
                  iconBg="bg-status-green/10"
                  iconColor="text-status-green"
                  onClick={() => onEnable(row)}
                >
                  Enable
                </DropdownMenuItem>
              )}

              {canUpdate && row.status !== 'PENDING' && !isArchivedTab && (
                <DropdownMenuItem
                  icon={PowerOff}
                  iconBg="bg-status-red/10"
                  iconColor="text-status-red"
                  onClick={() => onDisable(row)}
                >
                  Disable
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      skeletonWidth: 'w-20',
    },
  ]
}

export function MerchantSecurityTab({ merchantId }: MerchantSecurityTabProps) {
  const canUpdate = usePermission('merchants:settings:update')

  // Security settings
  const securityQuery = useSecuritySettings(merchantId)

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const twoFAMutation = useSwitch2FA()

  /* eslint-disable react-hooks/set-state-in-effect -- sync server data to local toggle state */
  useEffect(() => {
    if (securityQuery.data) {
      setTwoFAEnabled(securityQuery.data.twoFactorEnabled)
    }
  }, [securityQuery.data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handle2FASwitch = (enabled: boolean) => {
    setTwoFAEnabled(enabled)
    twoFAMutation.mutate(
      { merchantId, enabled },
      {
        onError: error => {
          setTwoFAEnabled(!enabled)
          toast.error(getErrorMessage(error))
        },
      },
    )
  }

  // IP Whitelisting state
  const [ipPage, setIpPage] = useState<number>(DEFAULT_PAGINATION.page)
  const [ipPerPage, setIpPerPage] = useState<number>(DEFAULT_PAGINATION.perPage)
  const [ipEnabled, setIPEnabled] = useState<boolean | null>(null)
  const [showIPDrawer, setShowIPDrawer] = useState(false)
  const [selectedIP, setSelectedIP] = useState<WhitelistIP | null>(null)
  const [deleteIP, setDeleteIP] = useState<WhitelistIP | null>(null)
  const whitelistIPsQuery = useWhitelistIPs(merchantId, {
    page: ipPage,
    per_page: ipPerPage,
  })
  const switchMutation = useSwitchWhitelistIP()
  const deleteIPMutation = useDeleteWhitelistIP()

  /* eslint-disable react-hooks/set-state-in-effect -- sync server data to local toggle state */
  useEffect(() => {
    if (whitelistIPsQuery.data) {
      setIPEnabled(whitelistIPsQuery.data.ipWhitelistEnabled)
    }
  }, [whitelistIPsQuery.data])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleIPSwitch = (enabled: boolean) => {
    setIPEnabled(enabled)
    switchMutation.mutate(
      { merchantId, enabled },
      {
        onError: error => {
          setIPEnabled(!enabled)
          toast.error(getErrorMessage(error))
        },
      },
    )
  }

  const handleDeleteIP = () => {
    if (!deleteIP) return
    deleteIPMutation.mutate(
      { merchantId, whitelistId: deleteIP.id },
      {
        onSuccess: () => {
          toast.success('Whitelist IP deleted successfully')
          setDeleteIP(null)
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  // Approve / Reject IP whitelist
  const [approveIP, setApproveIP] = useState<WhitelistIP | null>(null)
  const [approvalIPRemarks, setApprovalIPRemarks] = useState('')
  const [rejectIP, setRejectIP] = useState<WhitelistIP | null>(null)
  const [rejectionIPReason, setRejectionIPReason] = useState('')
  const ipStatusMutation = useUpdateWhitelistIPStatus()

  const handleApproveIP = () => {
    if (!approveIP || !approvalIPRemarks.trim()) return
    ipStatusMutation.mutate(
      {
        merchantId,
        whitelistId: approveIP.id,
        data: { status: 'APPROVED', approval_remarks: approvalIPRemarks.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Whitelist IP approved successfully')
          setApproveIP(null)
          setApprovalIPRemarks('')
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const handleRejectIP = () => {
    if (!rejectIP || !rejectionIPReason.trim()) return
    ipStatusMutation.mutate(
      {
        merchantId,
        whitelistId: rejectIP.id,
        data: { status: 'REJECTED', rejection_reason: rejectionIPReason.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Whitelist IP rejected')
          setRejectIP(null)
          setRejectionIPReason('')
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  // Whitelist Account state
  const [accountPage, setAccountPage] = useState<number>(DEFAULT_PAGINATION.page)
  const [accountPerPage, setAccountPerPage] = useState<number>(DEFAULT_PAGINATION.perPage)
  const [accountTab, setAccountTab] = useState<'active' | 'archived'>('active')
  const [showAccountDrawer, setShowAccountDrawer] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<WhitelistBankAccount | null>(null)
  const [disableAccount, setDisableAccount] = useState<WhitelistBankAccount | null>(null)
  const bankAccountsQuery = useBankAccounts(merchantId, accountTab, {
    page: accountPage,
    per_page: accountPerPage,
  })
  const archiveMutation = useArchiveBankAccount()

  const handleDisableAccount = () => {
    if (!disableAccount) return
    archiveMutation.mutate(
      { merchantId, bankAccountId: disableAccount.id, archived: true },
      {
        onSuccess: () => {
          toast.success('Bank account disabled successfully')
          setDisableAccount(null)
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const [enableAccount, setEnableAccount] = useState<WhitelistBankAccount | null>(null)

  const handleEnableAccount = () => {
    if (!enableAccount) return
    archiveMutation.mutate(
      { merchantId, bankAccountId: enableAccount.id, archived: false },
      {
        onSuccess: () => {
          toast.success('Bank account enabled successfully')
          setEnableAccount(null)
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  // Approve / Reject bank account
  const [approveAccount, setApproveAccount] = useState<WhitelistBankAccount | null>(null)
  const [approvalRemarks, setApprovalRemarks] = useState('')
  const [rejectAccount, setRejectAccount] = useState<WhitelistBankAccount | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const statusMutation = useUpdateBankAccountStatus()

  const handleApproveAccount = () => {
    if (!approveAccount || !approvalRemarks.trim()) return
    statusMutation.mutate(
      {
        merchantId,
        bankAccountId: approveAccount.id,
        data: { status: 'APPROVED', approval_remarks: approvalRemarks.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Bank account approved successfully')
          setApproveAccount(null)
          setApprovalRemarks('')
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  const handleRejectAccount = () => {
    if (!rejectAccount || !rejectionReason.trim()) return
    statusMutation.mutate(
      {
        merchantId,
        bankAccountId: rejectAccount.id,
        data: { status: 'REJECTED', rejection_reason: rejectionReason.trim() },
      },
      {
        onSuccess: () => {
          toast.success('Bank account rejected')
          setRejectAccount(null)
          setRejectionReason('')
        },
        onError: error => toast.error(getErrorMessage(error)),
      },
    )
  }

  return (
    <div className="space-y-3.5">
      {/* Card 1: Two-factor authentication */}
      <div className={cardClassName}>
        <h3 className="text-lg text-foreground">Two-factor authentication</h3>
        <div className="mt-4 flex items-center gap-6">
          <span className="text-sm text-foreground">
            Enable 2FA for login and payout transactions
          </span>
          <Switch
            checked={twoFAEnabled}
            onCheckedChange={handle2FASwitch}
            disabled={!canUpdate || twoFAMutation.isPending}
            size="lg"
            variant="green"
          />
        </div>
      </div>

      {/* Card 2: Reset Password */}
      {canUpdate && <ResetPasswordCard merchantId={merchantId} />}

      {/* Card 3: IP Whitelisting */}
      <div className={cardClassName}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <h3 className="text-lg text-foreground">IP Whitelisting</h3>
            {canUpdate && (
              <Switch
                checked={ipEnabled ?? false}
                onCheckedChange={handleIPSwitch}
                disabled={switchMutation.isPending}
                size="lg"
                variant="green"
              />
            )}
          </div>
          {canUpdate && (
            <button
              onClick={() => setShowIPDrawer(true)}
              className="h-[2.625rem] w-full sm:w-[7.5rem] rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              Add
            </button>
          )}
        </div>

        <div className="mt-8">
          <DataTable
            columns={getIPColumns(setSelectedIP, setDeleteIP, setApproveIP, setRejectIP, canUpdate)}
            data={whitelistIPsQuery.data?.items ?? []}
            rowKey={row => row.id}
            isLoading={whitelistIPsQuery.isLoading}
            emptyMessage="No whitelist IPs found"
            containerClassName="border-0 shadow-none bg-transparent rounded-none"
          />
        </div>

        {!whitelistIPsQuery.isLoading &&
          whitelistIPsQuery.data?.pagination &&
          whitelistIPsQuery.data.pagination.total > 0 && (
            <div className="mt-4">
              <DataTablePagination
                pagination={whitelistIPsQuery.data.pagination}
                onPageChange={setIpPage}
                onPerPageChange={v => {
                  setIpPerPage(v)
                  setIpPage(DEFAULT_PAGINATION.page)
                }}
                itemLabel="IPs"
              />
            </div>
          )}
      </div>

      {/* Card 4: Whitelist Account (for deposit) */}
      <div className={cardClassName}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg text-foreground">Whitelist Account (for deposit)</h3>
          {canUpdate && (
            <button
              onClick={() => setShowAccountDrawer(true)}
              className="h-[2.625rem] w-full sm:w-[12.5rem] rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90"
            >
              Add whitelist account
            </button>
          )}
        </div>

        {/* Sub-tabs */}
        <div className="mt-6 flex items-center w-fit rounded-full bg-muted p-1.5">
          <button
            onClick={() => {
              setAccountTab('active')
              setAccountPage(DEFAULT_PAGINATION.page)
            }}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2.5 text-sm transition-colors',
              accountTab === 'active'
                ? 'bg-tab-active text-tab-active-foreground'
                : 'text-foreground',
            )}
          >
            Active
          </button>
          <button
            onClick={() => {
              setAccountTab('archived')
              setAccountPage(DEFAULT_PAGINATION.page)
            }}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-2.5 text-sm transition-colors',
              accountTab === 'archived'
                ? 'bg-tab-active text-tab-active-foreground'
                : 'text-foreground',
            )}
          >
            Archived
          </button>
        </div>

        <div className="mt-6">
          <DataTable
            columns={getAccountColumns(
              setSelectedAccount,
              setDisableAccount,
              setEnableAccount,
              setApproveAccount,
              setRejectAccount,
              accountTab === 'archived',
              canUpdate,
            )}
            data={bankAccountsQuery.data?.data?.items ?? []}
            rowKey={row => row.id}
            isLoading={bankAccountsQuery.isLoading}
            emptyMessage={`No ${accountTab} accounts found`}
            containerClassName="border-0 shadow-none bg-transparent rounded-none"
          />
        </div>

        {!bankAccountsQuery.isLoading &&
          bankAccountsQuery.data?.meta?.pagination &&
          bankAccountsQuery.data.meta.pagination.total > 0 && (
            <div className="mt-4">
              <DataTablePagination
                pagination={bankAccountsQuery.data.meta.pagination}
                onPageChange={setAccountPage}
                onPerPageChange={v => {
                  setAccountPerPage(v)
                  setAccountPage(DEFAULT_PAGINATION.page)
                }}
                itemLabel="accounts"
              />
            </div>
          )}
      </div>

      {/* Drawers */}
      <AddWhitelistIPDrawer
        open={showIPDrawer}
        onOpenChange={setShowIPDrawer}
        merchantId={merchantId}
      />
      <ViewWhitelistIPDrawer
        open={!!selectedIP}
        onOpenChange={open => {
          if (!open) setSelectedIP(null)
        }}
        merchantId={merchantId}
        whitelistIP={selectedIP}
      />
      <AddWhitelistAccountDrawer
        open={showAccountDrawer}
        onOpenChange={setShowAccountDrawer}
        merchantId={merchantId}
      />
      <ViewWhitelistAccountDrawer
        open={!!selectedAccount}
        onOpenChange={open => {
          if (!open) setSelectedAccount(null)
        }}
        merchantId={merchantId}
        account={selectedAccount}
      />

      {/* Delete IP Confirmation */}
      <ConfirmDialog
        open={!!deleteIP}
        onOpenChange={open => {
          if (!open) setDeleteIP(null)
        }}
        title="Delete Whitelist IP"
        description={`Are you sure you want to delete the IP address "${deleteIP?.ipAddress}"? This action cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="danger"
        isPending={deleteIPMutation.isPending}
        onConfirm={handleDeleteIP}
      />

      {/* Approve IP Whitelist Confirmation */}
      <ConfirmDialog
        open={!!approveIP}
        onOpenChange={open => {
          if (!open) {
            setApproveIP(null)
            setApprovalIPRemarks('')
          }
        }}
        title="Approve Whitelist IP"
        description={`Are you sure you want to approve the IP address "${approveIP?.ipAddress}"?`}
        confirmLabel="Approve"
        pendingLabel="Approving..."
        variant="confirm"
        isPending={ipStatusMutation.isPending}
        confirmDisabled={!approvalIPRemarks.trim()}
        onConfirm={handleApproveIP}
      >
        <div>
          <label
            htmlFor="ip-approval-remarks"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Approval Remarks <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="ip-approval-remarks"
            placeholder="Enter remarks for approval"
            value={approvalIPRemarks}
            onChange={e => setApprovalIPRemarks(e.target.value)}
            disabled={ipStatusMutation.isPending}
            className="min-h-[80px] resize-none border-foreground/40 bg-secondary"
          />
        </div>
      </ConfirmDialog>

      {/* Reject IP Whitelist Confirmation */}
      <ConfirmDialog
        open={!!rejectIP}
        onOpenChange={open => {
          if (!open) {
            setRejectIP(null)
            setRejectionIPReason('')
          }
        }}
        title="Reject Whitelist IP"
        description={`Are you sure you want to reject the IP address "${rejectIP?.ipAddress}"?`}
        confirmLabel="Reject"
        pendingLabel="Rejecting..."
        variant="danger"
        isPending={ipStatusMutation.isPending}
        confirmDisabled={!rejectionIPReason.trim()}
        onConfirm={handleRejectIP}
      >
        <div>
          <label
            htmlFor="ip-rejection-reason"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Rejection Reason <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="ip-rejection-reason"
            placeholder="Enter reason for rejection"
            value={rejectionIPReason}
            onChange={e => setRejectionIPReason(e.target.value)}
            disabled={ipStatusMutation.isPending}
            className="min-h-[80px] resize-none border-foreground/40 bg-secondary"
          />
        </div>
      </ConfirmDialog>

      {/* Disable Bank Account Confirmation */}
      <ConfirmDialog
        open={!!disableAccount}
        onOpenChange={open => {
          if (!open) setDisableAccount(null)
        }}
        title="Disable Bank Account"
        description={`Are you sure you want to disable the bank account "${disableAccount?.accountHolderName} - ${disableAccount?.bankName}"? The account will be archived.`}
        confirmLabel="Disable"
        pendingLabel="Disabling..."
        variant="danger"
        isPending={archiveMutation.isPending}
        onConfirm={handleDisableAccount}
      />

      {/* Enable Bank Account Confirmation */}
      <ConfirmDialog
        open={!!enableAccount}
        onOpenChange={open => {
          if (!open) setEnableAccount(null)
        }}
        title="Enable Bank Account"
        description={`Are you sure you want to enable the bank account "${enableAccount?.accountHolderName} - ${enableAccount?.bankName}"? The account will be activated.`}
        confirmLabel="Enable"
        pendingLabel="Enabling..."
        variant="success"
        isPending={archiveMutation.isPending}
        onConfirm={handleEnableAccount}
      />

      {/* Approve Bank Account Confirmation */}
      <ConfirmDialog
        open={!!approveAccount}
        onOpenChange={open => {
          if (!open) {
            setApproveAccount(null)
            setApprovalRemarks('')
          }
        }}
        title="Approve Bank Account"
        description={`Are you sure you want to approve the bank account "${approveAccount?.accountHolderName} - ${approveAccount?.bankName}"?`}
        confirmLabel="Approve"
        pendingLabel="Approving..."
        variant="confirm"
        isPending={statusMutation.isPending}
        confirmDisabled={!approvalRemarks.trim()}
        onConfirm={handleApproveAccount}
      >
        <div>
          <label
            htmlFor="approval-remarks"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Approval Remarks <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="approval-remarks"
            placeholder="Enter remarks for approval"
            value={approvalRemarks}
            onChange={e => setApprovalRemarks(e.target.value)}
            disabled={statusMutation.isPending}
            className="min-h-[80px] resize-none border-foreground/40 bg-secondary"
          />
        </div>
      </ConfirmDialog>

      {/* Reject Bank Account Confirmation */}
      <ConfirmDialog
        open={!!rejectAccount}
        onOpenChange={open => {
          if (!open) {
            setRejectAccount(null)
            setRejectionReason('')
          }
        }}
        title="Reject Bank Account"
        description={`Are you sure you want to reject the bank account "${rejectAccount?.accountHolderName} - ${rejectAccount?.bankName}"?`}
        confirmLabel="Reject"
        pendingLabel="Rejecting..."
        variant="danger"
        isPending={statusMutation.isPending}
        confirmDisabled={!rejectionReason.trim()}
        onConfirm={handleRejectAccount}
      >
        <div>
          <label
            htmlFor="rejection-reason"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Rejection Reason <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="rejection-reason"
            placeholder="Enter reason for rejection"
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            disabled={statusMutation.isPending}
            className="min-h-[80px] resize-none border-foreground/40 bg-secondary"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}

// --- Sub-components ---

function ResetPasswordCard({ merchantId }: { merchantId: string }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const resetPasswordMutation = useResetPassword()

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPasswordMutation.mutateAsync({
        merchantId,
        newPassword: data.password,
      })
      toast.success('Password reset successfully')
      form.reset()
      setShowPassword(false)
      setShowConfirmPassword(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleCancel = () => {
    form.reset()
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const isPending = resetPasswordMutation.isPending

  return (
    <div className={cardClassName}>
      <h3 className="text-lg text-foreground">Reset Password</h3>

      <div className="mt-5 space-y-6">
        {/* Info banner */}
        <div className="flex items-center gap-3.5 rounded-[4px] bg-secondary p-3.5">
          <AppIcon icon={Info} color="muted" />
          <span className="text-sm text-muted-foreground">
            After reset, the new password will be copied to your clipboard.
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Password fields side by side */}
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm font-normal text-foreground">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          className="h-12 rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 pr-10"
                          {...field}
                          disabled={isPending}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <AppIcon icon={Eye} color="green" />
                          ) : (
                            <AppIcon icon={EyeOff} color="green" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-sm font-normal text-foreground">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          className="h-12 rounded-md border-[0.4px] border-foreground/40 bg-secondary px-6 pr-10"
                          {...field}
                          disabled={isPending}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={
                            showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <AppIcon icon={Eye} color="green" />
                          ) : (
                            <AppIcon icon={EyeOff} color="green" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3.5 sm:flex-row">
              <button
                type="submit"
                disabled={isPending}
                className="h-[2.625rem] w-full sm:w-[10rem] rounded-md bg-button-bg text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
              >
                {isPending ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="h-[2.625rem] w-full sm:w-[10rem] rounded-md bg-muted text-sm text-accent-dark transition-colors hover:bg-muted/80 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
