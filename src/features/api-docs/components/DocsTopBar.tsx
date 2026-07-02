'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { LogIn, Menu, Moon, Sun, UserPlus } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStatus, useCurrentUser } from '@/features/auth'
import { NavLinks } from './DocsSidebar'

export function DocsTopBar() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  // Fire /auth/me to sync auth state (api-docs has no AuthGuard).
  // retry: false — if not logged in the 401 should not keep retrying.
  const { isPending } = useCurrentUser({ retry: false })
  const { isAuthenticated } = useAuthStatus()

  return (
    <header className="bg-background z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 lg:px-8">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" aria-label="Open menu">
            <AppIcon icon={Menu} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="px-5 pt-5 text-sm font-semibold">Payout API</SheetTitle>
          <div className="px-3 py-4">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          {!isPending && !isAuthenticated && (
            <div className="mt-auto flex items-center gap-4 border-t px-5 py-4">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80"
              >
                <AppIcon icon={LogIn} size="sm" />
                Sign in
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80"
              >
                <AppIcon icon={UserPlus} size="sm" />
                Sign up
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <Image
          src="/logos/settlor-logo-form.png"
          alt="Settlor.Money"
          width={127}
          height={43}
          className="h-7 w-auto dark:hidden"
          priority
        />
        <Image
          src="/logos/settler-money-logo.png"
          alt="Settlor.Money"
          width={127}
          height={43}
          className="hidden h-7 w-auto dark:block"
          priority
        />
        <span className="text-muted-foreground hidden text-xs sm:inline">Payout API · v1</span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <AppIcon
            icon={Sun}
            size="sm"
            className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
          />
          <AppIcon
            icon={Moon}
            size="sm"
            className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
          />
        </Button>
        {!isPending && !isAuthenticated && (
          <div className="hidden items-center gap-4 sm:flex">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80"
            >
              <AppIcon icon={LogIn} size="sm" />
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80"
            >
              <AppIcon icon={UserPlus} size="sm" />
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
