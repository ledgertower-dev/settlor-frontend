'use client'

import * as React from 'react'

import { cn } from '@/lib/core/utils'

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined)

function useCollapsible() {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible')
  }
  return context
}

interface CollapsibleProps extends React.ComponentProps<'div'> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function Collapsible({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange],
  )

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div data-slot="collapsible" className={cn(className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

function CollapsibleTrigger({
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  const { open, onOpenChange } = useCollapsible()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(!open)
    onClick?.(event)
  }

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={open ? 'open' : 'closed'}
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

function CollapsibleContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  const { open } = useCollapsible()

  if (!open) return null

  return (
    <div
      data-slot="collapsible-content"
      data-state={open ? 'open' : 'closed'}
      className={cn(className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
