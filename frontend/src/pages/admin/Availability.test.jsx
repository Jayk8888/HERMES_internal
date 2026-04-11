import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminAvailability from './Availability'

const mocks = vi.hoisted(() => ({
  useFetch: vi.fn(),
  deleteAvailabilitySlot: vi.fn(),
}))

vi.mock('../../hooks/useFetch', () => ({
  useFetch: mocks.useFetch,
}))

vi.mock('../../components/layout/PageLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('./lib/loaders', () => ({
  createAvailabilitySlot: vi.fn(),
  deleteAvailabilitySlot: mocks.deleteAvailabilitySlot,
  loadAdminAvailability: vi.fn(),
  updateAvailabilitySlot: vi.fn(),
}))

describe('AdminAvailability', () => {
  beforeEach(() => {
    mocks.useFetch.mockReturnValue({
      data: [{
        id: 'doctor-1',
        fullName: 'Dr One',
        specialization: 'Cardiology',
        slotCount: 1,
        slots: [{ id: 'slot-1', day: 'Monday', startTime: '09:00', endTime: '10:00', label: '09:00 - 10:00' }],
        groupedSlots: [
          { day: 'Monday', slots: [{ id: 'slot-1', day: 'Monday', startTime: '09:00', endTime: '10:00', label: '09:00 - 10:00' }] },
          { day: 'Tuesday', slots: [] },
          { day: 'Wednesday', slots: [] },
          { day: 'Thursday', slots: [] },
          { day: 'Friday', slots: [] },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] },
        ],
      }],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    mocks.deleteAvailabilitySlot.mockResolvedValue({})
  })

  it('deletes availability slot', async () => {
    render(<MemoryRouter><AdminAvailability /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    await waitFor(() => expect(mocks.deleteAvailabilitySlot).toHaveBeenCalledWith('slot-1'))
  })
})
