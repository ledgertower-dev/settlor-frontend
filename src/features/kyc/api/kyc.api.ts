import axios from 'axios'

import { env } from '@/lib/core/env'
import { throwApiError } from '@/lib/api/error-handler'
import type {
  DocumentTypesResponse,
  KycPresignRequest,
  KycPresignResponse,
  KycUploadConfirmResponse,
  KycSubmitPayload,
  ResubmitApplicationResponse,
} from '../types'

interface ApiSuccessResponse<T> {
  success: boolean
  data: T
}

interface BackendDocumentType {
  doc_type: string
  label: string
  required: boolean
}

interface BackendDocumentTypesData {
  documents: BackendDocumentType[]
  accepted_formats: string[]
  accepted_extensions: string[]
}

interface BackendResubmitProfile {
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

interface BackendResubmitDocument {
  id: string
  doc_type: string
  label: string
  status: string
  rejection_remarks?: string
  version: number
}

interface BackendResubmitApplicationData {
  profile: BackendResubmitProfile
  documents: BackendResubmitDocument[]
}

/**
 * Lightweight axios instance for KYC endpoints.
 * Does NOT send cookies, X-Auth-Mode, or CSRF tokens — only X-KYC-Token.
 * This avoids CORS preflight failures that apiClient would trigger.
 */
const kycClient = axios.create({
  baseURL: `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

function kycHeaders(token: string) {
  return { 'X-KYC-Token': token }
}

class KycService {
  async getDocumentTypes(): Promise<DocumentTypesResponse> {
    try {
      const response =
        await kycClient.get<ApiSuccessResponse<BackendDocumentTypesData>>('/kyc/document-types')

      const data = response.data.data
      return {
        documents: data.documents.map(doc => ({
          docType: doc.doc_type,
          label: doc.label,
          required: doc.required,
        })),
        acceptedFormats: data.accepted_formats,
        acceptedExtensions: data.accepted_extensions,
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  async presignUpload(token: string, body: KycPresignRequest): Promise<KycPresignResponse> {
    try {
      const response = await kycClient.post<ApiSuccessResponse<KycPresignResponse>>(
        '/kyc/uploads/presign',
        body,
        { headers: kycHeaders(token) },
      )
      return response.data.data
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  async uploadToStorage(
    url: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> {
    const rawAxios = axios.create({ transformRequest: [d => d] })
    try {
      await rawAxios.put(url, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        onUploadProgress: e => {
          if (!onProgress || !e.total) return
          onProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  async confirmUpload(token: string, fileKey: string): Promise<KycUploadConfirmResponse> {
    try {
      const response = await kycClient.post<ApiSuccessResponse<KycUploadConfirmResponse>>(
        '/kyc/uploads/confirm',
        { file_key: fileKey },
        { headers: kycHeaders(token) },
      )
      return response.data.data
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Full 3-step upload: presign → PUT to storage → confirm.
   * Returns the upload_id for use in the submit payload.
   */
  async uploadDocument(
    token: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    const contentType = file.type || 'application/octet-stream'

    const presigned = await this.presignUpload(token, {
      filename: file.name,
      content_type: contentType,
      size: file.size,
    })

    await this.uploadToStorage(presigned.upload_url, file, onProgress)

    const confirmed = await this.confirmUpload(token, presigned.file_key)
    return confirmed.id
  }

  async submitKyc(token: string, payload: KycSubmitPayload): Promise<{ message: string }> {
    try {
      const response = await kycClient.post<ApiSuccessResponse<{ message: string }>>(
        '/kyc/submit',
        payload,
        { headers: kycHeaders(token) },
      )
      return response.data.data
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  async getResubmitApplication(token: string): Promise<ResubmitApplicationResponse> {
    try {
      const response = await kycClient.get<ApiSuccessResponse<BackendResubmitApplicationData>>(
        '/kyc/resubmit',
        { headers: kycHeaders(token) },
      )
      const data = response.data.data
      return {
        profile: {
          id: data.profile.id,
          merchantId: data.profile.merchant_id,
          businessType: data.profile.business_type,
          businessName: data.profile.business_name,
          businessEmail: data.profile.business_email,
          businessMobile: data.profile.business_mobile,
          website: data.profile.website,
          companyPan: data.profile.company_pan,
          kycStatus: data.profile.kyc_status,
          submittedAt: data.profile.submitted_at,
          reviewedAt: data.profile.reviewed_at,
          createdAt: data.profile.created_at,
        },
        documents: data.documents.map(doc => ({
          id: doc.id,
          docType: doc.doc_type,
          label: doc.label,
          status: doc.status,
          rejectionRemarks: doc.rejection_remarks,
          version: doc.version,
        })),
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  async resubmitDocuments(
    token: string,
    documents: { doc_type: string; upload_id: string }[],
  ): Promise<{ message: string }> {
    try {
      const response = await kycClient.post<ApiSuccessResponse<{ message: string }>>(
        '/kyc/resubmit',
        { documents },
        { headers: kycHeaders(token) },
      )
      return response.data.data
    } catch (error: unknown) {
      throwApiError(error)
    }
  }
}

export const kycService = new KycService()
