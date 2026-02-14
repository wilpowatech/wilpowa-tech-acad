'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'

interface Module {
  id: string
  week_number: number
  title: string
  description: string
}

interface Lesson {
  id: string
  title: string
  day_number: number
  deadline: string | null
}

interface Lab {
  id: string
  title: string
  day_number: number | null
  deadline: string | null
  total_points: number
}

interface Quiz {
  id: string
  title: string
  day_number: number | null
  deadline: string | null
}

interface Course {
  id: string
  title: string
  description: string
}

interface WeekData {
  module: Module
  lessons: Lesson[]
  labs: Lab[]
  quizzes: Quiz[]
}

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [status, setStatus] = useState<'upcoming' | 'active' | 'expired'>('upcoming')

  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const now = new Date().getTime()
      const end = new Date(deadline).getTime()
      const diff = end - now
      // Deadline starts at midnight of that day (24hrs before deadline)
      const start = end - 24 * 60 * 60 * 1000

      if (now < start) {
        setStatus('upcoming')
        setTimeLeft('Not yet open')
      } else if (diff <= 0) {
        setStatus('expired')
        setTimeLeft('Expired')
      } else {
        setStatus('active')
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        setTimeLeft(`${h}h ${m}m left`)
      }
    }
    tick()
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [deadline])

  if (!deadline) return null

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
      status === 'active' ? 'bg-amber-500/20 text-amber-300'
      : status === 'expired' ? 'bg-destructive/20 text-destructive'
      : 'bg-muted text-muted-foreground'
    }`}>
      {timeLeft}
    </span>
  )
}

export default function StudentCoursePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { enrollmentId } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [weeks, setWeeks] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (enrollmentId && user) fetchCourseData()
  }, [enrollmentId, user])

  const fetchCourseData = async () => {
    try {
      // Get enrollment
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('course_id, start_date')
        .eq('id', enrollmentId)
        .eq('student_id', user?.id)
        .single()

      if (enrollError || !enrollment) {
        router.push('/student/dashboard')
        return
      }

      // Get course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', enrollment.course_id)
        .single()
      setCourse(courseData)

      // Get all modules
      const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', enrollment.course_id)
        .order('week_number', { ascending: true })

      if (!modules || modules.length === 0) {
        setWeeks([])
        setLoading(false)
        return
      }

      // For each module, fetch lessons, labs, quizzes
      const weekDataPromises = modules.map(async (mod) => {
        const [lessonsRes, labsRes, quizzesRes] = await Promise.all([
          fetch(`/api/lessons?module_id=${mod.id}`).then(r => r.json()),
          fetch(`/api/labs?module_id=${mod.id}`).then(r => r.json()),
          fetch(`/api/quizzes?module_id=${mod.id}`).then(r => r.json()),
        ])
        return {
          module: mod,
          lessons: (lessonsRes.lessons || []).sort((a: Lesson, b: Lesson) => a.day_number - b.day_number),
          labs: labsRes.labs || [],
          quizzes: quizzesRes.quizzes || [],
        }
      })

      const allWeeks = await Promise.all(weekDataPromises)
      setWeeks(allWeeks)

      // Auto-expand current week (first week with upcoming or active content)
      if (allWeeks.length > 0) {
        setExpandedWeek(allWeeks[0].module.week_number)
      }
    } catch (err) {
      console.error('Error fetching course:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} profile={profile} />

      <header className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/student/dashboard" className="text-primary hover:text-primary/80 text-sm mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{course?.title || 'Course'}</h1>
          <p className="text-muted-foreground mt-1">{course?.description}</p>
        </div>
      </header>

      {/* 24hr deadline reminder */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg px-4 py-3 text-sm flex items-start gap-3">
          <span className="text-lg leading-none mt-0.5">&#9200;</span>
          <span>
            Each day has a <strong>24-hour deadline</strong> starting at <strong>12:00 AM</strong>.
            Complete the lecture quiz and submit the lab before <strong>11:59 PM</strong> that same day.
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {weeks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No content has been published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {weeks.map(({ module: mod, lessons, labs, quizzes }) => {
              const isExpanded = expandedWeek === mod.week_number

              return (
                <div key={mod.id} className="bg-card/80 border border-border rounded-xl overflow-hidden">
                  {/* Week Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedWeek(isExpanded ? null : mod.week_number)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-card transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        W{mod.week_number}
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Week {mod.week_number}: {mod.title}</h2>
                        <p className="text-sm text-muted-foreground">{mod.description || `${lessons.length} lectures, ${labs.length} labs, ${quizzes.length} quizzes`}</p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Day-by-day content */}
                  {isExpanded && (
                    <div className="border-t border-border px-6 py-4 space-y-4">
                      {[1, 2, 3, 4, 5].map(day => {
                        const lesson = lessons.find(l => l.day_number === day)
                        const lab = labs.find(l => l.day_number === day)
                        const quiz = quizzes.find(q => q.day_number === day)
                        const hasContent = lesson || lab || quiz

                        if (!hasContent) {
                          return (
                            <div key={day} className="flex items-center gap-3 px-4 py-3 bg-background/30 rounded-lg opacity-50">
                              <span className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">{day}</span>
                              <span className="text-sm text-muted-foreground">Day {day} &mdash; No content yet</span>
                            </div>
                          )
                        }

                        return (
                          <div key={day} className="bg-background/30 border border-border/50 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{day}</span>
                              <h3 className="font-semibold text-foreground text-sm">
                                Day {day}: {lesson?.title || 'Untitled'}
                              </h3>
                              <DeadlineBadge deadline={lesson?.deadline || lab?.deadline || quiz?.deadline || null} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 ml-10">
                              {/* Lecture link */}
                              {lesson && (
                                <div className="bg-card/50 border border-border rounded-lg px-3 py-2">
                                  <p className="text-xs text-muted-foreground mb-0.5">Lecture</p>
                                  <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                                </div>
                              )}

                              {/* Quiz link */}
                              {quiz && (
                                <Link href={`/student/quiz/${quiz.id}`}
                                  className="bg-card/50 border border-border rounded-lg px-3 py-2 hover:border-primary/50 transition-colors">
                                  <p className="text-xs text-muted-foreground mb-0.5">Quiz</p>
                                  <p className="text-sm font-medium text-primary truncate">{quiz.title}</p>
                                </Link>
                              )}

                              {/* Lab link */}
                              {lab && (
                                <Link href={`/student/lab/${lab.id}`}
                                  className="bg-card/50 border border-border rounded-lg px-3 py-2 hover:border-secondary/50 transition-colors">
                                  <p className="text-xs text-muted-foreground mb-0.5">Lab</p>
                                  <p className="text-sm font-medium text-secondary truncate">{lab.title}</p>
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
