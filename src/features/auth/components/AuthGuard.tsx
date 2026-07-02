'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '../model/auth.store'
import { useCurrentUser } from '../model/use-profile'
import { accountTypeToRolePrefix } from '@/hooks/use-role-prefix'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  requirePasswordChange?: boolean
}

export function AuthGuard({
  children,
  redirectTo = '/auth/login',
  requirePasswordChange = false,
}: AuthGuardProps) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // Single /auth/me call on every mount — validates session with the server
  // Syncs user + isAuthenticated to Zustand on success
  const { isPending, isError } = useCurrentUser()

  // Show admin password reset notice toast (once per session)
  const noticeShown = useRef(false)
  useEffect(() => {
    if (user?.adminPasswordResetNotice?.show && !noticeShown.current) {
      noticeShown.current = true
      toast.info(user.adminPasswordResetNotice.message)
    }
  }, [user])

  useEffect(() => {
    // Only perform redirects after the /auth/me call resolves successfully.
    // When isError is true, the axios interceptor is already handling the redirect
    // (403 → /auth/blocked, 401 → /auth/login), so AuthGuard must not compete.
    if (!isPending && !isError) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (user && user.mustChangePassword && !requirePasswordChange) {
        router.push('/auth/change-password')
        return
      }

      if (user && !user.mustChangePassword && requirePasswordChange) {
        const role = accountTypeToRolePrefix(user.accountType)
        router.push(`/${role}/dashboard`)
        return
      }

      // Authoritative role-prefix enforcement. The middleware uses the client-writable
      // `settlor_role` cookie (spoofable), so we re-check the URL prefix against the
      // server-validated account type from /auth/me. A tampered cookie is corrected
      // here and kept in sync so the middleware's next decision is right too.
      if (user && !requirePasswordChange) {
        const realRole = accountTypeToRolePrefix(user.accountType)
        const urlRole = pathname.split('/')[1]
        if ((urlRole === 'admin' || urlRole === 'merchant') && urlRole !== realRole) {
          document.cookie = `settlor_role=${realRole};path=/;SameSite=Lax`
          router.replace(`/${realRole}/dashboard`)
          return
        }
      }
    }
  }, [
    isPending,
    isError,
    isAuthenticated,
    user,
    router,
    redirectTo,
    requirePasswordChange,
    pathname,
  ])

  // Show loading state while checking auth with server
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted dark:bg-background">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logos/settlor-logo-form.png"
            alt="Settlor.Money"
            width={127}
            height={43}
            className="h-[3.3rem] w-auto dark:hidden"
            priority
          />
          <Image
            src="/logos/settler-money-logo.png"
            alt="Settlor.Money"
            width={127}
            height={43}
            className="hidden h-[3.3rem] w-auto dark:block"
            priority
          />
          <div className="app-loader" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (user && user.mustChangePassword && !requirePasswordChange) {
    return null
  }

  if (user && !user.mustChangePassword && requirePasswordChange) {
    return null
  }

  return <>{children}</>
}
