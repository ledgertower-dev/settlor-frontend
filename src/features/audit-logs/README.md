# Audit Logs Feature

This feature provides TypeScript types, API client, and React Query hooks for the audit logs functionality in the application RBAC system.

## Structure

```
audit-logs/
├── api/                      # API client for backend communication
│   ├── audit-logs.api.ts     # Service class for audit logs API calls
│   └── index.ts              # API exports
├── model/                    # React Query hooks and UI state
│   ├── use-audit-logs.ts     # React Query hooks for data fetching
│   ├── audit-logs-ui-store.ts # Zustand store for UI state
│   └── index.ts              # Model exports
├── types/                    # TypeScript type definitions
│   ├── audit-log.types.ts    # Core types and interfaces
│   └── index.ts              # Type exports
├── index.ts                  # Public API - all exports
└── README.md                 # This file
```

## Usage

### Types

```typescript
import type {
  AuditLog,
  AuditAction,
  AuditLogFilters,
  AuditLogListParams,
} from '@/features/audit-logs'

// AuditAction: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE'

const log: AuditLog = {
  id: '123',
  userId: 'user-456',
  userEmail: 'user@example.com',
  action: 'LOGIN',
  resource: 'auth',
  requestMethod: 'POST',
  requestPath: '/api/auth/login',
  statusCode: 200,
  createdAt: '2025-01-01T00:00:00.000Z',
}
```

### React Query Hook

```typescript
import { useAuditLogs } from '@/features/audit-logs'

function AuditLogsPage() {
  const { data, isLoading, error } = useAuditLogs({
    page: 1,
    perPage: 15,
    userId: 'user-123',      // Optional: filter by user
    action: 'LOGIN',          // Optional: filter by action
    resource: 'users',        // Optional: filter by resource
    startDate: '2025-01-01',  // Optional: filter by date range
    endDate: '2025-01-31',    // Optional: filter by date range
    sort: 'createdAt',
    sortOrder: 'desc'
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.data.items.map(log => (
        <div key={log.id}>{log.action} - {log.userEmail}</div>
      ))}
      <div>Total: {data?.meta.pagination.total}</div>
    </div>
  )
}
```

### UI Store (Zustand)

```typescript
import { useAuditLogsUIStore } from '@/features/audit-logs'

function AuditLogsFilters() {
  const {
    filters,
    setUserId,
    setAction,
    setResource,
    setDateRange,
    setPage,
    setPerPage,
    resetFilters
  } = useAuditLogsUIStore()

  return (
    <div>
      <input
        value={filters.userId || ''}
        onChange={e => setUserId(e.target.value || undefined)}
      />
      <select
        value={filters.action || ''}
        onChange={e => setAction(e.target.value as AuditAction || undefined)}
      >
        <option value="">All Actions</option>
        <option value="LOGIN">Login</option>
        <option value="LOGOUT">Logout</option>
        {/* ... */}
      </select>
      <button onClick={resetFilters}>Reset</button>
    </div>
  )
}
```

### API Service (Direct Usage)

```typescript
import { auditLogsService } from '@/features/audit-logs'

async function fetchLogs() {
  const response = await auditLogsService.getAuditLogs({
    page: 1,
    perPage: 20,
    action: 'LOGIN',
  })

  console.log(response.data.items)
  console.log(response.meta.pagination)
}
```

## Query Keys

The feature uses consistent query keys for React Query caching:

```typescript
import { auditLogKeys } from '@/features/audit-logs'

// All audit logs
auditLogKeys.all // ['audit-logs']

// All lists
auditLogKeys.lists() // ['audit-logs', 'list']

// Specific list with params
auditLogKeys.list({ page: 1, perPage: 15 })
// ['audit-logs', 'list', { page: 1, perPage: 15 }]
```

## Features

- **Type Safety**: Full TypeScript coverage with strict types
- **React Query Integration**: Automatic caching, refetching, and state management
- **Filter Support**: Filter by user, action, resource, and date range
- **Pagination**: Built-in pagination with metadata
- **UI State Management**: Zustand store for filter state with automatic page reset
- **API Error Handling**: Integrated error handling with throwApiError utility

## Backend API

The service connects to the backend endpoint:

- **GET** `/api/audit-logs` - List audit logs with filters and pagination

Query parameters:

- `page` (number): Page number (default: 1)
- `perPage` (number): Items per page (default: 15)
- `userId` (string, optional): Filter by user ID
- `action` (AuditAction, optional): Filter by action type
- `resource` (string, optional): Filter by resource name
- `startDate` (ISO string, optional): Filter by start date
- `endDate` (ISO string, optional): Filter by end date
- `sort` (string): Sort field (default: 'createdAt')
- `sortOrder` ('asc' | 'desc'): Sort order (default: 'desc')

## Notes

- All date filters use ISO 8601 format strings
- Page numbers are 1-indexed
- The UI store automatically resets to page 1 when filters change
- No mutation hooks needed (audit logs are read-only)
- Follows the same patterns as the users feature for consistency
