'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { ThemeToggle } from '@/src/admin/components/ThemeToggle'

export default function SetupPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [needsSetup, setNeedsSetup] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    void checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/admin/setup')
      const data = await response.json()
      if (!data.needsSetup) setNeedsSetup(false)
    } catch (error) {
      console.error('Error checking setup status:', error)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !name) {
      toast({
        title: 'Please fill in all fields',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'error', duration: 3000 })
      return
    }

    if (password.length < 8) {
      toast({
        title: 'Password must be at least 8 characters',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast({
          title: 'Setup complete',
          description: 'Admin user created. Redirecting to login…',
          variant: 'success',
          duration: 2000,
        })

        window.setTimeout(() => {
          window.location.href = '/admin/login'
        }, 2000)
      } else {
        toast({
          title: 'Setup failed',
          description: data.error || 'Setup failed',
          variant: 'error',
          duration: 5000,
        })
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Please try again.',
        variant: 'error',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!needsSetup) {
    return (
      <div className="relative grid min-h-screen place-items-center bg-background p-4 dark:bg-[radial-gradient(circle_at_20%_10%,rgba(209,122,163,0.16)_0%,rgba(209,122,163,0)_45%),radial-gradient(circle_at_85%_30%,rgba(201,168,76,0.12)_0%,rgba(201,168,76,0)_45%),linear-gradient(180deg,#17131d_0%,#211826_100%)]">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md border-border/70">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Setup Complete</CardTitle>
            <CardDescription>
              The application has already been set up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/admin/login"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Go to login
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-background p-4 text-foreground dark:bg-[radial-gradient(circle_at_20%_10%,rgba(209,122,163,0.16)_0%,rgba(209,122,163,0)_45%),radial-gradient(circle_at_85%_30%,rgba(201,168,76,0.12)_0%,rgba(201,168,76,0)_45%),linear-gradient(180deg,#17131d_0%,#211826_100%)]">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border/70 bg-card/90 text-card-foreground shadow-[0_30px_90px_rgba(2,6,23,0.22)] backdrop-blur">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-primary">
              Dreamscape
            </CardTitle>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.22em]">
              Initial Setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-50">
              <div className="text-sm font-semibold">Create Admin Account</div>
              <div className="mt-1 text-xs opacity-80">
                This creates the first administrator account. Use a strong password.
              </div>
            </div>

            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dreamscape.com"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10"
                />
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/15 p-4 text-xs text-muted-foreground dark:bg-muted/30">
                <div className="font-semibold text-foreground">Password hints</div>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>At least 8 characters</li>
                  <li>Use a mix of letters + numbers</li>
                  <li>Add a symbol if possible</li>
                </ul>
              </div>

              <Button type="submit" className="h-10 w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Creating account…
                  </span>
                ) : (
                  'Create Admin Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
