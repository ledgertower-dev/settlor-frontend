# Roles Feature

Comprehensive role management for the application RBAC system. Supports creating, updating, and deleting roles, managing permissions, and tracking role assignments to users and teams.

## Architecture

This feature uses the modern TanStack Query + Zustand architecture:

- **TanStack Query Hooks** (`model/use-roles.ts`): Server state management
- **Zustand UI Store** (`model/roles-ui-store.ts`): Client UI state
- **API Service** (`api/roles.api.ts`): HTTP client and request/response handling

## Directory Structure

```
roles/
├── api/
│   └── roles.api.ts          # API service layer
├── components/
│   ├── CreateRoleModal.tsx
│   ├── EditRoleModal.tsx
│   ├── DeleteRoleDialog.tsx
│   ├── RolesList.tsx
│   └── ...
├── model/
│   ├── use-roles.ts          # TanStack Query hooks
│   └── roles-ui-store.ts     # Zustand UI state store
├── types/
│   └── index.ts              # TypeScript types
└── index.ts                  # Barrel exports
```

## Query Hooks

### Query Hooks (Fetching Data)

#### `useRoles()`

Fetches all roles in the system.

```tsx
import { useRoles } from '@/features/roles/model/use-roles'

function RolesList() {
  const { data, isLoading, error } = useRoles()

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage error={error} />

  const roles = data?.data.roles ?? []

  return (
    <div>
      {roles.map(role => (
        <RoleCard key={role.id} role={role} />
      ))}
    </div>
  )
}
```

#### `useRole(roleId)`

Fetches a single role by ID with automatic caching.

```tsx
import { useRole } from '@/features/roles/model/use-roles'

function RoleDetail({ roleId }: { roleId: string }) {
  const { data, isLoading } = useRole(roleId)

  if (isLoading) return <Spinner />

  const role = data?.data.role

  return (
    <div>
      <h1>{role?.name}</h1>
      <p>{role?.description}</p>
    </div>
  )
}
```

**Note:** Hook is automatically disabled if `roleId` is `undefined`.

#### `useRolePermissions(roleId)`

Fetches permissions assigned to a role.

```tsx
import { useRolePermissions } from '@/features/roles/model/use-roles'

function RolePermissions({ roleId }: { roleId: string }) {
  const { data, isLoading } = useRolePermissions(roleId)

  const permissions = data?.data.permissions ?? []

  return (
    <ul>
      {permissions.map(perm => (
        <li key={perm.id}>
          {perm.name} - {perm.assignedAt}
        </li>
      ))}
    </ul>
  )
}
```

#### `useRoleUsers(roleId, params)`

Fetches users with this role (direct or via team) with pagination and search.

```tsx
import { useRoleUsers } from '@/features/roles/model/use-roles'

function RoleUsers({ roleId }: { roleId: string }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useRoleUsers(roleId, {
    page,
    perPage: 10,
    q: search,
  })

  const users = data?.data.users ?? []
  const pagination = data?.data.meta?.pagination

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <UserList users={users} />
      <Pagination page={page} totalPages={pagination?.totalPages ?? 0} onPageChange={setPage} />
    </div>
  )
}
```

#### `useRoleTeams(roleId, params)`

Fetches teams with this role assigned.

```tsx
import { useRoleTeams } from '@/features/roles/model/use-roles'

function RoleTeams({ roleId }: { roleId: string }) {
  const { data } = useRoleTeams(roleId, { page: 1, perPage: 10 })

  const teams = data?.data.teams ?? []

  return (
    <ul>
      {teams.map(team => (
        <li key={team.id}>{team.name}</li>
      ))}
    </ul>
  )
}
```

### Mutation Hooks (Modifying Data)

#### `useCreateRole()`

Creates a new role and automatically invalidates the roles list cache.

```tsx
import { useCreateRole } from '@/features/roles/model/use-roles'
import { useRolesUIStore } from '@/features/roles/model/roles-ui-store'

function CreateRoleModal() {
  const createRole = useCreateRole()
  const { closeCreateModal } = useRolesUIStore()

  const handleSubmit = (formData: CreateRoleRequest) => {
    createRole.mutate(formData, {
      onSuccess: () => {
        toast.success('Role created successfully')
        closeCreateModal()
      },
      onError: error => {
        toast.error('Failed to create role')
        console.error(error)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button disabled={createRole.isPending}>
        {createRole.isPending ? 'Creating...' : 'Create'}
      </Button>
    </form>
  )
}
```

#### `useUpdateRole()`

Updates an existing role.

```tsx
import { useUpdateRole } from '@/features/roles/model/use-roles'

function EditRoleModal({ roleId }: { roleId: string }) {
  const updateRole = useUpdateRole()

  const handleSubmit = (formData: UpdateRoleRequest) => {
    updateRole.mutate(
      { id: roleId, data: formData },
      {
        onSuccess: () => {
          toast.success('Role updated')
        },
      },
    )
  }

  return <form onSubmit={handleSubmit}>{/* Form */}</form>
}
```

#### `useDeleteRole()`

Deletes a role.

```tsx
import { useDeleteRole } from '@/features/roles/model/use-roles'

function DeleteRoleDialog({ roleId }: { roleId: string }) {
  const deleteRole = useDeleteRole()

  const handleDelete = () => {
    deleteRole.mutate(roleId, {
      onSuccess: () => {
        toast.success('Role deleted')
        onClose()
      },
      onError: error => {
        toast.error('Failed to delete role')
      },
    })
  }

  return (
    <Dialog>
      <Button onClick={handleDelete} disabled={deleteRole.isPending}>
        {deleteRole.isPending ? 'Deleting...' : 'Delete'}
      </Button>
    </Dialog>
  )
}
```

#### `useUpdateRolePermissions()`

Updates permissions assigned to a role.

```tsx
import { useUpdateRolePermissions } from '@/features/roles/model/use-roles'

function PermissionsEditor({ roleId }: { roleId: string }) {
  const updatePermissions = useUpdateRolePermissions()

  const handleSave = (permissionIds: string[]) => {
    updatePermissions.mutate(
      { id: roleId, data: { permissionIds } },
      {
        onSuccess: () => {
          toast.success('Permissions updated')
        },
      },
    )
  }

  return <PermissionsCheckboxes onSave={handleSave} />
}
```

## UI Store

The Zustand store manages client-side UI state including modals, selections, and form states.

### Store State

```typescript
interface RolesUIStore {
  // Modal states
  createModalOpen: boolean
  editModalOpen: boolean
  deleteDialogOpen: boolean

  // Selected role
  selectedRoleId: string | null

  // Form states
  isEditingDetails: boolean
  permissionChanges: Record<string, boolean>

  // Actions
  openCreateModal: () => void
  closeCreateModal: () => void
  openEditModal: (roleId: string) => void
  closeEditModal: () => void
  openDeleteDialog: (roleId: string) => void
  closeDeleteDialog: () => void
  setEditingDetails: (editing: boolean) => void
  setPermissionChanges: (changes: Record<string, boolean>) => void
  resetPermissionChanges: () => void
  clearSelection: () => void
}
```

### Usage Examples

#### Opening Modals

```tsx
import { useRolesUIStore } from '@/features/roles/model/roles-ui-store'

function RolesPage() {
  const { openCreateModal, openEditModal } = useRolesUIStore()

  return (
    <div>
      <Button onClick={openCreateModal}>Create Role</Button>
      <Button onClick={() => openEditModal('role-123')}>Edit Role</Button>
    </div>
  )
}
```

#### Using Modal State

```tsx
import { useRolesUIStore } from '@/features/roles/model/roles-ui-store'

function CreateRoleModal() {
  const { createModalOpen, closeCreateModal } = useRolesUIStore()

  return (
    <Dialog open={createModalOpen} onOpenChange={closeCreateModal}>
      {/* Modal content */}
    </Dialog>
  )
}
```

#### Managing Permission Changes

```tsx
import { useRolesUIStore } from '@/features/roles/model/roles-ui-store'

function PermissionsEditor() {
  const { permissionChanges, setPermissionChanges, resetPermissionChanges } = useRolesUIStore()

  const handlePermissionToggle = (permId: string, checked: boolean) => {
    setPermissionChanges({
      ...permissionChanges,
      [permId]: checked,
    })
  }

  const handleSave = () => {
    // Save changes...
    resetPermissionChanges()
  }

  const handleCancel = () => {
    resetPermissionChanges()
  }

  return <div>{/* Permission checkboxes */}</div>
}
```

## Complete Component Example

Here's a complete example combining query hooks and UI store:

```tsx
import { useRole, useDeleteRole } from '@/features/roles/model/use-roles'
import { useRolesUIStore } from '@/features/roles/model/roles-ui-store'

function DeleteRoleDialog() {
  // UI state from Zustand
  const { deleteDialogOpen, selectedRoleId, closeDeleteDialog } = useRolesUIStore()

  // Server data from TanStack Query
  const { data: roleData } = useRole(selectedRoleId ?? undefined)
  const deleteRole = useDeleteRole()

  const role = roleData?.data.role

  const handleDelete = () => {
    if (!role || role.isSystemLocked) {
      toast.error('Cannot delete system role')
      return
    }

    deleteRole.mutate(role.id, {
      onSuccess: () => {
        toast.success('Role deleted')
        closeDeleteDialog()
      },
      onError: () => {
        toast.error('Failed to delete role')
      },
    })
  }

  return (
    <Dialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
        </DialogHeader>

        <div>
          <p>Are you sure you want to delete {role?.name}?</p>
          {role?.isSystemLocked && (
            <Alert variant="destructive">System roles cannot be deleted</Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDeleteDialog}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteRole.isPending || role?.isSystemLocked}
          >
            {deleteRole.isPending ? 'Deleting...' : 'Delete'}
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
;['roles'][('roles', roleId)][('roles', roleId, 'permissions')][('roles', roleId, 'users', params)][ // All roles list // Single role detail // Role's permissions // Role's users (with filters)
  ('roles', roleId, 'teams', params)
] // Role's teams (with filters)
```

This structure allows for precise cache invalidation. For example:

- Creating a role invalidates `['roles']` (the list)
- Updating permissions invalidates `['roles', roleId, 'permissions']` and `['roles', roleId]`

See [Query Keys Documentation](../../docs/QUERY_KEYS.md) for more details.

## Best Practices

### 1. Always Handle Loading and Error States

```tsx
const { data, isLoading, error } = useRoles()

if (isLoading) return <Spinner />
if (error) return <ErrorDisplay error={error} />

// Safe to use data here
const roles = data?.data.roles ?? []
```

### 2. Use Mutation Callbacks for Side Effects

```tsx
createRole.mutate(formData, {
  onSuccess: () => {
    // Close modal, show toast, etc.
    toast.success('Success')
    closeModal()
  },
  onError: error => {
    // Show error message
    toast.error(error.message)
  },
})
```

### 3. Disable Hooks When Data is Not Available

```tsx
// Good: Hook is disabled when roleId is undefined
const { data } = useRole(roleId)

// Bad: Always enabled even when roleId is undefined
const { data } = useRole(roleId, { enabled: true })
```

### 4. Use UI Store for Client-Side State Only

```tsx
// Good: UI state in Zustand
const { modalOpen, openModal } = useRolesUIStore()

// Bad: Server data in Zustand (use TanStack Query instead)
const { roles, setRoles } = useRolesStore() // ❌
```

### 5. Leverage Automatic Cache Invalidation

Mutations automatically invalidate related queries. You don't need to manually refetch:

```tsx
// Good: Mutation handles cache invalidation
createRole.mutate(data, {
  onSuccess: () => {
    // No need to manually refetch roles
    closeModal()
  },
})

// Bad: Manual refetch (unnecessary)
createRole.mutate(data, {
  onSuccess: async () => {
    await refetchRoles() // ❌ Not needed
    closeModal()
  },
})
```

## Common Patterns

### Pattern 1: List + Detail Pattern

```tsx
function RolesPage() {
  // List query
  const { data: rolesData } = useRoles()

  // Detail query (only runs when role is selected)
  const { selectedRoleId } = useRolesUIStore()
  const { data: roleDetail } = useRole(selectedRoleId ?? undefined)

  return (
    <div>
      <RolesList roles={rolesData?.data.roles} />
      {roleDetail && <RoleDetail role={roleDetail.data.role} />}
    </div>
  )
}
```

### Pattern 2: Modal with Mutations

```tsx
function EditRoleModal() {
  const { selectedRoleId, closeEditModal } = useRolesUIStore()
  const { data } = useRole(selectedRoleId ?? undefined)
  const updateRole = useUpdateRole()

  const handleSubmit = formData => {
    updateRole.mutate({ id: selectedRoleId!, data: formData }, { onSuccess: closeEditModal })
  }

  return (
    <Dialog onOpenChange={closeEditModal}>
      <Form onSubmit={handleSubmit} defaultValues={data?.data.role} />
    </Dialog>
  )
}
```

### Pattern 3: Dependent Queries

```tsx
function RolePermissionsTab({ roleId }: { roleId: string }) {
  // First query - get role detail
  const { data: roleData } = useRole(roleId)

  // Second query - get permissions (only runs if roleId exists)
  const { data: permissionsData } = useRolePermissions(roleId)

  // Both queries automatically enabled/disabled based on roleId
  return <div>{/* Render permissions */}</div>
}
```

## TypeScript Types

All types are exported from the feature's types file:

```typescript
import type {
  Role,
  CreateRoleRequest,
  UpdateRoleRequest,
  UpdateRolePermissionsRequest,
} from '@/features/roles/types'
```

## Testing

### Testing Components with Query Hooks

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RolesList } from './RolesList'

test('renders roles list', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RolesList />
    </QueryClientProvider>
  )

  expect(await screen.findByText('Administrator')).toBeInTheDocument()
})
```

## Related Documentation

- [TanStack Query Migration Guide](../../docs/TANSTACK_QUERY_MIGRATION.md)
- [Query Keys Reference](../../docs/QUERY_KEYS.md)
- [Users Feature README](../users/README.md)
- [Teams Feature README](../teams/README.md)
