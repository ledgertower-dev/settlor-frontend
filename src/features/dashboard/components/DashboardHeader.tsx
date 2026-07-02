'use client'

import { DynamicBreadcrumb } from '@/components/ui/dynamic-breadcrumb'
import { MobileSidebar } from './MobileSidebar'
import { ProfileDropdown } from './ProfileDropdown'

export function DashboardHeader() {
  return (
    <header className="shrink-0 flex h-21 gap-4 items-center justify-between px-4 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileSidebar />
        <DynamicBreadcrumb className="min-w-0" />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ProfileDropdown />
      </div>
    </header>
  )
}
