import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserRolesBadges } from '../../../src/features/users/components/UserRolesBadges'

// Mock the Tooltip components to simplify testing
jest.mock('../../../src/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <span data-testid="tooltip-trigger" data-as-child={asChild}>
      {children}
    </span>
  ),
}))

// Mock the Badge component to render simply
jest.mock('../../../src/components/ui/badge', () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: React.ReactNode
    variant?: string
    className?: string
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}))

describe('UserRolesBadges', () => {
  describe('Empty State', () => {
    it('should render "No roles" when roles is undefined', () => {
      render(<UserRolesBadges />)

      expect(screen.getByText('No roles')).toBeInTheDocument()
    })

    it('should render "No roles" when roles is an empty array', () => {
      render(<UserRolesBadges roles={[]} />)

      expect(screen.getByText('No roles')).toBeInTheDocument()
    })
  })

  describe('Rendering with Data', () => {
    it('should render a single role badge', () => {
      const roles = [{ id: '1', name: 'Admin' }]

      render(<UserRolesBadges roles={roles} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.queryByText('No roles')).not.toBeInTheDocument()
    })

    it('should render two role badges', () => {
      const roles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Editor' },
      ]

      render(<UserRolesBadges roles={roles} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Editor')).toBeInTheDocument()
    })

    it('should show only first two roles and a "+N more" badge for overflow', () => {
      const roles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Editor' },
        { id: '3', name: 'Viewer' },
        { id: '4', name: 'Manager' },
      ]

      render(<UserRolesBadges roles={roles} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Editor')).toBeInTheDocument()
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })

    it('should show "+1 more" badge when there are exactly 3 roles', () => {
      const roles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Editor' },
        { id: '3', name: 'Viewer' },
      ]

      render(<UserRolesBadges roles={roles} />)

      expect(screen.getByText('+1 more')).toBeInTheDocument()
    })

    it('should show remaining role names in tooltip content', () => {
      const roles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Editor' },
        { id: '3', name: 'Viewer' },
        { id: '4', name: 'Manager' },
      ]

      render(<UserRolesBadges roles={roles} />)

      // The tooltip content should show remaining roles
      const tooltipContent = screen.getByTestId('tooltip-content')
      expect(tooltipContent).toHaveTextContent('Viewer, Manager')
    })

    it('should not show "+N more" badge when there are exactly 2 roles', () => {
      const roles = [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Editor' },
      ]

      render(<UserRolesBadges roles={roles} />)

      expect(screen.queryByText(/more/)).not.toBeInTheDocument()
    })

    it('should render badges with secondary variant', () => {
      const roles = [{ id: '1', name: 'Admin' }]

      render(<UserRolesBadges roles={roles} />)

      const badges = screen.getAllByTestId('badge')
      badges.forEach(badge => {
        expect(badge).toHaveAttribute('data-variant', 'secondary')
      })
    })
  })
})
