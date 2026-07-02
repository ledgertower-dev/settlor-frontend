'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PillTabs } from '@/components/shared/pill-tabs'
import { EllipsisVertical, SquarePen, LockOpen, Ban, Search, Plus } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { useResourcePermissions } from '@/features/access/model'
import { usePermissionError } from '@/lib/api/use-permission-error'
import { AccessDeniedAlert } from '@/components/shared/access-denied'
import { usePaginatedQuery } from '@/hooks/use-paginated-query'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { PermissionButton } from '@/components/shared/permission-button'

import { getErrorMessage } from '@/lib/api/error-handler'

import { useUsers, useBlockUser, useUnblockUser } from '../model/use-users'
import { useUsersPaginationStore, useUsersModalStore, type UserTab } from '../model/users-ui-store'
import { CreateUserDrawer } from './CreateUserDrawer'
import { ViewUserDrawer } from './ViewUserDrawer'
import { formatDate } from '@/lib/core/format'
import type { User } from '../types'

// --- Tab config ---

const TABS: { value: UserTab; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
]

const TAB_STATUS_MAP: Record<UserTab, string> = {
  active: 'ACTIVE',
  blocked: 'BLOCKED',
}

const VALID_TABS = new Set<UserTab>(['active', 'blocked'])

type BlockAction = 'block' | 'unblock'

function getColumns(
  onView: (user: User) => void,
  onBlockToggle: (user: User) => void,
  canUpdate: boolean,
  page: number,
  perPage: number,
): ColumnDef<User>[] {
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
      skeletonWidth: 'w-40',
    },
    {
      key: 'role',
      header: 'Role',
      cell: row => <span className="capitalize">{row.role?.name ?? 'N/A'}</span>,
      skeletonWidth: 'w-24',
    },
    {
      key: 'email',
      header: 'Email',
      cell: row => <span className="lowercase">{row.email}</span>,
      skeletonWidth: 'w-48',
    },
    {
      key: 'createdOn',
      header: 'Created On',
      cell: row => formatDate(row.createdAt),
      skeletonWidth: 'w-40',
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
                className="flex h-8 w-10 items-center justify-center rounded-md bg-accent text-muted-foreground transition-colors hover:bg-accent/80 hover:text-foreground"
                onClick={e => e.stopPropagation()}
              >
                <AppIcon icon={EllipsisVertical} size="sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] rounded-[10px] p-2.5 space-y-0">
              <DropdownMenuItem icon={SquarePen} showBorder onClick={() => onView(row)}>
                Edit
              </DropdownMenuItem>
              {canUpdate && (
                <DropdownMenuItem
                  icon={row.status === 'blocked' ? LockOpen : Ban}
                  iconBg={row.status === 'blocked' ? 'bg-status-green/10' : 'bg-status-red/10'}
                  iconColor={row.status === 'blocked' ? 'text-status-green' : 'text-status-red'}
                  onClick={() => onBlockToggle(row)}
                >
                  {row.status === 'blocked' ? 'Unblock' : 'Block'}
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

export function UsersList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canCreate, canUpdate } = useResourcePermissions('users')
  const [blockUser, setBlockUser] = useState<User | null>(null)
  const [blockAction, setBlockAction] = useState<BlockAction>('block')
  const blockUserMutation = useBlockUser()
  const unblockUserMutation = useUnblockUser()
  const { filters, setTab, setPage, setPerPage, setSearch } = useUsersPaginationStore()
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setSearch)

  // The URL (?tab=) is the single source of truth; the store mirrors it so the
  // query/page-reset follow. Driving both the store and the URL from the click
  // handler races the router's async URL update and snaps the tab back.
  const tabParam = searchParams.get('tab') as UserTab | null
  const activeTab: UserTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : 'active'

  useEffect(() => {
    if (activeTab !== filters.tab) setTab(activeTab)
  }, [activeTab, filters.tab, setTab])

  const handleTabChange = (tab: UserTab) => {
    if (tab === activeTab) return // no-op when the active tab is re-clicked
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const { openModal, selectedUser, openCreateModal, openViewModal, closeModal } =
    useUsersModalStore()

  const queryParams = useMemo(
    () => ({
      q: filters.search || undefined,
      status: TAB_STATUS_MAP[filters.tab],
      page: filters.page,
      perPage: filters.perPage,
    }),
    [filters],
  )

  const query = useUsers(queryParams)
  usePaginatedQuery({ query, setPage, currentPage: filters.page })
  const { data: usersResponse, isLoading, isFetching, error } = query
  const { isPermissionDenied, permissionMessage } = usePermissionError(error)

  const users = usersResponse?.data.items || []
  const pagination = usersResponse?.meta?.pagination

  const handleView = (user: User) => {
    openViewModal(user)
  }

  const handleBlockToggle = (user: User) => {
    setBlockAction(user.status === 'blocked' ? 'unblock' : 'block')
    setBlockUser(user)
  }

  const handleBlockConfirm = async () => {
    if (!blockUser) return
    try {
      if (blockAction === 'block') {
        await blockUserMutation.mutateAsync(blockUser.id)
        toast.success('User blocked successfully')
        handleTabChange('blocked')
      } else {
        await unblockUserMutation.mutateAsync(blockUser.id)
        toast.success('User unblocked successfully')
        handleTabChange('active')
      }
      setBlockUser(null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  if (error && isPermissionDenied) {
    return (
      <div className="m-6">
        <AccessDeniedAlert message={permissionMessage} />
      </div>
    )
  }

  const columns = getColumns(
    handleView,
    handleBlockToggle,
    canUpdate,
    filters.page,
    filters.perPage,
  )

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <PillTabs tabs={TABS} value={activeTab} onValueChange={handleTabChange} />

      {/* Table card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        {/* Title + Search + Add Member */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">User List</h2>
            <p className="text-sm text-muted-foreground">Manage and view all users</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 cursor-text rounded-[11px] bg-search-bg px-3.5 h-12 sm:flex-none sm:w-[280px]">
              <AppIcon icon={Search} size="sm" color="muted" />
              <input
                type="text"
                placeholder="Search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </label>
            <PermissionButton
              allowed={canCreate}
              deniedMessage="You don't have permission to create users"
              onClick={openCreateModal}
              icon={Plus}
            >
              Add Member
            </PermissionButton>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={users}
          rowKey={row => row.id}
          isLoading={isLoading || isFetching}
          loadingRows={filters.perPage}
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
          emptyMessage={
            filters.search
              ? 'No users found matching your search.'
              : filters.tab === 'active'
                ? 'No active users yet. Create one to get started.'
                : 'No blocked users.'
          }
        />

        {/* Pagination */}
        {!isLoading && users.length > 0 && pagination && (
          <div className="mt-8">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              itemLabel="users"
            />
          </div>
        )}
      </div>

      {/* Create User Drawer */}
      <CreateUserDrawer
        open={openModal === 'create'}
        onOpenChange={open => {
          if (!open) closeModal()
        }}
      />

      {/* View/Edit User Drawer */}
      <ViewUserDrawer
        open={openModal === 'view'}
        onOpenChange={open => {
          if (!open) closeModal()
        }}
        user={selectedUser}
      />

      {/* Block/Unblock Confirmation */}
      <ConfirmDialog
        open={!!blockUser}
        onOpenChange={open => !open && setBlockUser(null)}
        title={blockAction === 'block' ? 'Block User' : 'Unblock User'}
        description={
          blockAction === 'block' ? (
            <>
              Are you sure you want to block <strong>{blockUser?.name}</strong>? They will no longer
              be able to access the system.
            </>
          ) : (
            <>
              Are you sure you want to unblock <strong>{blockUser?.name}</strong>? They will regain
              access to the system.
            </>
          )
        }
        confirmLabel={blockAction === 'block' ? 'Block' : 'Unblock'}
        pendingLabel={blockAction === 'block' ? 'Blocking...' : 'Unblocking...'}
        variant={blockAction === 'block' ? 'danger' : 'confirm'}
        isPending={blockUserMutation.isPending || unblockUserMutation.isPending}
        onConfirm={handleBlockConfirm}
      />
    </div>
  )
}
