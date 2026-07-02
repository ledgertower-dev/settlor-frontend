'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/core/utils'
import type { Permission } from '@/lib/types/api-types'

interface PermissionCheckboxProps {
  permission: Permission
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}

export function PermissionCheckbox({
  permission,
  checked,
  onToggle,
  disabled = false,
}: PermissionCheckboxProps) {
  const displayName = permission.description || permission.name

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onToggle()}
      onKeyDown={e => {
        if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-md border p-3.5 text-left transition-colors sm:w-[calc(50%-7px)] lg:w-[calc(25%-10.5px)]',
        checked ? 'border-status-green bg-status-green/10' : 'border-foreground/15 bg-card',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-status-green/50',
      )}
    >
      <Checkbox
        checked={checked}
        tabIndex={-1}
        disabled={disabled}
        className={cn(
          'pointer-events-none size-5',
          checked
            ? 'border-status-green bg-status-green data-[state=checked]:border-status-green data-[state=checked]:bg-status-green dark:data-[state=checked]:bg-status-green'
            : 'border-foreground/50 bg-card',
        )}
      />
      <span className="text-sm font-medium capitalize text-foreground">{displayName}</span>
    </div>
  )
}
