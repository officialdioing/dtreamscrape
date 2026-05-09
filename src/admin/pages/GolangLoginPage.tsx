'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Apple, ArrowLeft, Eye, EyeOff, Facebook } from 'lucide-react'
import { oauthLogin, login, type LoginRequest } from '@/src/lib/golang-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { ThemeToggle } from '@/src/admin/components/ThemeToggle'

export default function GolangLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  })

  const handleOAuthLogin = (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true)
    try {
      oauthLogin[provider]()
    } catch {
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth login failed`)
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(formData)

      // Force page reload to ensure AuthProvider picks up the new session
      // This is necessary because AuthProvider needs to re-read localStorage
      window.location.href = '/admin/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground dark:bg-[radial-gradient(circle_at_20%_10%,rgba(209,122,163,0.16)_0%,rgba(209,122,163,0)_45%),radial-gradient(circle_at_85%_30%,rgba(201,168,76,0.12)_0%,rgba(201,168,76,0)_45%),linear-gradient(180deg,#17131d_0%,#211826_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#40153f]/12 blur-3xl dark:bg-[#d17aa3]/16" />
        <div className="absolute bottom-[-7rem] right-[-5rem] h-80 w-80 rounded-full bg-[#c9a84c]/14 blur-3xl dark:bg-[#c9a84c]/10" />
      </div>

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg items-center justify-center">
        <Card className="w-full rounded-[2rem] border border-border/70 bg-card/90 text-card-foreground shadow-[0_30px_90px_rgba(2,6,23,0.22)] backdrop-blur">
          <CardHeader className="space-y-6 px-7 pb-4 pt-8 sm:px-8">
            <div className="flex items-center justify-between">
              <Button asChild variant="ghost" className="h-9 rounded-full px-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary hover:bg-primary/5 hover:text-primary">
                <Link href="/">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back home
                </Link>
              </Button>
            </div>

            <div className="flex justify-center">
              <div className="relative h-14 w-48">
                <Image
                  src="/logo.png"
                  alt="Dreamscape Curated Events"
                  fill
                  priority
                  sizes="192px"
                  className="object-contain"
                />
              </div>
            </div>

            <div className="mx-auto h-px w-24 bg-[linear-gradient(90deg,rgba(64,21,63,0),rgba(64,21,63,0.5),rgba(201,168,76,0.75),rgba(64,21,63,0.5),rgba(64,21,63,0))]" />

            <div className="flex justify-center">
              <CardDescription className="max-w-md text-center text-sm leading-6 text-muted-foreground">
                Sign in to continue to your dashboard.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-7 pb-8 pt-2 sm:px-8">
            <form onSubmit={handleEmailLogin} className="space-y-7">
              <div className="rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-[0_12px_30px_rgba(64,21,63,0.06)] sm:p-5">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-2xl border border-border/80 bg-background px-4 text-[0.98rem] text-foreground shadow-[0_8px_20px_rgba(64,21,63,0.04)] placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/10"
                      placeholder="Email Address"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-12 rounded-2xl border border-border/80 bg-background px-4 pr-10 text-[0.98rem] text-foreground shadow-[0_8px_20px_rgba(64,21,63,0.04)] placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/10"
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_18px_35px_rgba(64,21,63,0.28)] transition-all hover:bg-primary/90"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-8 space-y-5">
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-border/70" />
                <span className="px-4 text-sm text-muted-foreground">Or sign in with</span>
                <div className="flex-1 border-t border-border/70" />
              </div>

              <div className="flex items-center justify-center gap-3.5">
                <Button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-border/70 bg-background text-foreground/80 shadow-none transition-all hover:border-primary/30 hover:bg-primary/5"
                  aria-label="Continue with Google"
                >
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled={isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(64,21,63,0.18)] transition-all hover:bg-primary/90"
                  aria-label="Continue with Facebook"
                >
                  <Facebook className="h-[18px] w-[18px]" />
                </Button>

                <Button
                  type="button"
                  onClick={() => handleOAuthLogin('apple')}
                  disabled={isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-full border border-border/70 bg-background text-foreground shadow-none transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  aria-label="Continue with Apple"
                >
                  <Apple className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
