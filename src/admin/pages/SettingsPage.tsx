'use client'

import * as React from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { toast as sonnerToast } from 'sonner'
import { useSettings } from '../providers/SettingsProvider'
import { authenticatedFetch } from '@/src/lib/golang-auth'
import { useAuth } from '@/src/admin/providers/GolangAuthProvider'

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const { settings, saveSettings, isLoading } = useSettings()
  const [draft, setDraft] = React.useState<any>(settings)

  React.useEffect(() => {
    setDraft(settings)
  }, [settings])

  const handleSave = async () => {
    try {
      await saveSettings(draft)
      sonnerToast.success('Settings updated', { duration: 2000 })
    } catch (error: any) {
      sonnerToast.error(error?.message || 'Failed to save settings', { duration: 2500 })
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {isLoading || !draft ? (
        <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card px-5 py-3 text-card-foreground shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
          <Spinner className="size-5 text-primary" />
          <div className="text-sm font-medium text-gray-700">Loading settings…</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-serif text-2xl font-semibold text-foreground">
                Global Settings
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Company details, social links, and defaults.
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading || !draft}
              className="h-11 rounded-full border-border/70 bg-background px-4 text-sm font-medium shadow-[0_8px_24px_rgba(64,21,63,0.04)] hover:bg-muted"
              variant="outline"
            >
              <Save size={14} className="mr-2" />
              Save Settings
            </Button>
          </div>

          <Card className="border-border/70 bg-card shadow-[0_18px_54px_rgba(64,21,63,0.06)]">
            <CardContent className="space-y-6 p-6">
              <Tabs defaultValue="business" className="space-y-6">
                <TabsList className="flex h-auto w-full max-w-4xl gap-10 bg-transparent p-0">
                  <TabsTrigger
                    value="business"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
                  >
                    Business Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="social"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
                  >
                    Social Media
                  </TabsTrigger>
                  <TabsTrigger
                    value="seo"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
                  >
                    SEO Defaults
                  </TabsTrigger>
                  <TabsTrigger
                    value="account"
                    className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-4 text-sm font-semibold uppercase tracking-[0.18em] data-[state=active]:border-brand-pink data-[state=active]:text-brand-dark data-[state=active]:shadow-none"
                  >
                    Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="business" className="space-y-6">
                  <div className="space-y-1">
                    <CardTitle className="font-serif text-base sm:text-lg">
                      Business Information
                    </CardTitle>
                  </div>
                  <Card className="border-border/70 shadow-none">
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 p-6">
                      <Field label="Company Name">
                        <Input
                          value={draft.companyName || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, companyName: e.target.value })
                          }
                          className="h-10"
                        />
                      </Field>
                      <Field label="Contact Email">
                        <Input
                          type="email"
                          value={draft.email || ''}
                          onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                          className="h-10"
                        />
                      </Field>
                      <Field label="Phone Number">
                        <Input
                          value={draft.phone || ''}
                          onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                          className="h-10"
                        />
                      </Field>
                      <Field label="Physical Address">
                        <Input
                          value={draft.address || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, address: e.target.value })
                          }
                          className="h-10"
                        />
                      </Field>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="social" className="space-y-6">
                  <Card className="border-border/70 shadow-none">
                    <CardHeader>
                      <CardTitle className="font-serif text-base sm:text-lg">Social Media</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                      <Field label="Instagram Handle">
                        <Input
                          value={draft.instagram || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, instagram: e.target.value })
                          }
                          className="h-10"
                        />
                      </Field>
                      <Field label="Facebook Page">
                        <Input
                          value={draft.facebook || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, facebook: e.target.value })
                          }
                          className="h-10"
                        />
                      </Field>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6">
                  <Card className="border-border/70 shadow-none">
                    <CardHeader>
                      <CardTitle className="font-serif text-base sm:text-lg">SEO Defaults</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:gap-5">
                      <Field label="Default Meta Title">
                        <Input
                          value={draft.metaTitle || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, metaTitle: e.target.value })
                          }
                          className="h-10"
                        />
                      </Field>
                      <Field label="Default Meta Description">
                        <Input
                          value={draft.metaDescription || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, metaDescription: e.target.value })
                          }
                          className="h-10"
                        />
                      </Field>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="account" className="space-y-6">
                  <UpdateProfileCard />
                  <UpdateEmailCard />
                  <ChangePasswordCard />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Reusable form state hook
function useFormSubmit() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (
    endpoint: string,
    data: any,
    successMessage: string,
    resetForm: () => void
  ) => {
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await authenticatedFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Request failed')
      }

      setSuccess(true)
      sonnerToast.success(successMessage, { duration: 3000 })
      resetForm()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const errorMessage = err?.message || 'Request failed'
      setError(errorMessage)
      sonnerToast.error(errorMessage, { duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, success, handleSubmit }
}

function UpdateProfileCard() {
  const [username, setUsername] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [middleName, setMiddleName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)
  const { user, updateUser } = useAuth()

  // Fetch current user profile on mount
  React.useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const token = localStorage.getItem('golang_session')
        if (token) {
          const session = JSON.parse(token)
          if (session.user) {
            const metadata = session.user.metadata || {};

            // Set username from metadata if available
            if (metadata.username) {
              setUsername(metadata.username)
            } else if (session.user.username) {
              setUsername(session.user.username)
            }

            // Set name fields from metadata first, then fallback to user properties
            if (metadata.first_name) {
              setFirstName(metadata.first_name)
            } else if (session.user.first_name) {
              setFirstName(session.user.first_name)
            }

            if (metadata.middle_name) {
              setMiddleName(metadata.middle_name)
            } else if (session.user.middle_name) {
              setMiddleName(session.user.middle_name)
            }

            if (metadata.last_name) {
              setLastName(metadata.last_name)
            } else if (session.user.last_name) {
              setLastName(session.user.last_name)
            }

            // Set phone from metadata if available
            if (metadata.phone) {
              setPhone(metadata.phone)
            }
          }
        }
      } catch (err) {
        console.error('Failed to get current profile:', err)
      }
    }
    fetchCurrentProfile()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!username || username.trim().length === 0) {
      setError('Username is required')
      return
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    if (!firstName || firstName.trim().length === 0) {
      setError('First name is required')
      return
    }

    if (!lastName || lastName.trim().length === 0) {
      setError('Last name is required')
      return
    }

    if (phone && phone.trim().length > 0) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]+$/
      if (!phoneRegex.test(phone.trim())) {
        setError('Please enter a valid phone number')
        return
      }
    }

    setIsLoading(true)

    try {
      const response = await authenticatedFetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess(true)
      sonnerToast.success('Profile updated successfully', { duration: 3000 })

      // Update auth provider and localStorage with new profile data
      try {
        if (user) {
          const updatedUser = {
            ...user,
            metadata: {
              ...user.metadata,
              username: username.trim(),
              first_name: firstName.trim(),
              middle_name: middleName ? middleName.trim() : null,
              last_name: lastName.trim(),
              phone: phone ? phone.trim() : null,
            },
            // Update derived name fields for compatibility
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            name: `${firstName.trim()} ${middleName ? middleName.trim() + ' ' : ''}${lastName.trim()}`,
          }
          updateUser(updatedUser)
        }
      } catch (err) {
        console.error('Failed to update user data:', err)
      }

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update profile'
      setError(errorMessage)
      sonnerToast.error(errorMessage, { duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="font-serif text-base sm:text-lg">Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-xs text-muted-foreground mb-2">* indicates required fields</div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 text-green-800 border border-green-200 text-sm">
              Profile updated successfully!
            </div>
          )}

          <Field label="Username *">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="h-10"
              required
              placeholder="username"
            />
          </Field>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3">
            <Field label="First Name *">
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                className="h-10"
                required
                placeholder="John"
              />
            </Field>

            <Field label="Middle Name">
              <Input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                disabled={isLoading}
                className="h-10"
                placeholder="William"
              />
            </Field>

            <Field label="Last Name *">
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                className="h-10"
                required
                placeholder="Doe"
              />
            </Field>
          </div>

          <Field label="Phone Number">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
              className="h-10"
              placeholder="+1 (555) 123-4567"
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function UpdateEmailCard() {
  const [email, setEmail] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)
  const { user, updateUser } = useAuth()

  // Fetch current user email on mount
  React.useEffect(() => {
    const fetchCurrentEmail = async () => {
      try {
        const token = localStorage.getItem('golang_session')
        if (token) {
          const session = JSON.parse(token)
          if (session.user?.email) {
            setEmail(session.user.email)
          }
        }
      } catch (err) {
        console.error('Failed to get current email:', err)
      }
    }
    fetchCurrentEmail()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email) {
      setError('Email address is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await authenticatedFetch('/api/admin/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email')
      }

      setSuccess(true)
      sonnerToast.success('Email updated successfully', { duration: 3000 })

      // Update auth provider with new email
      try {
        if (user) {
          const updatedUser = {
            ...user,
            email: email,
          }
          updateUser(updatedUser)
        }
      } catch (err) {
        console.error('Failed to update user email:', err)
      }

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update email'
      setError(errorMessage)
      sonnerToast.error(errorMessage, { duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="font-serif text-base sm:text-lg">Update Email Address</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-xs text-muted-foreground mb-2">* indicates required fields</div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 text-green-800 border border-green-200 text-sm">
              Email updated successfully! Please use your new email for future logins.
            </div>
          )}

          <Field label="Email Address *">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-10"
              required
              placeholder="your@email.com"
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? 'Updating...' : 'Update Email'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [localError, setLocalError] = React.useState('')
  const { isLoading, error, success, handleSubmit } = useFormSubmit()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setLocalError('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setLocalError('New passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setLocalError('New password must be different from current password')
      return
    }

    await handleSubmit(
      '/api/admin/change-password',
      { currentPassword, newPassword },
      'Password changed successfully',
      () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    )
  }

  const displayError = localError || error

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="font-serif text-base sm:text-lg">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="text-xs text-muted-foreground mb-2">* indicates required fields</div>

          {displayError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {displayError}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 text-green-800 border border-green-200 text-sm">
              Password changed successfully!
            </div>
          )}

          <Field label="Current Password *">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
              className="h-10"
              required
            />
          </Field>

          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
            <Field label="New Password *">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                className="h-10"
                required
              />
            </Field>

            <Field label="Confirm New Password *">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="h-10"
                required
              />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
