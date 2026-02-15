'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

function FeatureIcon({ type }: { type: string }) {
  const cls = "h-8 w-8"
  switch (type) {
    case 'bootcamp':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
    case 'projects':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
    case 'assessment':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
    case 'mentoring':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
    case 'certificates':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
    case 'career':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>
    default:
      return null
  }
}

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: 'bootcamp',
      title: '12-Week Intensive',
      description: 'Complete curriculum with time-based progress tracking, daily lessons, and structured learning paths.',
      href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
    },
    {
      icon: 'projects',
      title: 'Real-World Projects',
      description: 'Build portfolio-ready applications with hands-on labs and practical coding exercises.',
      href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
    },
    {
      icon: 'assessment',
      title: 'Expert Assessment',
      description: '4 comprehensive exams with plagiarism detection and automated grading systems.',
      href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
    },
    {
      icon: 'mentoring',
      title: 'Live Mentoring',
      description: 'Direct access to experienced instructors who guide you through every challenge.',
      href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=instructor',
    },
    {
      icon: 'certificates',
      title: 'Certificates',
      description: 'Earn verified completion certificates that showcase your skills to employers.',
      href: user ? (profile?.role === 'student' ? '/student/certificates' : '/instructor/dashboard') : '/auth/signup?role=student',
    },
    {
      icon: 'career',
      title: 'Career Support',
      description: 'Job placement assistance, resume review, and interview preparation support.',
      href: user ? (profile?.role === 'student' ? '/student/dashboard' : '/instructor/dashboard') : '/auth/signup?role=student',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background image with light overlay */}
        <div className="absolute inset-0">
          <Image
            src="/site-background.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-white/80" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Wilpowa Tech Academy"
              width={280}
              height={78}
              className="h-20 w-auto object-contain mx-auto"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Professional Software Development Bootcamp
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
            Master full-stack development in 12 weeks with real-world projects, hands-on labs, and expert instruction.
          </p>

          {!user && (
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/auth/signup?role=student">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-base shadow-lg shadow-primary/20">
                  Enroll as Student
                </Button>
              </Link>
              <Link href="/auth/signup?role=instructor">
                <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground px-8 py-3 text-base">
                  Become an Instructor
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-3 text-balance">Why Choose Wilpowa Tech Academy</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-pretty leading-relaxed">
            Everything you need to launch your career in software development, all in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Link key={i} href={feature.href} className="group">
              <div className="h-full bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-14 w-14 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <FeatureIcon type={feature.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Wilpowa Tech Academy. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sign In</Link>
            <Link href="/auth/signup" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
