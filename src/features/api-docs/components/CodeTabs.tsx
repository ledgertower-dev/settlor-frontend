'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/core/utils'
import { CodeBlock } from './CodeBlock'

export interface CodeSample {
  /** Tab label, e.g. "Node.js". */
  label: string
  /** shiki language id, e.g. "javascript". */
  lang: string
  code: string
}

interface CodeTabsProps {
  samples: CodeSample[]
  className?: string
}

/** A tabbed group of code samples (curl / Node.js / Python …) built on ui/tabs. */
export function CodeTabs({ samples, className }: CodeTabsProps) {
  if (samples.length === 0) return null
  if (samples.length === 1) {
    return <CodeBlock code={samples[0].code} lang={samples[0].lang} className={className} />
  }

  return (
    <Tabs defaultValue={samples[0].label} className={cn('gap-2', className)}>
      <TabsList className="w-fit">
        {samples.map(s => (
          <TabsTrigger key={s.label} value={s.label}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {samples.map(s => (
        <TabsContent key={s.label} value={s.label}>
          <CodeBlock code={s.code} lang={s.lang} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
