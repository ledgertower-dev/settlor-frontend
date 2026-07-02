import { z } from 'zod'
import * as React from 'react'

export const DocumentItemSchema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

export type DocumentItem = z.infer<typeof DocumentItemSchema>

export interface DashboardUser {
  name: string
  email: string
  avatar: string
}

export interface NavItem {
  title: string
  url: string
  icon?: React.ComponentType
  isActive?: boolean
  items?: NavItem[]
}

export interface DocumentNavItem {
  name: string
  url: string
  icon: React.ComponentType
}

export interface DashboardData {
  user: DashboardUser
  navMain: NavItem[]
  navClouds: NavItem[]
  navSecondary: NavItem[]
  documents: DocumentNavItem[]
}

export interface ChartDataPoint {
  date: string
  desktop: number
  mobile: number
}

export interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

export interface SectionCard {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  description: string
  subtitle: string
}
