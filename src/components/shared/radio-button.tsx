'use client'

import { cn } from '@/lib/core/utils'

interface RadioButtonProps {
  selected: boolean
  onSelect: () => void
  label: string
  className?: string
  disabled?: boolean
  /** @default "default" */
  size?: 'default' | 'sm'
}

export function RadioButton({
  selected,
  onSelect,
  label,
  className,
  disabled = false,
  size = 'default',
}: RadioButtonProps) {
  const isSmall = size === 'sm'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex items-center disabled:opacity-50 disabled:cursor-not-allowed',
        isSmall ? 'gap-2' : 'gap-3.5',
        className,
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full transition-colors',
          isSmall ? 'size-4 border' : 'size-6 border-2',
          selected
            ? 'border-status-green'
            : isSmall
              ? 'border-foreground/30'
              : 'border-foreground/20 bg-card',
        )}
      >
        {selected && (
          <span className={cn('rounded-full bg-status-green', isSmall ? 'size-2.5' : 'size-3')} />
        )}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  )
}
