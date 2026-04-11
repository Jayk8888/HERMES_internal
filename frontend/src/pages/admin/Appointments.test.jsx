import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminAppointments from './Appointments'

const mocks = vi.hoisted(() => ({
  useFetch: vi.fn(),
  createAdminAppointment: vi.fn(),
}))

vi.mock('../../hooks/useFetch', () => ({
  useFetch: mocks.useFetch,
}))

vi.mock('../../components/layout/PageLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('./lib/loaders', () => ({
  createAdminAppointment: mocks.createAdminAppointment,
  loadAdminAppointments: vi.fn(),
  loadAdminUsers: vi.fn(),
}))

describe('AdminAppointments', () => {
  beforeEach(() => {
    mocks.useFetch.mockReset()
    const appointmentFetch = {
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    }
    const userFetch = {
      data: [
        { id: 'doctor-1', fullName: 'Dr One', role: 'doctor', integrity: 'healthy' },
        { id: 'patient-1', fullName: 'Patient One', role: 'patient', integrity: 'healthy' },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    }
    let callIndex = 0
    mocks.useFetch.mockImplementation(() => {
      callIndex += 1
      return callIndex % 2 === 1 ? appointmentFetch : userFetch
    })
    mocks.createAdminAppointment.mockResolvedValue({})
  })

  it('blocks invalid save then calls rpc for valid create', async () => {
    const { container } = render(<MemoryRouter><AdminAppointments /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }))
    expect(await screen.findByText('Patient required')).toBeInTheDocument()

    const [patientSelect, doctorSelect] = screen.getAllByRole('combobox')
    const dateTimeInput = container.querySelector('input[type="datetime-local"]')

    fireEvent.change(patientSelect, { target: { value: 'patient-1' } })
    fireEvent.change(doctorSelect, { target: { value: 'doctor-1' } })
    fireEvent.change(dateTimeInput, { target: { value: '2026-04-12T10:00' } })
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }))

    await waitFor(() => expect(mocks.createAdminAppointment).toHaveBeenCalled())
  })
})
