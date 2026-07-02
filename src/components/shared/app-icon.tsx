import { type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/core/utils'

/**
 * AppIcon — the single wrapper for rendering lucide icons in app code.
 *
 * Centralizes the two things we want governed across the app:
 *  - **color**: only a fixed set of semantic theme tokens (no ad-hoc color codes).
 *               To re-theme an icon color, change the token in `globals.css`.
 *  - **stroke**: one default stroke width (1.5). Change it here to affect every icon.
 *
 * Size and layout stay in `className` (the codebase uses many one-off sizes).
 * Pass the lucide component itself — there is no string lookup/registry.
 *
 * @example
 * import { Search } from 'lucide-react'
 * <AppIcon icon={Search} color="muted" />                       // md (20px), shrink-0, stroke 1.5 — all default
 * <AppIcon icon={Search} size="sm" color="muted" className="mr-2" />
 */
type IconColor =
  | 'default'
  | 'muted'
  | 'primary-foreground'
  | 'destructive'
  | 'green'
  | 'red'
  | 'orange'
  | 'teal'
  | 'dark'
  | 'white'
  | 'current'

type IconStroke = 'thin' | 'base' | 'bold'

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const colorMap: Record<IconColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  'primary-foreground': 'text-primary-foreground',
  destructive: 'text-destructive',
  green: 'text-status-green',
  red: 'text-status-red',
  orange: 'text-status-orange',
  teal: 'text-status-teal',
  dark: 'text-status-dark',
  white: 'text-white',
  current: '', // inherit currentColor
}

const strokeMap: Record<IconStroke, number> = {
  thin: 1,
  base: 1.5,
  bold: 2.5,
}

const sizeMap: Record<IconSize, string> = {
  xs: 'size-3', // 12px
  sm: 'size-4', // 16px
  md: 'size-5', // 20px
  lg: 'size-6', // 24px
  xl: 'size-8', // 32px
}

export interface AppIconProps {
  /** The lucide-react icon component, e.g. `Search` */
  icon: LucideIcon
  /** Size preset → Tailwind size class (default `md` = 20px). Override per-breakpoint via className, e.g. `className="lg:size-6"`. */
  size?: IconSize
  /** Semantic color token (defaults to inheriting currentColor) */
  color?: IconColor
  /** Stroke width preset (defaults to 1.5) */
  stroke?: IconStroke
  /** Size + layout classes, e.g. `size-5 shrink-0` */
  className?: string
}

export function AppIcon({
  icon: IconComponent,
  size = 'md',
  color = 'current',
  stroke = 'base',
  className,
}: AppIconProps) {
  return (
    <IconComponent
      strokeWidth={strokeMap[stroke]}
      className={cn('shrink-0', sizeMap[size], colorMap[color], className)}
    />
  )
}
