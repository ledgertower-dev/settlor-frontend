'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

interface MaintenanceCardProps extends React.ComponentProps<'div'> {
  name?: string
  description?: string
  endsAt?: string
}

function useCountdown(endsAt?: string) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt))

  useEffect(() => {
    if (!endsAt) return

    const tick = () => setTimeLeft(getTimeLeft(endsAt))
    tick()
    const interval = setInterval(tick, 1000)

    return () => clearInterval(interval)
  }, [endsAt])

  return timeLeft
}

function getTimeLeft(endsAt?: string) {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { hours, minutes, seconds }
}

export function MaintenanceCard({
  className,
  name,
  description,
  endsAt,
  ...props
}: MaintenanceCardProps) {
  const timeLeft = useCountdown(endsAt)
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleContinue = () => {
    queryClient.removeQueries({ queryKey: ['activeMaintenance'] })
    queryClient.invalidateQueries({ queryKey: ['maintenanceSchedules'] })
    router.push('/auth/login')
  }

  return (
    <div className={`flex flex-1 flex-col ${className ?? ''}`} {...props}>
      {/* Center — card */}
      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-col items-center gap-6 rounded-[0.875rem] border border-auth-form-text/10 px-6 py-10 shadow-[1px_1px_100px_0px_rgba(0,0,0,0.05)] sm:gap-8 sm:py-14">
          <Image
            src="/maintenance-illustration.svg"
            alt="Maintenance"
            width={428}
            height={428}
            className="h-auto w-full max-w-[12.5rem] sm:max-w-[13rem]"
            priority
          />

          <div className="flex w-full flex-col items-center gap-3 sm:gap-4">
            {name && (
              <h1 className="text-center text-xl font-semibold leading-tight tracking-[0.01em] text-auth-form-text font-[family-name:var(--font-geist-sans)] sm:text-[1.5rem] 2xl:text-[2rem]">
                {name}
              </h1>
            )}
            {description && (
              <p className="text-center text-sm font-medium leading-normal text-auth-form-muted sm:text-base">
                {description}
              </p>
            )}
          </div>

          {timeLeft ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <TimeUnit value={timeLeft.hours} label="Hours" />
              <span className="text-lg font-semibold text-auth-form-text sm:text-xl">:</span>
              <TimeUnit value={timeLeft.minutes} label="Minutes" />
              <span className="text-lg font-semibold text-auth-form-text sm:text-xl">:</span>
              <TimeUnit value={timeLeft.seconds} label="Seconds" />
            </div>
          ) : endsAt ? (
            <Button
              variant={null}
              onClick={handleContinue}
              className="group h-11 w-full gap-2.5 rounded-full bg-auth-cta px-8 py-3 text-sm font-semibold tracking-[0.01em] text-auth-cta-text hover:bg-auth-cta/90 font-[family-name:var(--font-geist-sans)] sm:h-[3.25rem] sm:gap-3.5 sm:px-[2.875rem] sm:py-3.5 sm:text-base"
            >
              Continue
              <AppIcon
                icon={ArrowRight}
                size="sm"
                stroke="bold"
                className="text-auth-cta-text transition-transform group-hover:translate-x-1"
              />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex size-11 items-center justify-center rounded-lg bg-auth-form-text/10 sm:h-14 sm:w-14">
        <span className="tabular-nums text-lg font-semibold text-auth-form-text sm:text-xl">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[0.625rem] text-auth-form-muted sm:text-xs">{label}</span>
    </div>
  )
}
