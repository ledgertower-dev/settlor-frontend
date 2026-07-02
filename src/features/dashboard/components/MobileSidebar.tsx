'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  ArrowRightLeft,
  BookText,
  Calendar,
  UserCheck,
  Building2,
  ChartColumn,
  FileText,
  HandCoins,
  House,
  Layers,
  Menu,
  Settings,
  ShieldUser,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useSidebarPermissions } from '../hooks/useSidebarPermissions'
import { useRolePath, stripRolePrefix } from '@/hooks/use-role-prefix'
import { cn } from '@/lib/core/utils'

interface NavItem {
  id: string
  title: string
  url: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: '/dashboard',
        icon: House,
      },
      {
        id: 'merchants',
        title: 'Merchants',
        url: '/merchants',
        icon: Building2,
      },
      {
        id: 'auditLogs',
        title: 'Audit log',
        url: '/audit-logs',
        icon: FileText,
      },
      {
        id: 'roles',
        title: 'Roles & Permissions',
        url: '/roles',
        icon: ShieldUser,
      },
      {
        id: 'users',
        title: 'User Management',
        url: '/users',
        icon: Users,
      },
    ],
  },
  {
    label: 'Payout Transaction',
    items: [
      {
        id: 'depositTransactions',
        title: 'Deposit Payout',
        url: '/deposit-payout',
        icon: Wallet,
      },
      {
        id: 'payoutTransactions',
        title: 'Payout Transaction',
        url: '/payout-transactions',
        icon: ArrowRightLeft,
      },
      {
        id: 'scheduledPayouts',
        title: 'Scheduled Payouts',
        url: '/scheduled-payouts',
        icon: Calendar,
      },
      {
        id: 'beneficiaries',
        title: 'Manage Beneficiary',
        url: '/beneficiaries',
        icon: UserCheck,
      },
      {
        id: 'walletAdjustments',
        title: 'Wallet Adjustment',
        url: '/wallet-adjustments',
        icon: HandCoins,
      },
      {
        id: 'accountLedger',
        title: 'Account Ledger',
        url: '/account-ledger',
        icon: BookText,
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      {
        id: 'generatedReports',
        title: 'Generated Reports',
        url: '/generated-reports',
        icon: ChartColumn,
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        id: 'providers',
        title: 'Providers',
        url: '/providers',
        icon: Layers,
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'settings',
        title: 'Settings',
        url: '/settings',
        icon: Settings,
      },
    ],
  },
]

function isRouteActive(pathname: string, url: string): boolean {
  const innerPath = stripRolePrefix(pathname)
  if (url === '/dashboard') return innerPath === '/dashboard'
  return innerPath.startsWith(url)
}

function filterNavGroups(groups: NavGroup[], visibleItems: string[]): NavGroup[] {
  const visibleSet = new Set(visibleItems)
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => visibleSet.has(item.id)),
    }))
    .filter(group => group.items.length > 0)
}

export function MobileSidebar() {
  const pathname = usePathname()
  const { visibleItems, isLoading } = useSidebarPermissions()
  const rolePath = useRolePath()
  const [open, setOpen] = React.useState(false)

  const filteredGroups = React.useMemo(
    () => filterNavGroups(NAV_GROUPS, visibleItems),
    [visibleItems],
  )

  // Close sheet on route change
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex lg:hidden items-center justify-center size-10 rounded-md hover:bg-accent transition-colors"
          aria-label="Open menu"
        >
          <AppIcon icon={Menu} color="default" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="!bg-sidebar w-[80vw] max-w-[14.5rem] p-0 border-none">
        <div className="flex h-full flex-col items-center px-3.5 pb-3.5 pt-5">
          {/* Logo */}
          <Link href={rolePath('/dashboard')} className="shrink-0">
            <Image
              src="/logos/settler-money-logo.png"
              alt="Settlor.Money"
              width={132}
              height={45}
              className="h-[2.8125rem] w-auto"
            />
          </Link>

          {/* Navigation — scrollable */}
          <div className="mt-[2.875rem] flex w-full min-h-0 flex-1 flex-col overflow-y-auto">
            {isLoading ? (
              <div className="w-full space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <nav className="flex w-full flex-col gap-6">
                {filteredGroups.map(group => (
                  <div key={group.label} className="flex flex-col gap-3.5 w-full">
                    <p className="text-xs text-sidebar-label">{group.label}</p>
                    <div className="flex flex-col gap-2.5 w-full">
                      {group.items.map(item => {
                        const isActive = isRouteActive(pathname, item.url)
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.id}
                            href={rolePath(item.url)}
                            className={cn(
                              'group relative flex items-center gap-3.5 p-2 w-full rounded-md transition-colors',
                              isActive ? '' : 'hover:bg-sidebar-accent',
                            )}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {isActive && (
                              <div className="absolute inset-0 rounded-md bg-sidebar-active" />
                            )}
                            <div
                              className={cn(
                                'relative z-10 flex items-center justify-center w-8 px-1.5 py-1.5 rounded-md overflow-clip shrink-0 transition-colors',
                                isActive ? '' : '',
                              )}
                            >
                              <AppIcon
                                icon={Icon}
                                className={cn(
                                  'size-5',
                                  isActive ? 'text-white' : 'text-sidebar-label',
                                )}
                              />
                            </div>
                            <span
                              className={cn(
                                'relative z-10 text-sm font-medium',
                                isActive
                                  ? 'text-accent-dark-foreground'
                                  : 'text-sidebar-foreground',
                              )}
                            >
                              {item.title}
                            </span>
                            {isActive && (
                              <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0.0625rem_0.0625rem_0.25rem_0_rgba(255,255,255,0.15)] pointer-events-none" />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
