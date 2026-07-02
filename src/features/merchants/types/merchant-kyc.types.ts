export type KycProfileStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'CHANGES_REQUESTED'

export type KycDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface KycProfile {
  id: string
  merchantId: string
  businessType: string
  businessName: string
  businessEmail: string
  businessMobile: string
  website?: string
  companyPan: string
  kycStatus: KycProfileStatus
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
}

export interface KycDocument {
  id: string
  docType: string
  label: string
  status: KycDocumentStatus
  rejectionRemarks?: string
  version: number
  viewUrl?: string
}

export interface KycDetailResponse {
  profile: KycProfile
  documents: KycDocument[]
}

export interface ReviewDocumentPayload {
  action: 'approve' | 'reject'
  remarks?: string
}
