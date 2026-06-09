import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResetPasswordPage } from '@/pages/ResetPassword'

const getSessionMock = vi.fn()
const updateUserMock = vi.fn()
const signOutMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => getSessionMock(),
      updateUser: (...args: unknown[]) => updateUserMock(...args),
      signOut: () => signOutMock(),
    },
  },
}))

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    })
  })

  it('renders new password form when recovery session exists', async () => {
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /set new password/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when recovery session is missing', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /reset link invalid/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /request a new reset link/i }),
    ).toHaveAttribute('href', '/forgot-password')
  })
})
