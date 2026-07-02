import { PAYOUT_BASE_URL } from '../lib/codegen'

const pills = ['AES-256-GCM', 'Bearer token', 'INR only', 'IMPS · NEFT · RTGS']

/** Branded page header using the app's accent-dark (#003243) brand colour. */
export function DocsHero() {
  return (
    <div className="bg-button-bg text-primary-foreground relative mb-10 overflow-hidden rounded-xl px-6 py-9 sm:px-9 sm:py-11">
      {/* decorative brand glow */}
      <div
        aria-hidden
        className="bg-status-teal/30 pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl"
      />
      <div className="relative z-10 max-w-2xl space-y-4">
        <span className="bg-primary-foreground/15 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase">
          Merchant API · v1
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Settlor.Money Payout API
        </h1>
        <p className="text-primary-foreground/80 text-[15px] leading-7">
          Disburse funds to bank beneficiaries server-to-server. Exchange your credentials for a
          bearer token, then send AES-256-GCM encrypted payout and status requests.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <code className="bg-primary-foreground/10 ring-primary-foreground/15 rounded-md px-3 py-1.5 font-mono text-sm ring-1">
            {PAYOUT_BASE_URL}
          </code>
          {pills.map(p => (
            <span
              key={p}
              className="bg-primary-foreground/10 rounded-md px-2.5 py-1.5 text-xs font-medium"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
