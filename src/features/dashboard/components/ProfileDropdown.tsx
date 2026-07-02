'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LogOut, Moon, User } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStatus, useLogout } from '@/features/auth'
import { useRolePath } from '@/hooks/use-role-prefix'
import { cn } from '@/lib/core/utils'

export function ProfileDropdown() {
  const router = useRouter()
  const rolePath = useRolePath()
  const { user } = useAuthStatus()
  const logout = useLogout()
  const { theme, setTheme } = useTheme()

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'
  const displayName = user?.name || 'User'
  const displayRole = user?.role?.name || user?.accountType || 'User'

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2.5 rounded-full bg-card h-14 pl-1.5 pr-1.5 sm:pr-3.5 shadow-[var(--header-shadow)] cursor-pointer outline-none dark:border dark:border-white/15"
          aria-label="Profile menu"
        >
          {/* Avatar circle */}
          <div className="flex size-11 items-center justify-center rounded-full bg-button-bg pointer-events-none">
            <span className="text-[15px] font-semibold text-primary-foreground">{initial}</span>
          </div>
          {/* Name & email */}
          <div className="hidden sm:flex flex-col gap-0.5 max-w-[10rem] text-left pointer-events-none">
            <span className="text-sm font-semibold text-foreground capitalize truncate w-full">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground truncate w-full">
              {user?.email || ''}
            </span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[250px] rounded-md border border-transparent dark:border-input bg-background p-5 shadow-[var(--shadow-elevated)] dark:border dark:border-white/15 dark:shadow-[0px_16px_48px_rgba(255,255,255,0.08)]"
      >
        <div className="flex flex-col gap-6">
          {/* User info */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex shrink-0 items-end">
              <div className="flex size-12 items-center justify-center rounded-full border border-foreground/20 bg-button-bg">
                <span className="text-2xl font-light text-primary-foreground">{initial}</span>
              </div>
              <div className="-ml-2.5 mb-0.5 size-3.5 rounded-full border-2 border-background bg-status-green" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-sm font-medium text-foreground truncate">{user?.email || ''}</p>
              <p className="text-sm text-muted-foreground capitalize">{displayRole}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="flex flex-col gap-3.5">
            {/* My profile */}
            <button
              type="button"
              onClick={() => router.push(rolePath('/settings'))}
              className="group relative flex items-center gap-3.5 p-2 w-full rounded-md cursor-pointer transition-colors hover:bg-muted"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <AppIcon icon={User} color="default" />
              </div>
              <span className="text-sm text-foreground">My profile</span>
            </button>

            {/* Dark theme toggle */}
            <div className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-4.5">
                <AppIcon icon={Moon} color="default" className="ml-3.5" />
                <span className="text-sm text-foreground">Dark theme</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
                size="lg"
                variant="green"
              />
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              className={cn(
                'flex w-full items-center gap-3.5 rounded-md border-[0.4px] border-destructive/50 bg-destructive/5 p-2 transition-colors hover:bg-destructive/10 cursor-pointer',
                logout.isPending && 'opacity-50 cursor-not-allowed',
              )}
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-background">
                <AppIcon icon={LogOut} color="destructive" className="rotate-180" />
              </div>
              <span className="text-sm text-foreground">
                {logout.isPending ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
