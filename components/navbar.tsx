'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/auth'

export default function Navbar({ user, profile }: any) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            DevCourse
          </div>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href={
              profile?.role === 'student'
                ? '/student/dashboard'
                : '/instructor/dashboard'
            }
            className="text-sm text-foreground hover:text-primary transition"
          >
            Dashboard
          </Link>
          {profile?.role === 'student' && (
            <Link
              href="/student/progress"
              className="text-sm text-foreground hover:text-primary transition"
            >
              Progress
            </Link>
          )}
          {profile?.role === 'instructor' && (
            <Link
              href="/instructor/courses"
              className="text-sm text-foreground hover:text-primary transition"
            >
              My Courses
            </Link>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10 hover:bg-primary/20 transition text-primary font-bold text-sm"
          >
            {getInitials(profile?.full_name || 'U')}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Link
                href={
                  profile?.role === 'student'
                    ? '/student/dashboard'
                    : '/instructor/dashboard'
                }
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition"
                onClick={() => setIsDropdownOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm text-foreground hover:bg-primary/10 transition"
                onClick={() => setIsDropdownOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
