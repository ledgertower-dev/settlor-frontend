import type {
  Team,
  TeamMember,
  RoleWithAssignDate,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMembersRequest,
  AddTeamRolesRequest,
} from '@/lib/types/api-types'

export type {
  Team,
  TeamMember,
  RoleWithAssignDate,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMembersRequest,
  AddTeamRolesRequest,
}

export interface TeamFilters {
  search: string
  page: number
  perPage: number
  sort: 'name' | 'memberCount' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}

export interface TeamTableRow extends Team {
  // Additional fields can be added here as needed
  memberCount: number
}
