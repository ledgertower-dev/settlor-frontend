/**
 * Teams API Service
 *
 * Connects to the application RBAC backend at localhost:3001
 */

import apiClient from '@/lib/api/api-client'
import { throwApiError } from '@/lib/api/error-handler'
import type {
  Team,
  TeamMember,
  RoleWithAssignDate,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMembersRequest,
  AddTeamRolesRequest,
} from '../types'
import type { BackendMutationResponse } from '@/lib/types/api-types'

/**
 * Backend Response Types (matching API documentation)
 */
interface BackendTeamListItem {
  id: string
  name: string
  description: string
  memberCount: number
  isSystemLocked: boolean
  createdAt: string
  updatedAt: string
}

interface BackendTeamsListResponse {
  success: boolean
  data: {
    teams: BackendTeamListItem[]
  }
  timestamp?: string
}

interface BackendTeamDetailResponse {
  success: boolean
  data: {
    team: BackendTeamListItem
  }
  timestamp?: string
}

interface BackendTeamMember {
  id: string
  email: string
  name: string
  status: 'active' | 'inactive'
  joinedAt: string
}

interface BackendTeamMembersResponse {
  success: boolean
  data: {
    members: BackendTeamMember[]
  }
  timestamp?: string
}

interface BackendRole {
  id: string
  name: string
  description: string
  isSystemLocked?: boolean
  permissionsEditable?: boolean
  assignedAt: string
}

interface BackendTeamRolesResponse {
  success: boolean
  data: {
    roles: BackendRole[]
  }
  timestamp?: string
}

/**
 * Teams Service
 */
class TeamsService {
  /**
   * Get all teams
   */
  async getTeams(): Promise<{ success: boolean; teams: Team[] }> {
    try {
      const response = await apiClient.get<BackendTeamsListResponse>('/teams')

      return {
        success: true,
        teams: response.data.data.teams,
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<{ success: boolean; team: Team }> {
    try {
      const response = await apiClient.get<BackendTeamDetailResponse>(`/teams/${teamId}`)

      return {
        success: true,
        team: response.data.data.team,
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Create new team
   */
  async createTeam(data: CreateTeamRequest): Promise<{ success: boolean; team: Team }> {
    try {
      const response = await apiClient.post<BackendTeamDetailResponse>('/teams', data)

      return {
        success: true,
        team: response.data.data.team,
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Update team
   */
  async updateTeam(
    teamId: string,
    data: UpdateTeamRequest,
  ): Promise<{ success: boolean; team: Team }> {
    try {
      const response = await apiClient.patch<BackendTeamDetailResponse>(`/teams/${teamId}`, data)

      return {
        success: true,
        team: response.data.data.team,
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Delete team
   * Returns HTTP 204 No Content
   */
  async deleteTeam(teamId: string): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.delete(`/teams/${teamId}`)

      return {
        success: true,
        message: 'Team deleted successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Get team members
   * Backend returns status: 'active' | 'inactive', Frontend uses status: 'active' | 'inactive'
   */
  async getTeamMembers(teamId: string): Promise<{ success: boolean; members: TeamMember[] }> {
    try {
      const response = await apiClient.get<BackendTeamMembersResponse>(`/teams/${teamId}/members`)

      return {
        success: true,
        members: response.data.data.members.map(member => ({
          id: member.id,
          email: member.email,
          name: member.name,
          status: member.status, // Backend already returns 'active' | 'inactive'
          joinedAt: member.joinedAt,
        })),
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Add members to team
   */
  async addTeamMembers(
    teamId: string,
    data: AddTeamMembersRequest,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<BackendMutationResponse>(
        `/teams/${teamId}/members`,
        data,
      )

      return {
        success: true,
        message: response.data.message || 'Members added to team successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Remove member from team
   * Returns HTTP 204 No Content
   */
  async removeTeamMember(
    teamId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.delete(`/teams/${teamId}/members/${userId}`)

      return {
        success: true,
        message: 'Member removed from team successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Get team roles
   */
  async getTeamRoles(teamId: string): Promise<{ success: boolean; roles: RoleWithAssignDate[] }> {
    try {
      const response = await apiClient.get<BackendTeamRolesResponse>(`/teams/${teamId}/roles`)

      // Map backend roles to include isSystemLocked if present
      const roles: RoleWithAssignDate[] = response.data.data.roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        assignedAt: role.assignedAt,
        isSystemLocked: role.isSystemLocked || false,
        permissionsEditable: role.permissionsEditable ?? !(role.isSystemLocked || false),
        createdAt: role.assignedAt, // Use assignedAt as fallback for createdAt
        updatedAt: role.assignedAt, // Use assignedAt as fallback for updatedAt
      }))

      return {
        success: true,
        roles,
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Add roles to team
   */
  async addTeamRoles(
    teamId: string,
    data: AddTeamRolesRequest,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<BackendMutationResponse>(`/teams/${teamId}/roles`, data)

      return {
        success: true,
        message: response.data.message || 'Roles added to team successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }

  /**
   * Remove role from team
   * Returns HTTP 204 No Content
   */
  async removeTeamRole(
    teamId: string,
    roleId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await apiClient.delete(`/teams/${teamId}/roles/${roleId}`)

      return {
        success: true,
        message: 'Role removed from team successfully',
      }
    } catch (error: unknown) {
      throwApiError(error)
    }
  }
}

// Export singleton instance
export const teamsService = new TeamsService()
