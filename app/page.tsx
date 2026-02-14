'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { user, loading, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === 'instructor') {
        router.push('/instructor/dashboard')
      } else if (profile?.role === 'student') {
        router.push('/student/dashboard')
      } else {
        router.push('/admin/dashboard')
      }
    }
  }, [user, loading, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Wilpowa Tech Academy"
              width={180}
              height={50}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex gap-4">
            {!user ? (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" className="border-border text-foreground hover:text-foreground bg-transparent">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-5xl font-bold text-foreground mb-6 text-balance">Professional Software Development Bootcamp</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
          Master full-stack development in 12 weeks with real-world projects, hands-on labs, and expert instruction.
        </p>

        {!user ? (
          <div className="flex justify-center gap-4">
            <Link href="/auth/signup?role=student">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Enroll as Student
              </Button>
            </Link>
            <Link href="/auth/signup?role=instructor">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:text-foreground bg-transparent">
                Become an Instructor
              </Button>
            </Link>
          </div>
        ) : null}
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: '12-Week Intensive',
              description: 'Complete curriculum with time-based progress tracking',
              href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
            },
            {
              title: 'Real-World Projects',
              description: 'Build portfolio-ready applications and labs',
              href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
            },
            {
              title: 'Expert Assessment',
              description: '4 comprehensive exams + plagiarism detection',
              href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
            },
            {
              title: 'Live Mentoring',
              description: 'Direct access to experienced instructors',
              href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=instructor',
            },
            {
              title: 'Certificates',
              description: 'Earn verified completion certificates',
              href: user ? (profile?.role === 'student' ? '/student/certificates' : '/instructor/dashboard') : '/auth/signup?role=student',
            },
            {
              title: 'Career Support',
              description: 'Job placement assistance and resume review',
              href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
            },
          ].map((feature, i) => (
            <Link key={i} href={feature.href} className="group">
              <div className="h-full bg-card/80 border border-border rounded-lg p-6 hover:border-primary hover:bg-card transition-all duration-300 cursor-pointer">
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground group-hover:text-foreground transition-colors">{feature.description}</p>
                <div className="mt-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                  Learn more &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
