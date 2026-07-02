'use client'

import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { type LucideIcon } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

export interface MetricCardItem {
  label: string
  subtitle?: string
  value: string
  description?: string
  icon?: LucideIcon
}

interface MetricCardsProps {
  items: MetricCardItem[]
  columns?: number
  children?: ReactNode
}

export function MetricCards({ items, columns = items.length }: MetricCardsProps) {
  const gridClass =
    columns === 5
      ? 'lg:grid-cols-3 xl:grid-cols-5'
      : columns === 4
        ? 'lg:grid-cols-4'
        : columns === 3
          ? 'lg:grid-cols-3'
          : 'lg:grid-cols-2'

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${gridClass}`}>
      {items.map(card => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="p-4 shadow-none hover:shadow-none">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex size-8 items-center justify-center rounded-sm border shrink-0">
                  <AppIcon icon={Icon} size="sm" color="muted" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{card.label}</p>
                {card.subtitle && <p className="text-xs text-muted-foreground">{card.subtitle}</p>}
              </div>
            </div>
            <div>
              <p className="text-2xl font-semibold">{card.value}</p>
              {card.description && (
                <p className="text-xs text-muted-foreground">{card.description}</p>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
