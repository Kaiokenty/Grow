import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { InputField, InputGroup } from '@/components/ui/input-group'
import { supabase } from '@/lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const { data, error: sessionErr } = await supabase.auth.getSession()

      if (cancelled) return

      if (sessionErr || !data.session) {
        setSessionError('This reset link is invalid or has expired.')
        setHasSession(false)
      } else {
        setHasSession(true)
      }

      setCheckingSession(false)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setLoading(false)
      setError(updateError.message)
      return
    }

    await supabase.auth.signOut()
    setLoading(false)
    navigate('/login', { replace: true })
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 text-sm text-muted-foreground">
        Verifying reset link…
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <h1 className="text-xl font-medium">Reset link invalid</h1>
            <CardDescription>
              {sessionError ?? 'This reset link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              <Link
                to="/forgot-password"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Request a new reset link
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-xl font-medium text-balance">Set new password</h1>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputGroup className="w-full">
              <InputField
                index={0}
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                minLength={8}
                required
              />
              <InputField
                index={1}
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
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
              Update password
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
