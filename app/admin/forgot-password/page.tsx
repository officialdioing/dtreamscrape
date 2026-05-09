'use client'
import { getBackendUrl } from '@/src/lib/backend-url';

import * as React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/src/admin/toast/ToastProvider'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/src/admin/components/ThemeToggle'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: 'Please enter your email address',
        variant: 'error',
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    try {
      const backendUrl = getBackendUrl()
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        toast({
          title: 'Reset email sent',
          description:
            'If an account exists with this email, you will receive a password reset link.',
          variant: 'success',
          duration: 4500,
        })
      } else {
        toast({
          title: 'Failed to send reset email',
          description: data.error || 'Please try again.',
          variant: 'error',
          duration: 4500,
        })
      }
    } catch {
      toast({
        title: 'Network error',
        description: 'Please try again.',
        variant: 'error',
        duration: 4500,
      })
    } finally {
      setIsLoading(false)
    }
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
        className="w-full max-w-md"
      >
        <Card className="border-border/70 bg-card/90 text-card-foreground shadow-[0_30px_90px_rgba(2,6,23,0.22)] backdrop-blur">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-primary">
              Dreamscape
            </CardTitle>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.22em]">
              Forgot Password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-50">
                <div className="text-sm font-semibold">Check your email</div>
                <div className="mt-1 text-sm opacity-80">
                  If an account exists with <strong>{email}</strong>, you’ll receive a password reset link shortly.
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-center text-sm text-muted-foreground">
                  Enter your email address and we’ll send you a reset link.
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@dreamscape.com"
                      className="h-10"
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="h-10 w-full" disabled={isLoading}>
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner className="size-4" />
                        Sending…
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                onClick={() => router.push('/admin/login')}
              >
                ← Back to login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
