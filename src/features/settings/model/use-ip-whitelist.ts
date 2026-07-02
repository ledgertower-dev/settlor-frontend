import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApiService } from '../api/settings.api'

export const meWhitelistIPKeys = {
  all: ['meWhitelistIPs'] as const,
  lists: () => [...meWhitelistIPKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...meWhitelistIPKeys.lists(), params] as const,
}

export function useMeWhitelistIPs(params: { page: number; per_page: number; status: string }) {
  return useQuery({
    queryKey: meWhitelistIPKeys.list(params),
    queryFn: () => settingsApiService.getWhitelistIPs(params),
  })
}

export function useCreateMeWhitelistIP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { ip_address: string; description?: string; type: string }) =>
      settingsApiService.createWhitelistIP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meWhitelistIPKeys.lists() })
    },
  })
}

export function useUpdateMeWhitelistIP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: {
        ip_address: string
        description?: string
        type: string
      }
    }) => settingsApiService.updateWhitelistIP(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meWhitelistIPKeys.lists() })
    },
  })
}

export function useDeleteMeWhitelistIP() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => settingsApiService.deleteWhitelistIP(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meWhitelistIPKeys.lists() })
    },
  })
}
