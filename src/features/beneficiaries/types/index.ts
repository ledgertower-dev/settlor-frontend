// ============================================================================
// Backend Types (snake_case — raw API response)
// ============================================================================

export interface BackendBeneficiary {
  id: string
  beneficiary_name: string
  account_number: string
  ifsc: string
  bank_name: string
  address: string
  status: string
  created_at: string
}

export interface BackendBeneficiariesListResponse {
  success: boolean
  data: BackendBeneficiary[]
  meta: { page: number; per_page: number; total: number; total_pages: number }
}

export interface BackendBeneficiaryResponse {
  success: boolean
  data: BackendBeneficiary
}

// ============================================================================
// Frontend Types (camelCase)
// ============================================================================

export interface Beneficiary {
  id: string
  beneficiaryName: string
  accountNumber: string
  ifsc: string
  bankName: string
  address: string
  status: string
  createdAt: string
}

// ============================================================================
// Request Types (snake_case — sent to backend as-is)
// ============================================================================

export interface CreateBeneficiaryRequest {
  beneficiary_name: string
  account_number: string
  ifsc: string
  bank_name: string
  address: string
}

export interface UpdateBeneficiaryRequest {
  beneficiary_name?: string
  account_number?: string
  ifsc?: string
  bank_name?: string
  address?: string
}

// ============================================================================
// List Params
// ============================================================================

export interface BeneficiaryListParams {
  page?: number
  per_page?: number
  q?: string
}
