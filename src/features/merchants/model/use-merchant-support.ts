import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantSupportService } from '../api/merchant-support.api'
import type { SupportMemberListParams } from '../types/merchant-support.types'

export const supportMemberKeys = {
  all: ['support-members'] as const,
  lists: () => [...supportMemberKeys.all, 'list'] as const,
  list: (params: SupportMemberListParams) => [...supportMemberKeys.lists(), params] as const,
  assigned: (merchantId: string) => [...supportMemberKeys.all, 'assigned', merchantId] as const,
}

export function useSupportMembers(params: SupportMemberListParams) {
  return useQuery({
    queryKey: supportMemberKeys.list(params),
    queryFn: () => merchantSupportService.getSupportMembers(params),
  })
}

export function useAssignedSupportMembers(merchantId: string) {
  return useQuery({
    queryKey: supportMemberKeys.assigned(merchantId),
    queryFn: () => merchantSupportService.getAssignedSupportMembers(merchantId),
    enabled: !!merchantId,
  })
}

export function useAssignSupportMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      merchantId,
      supportUserIds,
    }: {
      merchantId: string
      supportUserIds: string[]
    }) => merchantSupportService.assignSupportMembers(merchantId, supportUserIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supportMemberKeys.assigned(variables.merchantId) })
    },
  })
}
