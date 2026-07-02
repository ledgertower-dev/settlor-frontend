'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, RefreshCw, TriangleAlert } from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'
import { logger } from '@/lib/core/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

interface AuthError {
  code?: string
  message: string
  isAuthError?: boolean
  isSessionExpired?: boolean
}

export class AuthErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Check if this is an auth-related error
    const authError = this.parseAuthError(error)

    if (authError.isAuthError) {
      this.handleAuthError(authError)
    } else {
      // Log non-auth errors
      logger.error('AuthErrorBoundary caught an error', { error: error.message })
    }
  }

  private parseAuthError(error: Error): AuthError {
    const message = error.message || 'An authentication error occurred'

    // Check for common auth error patterns
    const isSessionExpired =
      message.includes('session expired') ||
      message.includes('token expired') ||
      message.includes('unauthorized') ||
      message.includes('401')

    const isAuthError =
      isSessionExpired ||
      message.includes('authentication') ||
      message.includes('authorization') ||
      message.includes('forbidden') ||
      message.includes('403')

    // Extract error code if present
    const codeMatch = message.match(/code:\s*(\w+)/i)
    const code = codeMatch ? codeMatch[1] : undefined

    return {
      code,
      message,
      isAuthError,
      isSessionExpired,
    }
  }

  private handleAuthError(authError: AuthError) {
    if (authError.isSessionExpired) {
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
        action: {
          label: 'Login',
          onClick: () => this.handleLogout(),
        },
      })
    } else {
      toast.error(authError.message, {
        duration: 4000,
      })
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }))

      toast.info('Retrying...', {
        duration: 2000,
      })
    } else {
      toast.error('Maximum retry attempts reached. Please refresh the page or contact support.', {
        duration: 6000,
      })
    }
  }

  private handleLogout = () => {
    try {
      // Redirect to login — backend/proxy handles cookie cleanup
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    } catch (error) {
      logger.error('Error during logout redirect', { error: String(error) })
      toast.error('Error during logout. Please try again.', {
        duration: 4000,
      })
    }
  }

  private handleRefreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      const authError = this.parseAuthError(this.state.error!)
      const canRetry = this.state.retryCount < this.maxRetries

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AppIcon icon={TriangleAlert} color="destructive" className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">
                {authError.isSessionExpired ? 'Session Expired' : 'Authentication Error'}
              </CardTitle>
              <CardDescription className="text-sm">
                {authError.isSessionExpired
                  ? 'Your session has expired. Please log in again to continue.'
                  : authError.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                {authError.isSessionExpired ? (
                  <Button onClick={this.handleLogout} className="w-full">
                    <AppIcon icon={LogOut} className="mr-2 h-4 w-4" />
                    Go to Login
                  </Button>
                ) : (
                  <>
                    {canRetry && (
                      <Button onClick={this.handleRetry} variant="default" className="w-full">
                        <AppIcon icon={RefreshCw} className="mr-2 h-4 w-4" />
                        Retry ({this.maxRetries - this.state.retryCount} attempts left)
                      </Button>
                    )}
                    <Button onClick={this.handleRefreshPage} variant="outline" className="w-full">
                      <AppIcon icon={RefreshCw} className="mr-2 h-4 w-4" />
                      Refresh Page
                    </Button>
                    <Button onClick={this.handleLogout} variant="ghost" className="w-full">
                      <AppIcon icon={LogOut} className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words bg-muted p-2 rounded text-xs">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 whitespace-pre-wrap break-words bg-muted p-2 rounded text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AuthErrorBoundary>
  )

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default AuthErrorBoundary
