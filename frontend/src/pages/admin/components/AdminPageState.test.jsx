import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminEmptyState, AdminErrorState } from './AdminPageState'

describe('admin page states', () => {
  it('renders empty state', () => {
    render(<AdminEmptyState title="Nothing here" description="No rows yet." icon="0" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('No rows yet.')).toBeInTheDocument()
  })

  it('renders error retry action', () => {
    const onRetry = vi.fn()
    render(<AdminErrorState error="Boom" onRetry={onRetry} />)
    expect(screen.getByText('Boom')).toBeInTheDocument()
  })
})
