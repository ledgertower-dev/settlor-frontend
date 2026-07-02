import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApiService } from '../api/settings.api'

export const meWebhookKeys = {
  all: ['meWebhooks'] as const,
  detail: () => [...meWebhookKeys.all, 'detail'] as const,
}

export function useMeWebhooks() {
  return useQuery({
    queryKey: meWebhookKeys.detail(),
    queryFn: () => settingsApiService.getWebhooks(),
  })
}

export function useUpdateMeWebhooks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { payout_callback_url?: string; deposit_callback_url?: string }) =>
      settingsApiService.updateWebhooks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meWebhookKeys.all })
    },
  })
}
