'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'

import { AppIcon } from '@/components/shared/app-icon'
import { cn } from '@/lib/core/utils'
import { Button } from '@/components/ui/button'
import { getDocsHighlighter, SHIKI_THEMES } from '../lib/highlighter'

interface CodeBlockProps {
  code: string
  lang: string
  /** Optional label shown in the top bar (e.g. a filename or language). */
  label?: string
  className?: string
}

export function CodeBlock({ code, lang, label, className }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    getDocsHighlighter()
      .then(hl => {
        if (!active) return
        setHtml(
          hl.codeToHtml(code, {
            lang,
            themes: SHIKI_THEMES,
            defaultColor: false,
          }),
        )
      })
      .catch(() => {
        if (active) setHtml(null)
      })
    return () => {
      active = false
    }
  }, [code, lang])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy — copy manually')
    }
  }

  return (
    <div
      className={cn(
        'group bg-muted/60 relative overflow-hidden rounded-lg border text-[13px]',
        className,
      )}
    >
      {label ? (
        <div className="text-muted-foreground border-b px-4 py-2 font-mono text-xs">{label}</div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={copy}
        aria-label="Copy code"
        className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
      >
        {copied ? <AppIcon icon={Check} size="sm" /> : <AppIcon icon={Copy} size="sm" />}
      </Button>
      {html ? (
        <div
          className="shiki-block overflow-x-auto p-4 font-mono leading-relaxed [&_pre]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
