'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Nfc } from 'lucide-react'

import { cn } from '@/lib/core/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR } from '@/lib/core/format'
import { useAuthStore } from '@/features/auth'
import { useMyWallets } from '../model/use-dashboard-metrics'
import { usePagedList, type PagedList } from '../model/use-paged-list'
import type { MerchantWallet } from '../types/dashboard.types'

function initials(name: string, fallback: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (fallback || '—').slice(0, 2).toUpperCase()
}

/** Code shown for a wallet — the wallet code, falling back to the virtual account code. */
function walletLabel(w: MerchantWallet): string {
  return w.walletCode || w.vaCode || '—'
}

export function AccountDetailsCard() {
  const { data, isLoading } = useMyWallets()
  const user = useAuthStore(s => s.user)
  // Merchants get the full card (their payout wallets); other users (admin etc.)
  // get total balance + fees plus a provider-contribution breakdown.
  const isMerchant = user?.accountType === 'MERCHANT'
  // Selecting an "Other account" only previews its details in the card above;
  // it does not change which wallet is primary.
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const totalBalance = data?.totalBalance ?? 0
  const fees = data?.fees ?? 0
  const primary = data?.primaryAccount ?? data?.wallets?.[0] ?? null
  // Show every wallet here (incl. the primary, flagged with its active badge),
  // with the selected/default wallet first.
  const accounts = [...(data?.wallets ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  )
  const selected = (selectedId && accounts.find(w => w.walletId === selectedId)) || primary
  const providers = data?.providers ?? []

  // Carousels: Other Accounts (2 per page) and Provider distribution (3 per page).
  const accountsPager = usePagedList(accounts, 2)
  const providersPager = usePagedList(providers, 3)

  return (
    <div className="flex flex-col gap-6 rounded-md border border-transparent bg-card px-5.5 py-5 shadow-[var(--shadow-card)] dark:border-input">
      <p className="text-lg font-semibold text-foreground">
        {isMerchant ? 'Account details' : 'Provider details'}
      </p>

      {/* Total balance + Fees */}
      <div className="grid grid-cols-2 gap-4">
        <Amount label="Total balance" value={totalBalance} isLoading={isLoading} />
        <Amount label="Fees" value={fees} isLoading={isLoading} />
      </div>

      {isMerchant ? (
        <>
          {/* My Accounts — shows the selected (or primary) account */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">My Accounts</p>
            {isLoading ? (
              <Skeleton className="h-[11.25rem] w-full rounded-xl" />
            ) : selected ? (
              <div className="flex min-h-[180px] flex-col justify-between gap-5 rounded-[10px] bg-[image:var(--account-card-gradient)] p-5 text-white">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-semibold">
                    {selected.bankName || selected.providerName}
                  </span>
                  <Nfc className="size-5 shrink-0 text-white/90" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-white/70">Account balance</span>
                  <span className="text-2xl font-semibold">{formatINR(selected.balance)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="truncate text-sm font-semibold">{walletLabel(selected)}</span>
                    {selected.isDefault && (
                      <span className="shrink-0 rounded-full border-[0.5px] border-account-brand bg-status-green/10 px-3.5 py-0.5 text-xs text-account-brand">
                        Primary
                      </span>
                    )}
                  </div>
                  {/* Brand mark — overlapping circles */}
                  <span className="flex shrink-0 items-center">
                    <span className="size-6 rounded-full bg-account-brand/95" />
                    <span className="-ml-2.5 size-6 rounded-full bg-white/85" />
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No accounts found.</p>
            )}
          </div>

          {/* Other Accounts — click to preview an account above */}
          {(isLoading || accounts.length > 0) && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">Other Accounts</p>
                {!isLoading && <PagerArrows pager={accountsPager} label="accounts" />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {isLoading
                  ? [0, 1].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
                  : accountsPager.pageItems.map(acc => {
                      const isSelected = selected?.walletId === acc.walletId
                      return (
                        <button
                          key={acc.walletId}
                          type="button"
                          onClick={() => setSelectedId(acc.walletId)}
                          className={cn(
                            'flex items-center gap-3 rounded-sm p-2 text-left transition-colors',
                            isSelected ? 'bg-accent' : 'hover:bg-accent/50',
                          )}
                        >
                          <span className="flex size-12 shrink-0 items-center justify-center rounded bg-button-bg text-sm font-semibold text-background">
                            {initials(acc.bankName || acc.providerName, acc.walletCode)}
                          </span>
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {walletLabel(acc)}
                              </span>
                              {acc.isDefault && (
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-status-green-bg text-[0.625rem] font-semibold text-status-green">
                                  P
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {formatINR(acc.balance)}
                            </span>
                          </div>
                        </button>
                      )
                    })}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Provider distribution — admin / non-merchant only. 3 at a time, carousel. */
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">Provider distribution</p>
            {!isLoading && <PagerArrows pager={providersPager} label="providers" />}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-5">
              {[0, 1, 2].map(i => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : providersPager.pageItems.length > 0 ? (
            <div className="flex flex-col gap-5">
              {providersPager.pageItems.map(p => {
                const pct = Math.min(100, Math.max(0, p.percentage))
                return (
                  <div
                    key={p.providerId}
                    className="flex flex-col gap-2.5 border border-input p-2 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-button-bg text-xs font-semibold text-background">
                        {initials(p.providerName, p.providerCode)}
                      </span>
                      <span className="flex-1 truncate font-semibold text-foreground">
                        {p.providerName}
                      </span>
                      <span className="shrink-0 font-semibold text-foreground">
                        {formatINR(p.balance)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-account-bar"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-sm text-muted-foreground">
                        {parseFloat(pct.toFixed(1))}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No provider data.</p>
          )}
        </div>
      )}
    </div>
  )
}

/** Prev/next arrows for a paged carousel; renders nothing when there's a single page. */
function PagerArrows({ pager, label }: { pager: PagedList<unknown>; label: string }) {
  if (pager.pageCount <= 1) return null
  const btn =
    'flex size-7 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40'
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={pager.prev}
        disabled={!pager.hasPrev}
        aria-label={`Previous ${label}`}
        className={btn}
      >
        <ChevronLeft className="size-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        onClick={pager.next}
        disabled={!pager.hasNext}
        aria-label={`Next ${label}`}
        className={btn}
      >
        <ChevronRight className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}

function Amount({
  label,
  value,
  isLoading,
}: {
  label: string
  value: number
  isLoading?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {isLoading ? (
        <Skeleton className="h-7 w-32" />
      ) : (
        <span className="text-2xl font-semibold text-foreground">{formatINR(value)}</span>
      )}
    </div>
  )
}
