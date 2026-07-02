'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/core/utils'

const switchVariants = cva(
  'peer inline-flex shrink-0 items-center rounded-full border shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[1px] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-[1.15rem] w-8',
        lg: 'h-6 w-12 px-[3px]',
      },
      variant: {
        default:
          'border-transparent data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
        green:
          'bg-white data-[state=checked]:border-status-green data-[state=checked]:bg-white data-[state=unchecked]:border-foreground/15 data-[state=unchecked]:bg-white dark:bg-card dark:data-[state=checked]:bg-card dark:data-[state=unchecked]:bg-card',
        red: 'bg-white data-[state=checked]:border-status-green data-[state=checked]:bg-white data-[state=unchecked]:border-status-red data-[state=unchecked]:bg-white dark:bg-card dark:data-[state=checked]:bg-card dark:data-[state=unchecked]:bg-card',
      },
    },
    defaultVariants: {
      size: 'sm',
      variant: 'default',
    },
  },
)

const thumbVariants = cva(
  'pointer-events-none block rounded-full ring-0 transition-transform data-[state=unchecked]:translate-x-0',
  {
    variants: {
      size: {
        sm: 'size-4 data-[state=checked]:translate-x-[calc(100%-2px)]',
        lg: 'size-4 data-[state=checked]:translate-x-[23.5px]',
      },
      variant: {
        default:
          'bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground',
        green:
          'data-[state=checked]:bg-status-green data-[state=unchecked]:bg-foreground/15 dark:data-[state=checked]:bg-status-green',
        red: 'data-[state=checked]:bg-status-green data-[state=unchecked]:bg-status-red dark:data-[state=checked]:bg-status-green dark:data-[state=unchecked]:bg-status-red',
      },
    },
    defaultVariants: {
      size: 'sm',
      variant: 'default',
    },
  },
)

interface SwitchProps
  extends React.ComponentProps<typeof SwitchPrimitive.Root>, VariantProps<typeof switchVariants> {}

function Switch({ className, size, variant, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ size, variant }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(thumbVariants({ size, variant }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
