'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'

import { cn } from '@/lib/core/utils'

function Checkbox({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  variant?: 'default' | 'green'
  size?: 'default' | 'lg'
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer shrink-0 border shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[1px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
        size === 'default' && 'size-4 rounded-[4px]',
        size === 'lg' && 'size-6 rounded-[4.5px]',
        variant === 'default' &&
          'border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary',
        variant === 'green' &&
          'border-input dark:bg-input/30 data-[state=checked]:bg-status-green data-[state=checked]:text-white data-[state=checked]:border-status-green',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className={cn(size === 'default' ? 'size-3.5' : 'size-4.5')} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
