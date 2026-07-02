import { Badge } from '@/components/ui/badge'
import type { AuditAction } from '../types/audit-log.types'

const actionConfig: Record<
  AuditAction,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  CREATE: { label: 'Create', variant: 'default' },
  UPDATE: { label: 'Update', variant: 'secondary' },
  DELETE: { label: 'Delete', variant: 'destructive' },
  LOGIN: { label: 'Login', variant: 'outline' },
  LOGOUT: { label: 'Logout', variant: 'outline' },
  LOGIN_FAILED: { label: 'Login Failed', variant: 'destructive' },
  PASSWORD_CHANGE: { label: 'Password Change', variant: 'secondary' },
}

interface ActionBadgeProps {
  action: AuditAction
}

export function ActionBadge({ action }: ActionBadgeProps) {
  const config = actionConfig[action] || { label: action, variant: 'outline' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
