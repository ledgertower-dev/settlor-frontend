/**
 * Dashboard Model Exports
 *
 * Barrel for dashboard metric hooks. Kept component-free so cross-feature
 * consumers (e.g. payouts) can import metrics without pulling dashboard UI.
 */
export { useDashboardSummary } from './use-dashboard-metrics'
