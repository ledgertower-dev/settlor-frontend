# Settlor.Money Frontend

A modern Next.js application for the Settlor.Money admin dashboard with RBAC (Role-Based Access Control). Built with React 19, TypeScript, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 15.5 with App Router and Turbopack
- **UI**: React 19, TypeScript 5, Tailwind CSS 4
- **Components**: shadcn/ui with Radix UI primitives
- **State**: React Query v5 (server), Zustand v5 (client)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest, Playwright

## Quick Start

```bash
# Install dependencies
yarn

# Set up environment
cp .env.example .env

# Start development server
yarn dev
```

Open http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── users/         # User management
│   │   ├── roles/         # Role management
│   │   ├── teams/         # Team management
│   │   └── profile/       # User profile
│   └── api/               # API route handlers
├── features/              # Feature modules
│   ├── auth/              # Authentication
│   ├── users/             # User management
│   ├── roles/             # Role management
│   ├── access/            # Permission matrix
│   ├── teams/             # Team management
│   ├── audit-logs/        # Audit logging
│   └── dashboard/         # Dashboard
├── components/
│   ├── ui/                # shadcn/ui components
│   └── shared/            # Shared components
├── lib/
│   ├── api/               # Axios client
│   ├── providers/         # React providers
│   └── types/             # Shared types
└── middleware.ts          # Route protection
```

## Available Scripts

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `yarn dev`           | Start dev server with Turbopack |
| `yarn build`         | Production build                |
| `yarn start`         | Run production server           |
| `yarn lint`          | Run ESLint                      |
| `yarn format:check`  | Check Prettier formatting       |
| `yarn format:fix`    | Auto-format code                |
| `yarn test`          | Run Jest tests                  |
| `yarn test:coverage` | Coverage report                 |

## Features

- **Authentication**: JWT with refresh tokens, temporary password flow
- **User Management**: CRUD operations, direct role assignment
- **Role Management**: Create/edit roles with permission assignment
- **Access Matrix**: Visualize effective permissions
- **Team Management**: Team and membership management
- **Audit Logs**: System activity tracking

## Architecture

### Feature-Based Organization

Each feature follows this structure:

```
features/{feature}/
├── api/           # API services
├── components/    # React components
├── model/         # Hooks, stores, context
├── schemas/       # Zod validation
├── types/         # TypeScript types
└── index.ts       # Barrel exports
```

### Key Patterns

- **Authentication**: JWT in localStorage + cookies, AuthGuard for protected routes
- **Server State**: React Query for caching and mutations
- **Client State**: Zustand for UI state (modals, filters)
- **Forms**: React Hook Form with Zod schema validation

## Environment Variables

| Variable                       | Description        | Default                     |
| ------------------------------ | ------------------ | --------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`     | Backend API URL    | `http://localhost:3001/api` |
| `NEXT_PUBLIC_WS_URL`           | WebSocket URL      | `http://localhost:3001`     |
| `NEXT_PUBLIC_ENABLE_AUTH_LOGS` | Debug auth logging | `false`                     |

## Docker

### Quick Start

```bash
yarn docker:up      # Start container
yarn docker:logs    # View logs
yarn docker:down    # Stop container
```

### Production Build

```bash
# Set environment variables
export NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
export NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Build and run
yarn docker:build:prod
yarn docker:up
```

**Note**: `NEXT_PUBLIC_*` variables are embedded at build time.

## Code Quality

- **Git Hooks**: Husky runs ESLint, Prettier, and Jest on commit
- **Commits**: Conventional commits enforced by commitlint
- **Package Manager**: Yarn only (enforced)

## Notes

- **Teams Feature**: Currently disabled. Code preserved for future use.
- **Node Version**: 18+ required (see `.nvmrc`)
- See `CLAUDE.md` for detailed developer guidance
