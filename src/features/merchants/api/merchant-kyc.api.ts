import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type {
  KycDetailResponse,
  KycProfile,
  KycDocument,
  ReviewDocumentPayload,
} from '../types/merchant-kyc.types'

// Backend response shapes (snake_case)
interface BackendKycProfile {
  id: string
  merchant_id: string
  business_type: string
  business_name: string
  business_email: string
  business_mobile: string
  website?: string
  company_pan: string
  kyc_status: string
  submitted_at?: string
  reviewed_at?: string
  created_at: string
}

interface BackendKycDocument {
  id: string
  doc_type: string
  label: string
  status: string
  rejection_remarks?: string
  version: number
  view_url?: string
}

interface BackendKycDetailResponse {
  success: boolean
  data: {
    profile: BackendKycProfile
    documents: BackendKycDocument[]
  }
}

function transformProfile(b: BackendKycProfile): KycProfile {
  return {
    id: b.id,
    merchantId: b.merchant_id,
    businessType: b.business_type,
    businessName: b.business_name,
    businessEmail: b.business_email,
    businessMobile: b.business_mobile,
    website: b.website,
    companyPan: b.company_pan,
    kycStatus: b.kyc_status as KycProfile['kycStatus'],
    submittedAt: b.submitted_at,
    reviewedAt: b.reviewed_at,
    createdAt: b.created_at,
  }
}

function transformDocument(b: BackendKycDocument): KycDocument {
  return {
    id: b.id,
    docType: b.doc_type,
    label: b.label,
    status: b.status as KycDocument['status'],
    rejectionRemarks: b.rejection_remarks,
    version: b.version,
    viewUrl: b.view_url,
  }
}

class MerchantKycService {
  async getKycDetail(merchantId: string): Promise<KycDetailResponse> {
    try {
      const response = await apiClient.get<BackendKycDetailResponse>(`/merchants/${merchantId}/kyc`)
      const raw = response.data.data
      return {
        profile: transformProfile(raw.profile),
        documents: raw.documents.map(transformDocument),
      }
    } catch (error) {
      throwApiError(error)
    }
  }

  async reviewDocument(
    merchantId: string,
    docId: string,
    payload: ReviewDocumentPayload,
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `/merchants/${merchantId}/kyc/documents/${docId}`,
        payload,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async finalizeApprove(merchantId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `/merchants/${merchantId}/kyc/finalize`,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }

  async requestResubmission(merchantId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>(
        `/merchants/${merchantId}/kyc/request-resubmission`,
      )
      return response.data
    } catch (error) {
      throwApiError(error)
    }
  }
}

export const merchantKycService = new MerchantKycService()
