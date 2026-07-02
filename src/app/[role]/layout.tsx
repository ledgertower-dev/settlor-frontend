import { AuthGuard } from '@/features/auth'
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar'
import { DynamicBreadcrumb } from '@/components/ui/dynamic-breadcrumb'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { MaintenanceGuard } from '@/features/dashboard/components/MaintenanceGuard'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-page-gradient">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>

        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          {/* Header */}
          <DashboardHeader />

          <MaintenanceGuard />

          {/* Content */}
          <main className="h-0 flex-grow overflow-y-auto overflow-x-hidden px-4 lg:px-8 pb-6 pt-3">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
