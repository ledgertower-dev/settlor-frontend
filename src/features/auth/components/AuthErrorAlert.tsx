import { CircleAlert, TriangleAlert } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

interface AuthErrorAlertProps {
  message: string
  'data-test-id'?: string
}

export function AuthErrorAlert({ message, ...props }: AuthErrorAlertProps) {
  return (
    <div
      className="flex gap-3 items-center rounded-[0.625rem] border border-status-red/40 bg-status-red/10 p-4"
      role="alert"
      {...props}
    >
      <AppIcon icon={TriangleAlert} color="orange" className="size-[1.375rem]" />
      <p className="text-md font-medium text-status-orange">{message}</p>
    </div>
  )
}

export function AuthPendingAlert(props: { 'data-test-id'?: string }) {
  return (
    <div
      className="flex gap-3 rounded-[0.625rem] border border-status-red/40 bg-status-red/10 p-4 pb-6"
      role="alert"
      {...props}
    >
      <AppIcon icon={CircleAlert} color="orange" className="size-[1.375rem] mt-0.5" />
      <div className="flex flex-col gap-2">
        <p className="text-base font-bold text-status-orange 2xl:text-lg">
          Access denied — account pending verification
        </p>
        <p className="text-base font-medium text-foreground/60 2xl:text-lg">
          Your KYC details are under review. You&apos;ll be able to log in once the verification
          process is complete.
        </p>
      </div>
    </div>
  )
}
