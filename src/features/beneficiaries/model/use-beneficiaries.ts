import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { beneficiariesService } from '../api/beneficiaries.api'
import type {
  BeneficiaryListParams,
  CreateBeneficiaryRequest,
  UpdateBeneficiaryRequest,
} from '../types'

// ============================================================================
// Query Keys
// ============================================================================

export const beneficiaryKeys = {
  all: ['beneficiaries'] as const,
  lists: () => [...beneficiaryKeys.all, 'list'] as const,
  list: (params: BeneficiaryListParams) => [...beneficiaryKeys.lists(), params] as const,
}

// ============================================================================
// Query Hooks
// ============================================================================

export function useBeneficiaries(params?: BeneficiaryListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: beneficiaryKeys.list(params ?? {}),
    queryFn: () => beneficiariesService.getBeneficiaries(params),
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateBeneficiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBeneficiaryRequest) => beneficiariesService.createBeneficiary(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: beneficiaryKeys.lists() })
    },
  })
}

export function useUpdateBeneficiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBeneficiaryRequest }) =>
      beneficiariesService.updateBeneficiary(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: beneficiaryKeys.lists() })
    },
  })
}

export function useDeleteBeneficiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => beneficiariesService.deleteBeneficiary(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: beneficiaryKeys.lists() })
    },
  })
}

export function useExportBeneficiariesCSV() {
  return useMutation({
    mutationFn: () => beneficiariesService.exportCSV(),
  })
}
