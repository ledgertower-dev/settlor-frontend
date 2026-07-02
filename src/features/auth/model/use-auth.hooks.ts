import { useShallow } from 'zustand/react/shallow'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from './auth.store'

export function useAuthStatus() {
  // Use shallow comparison selector to ensure proper reactivity when user object changes
  return useAuthStore(
    useShallow(state => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
    })),
  )
}

export function useLogin() {
  const { login, isLoading, error } = useAuthStore()

  return {
    mutate: login,
    isPending: isLoading,
    error,
  }
}

export function useLogout() {
  const { logout, isLoading, error } = useAuthStore()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    await logout()
    queryClient.clear()
  }

  return {
    mutate: handleLogout,
    isPending: isLoading,
    error,
  }
}

export function useChangePassword() {
  const { changePassword, isLoading, error } = useAuthStore()

  return {
    mutate: changePassword,
    isPending: isLoading,
    error,
  }
}
