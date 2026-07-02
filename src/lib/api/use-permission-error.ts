'use client'

import { useMemo } from 'react'
import { isPermissionError, getPermissionErrorMessage } from './error-handler'

/**
 * Hook to check if a query error is a permission error
 *
 * @param error - The error from a React Query hook
 * @returns Object with isPermissionDenied flag and error message
 *
 * @example
 * const { data, error, isError } = useStores()
 * const { isPermissionDenied, permissionMessage } = usePermissionError(error)
 *
 * if (isError && isPermissionDenied) {
 *   return <AccessDenied message={permissionMessage} />
 * }
 */
export function usePermissionError(error: unknown) {
  return useMemo(() => {
    if (!error) {
      return {
        isPermissionDenied: false,
        permissionMessage: '',
      }
    }

    const isPermissionDenied = isPermissionError(error)
    const permissionMessage = isPermissionDenied ? getPermissionErrorMessage(error) : ''

    return {
      isPermissionDenied,
      permissionMessage,
    }
  }, [error])
}

/**
 * Helper to render appropriate error UI based on error type
 *
 * @param error - The error object
 * @param PermissionDeniedComponent - Component to render for permission errors
 * @param GenericErrorComponent - Component to render for other errors
 * @returns The appropriate component based on error type
 */
export function renderErrorUI(
  error: unknown,
  PermissionDeniedComponent: React.ReactNode,
  GenericErrorComponent: React.ReactNode,
): React.ReactNode {
  if (!error) return null

  if (isPermissionError(error)) {
    return PermissionDeniedComponent
  }

  return GenericErrorComponent
}
