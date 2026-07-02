import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduledPayoutsService } from '../api/scheduled-payouts.api'
import type {
  ScheduledPayoutListParams,
  CreateScheduledPayoutRequest,
  UpdateScheduledPayoutRequest,
} from '../types'

// ============================================================================
// Query Keys
// ============================================================================

export const scheduledPayoutKeys = {
  all: ['scheduled-payouts'] as const,
  lists: () => [...scheduledPayoutKeys.all, 'list'] as const,
  list: (params: ScheduledPayoutListParams) => [...scheduledPayoutKeys.lists(), params] as const,
  details: () => [...scheduledPayoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...scheduledPayoutKeys.details(), id] as const,
  histories: () => [...scheduledPayoutKeys.all, 'history'] as const,
  history: (id: string) => [...scheduledPayoutKeys.histories(), id] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useScheduledPayouts(
  params?: ScheduledPayoutListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: scheduledPayoutKeys.list(params ?? {}),
    queryFn: () => scheduledPayoutsService.getScheduledPayouts(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: options?.enabled,
  })
}

export function useScheduledPayoutRunHistory(id: string | null) {
  return useQuery({
    queryKey: scheduledPayoutKeys.history(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('Scheduled payout ID is required')
      return scheduledPayoutsService.getRunHistory(id)
    },
    enabled: !!id,
    staleTime: 0,
  })
}

export function useScheduledPayout(id: string | null) {
  return useQuery({
    queryKey: scheduledPayoutKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('Scheduled payout ID is required')
      return scheduledPayoutsService.getScheduledPayout(id)
    },
    enabled: !!id,
    staleTime: 0,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateScheduledPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateScheduledPayoutRequest) =>
      scheduledPayoutsService.createScheduledPayout(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.lists() })
    },
  })
}

export function useUpdateScheduledPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduledPayoutRequest }) =>
      scheduledPayoutsService.updateScheduledPayout(id, data),
    onSuccess: async (_, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.history(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.lists() }),
      ])
    },
  })
}

export function usePauseScheduledPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scheduledPayoutsService.pauseScheduledPayout(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.history(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.lists() }),
      ])
    },
  })
}

export function useResumeScheduledPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scheduledPayoutsService.resumeScheduledPayout(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.history(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.lists() }),
      ])
    },
  })
}

export function useCancelScheduledPayout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => scheduledPayoutsService.cancelScheduledPayout(id),
    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.history(id) }),
        queryClient.invalidateQueries({ queryKey: scheduledPayoutKeys.lists() }),
      ])
    },
  })
}
