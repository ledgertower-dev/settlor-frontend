import { act } from '@testing-library/react'
import { useAuthStore } from '../../../src/features/auth/model/auth.store'

// Mock the auth service
jest.mock('../../../src/features/auth/api/auth.api', () => ({
  authService: {
    login: jest.fn(),
    verify2FA: jest.fn(),
    resend2FA: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    changePassword: jest.fn(),
    isAuthenticated: jest.fn(),
    refreshToken: jest.fn(),
  },
}))

const { authService } = require('../../../src/features/auth/api/auth.api')

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  status: 'active' as const,
  mustChangePassword: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    act(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    })
    jest.clearAllMocks()
    // Default mock for getCurrentUser called after login/verify2FA
    authService.getCurrentUser.mockResolvedValue(mockUser)
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('login', () => {
    it('should set loading state when login starts', async () => {
      authService.login.mockImplementation(
        () =>
          new Promise(resolve => {
            // Don't resolve immediately to check loading state
            setTimeout(
              () =>
                resolve({
                  type: 'login',
                  data: { user: mockUser },
                }),
              100,
            )
          }),
      )

      // Start login but don't await
      const loginPromise = useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      })

      // Check loading state is set
      expect(useAuthStore.getState().isLoading).toBe(true)
      expect(useAuthStore.getState().error).toBeNull()

      await loginPromise
    })

    it('should set user and token on successful login', async () => {
      authService.login.mockResolvedValue({
        type: 'login',
        data: { user: mockUser },
      })

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(result.requires2FA).toBe(false)
      if (!result.requires2FA) {
        expect(result.mustChangePassword).toBe(false)
      }
    })

    it('should return mustChangePassword true when user requires password change', async () => {
      authService.login.mockResolvedValue({
        type: 'login',
        data: { user: { ...mockUser, mustChangePassword: true } },
      })

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.requires2FA).toBe(false)
      if (!result.requires2FA) {
        expect(result.mustChangePassword).toBe(true)
      }
    })

    it('should return 2FA challenge when requires_2fa is true', async () => {
      const mockChallenge = {
        challengeId: 'challenge-123',
        expiresInSeconds: 300,
        maskedDestination: 't***@example.com',
        message: 'Code sent',
        method: 'email',
      }

      authService.login.mockResolvedValue({
        type: '2fa',
        data: mockChallenge,
      })

      const result = await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result.requires2FA).toBe(true)
      if (result.requires2FA) {
        expect(result.challenge).toEqual(mockChallenge)
      }
      // Should not set user or isAuthenticated
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should set error state on login failure', async () => {
      authService.login.mockRejectedValue(new Error('Invalid credentials'))

      await expect(
        useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Invalid credentials')

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('Invalid credentials')
    })

    it('should call authService.login with correct credentials', async () => {
      authService.login.mockResolvedValue({
        type: 'login',
        data: { user: mockUser },
      })

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  describe('logout', () => {
    it('should clear all auth state on logout', async () => {
      // Set up authenticated state first
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
        })
      })

      authService.logout.mockResolvedValue(undefined)

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should still clear state even if logout API call fails', async () => {
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          isAuthenticated: true,
        })
      })

      authService.logout.mockRejectedValue(new Error('Network error'))

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear the error state', () => {
      act(() => {
        useAuthStore.setState({ error: 'Some error' })
      })

      expect(useAuthStore.getState().error).toBe('Some error')

      act(() => {
        useAuthStore.getState().clearError()
      })

      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should fetch and set user and mark as authenticated', async () => {
      authService.getCurrentUser.mockResolvedValue(mockUser)

      await useAuthStore.getState().getCurrentUser()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('should clear auth state on getCurrentUser failure', async () => {
      act(() => {
        useAuthStore.setState({
          isAuthenticated: true,
          user: mockUser,
        })
      })

      authService.getCurrentUser.mockRejectedValue(new Error('Unauthorized'))

      await useAuthStore.getState().getCurrentUser()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setUser', () => {
    it('should update the user in state', () => {
      const newUser = {
        ...mockUser,
        name: 'Updated Name',
      }

      act(() => {
        useAuthStore.getState().setUser(newUser)
      })

      expect(useAuthStore.getState().user).toEqual(newUser)
    })
  })
})
