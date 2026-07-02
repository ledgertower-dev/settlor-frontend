'use client'

import { type LucideIcon } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/core/utils'

export interface PillTabItem<T extends string = string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface PillTabsProps<T extends string> {
  tabs: PillTabItem<T>[]
  value: T
  onValueChange: (value: T) => void
  className?: string
}

/**
 * Shared pill-style tab bar — the project's standard rounded segmented control
 * (shadcn Tabs, restyled with the `tab-active` tokens). Controlled via
 * value/onValueChange; render the active content yourself below it.
 */
export function PillTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  className,
}: PillTabsProps<T>) {
  return (
    <Tabs
      value={value}
      onValueChange={v => onValueChange(v as T)}
      className={cn('w-fit max-w-full', className)}
    >
      <TabsList className="h-14 w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-transparent bg-card p-1.5 shadow-[var(--shadow-card)] dark:border-input">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="group h-auto flex-none shrink-0 gap-2 rounded-full border-transparent px-3.5 py-2.5 text-sm font-normal text-foreground shadow-none transition-colors hover:bg-accent/50 data-[state=active]:bg-tab-active data-[state=active]:text-tab-active-foreground data-[state=active]:shadow-none dark:text-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-tab-active dark:data-[state=active]:text-tab-active-foreground"
            >
              {Icon && (
                <Icon
                  className="size-5 text-muted-foreground group-data-[state=active]:text-tab-active-foreground"
                  strokeWidth={1.5}
                />
              )}
              {tab.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
