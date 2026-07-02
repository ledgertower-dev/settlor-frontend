/**
 * Roles Model Barrel Export
 *
 * Re-exports all React Query hooks for roles management and UI store
 */

export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateRolePermissions,
  roleKeys,
} from './use-roles'

export { useRolesUIStore } from './roles-ui-store'
