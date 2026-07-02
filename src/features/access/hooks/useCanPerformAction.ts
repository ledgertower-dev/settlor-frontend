/**
 * Action-Based Permission Hook
 *
 * Maps CRUD actions to permission keys for different resources
 * Provides a clean API for checking if user can perform specific actions
 */

import { useMemo } from 'react'
import { usePermission } from './usePermission'

/**
 * Resource types in the system
 */
export type Resource =
  | 'users'
  | 'roles'
  | 'merchants'
  | 'wallet-adjustments'
  | 'payouts'
  | 'scheduled-payouts'
  | 'deposits'
  | 'ledger'
  | 'permissions'
  | 'audit-logs'
  | 'providers'
  | 'beneficiaries'
  | 'reports'
  | 'merchant-support'
  | 'merchant-settings'
  | 'kyc'

/**
 * CRUD actions
 */
export type Action = 'create' | 'read' | 'update' | 'delete' | 'write' | 'export'

/**
 * Permission mapping configuration
 * Maps resource + action to required permission key(s)
 */
const PERMISSION_MAP: Record<Resource, Partial<Record<Action, string | string[]>>> = {
  users: {
    read: 'users:read',
    create: 'users:create',
    update: 'users:update',
    delete: 'users:delete',
    write: ['users:create', 'users:update', 'users:delete'],
  },
  merchants: {
    read: 'merchants:read',
    write: 'merchants:write',
    create: 'merchants:write',
    update: 'merchants:write',
    delete: 'merchants:write',
  },
  'wallet-adjustments': {
    read: 'wallets:adjust',
    create: 'wallets:adjust',
  },
  payouts: {
    read: ['payouts:read', 'merchant:payouts:read'],
    create: 'merchant:payouts:create',
    export: ['merchant:payouts:export', 'reports:export'],
  },
  'scheduled-payouts': {
    read: ['scheduled_payouts:read', 'merchant:scheduled_payouts:read'],
    create: 'merchant:scheduled_payouts:create',
    update: 'merchant:scheduled_payouts:update',
    delete: 'merchant:scheduled_payouts:cancel',
  },
  deposits: {
    read: ['deposits:read', 'merchant:deposits:read'],
    create: 'merchant:deposits:create',
    export: ['merchant:deposit_payouts:export', 'reports:export'],
  },
  ledger: {
    read: ['ledger:read', 'merchant:ledger:read'],
    export: ['ledger:export', 'merchant:ledger:export'],
  },
  permissions: {
    read: 'permissions:read',
  },
  roles: {
    read: 'roles:read',
    create: 'roles:create',
    update: 'roles:update',
    delete: 'roles:delete',
    write: ['roles:create', 'roles:update', 'roles:delete'],
  },
  'audit-logs': {
    read: 'audit-logs:read',
    // Audit logs are read-only, no write operations
  },
  providers: {
    read: 'providers:read',
    write: 'providers:manage',
    create: 'providers:manage',
    update: 'providers:manage',
    delete: 'providers:manage',
  },
  beneficiaries: {
    read: 'merchant:beneficiaries:read',
    create: 'merchant:beneficiaries:create',
    update: 'merchant:beneficiaries:update',
    delete: 'merchant:beneficiaries:delete',
    export: 'merchant:beneficiaries:export',
  },
  reports: {
    read: 'reports:read',
    export: 'reports:export',
  },
  'merchant-support': {
    read: 'merchants:support:read',
    write: 'merchants:support:assign',
    create: 'merchants:support:assign',
  },
  'merchant-settings': {
    read: 'merchants:settings:read',
    write: 'merchants:settings:update',
    update: 'merchants:settings:update',
  },
  kyc: {
    read: 'kyc:read',
    write: 'kyc:review',
    update: 'kyc:review',
  },
}

/**
 * Get permission key(s) required for a specific resource and action
 */
function getPermissionKey(resource: Resource, action: Action): string | string[] | undefined {
  const resourcePermissions = PERMISSION_MAP[resource]

  if (!resourcePermissions) {
    return undefined
  }

  return resourcePermissions[action]
}

/**
 * Check if user can perform a specific action on a resource
 *
 * @param resource - The resource type
 * @param action - The action to perform
 * @returns boolean indicating if user can perform the action
 *
 * @example
 * ```tsx
 * // Check if user can create users
 * const canCreateUsers = useCanPerformAction('users', 'create')
 * ```
 */
export function useCanPerformAction(resource: Resource, action: Action): boolean {
  const permissionKey = useMemo(() => getPermissionKey(resource, action), [resource, action])

  return usePermission(permissionKey)
}

/**
 * Get all CRUD capabilities for a resource
 *
 * @param resource - The resource type
 * @returns Object with boolean flags for each action
 *
 * @example
 * ```tsx
 * const { canCreate, canRead, canUpdate, canDelete } = useResourcePermissions('users')
 *
 * return (
 *   <>
 *     {canCreate && <CreateButton />}
 *     {canUpdate && <EditButton />}
 *     {canDelete && <DeleteButton />}
 *   </>
 * )
 * ```
 */
export function useResourcePermissions(resource: Resource) {
  const canCreate = useCanPerformAction(resource, 'create')
  const canRead = useCanPerformAction(resource, 'read')
  const canUpdate = useCanPerformAction(resource, 'update')
  const canDelete = useCanPerformAction(resource, 'delete')
  const canWrite = useCanPerformAction(resource, 'write')
  const canExport = useCanPerformAction(resource, 'export')

  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canWrite,
    canExport,
  }
}
