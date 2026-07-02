---
name: Codebase Patterns
description: Key API response shapes, pagination types, and role-filtered feature conventions
type: project
---

## API Response Shapes

### `rolesService.getRoleUsers()` return shape
`ApiSuccessResponse<{ users: UserWithRoleAssignment[]; meta: PaginationMeta }>`
- Access: `data.data.users` and `data.data.meta.pagination`
- `PaginationMeta` here is from `api-types.ts` = `{ pagination: { page, perPage, total, ... } }`

### `DataTablePagination` props
Expects the flat `PaginationMeta` from `pagination.types.ts` = `{ page, perPage, total, totalPages, hasNextPage, hasPrevPage }`
So pass `data.data.meta.pagination` (inner) not `data.data.meta` (wrapper).

## Role-Filtered Features (e.g. Merchants)

Merchants = users with "merchant" role. Pattern:
1. `merchantsService.getMerchantRoleId()` — fetches roles with `perPage:100`, finds by `name.toLowerCase() === 'merchant'`, caches on class instance
2. `getMerchants(params)` — calls `rolesService.getRoleUsers(merchantRoleId, params)`
3. `createMerchant(data)` — calls `usersService.createUser({ ...data, roleIds: [merchantRoleId], autoGeneratePassword: true })`

## usePaginatedQuery Compatibility

`usePaginatedQuery` only handles two shapes:
1. `{ items, pagination }` — direct format
2. `{ data: { items }, meta: { pagination } }` — nested format

The `getRoleUsers` shape does NOT fit either — skip `usePaginatedQuery` for role-filtered features.

## Feature Module: Merchants
- `src/features/merchants/` — complete feature module
- `src/app/dashboard/merchants/` — list + detail pages
- Zustand store: `useMerchantsUIStore` — modal + filters only (no selectedMerchant, simpler than users)
- Query key root: `['merchants']`

## Mock Data Features (no backend yet)

### `src/lib/mock/index.ts`
Central mock API with `mockApi` object. Methods return `{ items, pagination }` directly (not nested in `data`/`meta`). Simulates delay with 500ms default.

### Wallets, Payouts, Transactions
All use mock data from `@/lib/mock`. Pagination shape from mockApi = `{ items: T[], pagination: PaginationMeta }` — pass `data.pagination` directly to `DataTablePagination`.

Feature modules:
- `src/features/wallets/` — `PrimaryWalletPage`, `PayoutWalletPage`, `WalletBalanceCard`
- `src/features/payouts/` — `PayoutsList`, `PayoutDetail`, `CreatePayoutModal`; query key root `['payouts']`
- `src/features/transactions/` — `TransactionsList`, `TransactionDetail`, `TransactionTimeline`; query key root `['transactions']`

App routes:
- `/dashboard/wallets/primary` and `/dashboard/wallets/payout`
- `/dashboard/payouts` and `/dashboard/payouts/[id]`
- `/dashboard/transactions` and `/dashboard/transactions/[id]`
