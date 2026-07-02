'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export interface NavItem {
  id: string
  title: string
  url: string
  icon: ReactNode
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

function isRouteActive(pathname: string, url: string): boolean {
  if (url === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname.startsWith(url)
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname()

  return (
    <>
      {groups.map(group => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">
            {group.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map(item => {
                const isActive = isRouteActive(pathname, item.url)
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Link href={item.url}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
