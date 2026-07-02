'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'

import { Lock, Search, Plus } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTable, type ColumnDef } from '@/components/shared/data-table'
import { ViewButton } from '@/components/shared/view-button'
import { DataTablePagination } from '@/components/shared/data-table-pagination'
import { useResourcePermissions } from '@/features/access/model'
import { usePermissionError } from '@/lib/api/use-permission-error'
import { AccessDeniedAlert } from '@/components/shared/access-denied'
import { usePaginatedQuery } from '@/hooks/use-paginated-query'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { PermissionButton } from '@/components/shared/permission-button'

import { useRoles } from '../model/use-roles'
import { useRolesPaginationStore } from '../model/roles-ui-store'
import type { Role } from '../types'

function getColumns(
  onView: (id: string) => void,
  page: number,
  perPage: number,
): ColumnDef<Role>[] {
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
      cell: row => (
        <div className="flex items-center gap-2">
          <span className="capitalize">{row.name}</span>
          {row.isSystemLocked && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center text-amber-500" aria-label="System role">
                  <AppIcon icon={Lock} size="sm" />
                </span>
              </TooltipTrigger>
              <TooltipContent>System role — cannot be edited or deleted</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
      skeletonWidth: 'w-40',
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

export function RolesList() {
  const router = useRouter()
  const rolePath = useRolePath()
  const { canCreate } = useResourcePermissions('roles')
  const { filters, setPage, setPerPage, setSearch } = useRolesPaginationStore()
  const [searchInput, setSearchInput] = useDebouncedSearch(filters.search, setSearch)

  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      page: filters.page,
      perPage: filters.perPage,
      sort: filters.sort,
      sortOrder: filters.sortOrder,
    }),
    [filters],
  )

  const query = useRoles(queryParams)
  usePaginatedQuery({ query, setPage, currentPage: filters.page })
  const { data: rolesResponse, isLoading, error } = query
  const { isPermissionDenied, permissionMessage } = usePermissionError(error)

  const roles = rolesResponse?.data.items || []
  const pagination = rolesResponse?.meta.pagination

  const handleView = (id: string) => {
    router.push(rolePath(`/roles/${id}`))
  }

  if (error && isPermissionDenied) {
    return (
      <div className="m-6">
        <AccessDeniedAlert message={permissionMessage} />
      </div>
    )
  }

  const columns = getColumns(handleView, filters.page, filters.perPage)

  return (
    <div className="space-y-5">
      {/* Table card */}
      <div className="rounded-lg border border-transparent dark:border-input bg-card px-6 pt-6 pb-8 shadow-[var(--shadow-card)]">
        {/* Title + Search + Add Role */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-medium text-foreground">Role List</h2>
            <p className="text-sm text-muted-foreground">Manage and view all roles</p>
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
              deniedMessage="You don't have permission to create roles"
              onClick={() => router.push(rolePath('/roles/create'))}
              icon={Plus}
            >
              Add Role
            </PermissionButton>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={roles}
          rowKey={row => row.id}
          isLoading={isLoading}
          loadingRows={filters.perPage}
          containerClassName="border-0 shadow-none bg-transparent rounded-none"
          emptyMessage={
            filters.search
              ? 'No roles found matching your search.'
              : 'No roles available yet. Create one to get started.'
          }
        />

        {/* Pagination */}
        {!isLoading && roles.length > 0 && pagination && (
          <div className="mt-8">
            <DataTablePagination
              pagination={pagination}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              itemLabel="roles"
            />
          </div>
        )}
      </div>
    </div>
  )
}
