import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApiService } from '../api/settings.api'
import type { CreateMaintenanceData, UpdateMaintenanceData } from '../api/settings.api'

export const maintenanceKeys = {
  all: ['maintenanceSchedules'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...maintenanceKeys.lists(), params] as const,
  active: ['activeMaintenance'] as const,
}

export function useActiveMaintenance() {
  return useQuery({
    queryKey: maintenanceKeys.active,
    queryFn: () => settingsApiService.getActiveMaintenance(),
    refetchInterval: 60_000,
  })
}

export function useMaintenanceSchedules(params: {
  page: number
  per_page: number
  status?: string
}) {
  return useQuery({
    queryKey: maintenanceKeys.list(params),
    queryFn: () => settingsApiService.getMaintenanceSchedules(params),
  })
}

export function useCreateMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMaintenanceData) => settingsApiService.createMaintenanceSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.active })
    },
  })
}

export function useUpdateMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenanceData }) =>
      settingsApiService.updateMaintenanceSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.active })
    },
  })
}

export function useDeleteMaintenanceSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => settingsApiService.deleteMaintenanceSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.active })
    },
  })
}
