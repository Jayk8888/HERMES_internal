import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RoleGuard } from './RoleGuard'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: mocks.useAuth,
}))

describe('RoleGuard', () => {
  it('blocks non-admin users', () => {
    mocks.useAuth.mockReturnValue({
      user: { id: 'u1' },
      profile: { role: 'patient' },
      loading: false,
    })

    render(
      <MemoryRouter>
        <RoleGuard role="admin">
          <div>Secret</div>
        </RoleGuard>
      </MemoryRouter>
    )

    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })
})
