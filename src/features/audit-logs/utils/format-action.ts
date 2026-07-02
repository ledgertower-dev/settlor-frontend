import type { AuditAction } from '../types/audit-log.types'

/**
 * Human-readable labels for audit actions
 * Used in both filter dropdowns and action badges for consistency
 */
export const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Failed',
  PASSWORD_CHANGE: 'Password Change',
}

/**
 * Get human-readable label for an audit action
 */
export function formatAction(action: AuditAction): string {
  return ACTION_LABELS[action] || action.replace(/_/g, ' ')
}
