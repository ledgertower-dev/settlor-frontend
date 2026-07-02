'use client'

import { X } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface DrawerLayoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  footer: React.ReactNode
  width?: string
}

export function DrawerLayout({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = 'sm:w-[640px] sm:max-w-[640px]',
}: DrawerLayoutProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`flex w-full flex-col p-0 ${width} [&>button]:hidden`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="text-lg font-medium text-foreground">{title}</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close drawer"
              className="cursor-pointer rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <AppIcon icon={X} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

          {/* Footer */}
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  )
}
