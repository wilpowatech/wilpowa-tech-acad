'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileData {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url: string | null
  date_of_birth: string | null
  phone: string | null
  sex: string | null
  github_url: string | null
  country: string | null
  bio: string | null
  created_at: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    sex: '',
    github_url: '',
    country: '',
    bio: '',
    date_of_birth: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
    if (user) {
      fetchProfile()
    }
  }, [user, authLoading])

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/profile?user_id=${user!.id}`)
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
        setFormData({
          full_name: data.profile.full_name || '',
          phone: data.profile.phone || '',
          sex: data.profile.sex || '',
          github_url: data.profile.github_url || '',
          country: data.profile.country || '',
          bio: data.profile.bio || '',
          date_of_birth: data.profile.date_of_birth || '',
        })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user!.id, ...formData }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save' })
        return
      }
      setProfile(data.profile)
      setEditing(false)
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    )
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => { setEditing(false); setMessage(null) }} variant="ghost" className="text-muted-foreground">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Status message */}
        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="h-16 w-16 rounded-full object-cover border-2 border-primary/30" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-bold border-2 border-primary/30">
                  {initials}
                </div>
              )}
              <div>
                <CardTitle className="text-xl text-foreground">{profile.full_name || 'Unnamed User'}</CardTitle>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {profile.role}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* GitHub URL - Prominent for students */}
            <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
              <Label className="text-sm font-semibold text-secondary">GitHub Profile URL</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Required for lab submissions via GitHub. Link your profile so your repos can be scored.
              </p>
              {editing ? (
                <Input
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/yourusername"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              ) : (
                <p className="text-sm text-foreground">
                  {profile.github_url ? (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {profile.github_url}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Not set - click Edit Profile to add your GitHub URL</span>
                  )}
                </p>
              )}
            </div>

            {/* Other fields in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                {editing ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1 bg-input border-border text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground">{profile.full_name || '-'}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                {editing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234..."
                    className="mt-1 bg-input border-border text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground">{profile.phone || '-'}</p>
                )}
              </div>

              {/* Sex */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Sex</Label>
                {editing ? (
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-foreground capitalize">{profile.sex || '-'}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                {editing ? (
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Nigeria"
                    className="mt-1 bg-input border-border text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground">{profile.country || '-'}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                {editing ? (
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="mt-1 bg-input border-border text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-sm text-foreground">
                    {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '-'}
                  </p>
                )}
              </div>

              {/* Member Since */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <p className="mt-1 text-sm text-foreground">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Bio - full width */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
              {editing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none"
                />
              ) : (
                <p className="mt-1 text-sm text-foreground leading-relaxed">{profile.bio || '-'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
