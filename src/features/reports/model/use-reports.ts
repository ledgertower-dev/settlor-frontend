import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '../api/reports.api'
import type { ReportListParams, ExportReportRequest } from '../types'

// ============================================================================
// Query Keys
// ============================================================================

export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (params: ReportListParams) => [...reportKeys.lists(), params] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useReports(params?: ReportListParams) {
  return useQuery({
    queryKey: reportKeys.list(params ?? {}),
    queryFn: () => reportsService.getReports(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useExportReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ExportReportRequest) => reportsService.exportReport(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportKeys.lists() })
    },
  })
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (id: string) => reportsService.downloadReport(id),
  })
}
