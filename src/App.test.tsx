import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '@/App'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, loading: false, session: null, signOut: vi.fn() }),
}))

describe('App', () => {
  it('renders login without loading body highlighter on /login', async () => {
    window.history.pushState({}, '', '/login')
    render(<App />)
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })
})
