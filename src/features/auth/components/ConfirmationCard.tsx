'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

export function ConfirmationCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={`flex flex-1 flex-col ${className ?? ''}`} {...props}>
      {/* Center — card */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col items-center gap-8 rounded-[0.875rem] border border-auth-form-text/10 px-6 py-10 shadow-[1px_1px_100px_0px_rgba(0,0,0,0.05)] sm:gap-[2.875rem] sm:px-6 sm:py-14">
          {/* Illustration */}
          <Image
            src="/icons/confirmation-illustration.svg"
            alt="Information received"
            width={461}
            height={294}
            className="h-auto w-full max-w-[12rem] sm:max-w-[20rem] 2xl:max-w-[28.8rem]"
            priority
          />

          {/* Text + Button */}
          <div className="flex flex-col items-stretch gap-6 self-stretch sm:gap-8">
            {/* Title + Description */}
            <div className="flex flex-col items-stretch gap-4 self-stretch sm:gap-6">
              <h1 className="text-center text-xl font-medium leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[1.5rem] 2xl:text-[2rem]">
                Your information has been received
              </h1>

              <p className="text-center text-sm font-medium leading-normal text-auth-form-muted sm:text-base">
                Our team will review and verify your information shortly. You will be notified once
                the verification process is complete.
              </p>
            </div>

            {/* Button */}
            <Button
              asChild
              variant={null}
              className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta px-8 py-3 text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:px-[2.875rem] sm:py-3.5 sm:text-base"
            >
              <Link href="/auth/login">
                Back to login
                <AppIcon
                  icon={ArrowRight}
                  size="sm"
                  stroke="bold"
                  className="text-auth-cta-text transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer — pinned to bottom */}
      <div className="flex flex-col items-center justify-center gap-1 pt-6 sm:flex-row sm:gap-2 sm:pt-8">
        <span className="text-sm font-medium text-auth-form-subtle sm:text-base">
          Already have an account ?
        </span>
        <Link
          href="/auth/login"
          className="text-sm font-bold text-auth-primary transition-opacity hover:opacity-70 sm:text-base"
        >
          Login
        </Link>
      </div>
    </div>
  )
}
