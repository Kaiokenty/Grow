import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { InputField, InputGroup } from '@/components/ui/input-group'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: { pathname: string } } | null)?.from
    ?.pathname ?? '/'

  if (user) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-xl font-medium text-balance">Sign in</h1>
          <CardDescription>Track training. Read the data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputGroup className="w-full">
            <InputField
              index={0}
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              required
            />
            <InputField
              index={1}
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              required
            />
          </InputGroup>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
        </CardContent>
      </Card>
    </div>
  )
}
