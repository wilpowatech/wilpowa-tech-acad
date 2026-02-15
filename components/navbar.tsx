'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, profile, loading } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/auth/login')
  }

  const isActive = (path: string) => pathname === path

  const role = profile?.role
  const isStudent = role === 'student'
  const isInstructor = role === 'instructor'
  const dashboardHref = isStudent ? '/student/dashboard' : isInstructor ? '/instructor/dashboard' : '/admin/dashboard'

  const navLinks = user ? [
    { label: 'Home', href: '/' },
    { label: 'Profile', href: '/profile' },
    { label: 'Courses', href: isInstructor ? '/instructor/dashboard' : '/student/dashboard' },
    { label: 'Settings', href: '/profile' },
    { label: 'About', href: '/#about' },
  ] : [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/#about' },
    { label: 'Sign In', href: '/auth/login' },
    { label: 'Sign Up', href: '/auth/signup' },
  ]

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const isAuthPage = pathname?.startsWith('/auth/')
  if (isAuthPage && !user) return null

  return (
    <nav className="sticky top-0 z-50 w-full bg-navbar shadow-lg">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo.png"
            alt="Wilpowa Tech Academy"
            width={200}
            height={56}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Center: Nav Links (desktop) */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.label + link.href}
              href={link.href}
              className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive(link.href)
                  ? 'text-rosegold-light bg-white/10'
                  : 'text-navbar-foreground/80 hover:text-white hover:bg-navbar-hover/60'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-rosegold rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Right: User avatar dropdown or auth buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full p-0.5 border-2 border-transparent hover:border-rosegold/50 transition-all duration-200"
                aria-label="User menu"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profile'}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-rosegold/30"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-rosegold/20 flex items-center justify-center text-white text-sm font-bold ring-2 ring-rosegold/30">
                    {initials}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Profile header */}
                  <div className="px-5 py-4 border-b border-border bg-muted/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          role === 'instructor'
                            ? 'bg-primary/10 text-primary'
                            : role === 'student'
                            ? 'bg-rosegold/10 text-rosegold'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown links */}
                  <div className="py-1.5">
                    <Link
                      href={dashboardHref}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Edit Profile
                    </Link>
                    <div className="flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer">
                      <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      Overall Score
                    </div>
                    <div className="flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer">
                      <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      Inbox
                    </div>
                    {isStudent && (
                      <Link
                        href="/student/certificates"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Certificates
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-border py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-navbar-foreground/80 hover:text-white hover:bg-navbar-hover/60 transition-all rounded-md">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-rosegold text-white rounded-md hover:bg-rosegold-light transition-colors">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-navbar-foreground/70 hover:text-white hover:bg-navbar-hover/40 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-navbar animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label + link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href) ? 'text-rosegold-light bg-white/10' : 'text-navbar-foreground/80 hover:text-white hover:bg-navbar-hover/40'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 px-4 py-2.5 text-sm font-medium text-center bg-rosegold text-white rounded-lg hover:bg-rosegold-light transition-colors"
              >
                Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
