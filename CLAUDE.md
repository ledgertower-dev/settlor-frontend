# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `yarn dev` - Start development server (http://localhost:3000)
- `yarn build` - Build for production
- `yarn start` - Start production server

### Code Quality

- `yarn lint` - Run ESLint
- `yarn format:check` - Check Prettier formatting
- `yarn format:fix` - Fix Prettier formatting

### Testing

- `yarn test` - Run Jest tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report

---

## Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── [role]/                   # Role-prefixed routes: /{role}/{page} (e.g. /admin/merchants)
│   │   ├── dashboard/            # /{role}/dashboard
│   │   ├── merchants/            # /{role}/merchants, /merchants/[id]
│   │   ├── payout-transactions/  # /{role}/payout-transactions
│   │   ├── deposit-payout/       # /{role}/deposit-payout
│   │   ├── scheduled-payouts/    # /{role}/scheduled-payouts
│   │   ├── account-ledger/       # /{role}/account-ledger
│   │   ├── wallet-adjustments/   # /{role}/wallet-adjustments
│   │   ├── beneficiaries/        # /{role}/beneficiaries
│   │   ├── providers/            # /{role}/providers
│   │   ├── generated-reports/    # /{role}/generated-reports
│   │   ├── roles/                # /{role}/roles
│   │   ├── users/                # /{role}/users
│   │   ├── audit-logs/           # /{role}/audit-logs
│   │   ├── settings/             # /{role}/settings
│   │   └── layout.tsx            # Dashboard layout (AuthGuard, Sidebar)
│   ├── auth/                     # /auth/login, /auth/change-password, etc.
│   ├── api/health/               # Health check API route
│   ├── layout.tsx                # Root layout (providers, fonts)
│   ├── error.tsx                 # Global error boundary
│   └── globals.css               # CSS variables, theme tokens
│
├── features/                     # Feature modules (self-contained)
│   ├── access/                   # Permissions checking & RBAC hooks
│   ├── account-ledger/           # Combined wallet statement (payouts + deposits)
│   ├── audit-logs/               # Audit log viewer
│   ├── auth/                     # Authentication (login, tokens, guards, KYC)
│   ├── beneficiaries/            # Beneficiary management
│   ├── dashboard/                # Dashboard metrics, layout, sidebar, navigation
│   ├── deposit-transactions/     # Deposit transactions
│   ├── kyc/                      # KYC flow
│   ├── merchants/                # Merchant management (config, security, wallets)
│   ├── payouts/                  # Payouts (list, create, bulk, export)
│   ├── providers/                # PSP providers (channels, virtual accounts)
│   ├── reports/                  # Generated reports / exports
│   ├── roles/                    # Role management
│   ├── scheduled-payouts/        # One-time & recurring scheduled payouts
│   ├── settings/                 # Settings
│   ├── teams/                    # Team management
│   ├── users/                    # User management
│   └── wallet-adjustments/       # Wallet adjustments
│
├── components/
│   ├── ui/                       # shadcn/ui components (DO NOT edit manually — use `npx shadcn add`)
│   └── shared/                   # Reusable app-level components (search-input, data-table-pagination, access-denied, etc.)
│
├── hooks/                        # Global custom hooks (use-mobile, use-paginated-query, etc.)
│
└── lib/
    ├── api/                      # API client (axios), error handler, api-utils
    ├── constants/                # Shared constants (status colors, etc.)
    ├── core/                     # env, logger, utils (cn helper), format
    ├── providers/                # React Query provider, theme provider
    ├── types/                    # Shared TypeScript types (api-types, pagination.types)
    └── validation/              # Shared zod helpers / validators
```

### Feature Module Structure

Every feature follows this pattern:

```
src/features/{feature}/
├── api/           # API service classes (axios calls, response transforms)
├── components/    # React components (pages, modals, tables)
├── model/         # React Query hooks + Zustand UI stores
├── schemas/       # Zod validation schemas (for forms)
├── types/         # TypeScript interfaces & types
└── index.ts       # Barrel exports (public API of the feature)
```

---

## Packages & What They're Used For

### Core

| Package                     | Purpose              |
| --------------------------- | -------------------- |
| `next` (v16)                | App Router framework |
| `react` / `react-dom` (v19) | UI library           |
| `typescript` (v6)           | Type safety          |

### State & Data

| Package                 | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `@tanstack/react-query` | Server state (API caching, refetching)               |
| `zustand`               | Client UI state (filters, modals, pagination)        |
| `axios`                 | HTTP client with interceptors (auth tokens, refresh) |

### UI & Styling

| Package                    | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `tailwindcss` (v4)         | Utility-first CSS                                        |
| `shadcn`                   | Component generator (Radix UI + Tailwind)                |
| `@radix-ui/*`              | Headless UI primitives (dialog, dropdown, tooltip, etc.) |
| `class-variance-authority` | Component variants (cva)                                 |
| `clsx` + `tailwind-merge`  | Class name merging (`cn` helper)                         |
| `lucide-react`             | Icon library (the only one — used directly inline)       |
| `sonner`                   | Toast notifications                                      |
| `recharts`                 | Charts & data visualization                              |
| `motion`                   | Animations (page transitions)                            |
| `next-themes`              | Dark/light theme switching                               |
| `vaul`                     | Drawer component                                         |
| `cmdk`                     | Command palette                                          |

### Forms & Validation

| Package               | Purpose                          |
| --------------------- | -------------------------------- |
| `react-hook-form`     | Form state management            |
| `@hookform/resolvers` | Zod resolver for react-hook-form |
| `zod` (v4)            | Schema validation                |

### Dev & Quality

| Package                                | Purpose                                          |
| -------------------------------------- | ------------------------------------------------ |
| `eslint` + `eslint-config-next`        | Linting                                          |
| `prettier`                             | Code formatting                                  |
| `husky` + `lint-staged` + `commitlint` | Git hooks (lint on commit, conventional commits) |
| `jest` + `@testing-library/react`      | Unit testing                                     |
| `@playwright/test`                     | E2E testing                                      |

---

## Rules & Conventions

### Theming — CRITICAL

- **ALWAYS use shadcn/Tailwind CSS theme tokens** for colors. NEVER use hardcoded colors like `text-gray-500`, `bg-white`, `text-black`, `border-gray-200`, etc.
- Use semantic tokens that adapt to dark/light mode automatically:

| Instead of                        | Use                          |
| --------------------------------- | ---------------------------- |
| `text-gray-900` / `text-black`    | `text-foreground`            |
| `text-gray-500` / `text-gray-600` | `text-muted-foreground`      |
| `bg-white`                        | `bg-background` or `bg-card` |
| `bg-gray-100`                     | `bg-muted` or `bg-accent`    |
| `border-gray-200`                 | `border-border`              |
| `text-red-600`                    | `text-destructive`           |
| `bg-gray-50`                      | `bg-secondary`               |

- Theme variables are defined in `src/app/globals.css` (`:root` for light, `.dark` for dark)
- The `next-themes` package handles theme switching via `ThemeProvider`
- All components must look correct in **both** dark and light themes

### Typography — Only 6 Font Sizes

Use exactly these 6 sizes across the entire project. No exceptions.

| Usage                      | Class                    | Example                                          |
| -------------------------- | ------------------------ | ------------------------------------------------ |
| **Page title**             | `text-2xl font-semibold` | Page heading ("Merchants", "Roles")              |
| **Dialog / drawer title**  | `text-xl font-normal`    | Modal titles, sheet headers, detail panel titles |
| **Section heading**        | `text-lg font-medium`    | Card titles, section headers                     |
| **Body / default**         | `text-sm`                | Table cells, form labels, card content           |
| **Small / secondary**      | `text-xs`                | Timestamps, badges, helper text                  |
| **Subtitle / description** | `text-base`              | Page descriptions, modal content                 |

Do NOT use `text-3xl`, `text-4xl`, etc. in page content. Keep it consistent.

### Status Colors — Consistent Across All Pages

Use the same colors for every status across all features (merchants, payouts, transactions, roles, etc.). **Never use hardcoded Tailwind colors like `bg-blue-500`, `bg-yellow-500`** — always use the theme tokens defined in `globals.css`:

| Status               | Token           | Light Hex | Usage (Tailwind)                         |
| -------------------- | --------------- | --------- | ---------------------------------------- |
| **Initiated / Teal** | `status-teal`   | `#067986` | `text-status-teal`, `bg-status-teal`     |
| **Success / Green**  | `status-green`  | `#24c7a6` | `text-status-green`, `bg-status-green`   |
| **Failed / Red**     | `status-red`    | `#ff7373` | `text-status-red`, `bg-status-red`       |
| **Expired / Dark**   | `status-dark`   | `#353535` | `text-status-dark`, `bg-status-dark`     |
| **Pending / Orange** | `status-orange` | `#ff9f5e` | `text-status-orange`, `bg-status-orange` |

**Badge pattern** (outlined with dot):

```
<div className="flex items-center gap-2 rounded-full border border-status-{color} px-3 py-1.5">
  <span className="size-2 rounded-full bg-status-{color}" />
  <span className="text-sm text-status-{color}">{label}</span>
</div>
```

**Chart colors** (for recharts, use raw hex): `#067986`, `#24c7a6`, `#ff7373`, `#353535`

Every page must use these exact same status styles — no page should have its own color scheme.

### Visual Consistency

- All list pages must follow the same layout: **Header (title + description + action button) → Filters card → Data table card → Pagination**
- Empty states: show message inside the table, never block the page with an error
- All tables use the same column patterns: Name, Email/Description, Status (Badge), Date, Actions
- Modals use shadcn `<Dialog>`, confirmation uses `<AlertDialog>`

### API & Data Flow

- **API services**: Class-based singletons in `features/{feature}/api/` — use `apiClient` (axios) for requests
- **Backend response format**: `{ success: boolean, data: {...}, meta?: { pagination }, message?: string }`
- **Error handling**: Use `throwApiError(error)` in catch blocks — it parses and re-throws with proper error codes
- **React Query hooks**: In `features/{feature}/model/use-{feature}.ts` — wrap API service calls
- **Zustand stores**: In `features/{feature}/model/{feature}-ui-store.ts` — for UI state (filters, modals, pagination)

### Components

- Use **shadcn/ui** components from `@/components/ui/` — do not build custom equivalents
- Shared app components go in `@/components/shared/`
- Feature-specific components go in `features/{feature}/components/`
- Use `lucide-react` icons **directly inline** — `import { Search } from 'lucide-react'` then `<Search className="size-5" strokeWidth={1.5} />`. There is no icon wrapper/registry and no iconify. Default to `strokeWidth={1.5}` for visual consistency; size via Tailwind (`size-4`=16, `size-5`=20, `size-6`=24, `size-8`=32) and color via text tokens (`text-muted-foreground`, etc.). For data-driven lists, store the lucide component itself in the config (`{ icon: House }`, typed `LucideIcon`) and render `<item.icon />`.
- Forms: `react-hook-form` + `zod` schema + shadcn `<Form>` component

### Routing

- All dashboard routes live under the dynamic `app/[role]/` segment with a shared layout
- URLs are role-prefixed: `/{role}/{page}` (e.g. `/admin/merchants`, `/merchant/payout-transactions`); build links with the `useRolePath()` hook, not hardcoded prefixes
- Protected routes use `AuthGuard` in the `[role]` layout
- Route redirects go in `next.config.ts`

### Permissions

- Permission checks use `useResourcePermissions(resource)` hook → returns `{ canCreate, canRead, canUpdate, canDelete }`
- Permission map is in `src/features/access/hooks/useCanPerformAction.ts`
- Sidebar visibility is controlled by `src/features/dashboard/hooks/useSidebarPermissions.ts`
- Only block page for permission denied errors; other errors should be non-blocking (show empty state)

### Code Style

- **Imports**: Use `@/` path alias (maps to `src/`)
- **Barrel exports**: Every feature has `index.ts` that re-exports public API
- **Naming**: PascalCase for components, camelCase for hooks/utils, kebab-case for files
- **No hardcoded strings**: Use error handler utilities, not inline error messages

## Agent Usage

- **Always use the `nextjs-codebase-expert` agent** for planning and executing any task in this codebase — including new features, bug fixes, refactors, and architectural questions.
- Spawn the agent proactively before starting any implementation work, not just when the user asks for it.
- **Always use the `smart-commit-guard` agent** for committing changes. Use it when:
  - The user explicitly asks to commit staged changes.
  - A significant chunk of work (feature, bug fix, refactor) is completed and needs to be persisted.
  - Proactively after finishing any meaningful code changes — do not wait for the user to ask.

## Development Guidelines

- Use TypeScript strictly
- Follow existing patterns for new features
- Test your changes with `yarn test` and `yarn lint`
- Keep features self-contained and reusable
- Use `yarn` only (not npm/pnpm) — enforced by preinstall script
- Use only shadcn/ui components — do not use third-party UI component libraries
