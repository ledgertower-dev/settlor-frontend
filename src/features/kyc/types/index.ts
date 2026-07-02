export interface DocumentType {
  docType: string
  label: string
  required: boolean
}

export interface DocumentTypesResponse {
  documents: DocumentType[]
  acceptedFormats: string[]
  acceptedExtensions: string[]
}

export interface KycPresignRequest {
  filename: string
  content_type: string
  size: number
}

export interface KycPresignResponse {
  upload_url: string
  file_key: string
  expires_in: number
}

export interface KycUploadConfirmResponse {
  id: string
  file_key: string
  filename: string
  content_type: string
  size: number
  url: string
  created_at: string
}

export type DocUploadStatus = 'idle' | 'presigning' | 'uploading' | 'confirming' | 'done' | 'error'

export interface DocUploadState {
  file: File
  uploadId: string | null
  status: DocUploadStatus
  progress: number
  error: string | null
}

export interface KycSubmitPayload {
  business_type: string
  business_name: string
  business_email: string
  business_mobile: string
  website?: string
  company_pan: string
  documents: { doc_type: string; upload_id: string }[]
}

// Resubmit application response (mirrors backend DetailResponse)
export interface ResubmitProfile {
  id: string
  merchantId: string
  businessType: string
  businessName: string
  businessEmail: string
  businessMobile: string
  website?: string
  companyPan: string
  kycStatus: string
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
}

export interface ResubmitDocument {
  id: string
  docType: string
  label: string
  status: string // PENDING | APPROVED | REJECTED
  rejectionRemarks?: string
  version: number
}

export interface ResubmitApplicationResponse {
  profile: ResubmitProfile
  documents: ResubmitDocument[]
}
