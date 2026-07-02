/**
 * TanStack Query Hooks for Dashboard Analytics
 *
 * Connects to real backend analytics API with auto-refresh support
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { TimeRange } from '../types/dashboard.types'
import {
  analyticsService,
  type UserAnalytics,
  type RoleDistributionItem,
  type SecurityAnalytics,
} from '../api/analytics.api'

// ============================================================================
// Query Keys Factory
// ============================================================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  users: (timeRange: TimeRange) => [...dashboardKeys.all, 'users', timeRange] as const,
  roles: () => [...dashboardKeys.all, 'roles'] as const,
  security: (timeRange: TimeRange) => [...dashboardKeys.all, 'security', timeRange] as const,
}

// ============================================================================
// Configuration
// ============================================================================

const AUTO_REFRESH_INTERVAL = 60 * 1000 // 60 seconds
const STALE_TIME = 0 // always refetch dashboard data on open

interface UseDashboardOptions {
  enabled?: boolean
  autoRefresh?: boolean
}

// ============================================================================
// User Analytics Hook
// ============================================================================

export const useUserAnalytics = (
  timeRange: TimeRange = '30d',
  options: UseDashboardOptions = {},
) => {
  const { enabled = true, autoRefresh = true } = options

  return useQuery<UserAnalytics>({
    queryKey: dashboardKeys.users(timeRange),
    queryFn: () => analyticsService.getUserStats(timeRange),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
    refetchIntervalInBackground: false,
  })
}

// ============================================================================
// Role Distribution Hook
// ============================================================================

export const useRoleDistribution = (options: UseDashboardOptions = {}) => {
  const { enabled = true, autoRefresh = true } = options

  return useQuery<RoleDistributionItem[]>({
    queryKey: dashboardKeys.roles(),
    queryFn: () => analyticsService.getRoleDistribution(),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
    refetchIntervalInBackground: false,
  })
}

// ============================================================================
// Security Analytics Hook
// ============================================================================

export const useSecurityAnalytics = (
  timeRange: TimeRange = '30d',
  options: UseDashboardOptions = {},
) => {
  const { enabled = true, autoRefresh = true } = options

  return useQuery<SecurityAnalytics>({
    queryKey: dashboardKeys.security(timeRange),
    queryFn: () => analyticsService.getSecurityStats(timeRange),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
    refetchIntervalInBackground: false,
  })
}

// ============================================================================
// Dashboard Refresh Hook
// ============================================================================

export function useDashboardRefresh() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.all,
        refetchType: 'all',
      })
      setLastRefreshed(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient])

  const refreshTab = useCallback(
    async (tabKey: readonly string[]) => {
      setIsRefreshing(true)
      try {
        await queryClient.invalidateQueries({
          queryKey: tabKey,
          refetchType: 'all',
        })
        setLastRefreshed(new Date())
      } finally {
        setIsRefreshing(false)
      }
    },
    [queryClient],
  )

  return {
    refreshAll,
    refreshTab,
    isRefreshing,
    lastRefreshed,
  }
}
