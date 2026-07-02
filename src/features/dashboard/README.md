# Dashboard Feature

A comprehensive, business-meaningful dashboard for the Admin Panel combining RBAC system health metrics with business operations KPIs.

## Overview

The dashboard provides real-time insights into:

- **Executive Summary**: Top-level KPIs (users, stores, devices, assets, system health)
- **Access Management**: RBAC analytics (users, teams, roles, permissions)
- **Business Operations**: Store performance, device management, asset utilization
- **Security & Audit**: Failed logins, active sessions, permission changes
- **Quick Actions**: Role-based shortcuts for common tasks

## Architecture

### TanStack Query Integration

All data fetching uses TanStack Query for:

- Automatic caching and background refetching
- Loading and error states
- Optimistic updates (future)

**Current Implementation**: Queries return mock data directly from `queryFn`

**Future Migration**: Simply replace mock data with actual API calls:

```typescript
// Current (mock data)
export const useDashboardKPIs = (timeRange: TimeRange = '30d') => {
  return useQuery({
    queryKey: ['dashboard', 'kpis', timeRange],
    queryFn: () => Promise.resolve(getMockDashboardKPIs(timeRange)),
  })
}

// Future (API integration)
export const useDashboardKPIs = (timeRange: TimeRange = '30d') => {
  return useQuery({
    queryKey: ['dashboard', 'kpis', timeRange],
    queryFn: () => api.getDashboardKPIs(timeRange), // Just change this line!
  })
}
```

### File Structure

```
src/features/dashboard/
├── api/
│   └── mock-data.ts              # Mock data generators (replace with API calls)
├── components/
│   ├── KPICard.tsx               # Reusable KPI metric card
│   ├── StoreStatusGrid.tsx       # Grid of store status cards
│   ├── QuickActionsPanel.tsx    # Role-based action shortcuts
│   ├── PermissionChangesTimeline.tsx  # Audit trail timeline
│   ├── charts/
│   │   ├── RoleDistributionChart.tsx
│   │   ├── UserActivityChart.tsx
│   │   ├── DeviceTypeChart.tsx
│   │   ├── AssetUtilizationGauge.tsx
│   │   └── FailedLoginChart.tsx
│   └── sections/
│       ├── ExecutiveSummary.tsx  # Top-level KPIs
│       ├── AccessManagement.tsx  # RBAC analytics
│       ├── BusinessOperations.tsx # Store/device/asset metrics
│       └── SecurityPanel.tsx     # Security & audit logs
├── hooks/
│   └── useDashboardData.ts       # TanStack Query hooks
├── types/
│   └── dashboard.types.ts        # TypeScript interfaces
└── index.ts                      # Barrel exports
```

## Components

### KPICard

Reusable metric display with trend indicators.

**Props**:

- `metric: KPIMetric` - Metric data with value, trend, and status

**Features**:

- Color-coded status badges (active, warning, critical)
- Trend indicators (up/down/neutral) with percentages
- Responsive hover effects

### Chart Components

All charts use shadcn/ui Chart components built on Recharts:

- **RoleDistributionChart**: Bar chart showing users per role
- **UserActivityChart**: Area chart with new users, active users, deactivations
- **DeviceTypeChart**: Pie chart of device type distribution
- **AssetUtilizationGauge**: Radial gauge with color-coded utilization rate
- **FailedLoginChart**: Line chart with spike detection and threshold alerts

### Section Components

Each section is self-contained and accepts a `timeRange` prop:

- **ExecutiveSummary**: 5 KPI cards in responsive grid
- **AccessManagement**: User/team/role analytics with charts
- **BusinessOperations**: Store status, device health, asset metrics
- **SecurityPanel**: Session monitoring, failed login tracking, audit timeline

## Hooks

### Query Hooks

All hooks follow the same pattern and accept optional `timeRange` parameter:

```typescript
const { data, isLoading, error } = useDashboardKPIs('30d')
const { data, isLoading, error } = useUserStats('90d')
const { data, isLoading, error } = useStoreStats()
const { data, isLoading, error } = useDeviceStats()
const { data, isLoading, error } = useSecurityStats('7d')
```

## Types

### TimeRange

```typescript
type TimeRange = '7d' | '30d' | '90d' | '1y'
```

### KPIMetric

```typescript
interface KPIMetric {
  label: string
  value: number | string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    percentage: number
    label: string
  }
  status?: 'active' | 'inactive' | 'warning' | 'critical'
}
```

See `types/dashboard.types.ts` for complete type definitions.

## Usage

### Main Dashboard Page

```typescript
'use client'

import { useState } from 'react'
import { ExecutiveSummary, AccessManagement, BusinessOperations, SecurityPanel } from '@/features/dashboard'
import type { TimeRange } from '@/features/dashboard'

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  return (
    <div>
      {/* Time range selector */}
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        <SelectItem value="1y">Last year</SelectItem>
      </Select>

      {/* Dashboard sections */}
      <ExecutiveSummary timeRange={timeRange} />
      <AccessManagement timeRange={timeRange} />
      <BusinessOperations timeRange={timeRange} />
      <SecurityPanel timeRange={timeRange} />
    </div>
  )
}
```

## Features

### Loading States

All sections implement skeleton loaders using shadcn Skeleton component:

```typescript
if (isLoading) {
  return <Skeleton className="h-32 w-full" />
}
```

### Error Handling

Graceful error messages with retry suggestions:

```typescript
if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        Failed to load data. Please try again.
      </AlertDescription>
    </Alert>
  )
}
```

### Responsive Design

All components are fully responsive:

- **Mobile**: 1 column layout
- **Tablet**: 2-3 column layout
- **Desktop**: 3-5 column layout

### Time Range Filtering

Global time range filter affects all time-series data:

- User activity timelines
- Device check-in/check-out trends
- Failed login attempts
- Team growth charts

## Mock Data

The dashboard currently uses realistic mock data generators in `api/mock-data.ts`.

**Mock data includes**:

- 127 active users across 5 teams
- 24 stores (22 online, 2 offline)
- 486 devices (VR headsets, controllers, base stations, accessories)
- ₹2.4M in assets under management
- Security events and audit logs

## Future Enhancements

### API Integration

1. Create API service layer in `api/` folder
2. Replace mock data imports with API calls in hooks
3. No component changes required!

### Role-Based Visibility

Add permission checks to hide/show sections based on user roles:

```typescript
const { user } = useAuthStore()
const canViewSecurity = hasPermission(user, 'security:read')

{canViewSecurity && <SecurityPanel timeRange={timeRange} />}
```

### Real-Time Updates

Enable auto-refresh for critical metrics:

```typescript
const { data } = useDashboardKPIs(timeRange, {
  refetchInterval: 30000, // Refresh every 30 seconds
})
```

### Export Functionality

Add PDF/CSV export for reports:

```typescript
import { exportToPDF } from '@/lib/export'

<Button onClick={() => exportToPDF(dashboardData)}>
  Export Report
</Button>
```

## Dependencies

- **@tanstack/react-query**: Data fetching and caching
- **recharts**: Chart library (via shadcn/ui Chart components)
- **@tabler/icons-react**: Icon library
- **shadcn/ui**: UI component library (Card, Badge, Button, Chart, etc.)

## Best Practices

1. **Always use TypeScript types** from `dashboard.types.ts`
2. **Use TanStack Query hooks** for all data fetching
3. **Implement loading states** with Skeleton components
4. **Handle errors gracefully** with user-friendly messages
5. **Keep components responsive** with Tailwind breakpoints
6. **Follow shadcn/ui patterns** for consistency

## Contributing

When adding new metrics or charts:

1. Add types to `types/dashboard.types.ts`
2. Create mock data generator in `api/mock-data.ts`
3. Create TanStack Query hook in `hooks/useDashboardData.ts`
4. Build component in `components/` or `components/charts/`
5. Add export to `index.ts`
6. Integrate into appropriate section component

## License

Part of the Admin RBAC System
