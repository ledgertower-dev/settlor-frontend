'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/core/utils'
import { usePermission } from '@/features/access/hooks/usePermission'
import { AccessDenied } from '@/components/shared/access-denied'

type PageWrapperVariant = 'default' | 'plain' | 'navbar' | 'transparent'

interface PageWrapperProps {
  children: React.ReactNode
  variant?: PageWrapperVariant
  className?: string
  /** Permission key(s) required to view the page. Shows AccessDenied when the user lacks permission. */
  permission?: string | string[]
  /** Resource name shown in the AccessDenied message (e.g. "audit logs"). */
  resource?: string
}

const variantStyles: Record<PageWrapperVariant, string> = {
  default: 'rounded-lg border border-transparent dark:border-input bg-card px-4 lg:px-6 pt-6 pb-8',
  navbar: 'rounded-lg border border-transparent dark:border-input bg-card px-4 lg:px-6 pt-6 pb-8',
  plain: '',
  transparent:
    'rounded-md border-[0.4px] border-foreground/15 bg-transparent px-4 lg:px-6 pt-6 pb-8',
}

export function PageWrapper({
  children,
  variant = 'default',
  className,
  permission,
  resource,
}: PageWrapperProps) {
  const hasPermission = usePermission(permission)

  if (permission && !hasPermission) {
    return <AccessDenied resource={resource} />
  }

  return (
    <motion.div
      className={cn(variantStyles[variant], className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
