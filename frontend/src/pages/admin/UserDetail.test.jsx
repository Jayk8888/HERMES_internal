import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminUserDetail from './UserDetail'

const mocks = vi.hoisted(() => ({
  useFetch: vi.fn(),
  saveAdminUser: vi.fn(),
}))

vi.mock('../../hooks/useFetch', () => ({
  useFetch: mocks.useFetch,
}))

vi.mock('../../components/layout/PageLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('./lib/loaders', () => ({
  loadAdminUserDetail: vi.fn(),
  saveAdminUser: mocks.saveAdminUser,
}))

describe('AdminUserDetail', () => {
  beforeEach(() => {
    mocks.useFetch.mockReturnValue({
      data: {
        id: 'doctor-1',
        fullName: 'Dr One',
        email: 'doctor@example.com',
        phoneNumber: '',
        gender: '',
        role: 'doctor',
        doctor: { specialization: 'Cardiology', license_no: 'LIC-1' },
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    mocks.saveAdminUser.mockResolvedValue({})
  })

  it('keeps role field readonly', () => {
    render(
      <MemoryRouter initialEntries={['/admin/users/doctor-1']}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByLabelText('Role')).toHaveAttribute('readonly')
  })

  it('saves editable fields without changing role', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/users/doctor-1']}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        </Routes>
      </MemoryRouter>
    )

    fireEvent.change(screen.getAllByLabelText('Full name')[0], { target: { value: 'Dr Prime' } })
    fireEvent.click(screen.getAllByRole('button', { name: /save user/i })[0])

    await waitFor(() => expect(mocks.saveAdminUser).toHaveBeenCalled())
    expect(mocks.saveAdminUser.mock.calls[0][0].p_role).toBe('doctor')
  })
})
