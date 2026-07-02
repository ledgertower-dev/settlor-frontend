import Image from 'next/image'
import { FeatureCarousel } from './FeatureCarousel'

interface AuthPageLayoutProps {
  children: React.ReactNode
}

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="h-svh bg-black">
      <div className="relative h-full w-full overflow-hidden">
        {/* Background image — visible on desktop */}
        <Image
          src="/login-bg.png"
          alt=""
          fill
          className="object-cover object-right lg:object-center"
          priority
        />

        {/* ── LEFT PANEL (desktop only) ── */}
        <div className="absolute inset-y-0 left-0 z-10 hidden w-[59%] lg:flex lg:flex-col lg:justify-between lg:px-8 lg:pt-8">
          {/* Top section */}
          <div className="flex flex-col gap-12 xl:gap-18">
            {/* Logo */}
            <Image
              src="/logos/leopay-logo-dark.png"
              alt="Settlor.Money"
              width={70}
              height={70}
              className="h-auto w-12 xl:w-[4.375rem]"
            />

            {/* Hero text */}
            <h1 className="max-w-[90%] text-[3.5rem] font-normal leading-[1] tracking-[0.01em] text-white font-[family-name:var(--font-geist-sans)] xl:text-[5rem] 2xl:text-[6.25rem]">
              Let&apos;s build the future together
            </h1>
          </div>

          {/* Feature card carousel */}
          <FeatureCarousel />

          {/* Watermark logos — fill width, pinned to bottom */}
          <div className="mt-auto flex w-full items-start overflow-hidden">
            <Image
              src="/icons/watermark-logo-1.png"
              alt=""
              width={486}
              height={126}
              className="h-auto w-1/2 shrink-0"
            />
            <Image
              src="/icons/watermark-logo-2.png"
              alt=""
              width={486}
              height={137}
              className="-ml-[2%] mt-[2%] h-auto w-1/2 shrink-0"
            />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="font-satoshi flex h-full flex-col bg-auth-form-bg backdrop-blur-[6.25rem] lg:absolute lg:inset-y-0 lg:right-0 lg:z-10 lg:w-[41%] lg:shadow-[var(--auth-card-shadow)]">
          <div className="flex h-full flex-col overflow-y-auto px-6 py-8 sm:px-8 sm:py-10 md:py-12 md:px-12 lg:py-10 2xl:px-16 xl:pt-14 xl:pb-8">
            <div className="flex w-full max-w-full flex-1 flex-col">
              {/* Logo block */}
              <div className="flex flex-col gap-1.5">
                <Image
                  src="/logos/leopay-logo-form.png"
                  alt="Settlor.Money"
                  width={127}
                  height={43}
                  className="h-auto w-[6.25rem] dark:hidden sm:w-[7.9375rem]"
                />
                <Image
                  src="/logos/settler-money-logo.png"
                  alt="Settlor.Money"
                  width={127}
                  height={43}
                  className="hidden h-auto w-[6.25rem] dark:block sm:w-[7.9375rem]"
                />
                <p className="text-sm font-medium text-auth-form-muted sm:text-base">
                  Welcome to Settlor.Money
                </p>
              </div>

              {/* Page content — flex-1 so footer can push to bottom */}
              <div className="mt-8 flex flex-1 flex-col sm:mt-10 lg:mt-[2.875rem]">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
