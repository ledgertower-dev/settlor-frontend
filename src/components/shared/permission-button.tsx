import type { ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type LucideIcon } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

interface PermissionButtonProps {
  /** Whether the current user has permission to perform the action */
  allowed: boolean
  /** Tooltip text shown when the user lacks permission */
  deniedMessage: string
  /** Click handler — only called when allowed */
  onClick: () => void
  /** Button label */
  children: ReactNode
  /** Optional leading lucide icon component */
  icon?: LucideIcon
}

/**
 * A primary action button that is disabled (with an explanatory tooltip) when
 * the user does not have the required permission.
 *
 * @example
 * <PermissionButton
 *   allowed={canCreate}
 *   deniedMessage="You don't have permission to create users"
 *   onClick={openCreateModal}
 *   icon={Plus}
 * >
 *   Add Member
 * </PermissionButton>
 */
export function PermissionButton({
  allowed,
  deniedMessage,
  onClick,
  children,
  icon: Icon,
}: PermissionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* span wrapper keeps TooltipTrigger working on a disabled button */}
        <span className="inline-flex">
          <button
            onClick={onClick}
            disabled={!allowed}
            className="flex h-12 items-center gap-2 rounded-md bg-button-bg px-5 text-sm text-primary-foreground transition-colors hover:bg-button-bg/90 disabled:opacity-50"
          >
            {Icon && <AppIcon icon={Icon} color="primary-foreground" />}
            {children}
          </button>
        </span>
      </TooltipTrigger>
      {!allowed && <TooltipContent>{deniedMessage}</TooltipContent>}
    </Tooltip>
  )
}
