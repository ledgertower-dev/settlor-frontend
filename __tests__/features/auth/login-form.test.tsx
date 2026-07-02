import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '../../../src/features/auth/components/LoginForm'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock the auth store
const mockLogin = jest.fn()
const mockClearError = jest.fn()

jest.mock('../../../src/features/auth/model/auth.store', () => {
  const mockStore = Object.assign(
    jest.fn(() => ({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })),
    { getState: jest.fn(() => ({ user: { accountType: 'ADMIN' } })) },
  )
  return { useAuthStore: mockStore }
})

const { useAuthStore } = require('../../../src/features/auth/model/auth.store')

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthStore as jest.Mock).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
    ;(useAuthStore.getState as jest.Mock).mockReturnValue({ user: { accountType: 'ADMIN' } })
  })

  describe('Rendering', () => {
    it('should render the login form with all fields', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument()
    })

    it('should render the login heading', () => {
      render(<LoginForm />)

      expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
    })

    it('should have email input with correct type', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should have password input with password type by default', () => {
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when the toggle button is clicked', () => {
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText('Password')
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Click the show password button
      const toggleButton = screen.getByRole('button', { name: /show password/i })
      fireEvent.click(toggleButton)

      expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide
      const hideButton = screen.getByRole('button', { name: /hide password/i })
      fireEvent.click(hideButton)

      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Validation', () => {
    it('should show email validation error for invalid email', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      fireEvent.input(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.input(passwordInput, { target: { value: 'password123' } })

      const form = screen.getByRole('button', { name: /^login$/i }).closest('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    it('should show password required error when password is empty', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: /^login$/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument()
      })
    })

    it('should not call login when form has validation errors', async () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: /^login$/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled()
      })
    })
  })

  describe('Successful Submission', () => {
    it('should call login and redirect to dashboard on successful login', async () => {
      mockLogin.mockResolvedValue({ mustChangePassword: false })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /^login$/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
      })
    })

    it('should redirect to change-password when mustChangePassword is true', async () => {
      mockLogin.mockResolvedValue({ mustChangePassword: true })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /^login$/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/change-password')
      })
    })

    it('should call clearError before submitting', async () => {
      mockLogin.mockResolvedValue({ mustChangePassword: false })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /^login$/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled()
      })
    })
  })

  describe('Error Display', () => {
    it('should display error message from store', () => {
      ;(useAuthStore as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Invalid email or password',
        clearError: mockClearError,
      })

      render(<LoginForm />)

      expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
    })

    it('should not display error alert when there is no error', () => {
      render(<LoginForm />)

      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading text when isLoading is true', () => {
      ;(useAuthStore as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<LoginForm />)

      expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument()
    })

    it('should disable submit button when loading', () => {
      ;(useAuthStore as jest.Mock).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })

      render(<LoginForm />)

      expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
    })
  })
})
