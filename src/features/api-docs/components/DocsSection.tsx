import * as React from 'react'

import { cn } from '@/lib/core/utils'

/** A top-level documentation section with a scroll anchor for the sidebar. */
export function DocsSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b py-10 first:pt-2 last:border-b-0">
      <h2 className="text-foreground mb-4 flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <span aria-hidden className="bg-button-bg h-6 w-1.5 rounded-full" />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function DocsH3({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-foreground mt-6 text-lg font-semibold', className)}>{children}</h3>
}

export function DocsP({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-muted-foreground text-[15px] leading-7', className)}>{children}</p>
}

export function DocsUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-[15px] leading-7">
      {children}
    </ul>
  )
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  )
}

const methodColors: Record<string, string> = {
  POST: 'bg-button-bg text-primary-foreground border-transparent',
  GET: 'bg-status-green/15 text-status-green border-status-green/30',
}

/** A method + path pill, e.g. POST /api/v1/merchant/payouts. */
export function Endpoint({ method, path }: { method: string; path: string }) {
  return (
    <div className="bg-secondary border-foreground/15 flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2">
      <span
        className={cn(
          'rounded border px-2 py-0.5 font-mono text-xs font-semibold',
          methodColors[method] ?? 'bg-muted text-foreground',
        )}
      >
        {method}
      </span>
      <code className="text-foreground font-mono text-sm break-all">{path}</code>
    </div>
  )
}

/** A simple key/value reference table used for fields and error codes. */
export function DocsTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  const hasHeaders = headers.some(h => h.length > 0)
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-left text-[13px]">
        {hasHeaders && (
          <thead className="bg-muted/60 text-foreground">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="border-b px-3 py-2 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="text-muted-foreground">
          {rows.map((row, i) => (
            <tr key={i} className="even:bg-muted/30">
              {row.map((cell, j) => (
                <td key={j} className="border-b px-3 py-2 align-top last:border-r-0">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type CalloutTone = 'info' | 'warning'

const calloutTones: Record<CalloutTone, { wrap: string; icon: string }> = {
  info: { wrap: 'border-status-teal/30 bg-info-banner text-info-banner-foreground', icon: 'ℹ' },
  warning: { wrap: 'border-status-orange/40 bg-status-orange/10 text-foreground', icon: '⚠' },
}

export function Callout({
  tone = 'info',
  children,
}: {
  tone?: CalloutTone
  children: React.ReactNode
}) {
  const t = calloutTones[tone]
  return (
    <div className={cn('flex gap-3 rounded-lg border p-3 text-[14px] leading-6', t.wrap)}>
      <span aria-hidden className="select-none pt-0.5 text-base leading-none">
        {t.icon}
      </span>
      <div className="space-y-1">{children}</div>
    </div>
  )
}
