'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Eye, EyeOff, Copy, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRolePath } from '@/hooks/use-role-prefix'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SimpleMultiSelect, type MultiSelectOption } from '@/components/ui/simple-multi-select'

import { useUser, useUpdateUser } from '../model/use-users'
import { useUsersUIStore } from '../model/users-ui-store'
import { DeactivateUserDialog } from './DeactivateUserDialog'
import { teamsService } from '@/features/teams'
import { rolesService } from '@/features/roles'
import { useResourcePermissions } from '@/features/access/model'
import { logger } from '@/lib/core/logger'
import {
  basicInfoSchema,
  teamsSchema,
  rolesSchema,
  type BasicInfoFormData,
  type TeamsFormData,
  type RolesFormData,
} from '../schemas/user-detail.schema'

interface UserDetailProps {
  userId: string
  mode?: 'view' | 'edit'
}

export function UserDetail({ userId, mode = 'view' }: UserDetailProps) {
  const router = useRouter()
  const rolePath = useRolePath()
  const { openTempPasswordModal, tempPasswordData, clearTempPassword } = useUsersUIStore()
  const [showPassword, setShowPassword] = useState(false)
  const [roleSearchQuery, setRoleSearchQuery] = useState('')
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'active' | 'inactive' | null>(null)

  // Permission check
  const { canUpdate } = useResourcePermissions('users')

  // Determine if fields should be editable
  const isEditable = mode === 'edit' && canUpdate

  // Handle mode toggle
  const handleEditMode = () => {
    router.push(rolePath(`/users/${userId}?mode=edit`))
  }

  const handleViewMode = () => {
    router.push(rolePath(`/users/${userId}?mode=view`))
  }

  // Clear temp password data when component unmounts
  React.useEffect(() => {
    return () => {
      clearTempPassword()
    }
  }, [clearTempPassword])

  // Fetch user data using TanStack Query
  const { data: userData, isLoading: userLoading, error: userError } = useUser(userId)

  // Fetch available teams and roles
  const { data: availableTeamsData } = useQuery({
    queryKey: ['teams', 'list'],
    queryFn: async () => {
      const response = await teamsService.getTeams()
      return response.success ? response.teams : []
    },
  })

  const { data: availableRolesData, isLoading: rolesSearchLoading } = useQuery({
    queryKey: ['roles', 'list', roleSearchQuery],
    queryFn: async () => {
      const response = await rolesService.getRoles({
        perPage: 100,
        search: roleSearchQuery || undefined,
      })
      return response.data?.items || []
    },
  })

  const user = userData?.user
  const availableTeams = availableTeamsData || []
  const availableRoles = availableRolesData || []
  const loading = userLoading

  const userTeams = React.useMemo<{ id: string; name: string }[]>(() => [], [])
  const userRoles = React.useMemo<{ id: string; name: string }[]>(() => [], [])

  // Separate forms
  const basicInfoForm = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: user?.name || '',
      status: user?.status === 'active' ? 'active' : 'inactive',
    },
  })

  const teamsForm = useForm<TeamsFormData>({
    resolver: zodResolver(teamsSchema),
    defaultValues: {
      teamIds: userTeams.map(t => t.id),
    },
  })

  const rolesForm = useForm<RolesFormData>({
    resolver: zodResolver(rolesSchema),
    defaultValues: {
      roleIds: userRoles.map(r => r.id),
    },
  })

  // Update form values when data loads
  React.useEffect(() => {
    if (user) {
      basicInfoForm.reset({
        name: user.name,
        status: user.status === 'active' ? 'active' : 'inactive',
      })
    }
  }, [user, basicInfoForm])

  React.useEffect(() => {
    if (userTeams) {
      teamsForm.setValue(
        'teamIds',
        userTeams.map(t => t.id),
      )
    }
  }, [userTeams, teamsForm])

  React.useEffect(() => {
    if (userRoles) {
      rolesForm.setValue(
        'roleIds',
        userRoles.map(r => r.id),
      )
    }
  }, [userRoles, rolesForm])

  // Mutations
  const updateUser = useUpdateUser({
    onSuccess: () => {
      toast.success('Basic information updated successfully')
    },
    onError: error => {
      toast.error(error.message || 'Failed to update basic information')
    },
  })

  // Submit handlers
  const onBasicInfoSubmit = (data: BasicInfoFormData) => {
    if (!user) return
    if (!isEditable) {
      toast.error("You don't have permission to update users")
      return
    }
    updateUser.mutate({
      userId: user.id,
      data: {
        name: data.name,
        status: data.status,
      },
    })
  }

  const _onTeamsSubmit = (_data: TeamsFormData) => {
    toast.error('Team assignment is not available yet')
  }

  const onRolesSubmit = (_data: RolesFormData) => {
    toast.error('Role assignment is not available yet')
  }

  const handleGenerateTempPassword = () => {
    toast.error('Temporary password generation is not available yet')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      logger.error('Failed to copy to clipboard', { error: String(error) })
      toast.error('Failed to copy to clipboard')
    }
  }

  // Transform teams and roles to MultiSelectOption format
  const _teamOptions: MultiSelectOption[] = availableTeams.map(team => ({
    label: team.name,
    value: team.id,
    description: team.description,
  }))

  const roleOptions: MultiSelectOption[] = availableRoles.map(role => ({
    label: role.name,
    value: role.id,
    description: role.description,
  }))

  if (userError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>{userError.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={rolePath('/users')} className="hover:text-foreground">
          <AppIcon icon={ArrowLeft} size="sm" />
        </Link>
        <span>/</span>
        <Link href={rolePath('/users')} className="hover:text-foreground">
          Users
        </Link>
        <span>/</span>
        <span className="text-foreground">{user.name}</span>
      </div>

      {/* Header with mode toggle */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{user.name}</h1>
            <Badge variant={mode === 'edit' ? 'default' : 'secondary'}>
              {mode === 'edit' ? 'Edit Mode' : 'View Mode'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        </div>
        {canUpdate && (
          <div className="flex gap-2">
            {mode === 'view' ? (
              <Button onClick={handleEditMode} variant="default">
                <AppIcon icon={Pencil} size="sm" className="mr-2" />
                Edit
              </Button>
            ) : (
              <Button onClick={handleViewMode} variant="outline">
                <AppIcon icon={Eye} size="sm" className="mr-2" />
                View Mode
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Temporary Password Alert */}
      {tempPasswordData && (
        <Alert>
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Temporary password for <strong>{tempPasswordData.userName}</strong>:
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(tempPasswordData.password)}
              >
                <AppIcon icon={Copy} size="sm" className="mr-2" />
                Copy
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 font-mono text-sm bg-muted px-2 py-1 rounded">
                {showPassword ? tempPasswordData.password : '••••••••••••'}
              </code>
              <Button size="sm" variant="ghost" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <AppIcon icon={EyeOff} color="muted" />
                ) : (
                  <AppIcon icon={Eye} color="muted" />
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* User Details Card with Separate Sections */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Manage user information, teams, and role assignments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <Form {...basicInfoForm}>
              <form onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={basicInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} disabled={!isEditable} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicInfoForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={(value: 'active' | 'inactive') => {
                            // If changing from active to inactive, show confirmation dialog
                            if (field.value === 'active' && value === 'inactive') {
                              setPendingStatus(value)
                              setShowDeactivateDialog(true)
                            } else {
                              // For other changes (inactive to active), apply directly
                              field.onChange(value)
                            }
                          }}
                          defaultValue={field.value}
                          disabled={!isEditable}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Email Address</FormLabel>
                    <Input value={user.email} disabled className="mt-2" />
                  </div>

                  <div>
                    <FormLabel>Created Date</FormLabel>
                    <Input
                      value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      disabled
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Last Updated</FormLabel>
                    <Input
                      value={user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                      disabled
                      className="mt-2"
                    />
                  </div>
                  {user.mustChangePassword && (
                    <div>
                      <FormLabel>Password Status</FormLabel>
                      <div className="mt-2">
                        <Badge variant="outline" className="border-amber-200 text-amber-600">
                          Password Change Required
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {isEditable && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateUser.isPending}>
                      {updateUser.isPending ? 'Saving...' : 'Save Basic Info'}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>

          <Separator />

          {/* Teams Assignment Section */}
          {/* <div className="space-y-4">
            <h3 className="text-lg font-medium">Teams Assignment</h3>
            <Form {...teamsForm}>
              <form onSubmit={teamsForm.handleSubmit(onTeamsSubmit)} className="space-y-4">
                <FormField
                  control={teamsForm.control}
                  name="teamIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Teams</FormLabel>
                      <FormControl>
                        <SimpleMultiSelect
                          options={teamOptions}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Search and select teams..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit">
                    Update Teams
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <Separator /> */}

          {/* Roles Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Roles Assignment</h3>
            <Form {...rolesForm}>
              <form onSubmit={rolesForm.handleSubmit(onRolesSubmit)} className="space-y-4">
                <FormField
                  control={rolesForm.control}
                  name="roleIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Roles</FormLabel>
                      <FormControl>
                        <SimpleMultiSelect
                          options={roleOptions}
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Search and select roles..."
                          onSearchChange={setRoleSearchQuery}
                          isSearchLoading={rolesSearchLoading}
                          disabled={!isEditable}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isEditable && (
                  <div className="flex justify-end">
                    <Button type="submit">Update Roles</Button>
                  </div>
                )}
              </form>
            </Form>
          </div>

          {isEditable && <Separator />}

          {/* Password Management Section */}
          {isEditable && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Password Management</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Generate a temporary password for this user
                  </p>
                  {user.mustChangePassword && (
                    <Badge variant="outline" className="border-amber-200 text-amber-600 mt-2">
                      Password Change Required
                    </Badge>
                  )}
                </div>
                <Button onClick={handleGenerateTempPassword}>
                  <AppIcon icon={KeyRound} size="sm" className="mr-2" />
                  Generate Password
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deactivate User Confirmation Dialog */}
      <DeactivateUserDialog
        userName={user.name}
        userEmail={user.email}
        open={showDeactivateDialog}
        onOpenChange={open => {
          setShowDeactivateDialog(open)
          if (!open) {
            setPendingStatus(null)
          }
        }}
        onConfirm={() => {
          if (pendingStatus) {
            basicInfoForm.setValue('status', pendingStatus, { shouldDirty: true })
          }
          setShowDeactivateDialog(false)
          setPendingStatus(null)
        }}
      />
    </div>
  )
}
