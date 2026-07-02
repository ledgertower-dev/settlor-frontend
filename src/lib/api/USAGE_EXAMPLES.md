# API Types Usage Examples

This document provides comprehensive examples of how to use the shared API types and utilities from `/src/lib/api/types.ts`.

## Table of Contents

1. [Basic Response Handling](#basic-response-handling)
2. [Paginated Responses](#paginated-responses)
3. [Error Handling](#error-handling)
4. [Type-Safe API Services](#type-safe-api-services)
5. [React Query Integration](#react-query-integration)
6. [Field Name Transformation](#field-name-transformation)

---

## Basic Response Handling

### Simple GET Request

```typescript
import apiClient from '@/lib/api/api-client'
import { ApiResponse, extractData } from '@/lib/api'
import type { User } from '@/features/users/types'

// Define the API response structure
type GetUserResponse = ApiResponse<{ user: User }>

export async function getUser(id: string): Promise<User> {
  const response = await apiClient.get<GetUserResponse>(`/users/${id}`)

  // Extract data from the response wrapper
  const { user } = extractData(response.data)

  return user
}
```

### POST Request with Empty Response

```typescript
import { EmptyDataResponse, extractData } from '@/lib/api'

type ChangePasswordResponse = EmptyDataResponse

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await apiClient.post<ChangePasswordResponse>('/auth/change-password', {
    currentPassword,
    newPassword,
  })

  // extractData returns null for empty responses
  extractData(response.data) // null

  // You can access the success message if needed
  console.log(response.data.message) // "Password changed successfully"
}
```

---

## Paginated Responses

### Fetching Paginated Lists

```typescript
import { PaginatedResponse, extractPaginatedData, ListQueryParams } from '@/lib/api'
import type { User } from '@/features/users/types'

// Define the paginated response type
type GetUsersResponse = PaginatedResponse<User>

export async function getUsers(params?: ListQueryParams) {
  const response = await apiClient.get<GetUsersResponse>('/users', {
    params,
  })

  // Extract both items and pagination in one call
  const { items, pagination } = extractPaginatedData(response.data)

  return { users: items, pagination }
}

// Usage
const { users, pagination } = await getUsers({ page: 1, perPage: 20, q: 'john' })

console.log(users) // User[]
console.log(pagination)
// {
//   page: 1,
//   perPage: 20,
//   total: 50,
//   totalPages: 3,
//   hasNextPage: true,
//   hasPrevPage: false
// }
```

### Alternative: Extract Separately

```typescript
import { extractItems, extractPagination } from '@/lib/api'

export async function getUsersAlt(params?: ListQueryParams) {
  const response = await apiClient.get<GetUsersResponse>('/users', {
    params,
  })

  // Extract items and pagination separately
  const users = extractItems(response.data)
  const pagination = extractPagination(response.data)

  return { users, pagination }
}
```

---

## Error Handling

### Basic Error Handling

```typescript
import { extractErrorMessage, extractErrorCode, ERROR_CODES } from '@/lib/api'
import { toast } from 'sonner'

export async function loginUser(email: string, password: string) {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    })

    return response.data
  } catch (error) {
    // Extract user-friendly error message
    const message = extractErrorMessage(error)

    // Extract error code for specific handling
    const code = extractErrorCode(error)

    // Handle specific error codes
    if (code === ERROR_CODES.INVALID_CREDENTIALS) {
      toast.error('Invalid email or password')
    } else {
      toast.error(message)
    }

    throw error
  }
}
```

### Validation Error Handling

```typescript
import { extractValidationErrors } from '@/lib/api'
import { useForm } from 'react-hook-form'

export function CreateUserForm() {
  const form = useForm()

  const handleSubmit = async data => {
    try {
      await createUser(data)
      toast.success('User created successfully')
    } catch (error) {
      // Extract validation errors and set them on form fields
      const validationErrors = extractValidationErrors(error)

      if (validationErrors.length > 0) {
        validationErrors.forEach(({ field, message }) => {
          form.setError(field, { message })
        })
      } else {
        // Show general error message
        toast.error(extractErrorMessage(error))
      }
    }
  }

  // ... rest of form component
}
```

### Using handleApiError Helper

```typescript
import { handleApiError } from '@/lib/api'

export async function deleteUser(id: string): Promise<void> {
  try {
    await apiClient.delete(`/users/${id}`)
  } catch (error) {
    // Re-throws with standardized error format
    handleApiError(error)
  }
}

// Usage with try-catch
try {
  await deleteUser('123')
} catch (error) {
  // error is now a standard Error with a clean message
  toast.error(error.message)
}
```

---

## Type-Safe API Services

### Complete API Service Example

```typescript
import apiClient from '@/lib/api/api-client'
import {
  ApiResponse,
  PaginatedResponse,
  EmptyDataResponse,
  extractData,
  extractPaginatedData,
  handleApiError,
  ListQueryParams,
} from '@/lib/api'
import type { User, CreateUserInput, UpdateUserInput } from '../types'

// Response type definitions
type GetUsersResponse = PaginatedResponse<User>
type GetUserResponse = ApiResponse<{ user: User }>
type CreateUserResponse = ApiResponse<{ user: User; tempPassword?: string }>
type UpdateUserResponse = ApiResponse<{ user: User }>
type DeleteUserResponse = EmptyDataResponse

/**
 * Fetch paginated list of users
 */
export async function getUsers(params?: ListQueryParams) {
  try {
    const response = await apiClient.get<GetUsersResponse>('/users', {
      params,
    })

    return extractPaginatedData(response.data)
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Fetch single user by ID
 */
export async function getUser(id: string): Promise<User> {
  try {
    const response = await apiClient.get<GetUserResponse>(`/users/${id}`)
    const { user } = extractData(response.data)
    return user
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Create new user
 */
export async function createUser(
  data: CreateUserInput,
): Promise<{ user: User; tempPassword?: string }> {
  try {
    const response = await apiClient.post<CreateUserResponse>('/users', data)
    return extractData(response.data)
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Update existing user
 */
export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  try {
    const response = await apiClient.patch<UpdateUserResponse>(`/users/${id}`, data)
    const { user } = extractData(response.data)
    return user
  } catch (error) {
    handleApiError(error)
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  try {
    await apiClient.delete<DeleteUserResponse>(`/users/${id}`)
  } catch (error) {
    handleApiError(error)
  }
}
```

---

## React Query Integration

### Using with React Query Hooks

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, deleteUser } from '../api/users.api'
import { extractErrorMessage } from '@/lib/api'
import { toast } from 'sonner'

/**
 * Query hook for fetching users
 */
export function useUsers(params?: ListQueryParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
    // The API service already handles errors, so we just need to handle query errors
    onError: error => {
      toast.error(extractErrorMessage(error))
    },
  })
}

/**
 * Mutation hook for creating users
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: data => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] })

      toast.success('User created successfully')

      // Show temp password if generated
      if (data.tempPassword) {
        toast.info(`Temporary password: ${data.tempPassword}`)
      }
    },
    onError: error => {
      toast.error(extractErrorMessage(error))
    },
  })
}

/**
 * Mutation hook for deleting users
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User deleted successfully')
    },
    onError: error => {
      toast.error(extractErrorMessage(error))
    },
  })
}
```

### Using in Components

```typescript
import { useUsers, useCreateUser } from '../model/use-users.hooks'

export function UsersListPage() {
  const [page, setPage] = useState(1)

  // Fetch users with pagination
  const { data, isLoading, error } = useUsers({ page, perPage: 20 })

  // Create user mutation
  const createUserMutation = useCreateUser()

  const handleCreateUser = async (userData) => {
    await createUserMutation.mutateAsync(userData)
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading users</div>

  const { items: users, pagination } = data

  return (
    <div>
      <h1>Users ({pagination.total})</h1>

      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
```

---

## Field Name Transformation

### Transforming Backend Field Names

```typescript
import { transformFieldNames } from '@/lib/api'

// Backend returns `requiresPasswordChange`
// Frontend uses `mustChangePassword`

interface BackendUser {
  id: string
  email: string
  requiresPasswordChange: boolean // Backend naming
}

interface FrontendUser {
  id: string
  email: string
  mustChangePassword: boolean // Frontend naming
}

export async function getAuthenticatedUser(): Promise<FrontendUser> {
  const response = await apiClient.get<ApiResponse<{ user: BackendUser }>>('/auth/me')
  const { user } = extractData(response.data)

  // Transform field names from backend to frontend
  return transformFieldNames(user) as FrontendUser
}
```

### Adding Custom Transformations

If you need additional field name mappings, update the `FIELD_NAME_MAP` in `types.ts`:

```typescript
const FIELD_NAME_MAP: Record<string, string> = {
  requiresPasswordChange: 'mustChangePassword',
  isActive: 'status', // Add more mappings as needed
  // ...
}
```

---

## Best Practices

### 1. Always Type Your Responses

```typescript
// ✅ Good: Explicit response types
const response = await apiClient.get<GetUserResponse>(`/users/${id}`)

// ❌ Bad: No type safety
const response = await apiClient.get(`/users/${id}`)
```

### 2. Use Extraction Utilities

```typescript
// ✅ Good: Use extraction utilities
const { items, pagination } = extractPaginatedData(response.data)

// ❌ Bad: Manual extraction
const items = response.data.data.items
const pagination = response.data.meta.pagination
```

### 3. Consistent Error Handling

```typescript
// ✅ Good: Use error extraction utilities
catch (error) {
  toast.error(extractErrorMessage(error))
}

// ❌ Bad: Inconsistent error handling
catch (error) {
  toast.error(error.response?.data?.error?.message || 'Error')
}
```

### 4. Leverage Type Guards

```typescript
// ✅ Good: Type-safe error checking
if (isApiErrorResponse(response)) {
  console.error(response.error.message)
}

// ❌ Bad: Unsafe property access
if (response.error) {
  console.error(response.error.message)
}
```

---

## Migration Guide

If you have existing API services with inline type definitions (like the current `users.api.ts`), here's how to migrate:

### Before (Inline Types)

```typescript
interface ApiSuccessResponse<T> {
  status: 'success'
  data: T
  // ...
}

interface ApiErrorResponse {
  status: 'error'
  // ...
}
```

### After (Shared Types)

```typescript
import {
  ApiResponse,
  PaginatedResponse,
  extractData,
  extractPaginatedData,
  handleApiError,
} from '@/lib/api'

// Remove inline type definitions
// Use shared types from @/lib/api
```

### Benefits of Migration

1. **Consistency**: All API services use the same types
2. **Maintainability**: Update types in one place
3. **Type Safety**: Better TypeScript inference
4. **Utilities**: Built-in extraction and error handling
5. **Documentation**: Clear JSDoc comments on all utilities

---

## Additional Resources

- API Documentation: `/docs/planning/screen-wise-api-documentation.md`
- Type Definitions: `/src/lib/api/types.ts`
- API Client: `/src/lib/api/api-client.ts`
