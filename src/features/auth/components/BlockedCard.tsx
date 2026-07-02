'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

export function BlockedCard({ className, ...props }: React.ComponentProps<'div'>) {
  const handleRetry = () => {
    // Hard redirect to dashboard — if still blocked, interceptor sends back here;
    // if unblocked, dashboard loads; if session expired, proxy redirects to login
    window.location.href = '/'
  }

  return (
    <div className={`flex flex-1 flex-col ${className ?? ''}`} {...props}>
      {/* Center — card */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col items-center gap-6 rounded-[0.875rem] border border-auth-form-text/10 px-6 py-10 shadow-[1px_1px_100px_0px_rgba(0,0,0,0.05)] sm:py-14">
          <h1 className="text-center text-xl font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[1.8rem] 2xl:text-[2rem]">
            Account blocked
          </h1>

          <p className="text-center text-sm font-medium leading-normal text-auth-form-muted sm:text-base">
            Your account has been temporarily suspended. Please contact the administrator for
            further assistance.
          </p>

          <Button
            variant={null}
            onClick={handleRetry}
            className="group h-11 mt-2 w-full gap-2.5 rounded-full bg-auth-cta px-8 py-3 text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:px-[2.875rem] sm:py-3.5 sm:text-base"
          >
            Retry
            <AppIcon
              icon={ArrowRight}
              size="sm"
              stroke="bold"
              className="text-auth-cta-text transition-transform group-hover:translate-x-1"
            />
          </Button>
        </div>
      </div>
    </div>
  )
}
