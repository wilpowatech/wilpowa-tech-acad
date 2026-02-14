'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/auth'
import { ScorePieChart } from '@/components/score-pie-chart'

interface CourseProgress {
  courseId: string
  courseTitle: string
  enrolledDate: string
  status: string
  totalDays: number
  completedLectures: number
  quizCount: number
  labCount: number
  avgQuizScore: number
  avgLabScore: number
  overallScore: number
  daysWorked: number
  pendingDays: number
}

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [progressLoading, setProgressLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function fetchCourseProgress() {
    if (!user) return
    setProgressLoading(true)
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, course_id, start_date, status, courses(id, title)')
        .eq('student_id', user.id)

      const progressList: CourseProgress[] = []
      for (const enrollment of (enrollments || [])) {
        const course = (enrollment as any).courses
        const courseId = course?.id || enrollment.course_id

        const res = await fetch(`/api/progress?student_id=${user.id}&course_id=${courseId}`)
        const data = await res.json()
        const stats = data.stats || {}

        // Count total days assigned
        const { data: assignments } = await supabase
          .from('content_assignments')
          .select('day_number')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
        const totalAssigned = new Set((assignments || []).map((a: any) => a.day_number)).size

        const daysWorked = stats.completedLectures || 0
        const pendingDays = Math.max(0, totalAssigned - daysWorked)

        progressList.push({
          courseId,
          courseTitle: course?.title || 'Untitled Course',
          enrolledDate: enrollment.start_date,
          status: enrollment.status || 'active',
          totalDays: totalAssigned || stats.totalDays || 0,
          completedLectures: daysWorked,
          quizCount: stats.quizCount || 0,
          labCount: stats.labCount || 0,
          avgQuizScore: stats.avgQuizScore || 0,
          avgLabScore: stats.avgLabScore || 0,
          overallScore: stats.overallScore || 0,
          daysWorked,
          pendingDays,
        })
      }
      setCourseProgress(progressList)
    } catch {
      console.error('Failed to load course progress')
    } finally {
      setProgressLoading(false)
    }
  }

  // Fetch course progress for students
  useEffect(() => {
    if (profile?.role === 'student' && user) {
      fetchCourseProgress()
    }
  }, [profile, user])

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', user.id)

      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Upload failed' })
        return
      }

      setProfile(prev => prev ? { ...prev, avatar_url: data.avatar_url } : prev)
      setMessage({ type: 'success', text: 'Profile picture updated!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload profile picture' })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
              <div className="relative group">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="h-20 w-20 rounded-full object-cover border-2 border-primary/30" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/30">
                    {initials}
                  </div>
                )}
                {/* Upload overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">{profile.full_name || 'Unnamed User'}</CardTitle>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                  {profile.role}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">Hover avatar to change picture</p>
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

        {/* Course Progress Section (Students only) */}
        {profile.role === 'student' && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">My Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {progressLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : courseProgress.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">Not enrolled in any courses yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {courseProgress.map(cp => {
                    const completionPct = cp.totalDays > 0 ? Math.round((cp.daysWorked / cp.totalDays) * 100) : 0
                    return (
                      <div key={cp.courseId} className="rounded-xl border border-border bg-background/40 p-5">
                        {/* Course Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-base font-bold text-foreground">{cp.courseTitle}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Enrolled: {new Date(cp.enrolledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                            cp.status === 'completed'
                              ? 'bg-chart-4/10 text-chart-4'
                              : cp.status === 'active'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted/30 text-muted-foreground'
                          }`}>
                            {cp.status}
                          </span>
                        </div>

                        {/* Pie Charts Row */}
                        <div className="flex items-center justify-around mb-4 py-2">
                          <ScorePieChart score={cp.overallScore} label="Overall" size={90} />
                          <ScorePieChart score={cp.avgQuizScore} label="Quiz Avg" size={80} />
                          <ScorePieChart score={cp.avgLabScore} label="Lab Avg" size={80} />
                          <ScorePieChart score={completionPct} label="Completion" size={80} />
                        </div>

                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-card/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-foreground">{cp.daysWorked}</p>
                            <p className="text-[10px] text-muted-foreground">Days Done</p>
                          </div>
                          <div className="bg-card/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-secondary">{cp.pendingDays}</p>
                            <p className="text-[10px] text-muted-foreground">Pending</p>
                          </div>
                          <div className="bg-card/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-primary">{cp.quizCount}</p>
                            <p className="text-[10px] text-muted-foreground">Quizzes Taken</p>
                          </div>
                          <div className="bg-card/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-lg font-bold text-accent">{cp.labCount}</p>
                            <p className="text-[10px] text-muted-foreground">Labs Submitted</p>
                          </div>
                        </div>

                        {/* Score Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Overall Score</span>
                            <span className="font-bold text-foreground">{cp.overallScore}/100</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${cp.overallScore}%`,
                                background: cp.overallScore >= 70 ? '#00ff88' : cp.overallScore >= 50 ? '#ffd700' : '#ff4444'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
