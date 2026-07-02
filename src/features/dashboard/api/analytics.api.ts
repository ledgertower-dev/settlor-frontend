/**
 * Analytics API Service
 *
 * Connects to dashboard analytics endpoints for real-time metrics
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type { TimeRange } from '../types/dashboard.types'

// ============================================================================
// Backend Response Types (matching API responses)
// ============================================================================

interface BackendAnalyticsResponse<T> {
  success: boolean
  data: T
  timestamp?: string
}

// User Stats
interface BackendUserStatsData {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  passwordPending: number
  usersCreatedInPeriod: number
  lastLoginDistribution: {
    today: number
    thisWeek: number
    thisMonth: number
    older: number
    never: number
  }
}

// Role Distribution
interface BackendRoleDistributionData {
  items: Array<{
    roleId: string
    roleName: string
    userCount: number
  }>
}

// Security Stats
interface BackendSecurityStatsData {
  failedLogins: Array<{
    date: string
    count: number
  }>
  loginTrends: Array<{
    date: string
    successCount: number
  }>
  activityByType: Array<{
    action: string
    count: number
  }>
}

// ============================================================================
// Frontend Response Types (for components)
// ============================================================================

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  passwordPending: number
  usersCreatedInPeriod: number
  lastLoginDistribution: {
    today: number
    thisWeek: number
    thisMonth: number
    older: number
    never: number
  }
}

export interface RoleDistributionItem {
  roleId: string
  roleName: string
  userCount: number
  color?: string
}

export interface SecurityAnalytics {
  failedLogins: Array<{
    date: string
    count: number
  }>
  loginTrends: Array<{
    date: string
    successCount: number
  }>
  activityByType: Array<{
    action: string
    count: number
  }>
}

// Chart color palette
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00C49F',
]

/**
 * Analytics Service
 */
class AnalyticsService {
  /**
   * GET /analytics/users?timeRange=30d
   * Get user statistics including login distribution
   */
  async getUserStats(timeRange: TimeRange = '30d'): Promise<UserAnalytics> {
    try {
      // Map 1y to 90d since backend only supports 7d, 30d, 90d
      const mappedRange = timeRange === '1y' ? '90d' : timeRange
      const response = await apiClient.get<BackendAnalyticsResponse<BackendUserStatsData>>(
        `/analytics/users?timeRange=${mappedRange}`,
      )
      return response.data.data
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * GET /analytics/roles
   * Get role distribution with user counts
   */
  async getRoleDistribution(): Promise<RoleDistributionItem[]> {
    try {
      const response =
        await apiClient.get<BackendAnalyticsResponse<BackendRoleDistributionData>>(
          '/analytics/roles',
        )

      // Add colors to each role for charts
      return response.data.data.items.map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
    } catch (error) {
      throwApiError(error)
    }
  }

  /**
   * GET /analytics/security?timeRange=30d
   * Get security statistics including failed logins and activity
   */
  async getSecurityStats(timeRange: TimeRange = '30d'): Promise<SecurityAnalytics> {
    try {
      // Map 1y to 90d since backend only supports 7d, 30d, 90d
      const mappedRange = timeRange === '1y' ? '90d' : timeRange
      const response = await apiClient.get<BackendAnalyticsResponse<BackendSecurityStatsData>>(
        `/analytics/security?timeRange=${mappedRange}`,
      )
      return response.data.data
    } catch (error) {
      throwApiError(error)
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
