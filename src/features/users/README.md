# Users Feature

Comprehensive user management for the application RBAC system. Supports CRUD operations, team and role assignments, temporary password management, and user status tracking.

## Architecture

This feature uses the modern TanStack Query + Zustand architecture:

- **TanStack Query Hooks** (`model/use-users.ts`): Server state management
- **Zustand UI Store** (`model/users-ui-store.ts`): Client UI state
- **API Service** (`api/users.api.ts`): HTTP client and request/response handling

## Directory Structure

```
users/
├── api/
│   ├── users.api.ts          # API service layer
│   └── index.ts
├── components/
│   ├── CreateUserModal.tsx
│   ├── EditUserModal.tsx
│   ├── DeleteUserDialog.tsx
│   ├── ManageUserTeamsModal.tsx
│   ├── ManageUserRolesModal.tsx
│   ├── TempPasswordModal.tsx
│   ├── UsersList.tsx
│   └── ...
├── model/
│   ├── use-users.ts          # TanStack Query hooks
│   └── users-ui-store.ts     # Zustand UI state store
├── types/
│   └── index.ts              # TypeScript types
└── index.ts                  # Barrel exports
```

## Query Hooks

### Query Hooks (Fetching Data)

#### `useUsers(params, options)`

Fetches paginated list of users with search and filtering.

```tsx
import { useUsers } from '@/features/users/model/use-users'

function UsersList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useUsers({
    page,
    perPage: 10,
    q: search,
  })

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  const users = data?.data.items ?? []
  const pagination = data?.meta?.pagination

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <UsersTable users={users} />
      <Pagination page={page} totalPages={pagination?.totalPages ?? 0} onPageChange={setPage} />
    </div>
  )
}
```

**Parameters:**

- `params`: `UserListParams` - Search, pagination, sorting options
- `options`: React Query options (optional)

**Returns:**

```typescript
{
  data: {
    items: User[]
  },
  meta: {
    pagination: {
      page: number
      perPage: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
}
```

#### `useUser(userId, options)`

Fetches a single user by ID.

```tsx
import { useUser } from '@/features/users/model/use-users'

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = useUser(userId)

  if (isLoading) return <Spinner />

  const user = data?.user

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      <Badge>{user?.status}</Badge>
      {user?.mustChangePassword && <Alert>User must change password on next login</Alert>}
    </div>
  )
}
```

**Note:** Hook is automatically disabled if `userId` is `undefined`.

#### `useUserTeams(userId, options)`

Fetches teams that a user belongs to.

```tsx
import { useUserTeams } from '@/features/users/model/use-users'

function UserTeams({ userId }: { userId: string }) {
  const { data, isLoading } = useUserTeams(userId)

  const teams = data?.teams ?? []

  return (
    <div>
      <h2>Teams</h2>
      <ul>
        {teams.map(team => (
          <li key={team.id}>
            {team.name}
            {team.isSystemLocked && <Badge>System</Badge>}
            <span className="text-sm text-gray-500">
              Joined: {new Date(team.joinedAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### `useUserRoles(userId, options)`

Fetches roles directly assigned to a user (not team roles).

```tsx
import { useUserRoles } from '@/features/users/model/use-users'

function UserRoles({ userId }: { userId: string }) {
  const { data, isLoading } = useUserRoles(userId)

  const roles = data?.roles ?? []

  return (
    <div>
      <h2>Direct Roles</h2>
      <ul>
        {roles.map(role => (
          <li key={role.id}>
            {role.name}
            {role.isSystemLocked && <Badge>System</Badge>}
            <span className="text-sm text-gray-500">
              Assigned: {new Date(role.assignedAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Mutation Hooks (Modifying Data)

#### `useCreateUser(options)`

Creates a new user with optional team and role assignments.

```tsx
import { useCreateUser } from '@/features/users/model/use-users'
import { useUsersUIStore } from '@/features/users/model/users-ui-store'

function CreateUserModal() {
  const createUser = useCreateUser()
  const { closeModal, openTempPasswordModal } = useUsersUIStore()

  const handleSubmit = (formData: CreateUserRequest) => {
    createUser.mutate(formData, {
      onSuccess: data => {
        toast.success('User created successfully')

        // Show temporary password if generated
        if (data.tempPassword) {
          openTempPasswordModal({
            userId: data.user.id,
            userEmail: data.user.email,
            tempPassword: data.tempPassword,
          })
        }

        closeModal()
      },
      onError: error => {
        toast.error(`Failed to create user: ${error.message}`)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input name="name" label="Name" required />
      <Input name="email" label="Email" type="email" required />

      {/* Team selection */}
      <MultiSelect name="teamIds" label="Teams" options={teams} />

      {/* Role selection */}
      <MultiSelect name="roleIds" label="Roles" options={roles} />

      <Button disabled={createUser.isPending}>
        {createUser.isPending ? 'Creating...' : 'Create User'}
      </Button>
    </form>
  )
}
```

**Request Type:**

```typescript
interface CreateUserRequest {
  name: string
  email: string
  teamIds?: string[] // Optional team assignments
  roleIds?: string[] // Optional direct role assignments
}
```

**Response:**

```typescript
{
  user: User
  tempPassword?: string  // Auto-generated password
}
```

#### `useUpdateUser(options)`

Updates user details (name, email, status).

```tsx
import { useUpdateUser } from '@/features/users/model/use-users'

function EditUserModal({ userId }: { userId: string }) {
  const { data } = useUser(userId)
  const updateUser = useUpdateUser()

  const handleSubmit = (formData: UpdateUserRequest) => {
    updateUser.mutate(
      { userId, data: formData },
      {
        onSuccess: () => {
          toast.success('User updated successfully')
          closeModal()
        },
        onError: error => {
          toast.error(`Update failed: ${error.message}`)
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input name="name" defaultValue={data?.user.name} />
      <Input name="email" defaultValue={data?.user.email} />
      <Select name="status" defaultValue={data?.user.status}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>

      <Button disabled={updateUser.isPending}>
        {updateUser.isPending ? 'Updating...' : 'Update'}
      </Button>
    </form>
  )
}
```

**Note:** The API service automatically transforms `status: 'active' | 'inactive'` to backend's `isActive: boolean`.

#### `useDeleteUser(options)`

Deletes a user from the system.

```tsx
import { useDeleteUser } from '@/features/users/model/use-users'

function DeleteUserDialog({ userId }: { userId: string }) {
  const deleteUser = useDeleteUser()
  const { data } = useUser(userId)

  const handleDelete = () => {
    deleteUser.mutate(userId, {
      onSuccess: () => {
        toast.success('User deleted successfully')
        onClose()
      },
      onError: error => {
        toast.error(`Delete failed: ${error.message}`)
      },
    })
  }

  return (
    <Dialog>
      <DialogContent>
        <h2>Delete User</h2>
        <p>Are you sure you want to delete {data?.user.name}?</p>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
          {deleteUser.isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

#### `useUpdateUserTeams(options)`

Updates a user's team memberships.

```tsx
import { useUpdateUserTeams } from '@/features/users/model/use-users'

function ManageUserTeamsModal({ userId }: { userId: string }) {
  const { data: userTeams } = useUserTeams(userId)
  const updateTeams = useUpdateUserTeams()

  const handleSave = (selectedTeamIds: string[]) => {
    updateTeams.mutate(
      {
        userId,
        data: { teamIds: selectedTeamIds },
      },
      {
        onSuccess: () => {
          toast.success('Teams updated successfully')
          closeModal()
        },
      },
    )
  }

  const currentTeamIds = userTeams?.teams.map(t => t.id) ?? []

  return (
    <Dialog>
      <TeamSelector selectedTeamIds={currentTeamIds} onChange={handleSave} />
      <Button onClick={() => handleSave(currentTeamIds)} disabled={updateTeams.isPending}>
        {updateTeams.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </Dialog>
  )
}
```

**Request:**

```typescript
{
  teamIds: string[]  // Complete list of team IDs (replaces current)
}
```

#### `useUpdateUserRoles(options)`

Updates a user's direct role assignments.

```tsx
import { useUpdateUserRoles } from '@/features/users/model/use-users'

function ManageUserRolesModal({ userId }: { userId: string }) {
  const { data: userRoles } = useUserRoles(userId)
  const updateRoles = useUpdateUserRoles()

  const handleSave = (selectedRoleIds: string[]) => {
    updateRoles.mutate(
      {
        userId,
        data: { roleIds: selectedRoleIds },
      },
      {
        onSuccess: () => {
          toast.success('Roles updated successfully')
        },
      },
    )
  }

  const currentRoleIds = userRoles?.roles.map(r => r.id) ?? []

  return (
    <RoleSelector
      selectedRoleIds={currentRoleIds}
      onChange={handleSave}
      isSubmitting={updateRoles.isPending}
    />
  )
}
```

#### `useReissueTempPassword(options)`

Generates a new temporary password for a user.

```tsx
import { useReissueTempPassword } from '@/features/users/model/use-users'

function ReissuePasswordButton({ userId }: { userId: string }) {
  const reissuePassword = useReissueTempPassword()
  const { openTempPasswordModal } = useUsersUIStore()

  const handleReissue = () => {
    reissuePassword.mutate(userId, {
      onSuccess: data => {
        // Show the new password to admin
        openTempPasswordModal({
          userId,
          userEmail: user.email,
          tempPassword: data.tempPassword,
        })
        toast.success('Temporary password generated')
      },
      onError: () => {
        toast.error('Failed to generate password')
      },
    })
  }

  return (
    <Button onClick={handleReissue} disabled={reissuePassword.isPending}>
      {reissuePassword.isPending ? 'Generating...' : 'Re-issue Temp Password'}
    </Button>
  )
}
```

**Important:** The new password is shown once in the UI and sent via email to the user.

## UI Store

The Zustand store manages client-side UI state including modals, filters, and selected users.

### Store State

```typescript
interface UsersUIState {
  // Modal States
  openModal: ModalType | null // 'create' | 'edit' | 'delete' | 'manage-teams' | 'manage-roles' | 'temp-password'
  selectedUser: User | null
  tempPasswordData: TempPasswordData | null

  // Filter States
  filters: {
    search: string
    status: 'all' | 'active' | 'inactive'
    page: number
    perPage: number
    sort: 'name' | 'email' | 'createdAt'
    sortOrder: 'asc' | 'desc'
  }

  // Actions
  openCreateModal: () => void
  openEditModal: (user: User) => void
  openDeleteModal: (user: User) => void
  openManageTeamsModal: (user: User) => void
  openManageRolesModal: (user: User) => void
  openTempPasswordModal: (data: TempPasswordData) => void
  closeModal: () => void
  setSearch: (search: string) => void
  setStatusFilter: (status: UserStatus | 'all') => void
  setPage: (page: number) => void
  setPerPage: (perPage: number) => void
  setSort: (sort: string, sortOrder: 'asc' | 'desc') => void
  resetFilters: () => void
  clearTempPassword: () => void
}
```

### Usage Examples

#### Managing Modals

```tsx
import { useUsersUIStore } from '@/features/users/model/users-ui-store'

function UsersPage() {
  const {
    openCreateModal,
    openEditModal,
    openDeleteModal,
    openManageTeamsModal,
    openManageRolesModal,
  } = useUsersUIStore()

  return (
    <div>
      <Button onClick={openCreateModal}>Create User</Button>

      <UsersTable
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onManageTeams={openManageTeamsModal}
        onManageRoles={openManageRolesModal}
      />
    </div>
  )
}
```

#### Using Filters with Query Hooks

```tsx
import { useUsers } from '@/features/users/model/use-users'
import { useUsersUIStore } from '@/features/users/model/users-ui-store'

function UsersListWithFilters() {
  const { filters, setSearch, setStatusFilter, setPage, resetFilters } = useUsersUIStore()

  // Query automatically refetches when filters change
  const { data, isLoading } = useUsers({
    q: filters.search,
    page: filters.page,
    perPage: filters.perPage,
  })

  return (
    <div>
      <div className="filters">
        <SearchInput value={filters.search} onChange={setSearch} />
        <Select value={filters.status} onChange={setStatusFilter}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Button onClick={resetFilters}>Reset</Button>
      </div>

      {isLoading ? <Spinner /> : <UsersTable users={data?.data.items ?? []} />}

      <Pagination page={filters.page} onPageChange={setPage} />
    </div>
  )
}
```

**Note:** Changing search or status filter automatically resets page to 1.

#### Displaying Temporary Password

```tsx
import { useUsersUIStore } from '@/features/users/model/users-ui-store'

function TempPasswordModal() {
  const { openModal, tempPasswordData, closeModal, clearTempPassword } = useUsersUIStore()

  const handleClose = () => {
    closeModal()
    clearTempPassword()
  }

  if (openModal !== 'temp-password' || !tempPasswordData) {
    return null
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent>
        <h2>Temporary Password Generated</h2>
        <p>User: {tempPasswordData.userEmail}</p>

        <div className="password-display">
          <code>{tempPasswordData.tempPassword}</code>
          <CopyButton value={tempPasswordData.tempPassword} />
        </div>

        <Alert>
          This password will only be shown once. Make sure to save it. An email has been sent to the
          user.
        </Alert>

        <Button onClick={handleClose}>Close</Button>
      </DialogContent>
    </Dialog>
  )
}
```

## Complete Component Example

Here's a complete example combining query hooks and UI store:

```tsx
import { useUser, useDeleteUser } from '@/features/users/model/use-users'
import { useUsersUIStore } from '@/features/users/model/users-ui-store'

function DeleteUserDialog() {
  // UI state from Zustand
  const { openModal, selectedUser, closeModal } = useUsersUIStore()

  // Server data from TanStack Query
  const { data: userData } = useUser(selectedUser?.id)
  const deleteUser = useDeleteUser()

  if (openModal !== 'delete' || !selectedUser) {
    return null
  }

  const user = userData?.user ?? selectedUser

  const handleDelete = () => {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast.success(`${user.name} has been deleted`)
        closeModal()
      },
      onError: error => {
        toast.error(`Failed to delete user: ${error.message}`)
      },
    })
  }

  return (
    <Dialog open onOpenChange={closeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>

        <div>
          <p>
            Are you sure you want to delete <strong>{user.name}</strong>?
          </p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <Alert variant="destructive">
          <AlertDescription>
            This action cannot be undone. The user will be permanently removed from the system.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={closeModal} disabled={deleteUser.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
            {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Query Keys

All query keys follow a hierarchical structure:

```typescript
;['users', 'list', params][('users', 'detail', userId)][('users', 'detail', userId, 'teams')][ // Paginated user list // Single user detail // User's teams
  ('users', 'detail', userId, 'roles')
] // User's roles
```

The `userKeys` helper provides type-safe key generation:

```typescript
import { userKeys } from '@/features/users/model/use-users'

userKeys.all() // ['users']
userKeys.lists() // ['users', 'list']
userKeys.list({ page: 1 }) // ['users', 'list', { page: 1 }]
userKeys.detail('user-123') // ['users', 'detail', 'user-123']
userKeys.teams('user-123') // ['users', 'detail', 'user-123', 'teams']
userKeys.roles('user-123') // ['users', 'detail', 'user-123', 'roles']
```

See [Query Keys Documentation](../../docs/QUERY_KEYS.md) for more details.

## Best Practices

### 1. Handle Status Field Transformation

The backend uses `isActive: boolean`, but the frontend uses `status: 'active' | 'inactive'`. The API service handles this automatically:

```tsx
// ✅ Good: Use frontend types
const updateUser = useUpdateUser()
updateUser.mutate({
  userId: 'user-123',
  data: { status: 'inactive' },
})

// ❌ Bad: Don't use backend types
updateUser.mutate({
  userId: 'user-123',
  data: { isActive: false }, // Type error!
})
```

### 2. Always Show Temp Password After User Creation

```tsx
const createUser = useCreateUser()
const { openTempPasswordModal } = useUsersUIStore()

createUser.mutate(formData, {
  onSuccess: data => {
    if (data.tempPassword) {
      // Always show the password to admin
      openTempPasswordModal({
        userId: data.user.id,
        userEmail: data.user.email,
        tempPassword: data.tempPassword,
      })
    }
  },
})
```

### 3. Reset Filters When Appropriate

```tsx
const { resetFilters, setSearch } = useUsersUIStore()

// Reset filters when changing views
useEffect(() => {
  resetFilters()
}, [resetFilters])

// Or provide a reset button
<Button onClick={resetFilters}>Clear Filters</Button>
```

### 4. Use Selected User from Store

```tsx
// ✅ Good: Use selectedUser from store
const { selectedUser } = useUsersUIStore()
const { data } = useUser(selectedUser?.id)

// ❌ Bad: Pass user ID through multiple props
<EditModal userId={userId} userName={userName} userEmail={userEmail} />
```

### 5. Handle Pagination Properly

```tsx
const { filters, setPage } = useUsersUIStore()
const { data } = useUsers({ page: filters.page, perPage: filters.perPage })

const pagination = data?.meta?.pagination

// Always check for pagination data
if (pagination) {
  return (
    <Pagination
      currentPage={pagination.page}
      totalPages={pagination.totalPages}
      hasNextPage={pagination.hasNextPage}
      hasPrevPage={pagination.hasPrevPage}
      onPageChange={setPage}
    />
  )
}
```

## Common Patterns

### Pattern 1: Filtered List + Pagination

```tsx
function UsersPage() {
  const { filters, setSearch, setPage } = useUsersUIStore()
  const { data, isLoading } = useUsers({
    q: filters.search,
    page: filters.page,
    perPage: filters.perPage,
  })

  return (
    <div>
      <SearchBar value={filters.search} onChange={setSearch} />
      {isLoading ? <Spinner /> : <UsersTable users={data?.data.items} />}
      <Pagination page={filters.page} onPageChange={setPage} />
    </div>
  )
}
```

### Pattern 2: User Detail with Related Data

```tsx
function UserDetailPage({ userId }: { userId: string }) {
  // Fetch user detail
  const { data: userData } = useUser(userId)

  // Fetch related data (automatically disabled if userId is undefined)
  const { data: teamsData } = useUserTeams(userId)
  const { data: rolesData } = useUserRoles(userId)

  return (
    <div>
      <UserProfile user={userData?.user} />
      <UserTeams teams={teamsData?.teams} />
      <UserRoles roles={rolesData?.roles} />
    </div>
  )
}
```

### Pattern 3: Multi-Step User Creation

```tsx
function CreateUserWizard() {
  const createUser = useCreateUser()
  const { openTempPasswordModal, closeModal } = useUsersUIStore()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CreateUserRequest>>({})

  const handleFinish = () => {
    createUser.mutate(formData as CreateUserRequest, {
      onSuccess: data => {
        if (data.tempPassword) {
          openTempPasswordModal({
            userId: data.user.id,
            userEmail: data.user.email,
            tempPassword: data.tempPassword,
          })
        }
        closeModal()
      },
    })
  }

  return (
    <Wizard step={step} onStepChange={setStep}>
      <Step1 data={formData} onChange={setFormData} />
      <Step2 data={formData} onChange={setFormData} />
      <Step3 data={formData} onFinish={handleFinish} />
    </Wizard>
  )
}
```

## TypeScript Types

```typescript
import type {
  User,
  UserStatus,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserTeamsRequest,
  UpdateUserRolesRequest,
  TeamWithJoinDate,
  RoleWithAssignDate,
  TempPasswordData,
  UserFilters,
} from '@/features/users/types'
```

## Testing

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { UsersList } from './UsersList'

test('renders users list', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  render(
    <QueryClientProvider client={queryClient}>
      <UsersList />
    </QueryClientProvider>
  )

  expect(await screen.findByText('john@example.com')).toBeInTheDocument()
})
```

## Related Documentation

- [TanStack Query Migration Guide](../../docs/TANSTACK_QUERY_MIGRATION.md)
- [Query Keys Reference](../../docs/QUERY_KEYS.md)
- [Roles Feature README](../roles/README.md)
- [Teams Feature README](../teams/README.md)
