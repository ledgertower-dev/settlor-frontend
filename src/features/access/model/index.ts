/**
 * Access Model Exports
 *
 * Barrel export for all access-related hooks and state management
 */

export { usePermissions, permissionsKeys } from './use-permissions'
export {
  usePermission,
  useUserPermissionKeys,
  usePermissionsLoading,
  useRole,
} from '../hooks/usePermission'
export { useCanPerformAction, useResourcePermissions } from '../hooks/useCanPerformAction'
export type { Resource, Action } from '../hooks/useCanPerformAction'
