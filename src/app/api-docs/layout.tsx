import type { Metadata } from 'next'

import { DocsSidebar } from '@/features/api-docs/components/DocsSidebar'
import { DocsTopBar } from '@/features/api-docs/components/DocsTopBar'

export const metadata: Metadata = {
  title: 'Settlor.Money Payout API — Developer Docs',
  description:
    'Integration guide and request builder for the Settlor.Money merchant Payout API: token exchange, AES-256-GCM encryption, payout initiation and status.',
}

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex h-screen flex-col overflow-hidden">
      <DocsTopBar />
      <div className="flex min-h-0 flex-1">
        <DocsSidebar />
        <main id="docs-scroll" className="h-full min-w-0 flex-1 overflow-y-auto px-5 py-8 lg:px-12">
          <div className="mx-auto max-w-4xl pb-16">{children}</div>
        </main>
      </div>
    </div>
  )
}
