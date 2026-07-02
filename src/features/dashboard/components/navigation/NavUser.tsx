'use client'

import {
  Check,
  CircleUser,
  EllipsisVertical,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { AppIcon } from '@/components/shared/app-icon'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLogout } from '@/features/auth'
import type { User } from '@/features/auth'
import { useRolePath } from '@/hooks/use-role-prefix'
import Link from 'next/link'

/**
 * Generates avatar initials from a user's name
 * @param name - The user's full name
 * @returns Uppercase initials (e.g., "John Doe" → "JD")
 */
function getAvatarInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function NavUser({ user }: { user: User | null }) {
  const { isMobile } = useSidebar()
  const logout = useLogout()
  const { theme, setTheme } = useTheme()
  const rolePath = useRolePath()

  const handleLogout = () => {
    logout.mutate()
  }

  // Don't render if no user data
  if (!user) {
    return null
  }

  const initials = getAvatarInitials(user.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              </div>
              <AppIcon icon={EllipsisVertical} size="sm" className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <Link href={rolePath('/settings')}>
                <DropdownMenuItem>
                  <AppIcon icon={CircleUser} size="sm" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <AppIcon icon={Palette} size="sm" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <AppIcon icon={Sun} size="sm" />
                    Light
                    {theme === 'light' && <AppIcon icon={Check} size="sm" className="ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <AppIcon icon={Moon} size="sm" />
                    Dark
                    {theme === 'dark' && <AppIcon icon={Check} size="sm" className="ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <AppIcon icon={Monitor} size="sm" />
                    System
                    {theme === 'system' && <AppIcon icon={Check} size="sm" className="ml-auto" />}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={logout.isPending}>
              <AppIcon icon={LogOut} size="sm" />
              {logout.isPending ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
