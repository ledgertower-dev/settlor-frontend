import { cn } from '@/lib/core/utils'

const STEPS = [{ label: 'Create account' }, { label: 'Submit business KYC details' }]

interface RegistrationStepperProps {
  currentStep: 1 | 2
}

export function RegistrationStepper({ currentStep }: RegistrationStepperProps) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isActive = stepNumber <= currentStep

        return (
          <div key={step.label} className="flex items-center">
            {/* Circle icon */}
            <div className="relative z-10 flex size-10.5 shrink-0 items-center justify-center rounded-full bg-auth-form-bg">
              {isActive ? (
                <>
                  <div className="absolute inset-0 rounded-full bg-auth-primary/20" />
                  <div className="relative flex size-8 items-center justify-center rounded-full bg-auth-primary">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                      <path
                        d="M1 5L5 9L13 1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full bg-auth-surface-muted" />
                  <div className="relative flex size-8 items-center justify-center rounded-full bg-auth-surface">
                    <span className="text-sm font-medium leading-4 text-auth-form-subtle">
                      {stepNumber}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Pill label */}
            <div
              className={cn(
                '-ml-8 whitespace-nowrap rounded-full border bg-auth-surface/50 py-2.5 pr-6 pl-11 text-sm font-medium',
                isActive
                  ? 'border-auth-primary text-auth-form-text'
                  : 'border-auth-border-muted text-auth-form-muted',
              )}
            >
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{stepNumber === 1 ? 'Account' : 'KYC'}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
