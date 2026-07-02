import { useQuery } from '@tanstack/react-query'
import { dashboardMetricsService } from '../api/dashboard-metrics.api'
import type { DashboardMetricParams, StatusVolumeParams } from '../types/dashboard.types'

// Metrics change relatively slowly; keep them fresh for 30s to avoid refetch
// churn. Real-time freshness is handled by WebSocket-driven invalidation.
const DASHBOARD_STALE_TIME = 0

export const dashboardMetricsKeys = {
  all: ['dashboard-metrics'] as const,
  summary: (params?: DashboardMetricParams) =>
    [...dashboardMetricsKeys.all, 'summary', params] as const,
  todayVsYesterday: (params?: DashboardMetricParams) =>
    [...dashboardMetricsKeys.all, 'today-vs-yesterday', params] as const,
  payoutCards: (params?: DashboardMetricParams) =>
    [...dashboardMetricsKeys.all, 'payout-cards', params] as const,
  statusVolume: (params?: StatusVolumeParams) =>
    [...dashboardMetricsKeys.all, 'status-volume', params] as const,
  statusSplit: (params?: DashboardMetricParams) =>
    [...dashboardMetricsKeys.all, 'status-split', params] as const,
  myWallets: () => [...dashboardMetricsKeys.all, 'my-wallets'] as const,
}

export function useDashboardSummary(params?: DashboardMetricParams) {
  return useQuery({
    queryKey: dashboardMetricsKeys.summary(params),
    queryFn: () => dashboardMetricsService.getSummary(params),
    staleTime: DASHBOARD_STALE_TIME,
  })
}

export function useTodayVsYesterday(params?: DashboardMetricParams) {
  return useQuery({
    queryKey: dashboardMetricsKeys.todayVsYesterday(params),
    queryFn: () => dashboardMetricsService.getTodayVsYesterday(params),
    staleTime: DASHBOARD_STALE_TIME,
  })
}

export function usePayoutCards(params?: DashboardMetricParams) {
  return useQuery({
    queryKey: dashboardMetricsKeys.payoutCards(params),
    queryFn: () => dashboardMetricsService.getPayoutCards(params),
    staleTime: DASHBOARD_STALE_TIME,
  })
}

export function useStatusVolume(params?: StatusVolumeParams) {
  return useQuery({
    queryKey: dashboardMetricsKeys.statusVolume(params),
    queryFn: () => dashboardMetricsService.getStatusVolume(params),
    staleTime: DASHBOARD_STALE_TIME,
  })
}

export function useStatusSplit(params?: DashboardMetricParams) {
  return useQuery({
    queryKey: dashboardMetricsKeys.statusSplit(params),
    queryFn: () => dashboardMetricsService.getStatusSplit(params),
    staleTime: DASHBOARD_STALE_TIME,
  })
}

export function useMyWallets() {
  return useQuery({
    queryKey: dashboardMetricsKeys.myWallets(),
    queryFn: () => dashboardMetricsService.getMyWallets(),
    staleTime: DASHBOARD_STALE_TIME,
  })
}
