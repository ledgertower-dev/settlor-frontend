'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'

const FEATURES = [
  {
    icon: '/icons/instant-payouts-icon.svg',
    title: 'Instant Payouts',
    description:
      'Process payments in real-time with bank-grade security and complete transparency.',
  },
  {
    icon: '/icons/digital-kyc-icon.svg',
    title: 'Digital KYC',
    description: 'Seamless onboarding with automated verification — go live in minutes, not days.',
  },
  {
    icon: '/icons/multi-bank-icon.svg',
    title: 'Multi-Bank Integration',
    description: 'Connect with multiple banks through a single platform — one API, all banks.',
  },
]

const INTERVAL_MS = 7000

export function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  const next = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % FEATURES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [next])

  const feature = FEATURES[activeIndex]

  return (
    <div className="mt-16 xl:mt-18 lg:max-w-[20rem] xl:max-w-[30rem] 2xl:max-w-[35rem]">
      <div className="overflow-hidden rounded-[1rem] border-[0.5] border-white/20 bg-white/5 shadow-[0.125rem_0.125rem_2.5rem_rgba(0,0,0,0.1)] backdrop-blur-[6.25rem] xl:rounded-[1.25rem]">
        <div className="px-4 py-3 xl:px-6 xl:py-3.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 xl:gap-6 2xl:gap-12"
            >
              <div className="flex items-center gap-3 xl:gap-6">
                <Image
                  src={feature.icon}
                  alt=""
                  width={64}
                  height={64}
                  className="size-8 xl:size-12 2xl:size-16"
                />
                <span className="text-lg font-semibold text-white font-[family-name:var(--font-geist-sans)] xl:text-2xl 2xl:text-[2rem]">
                  {feature.title}
                </span>
              </div>
              <p className="text-sm font-normal text-white/70 font-[family-name:var(--font-geist-sans)] xl:text-base 2xl:text-2xl">
                {feature.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 px-4 pb-3 xl:px-6 xl:pb-3.5">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10"
              aria-label={`Go to feature ${i + 1}`}
            >
              {i === activeIndex && (
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: INTERVAL_MS / 1000, ease: 'linear' }}
                />
              )}
              {i < activeIndex && <div className="absolute inset-0 rounded-full bg-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
