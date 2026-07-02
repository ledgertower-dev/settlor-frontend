'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { stripRolePrefix, useRolePath } from '@/hooks/use-role-prefix'
import { cn } from '@/lib/core/utils'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/merchants': 'Merchants',
  '/payouts': 'Payouts',
  '/deposit-payout': 'Deposit Payout',
  '/payout-transactions': 'Payout Transactions',
  '/roles': 'Roles & Permissions',
  '/roles/create': 'Create Role',
  '/audit-logs': 'Audit Logs',
  '/users': 'User Management',
  '/auth/change-password': 'Change Password',
}

const MERCHANT_TAB_LABELS: Record<string, string> = {
  approved: 'Approved',
  'new-request': 'New Request',
  pending: 'Pending',
}

export function DynamicBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const rolePath = useRolePath()

  // Strip role prefix to get the inner path for title lookups
  const innerPath = stripRolePrefix(pathname)
  const pathSegments = innerPath.split('/').filter(Boolean)

  const breadcrumbItems: { label: string; href: string | undefined; isCurrentPage: boolean }[] = [
    { label: 'Settlor.Money', href: rolePath('/dashboard'), isCurrentPage: false },
  ]

  let currentPath = ''
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    currentPath += `/${segment}`
    const isLast = currentPath === innerPath

    let title = PAGE_TITLES[currentPath]
    const href = isLast ? undefined : rolePath(currentPath)

    if (!title) {
      // Check if this is a dynamic segment under /merchants
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
      if (parentPath === '/merchants') {
        const from = searchParams.get('from')
        title = (from && MERCHANT_TAB_LABELS[from]) ?? 'Profile Details'
      } else if (parentPath === '/roles') {
        title = 'Role Details'
      } else if (parentPath === '/providers') {
        title = 'Details'
      } else {
        title = segment
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      }
    }

    breadcrumbItems.push({
      label: title,
      href: href,
      isCurrentPage: isLast,
    })
  }

  return (
    <nav className={className} aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-2">
        {breadcrumbItems.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className={`flex items-center gap-2 ${index < breadcrumbItems.length - 2 ? 'hidden sm:flex' : ''} ${item.isCurrentPage ? 'shrink-0' : 'min-w-0'}`}
          >
            {index > 0 && (
              <AppIcon
                icon={ChevronLeft}
                className={cn(
                  'size-4 text-muted-foreground rotate-180',
                  index === breadcrumbItems.length - 2 ? 'hidden sm:block' : '',
                )}
              />
            )}
            {item.isCurrentPage ? (
              <span className="truncate text-xl font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href || '#'}
                className="truncate text-sm text-muted-foreground font-medium hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
