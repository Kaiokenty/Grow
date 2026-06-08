import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { InputField, InputGroup } from '@/components/ui/input-group'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export function SignUpPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-xl font-medium text-balance">Create account</h1>
          <CardDescription>Solo training log. Your data only.</CardDescription>
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
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              minLength={8}
              required
            />
          </InputGroup>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Sign up
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Have an account?{' '}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
        </CardContent>
      </Card>
    </div>
  )
}
