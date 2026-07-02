import { z } from 'zod'

export const DocumentItemSchema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

export const DashboardUserSchema = z.object({
  name: z.string(),
  email: z.string(),
  avatar: z.string(),
})

type NavItem = {
  title: string
  url: string
  icon?: unknown
  isActive?: boolean
  items?: NavItem[]
}

export const NavItemSchema: z.ZodType<NavItem> = z.object({
  title: z.string(),
  url: z.string(),
  icon: z.any().optional(),
  isActive: z.boolean().optional(),
  items: z.array(z.lazy(() => NavItemSchema)).optional(),
})

export const DocumentNavItemSchema = z.object({
  name: z.string(),
  url: z.string(),
  icon: z.function(),
})

export const DashboardDataSchema = z.object({
  user: DashboardUserSchema,
  navMain: z.array(NavItemSchema),
  navClouds: z.array(NavItemSchema),
  navSecondary: z.array(NavItemSchema),
  documents: z.array(DocumentNavItemSchema),
})

export const ChartDataPointSchema = z.object({
  date: z.string(),
  desktop: z.number(),
  mobile: z.number(),
})

export const SectionCardSchema = z.object({
  title: z.string(),
  value: z.string(),
  change: z.string(),
  trend: z.enum(['up', 'down']),
  description: z.string(),
  subtitle: z.string(),
})
