// Dashboard feature exports

// Layout Components
export { DashboardSidebar } from './components/DashboardSidebar'
export { MerchantDashboard } from './components/MerchantDashboard'

// Navigation components
export { NavMain } from './components/navigation/NavMain'

// Hooks
export {
  useUserAnalytics,
  useRoleDistribution,
  useSecurityAnalytics,
  useDashboardRefresh,
  dashboardKeys,
} from './hooks/useDashboardData'

export { useTabPermissions } from './hooks/useTabPermissions'
export { useSidebarPermissions } from './hooks/useSidebarPermissions'

// Types
export type { TimeRange, TrendDirection, StatusType } from './types/dashboard.types'
