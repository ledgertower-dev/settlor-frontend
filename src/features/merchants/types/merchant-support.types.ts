export interface SupportMember {
  id: string
  code: string
  name: string
  email: string
  phone: string
  status: string
  createdAt: string
}

export interface SupportMemberListParams {
  q?: string
  page?: number
  per_page?: number
}

export interface AssignSupportMembersRequest {
  support_user_ids: string[]
}
