import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import { ShapeProvider } from '@/lib/shape-context'
import { SurfaceProvider } from '@/lib/surface-context'
import { ThemeProvider } from '@/lib/theme'

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      })),
    )
  : () => null

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ShapeProvider defaultShape="rounded">
            <SurfaceProvider value={1}>{children}</SurfaceProvider>
          </ShapeProvider>
        </ThemeProvider>
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </AuthProvider>
    </QueryClientProvider>
  )
}
