'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/core/utils'

function SlideOverPanel({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="slide-over-panel" {...props} />
}

function SlideOverPanelTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="slide-over-panel-trigger" {...props} />
}

function SlideOverPanelClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="slide-over-panel-close" {...props} />
}

function SlideOverPanelPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="slide-over-panel-portal" {...props} />
}

function SlideOverPanelOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="slide-over-panel-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

function SlideOverPanelContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <SlideOverPanelPortal>
      <SlideOverPanelOverlay />
      <DialogPrimitive.Content
        data-slot="slide-over-panel-content"
        className={cn(
          'bg-background fixed inset-y-0 right-0 z-50 flex flex-col shadow-lg border-l',
          // Responsive widths: 100% mobile → 80% tablet → 70% desktop → 60% xl
          'w-full md:w-[80vw] lg:w-[70vw] xl:w-[60vw]',
          'max-w-[1200px]',
          // Animations
          'transition ease-in-out',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
          'data-[state=closed]:duration-300 data-[state=open]:duration-500',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </SlideOverPanelPortal>
  )
}

function SlideOverPanelHeader({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="slide-over-panel-header"
      className={cn(
        'sticky top-0 z-10',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'border-b',
        'px-6 py-4',
        'flex flex-col gap-1.5',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          className={cn(
            'absolute top-4 right-4',
            'rounded-sm opacity-70 transition-opacity',
            'hover:opacity-100',
            'focus-visible:outline-none focus-visible:ring-[1px] focus-visible:ring-ring/30',
            'disabled:pointer-events-none',
            'data-[state=open]:bg-secondary',
          )}
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function SlideOverPanelBody({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="slide-over-panel-body"
      className={cn('flex-1 overflow-y-auto px-6 py-6', className)}
      {...props}
    />
  )
}

function SlideOverPanelFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="slide-over-panel-footer"
      className={cn(
        'sticky bottom-0 z-10 mt-auto',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        'border-t',
        'px-6 py-4',
        'flex items-center justify-between',
        className,
      )}
      {...props}
    />
  )
}

function SlideOverPanelTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="slide-over-panel-title"
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function SlideOverPanelDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="slide-over-panel-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  SlideOverPanel,
  SlideOverPanelTrigger,
  SlideOverPanelClose,
  SlideOverPanelContent,
  SlideOverPanelHeader,
  SlideOverPanelBody,
  SlideOverPanelFooter,
  SlideOverPanelTitle,
  SlideOverPanelDescription,
}
