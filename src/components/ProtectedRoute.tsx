import { Navigate, useLocation } from 'react-router-dom'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-svh bg-background" aria-busy="true" aria-label="Loading">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <PageSkeleton rows={5} />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
