'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Course {
  id: string
  title: string
  description: string
  instructor_name: string
  created_at: string
}

export default function CoursesPage() {
  const { user, profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [user])

  async function fetchCourses() {
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      setCourses(data.courses || [])

      if (user) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', user.id)
        setEnrolledIds(new Set((enrollments || []).map((e: any) => e.course_id)))
      }
    } catch {
      console.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll(courseId: string) {
    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in to enroll.' })
      return
    }
    setEnrollingId(courseId)
    setMessage(null)
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({ student_id: user.id, course_id: courseId, status: 'active', start_date: new Date().toISOString() })

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'error', text: 'You are already enrolled in this course.' })
        } else {
          setMessage({ type: 'error', text: error.message })
        }
      } else {
        setEnrolledIds(prev => new Set([...prev, courseId]))
        setMessage({ type: 'success', text: 'Enrolled successfully! Go to your Dashboard to start learning.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Enrollment failed.' })
    } finally {
      setEnrollingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Available Courses</h1>
          <p className="text-muted-foreground mt-1">Browse and enroll in courses to start your learning journey.</p>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-chart-4/10 text-chart-4 border border-chart-4/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {message.text}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="text-center py-16 bg-card/80 border border-border rounded-xl">
            <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-muted-foreground">No courses available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const isEnrolled = enrolledIds.has(course.id)
              return (
                <div key={course.id} className="bg-card/80 border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
                  {/* Course color band */}
                  <div className="h-2 bg-secondary" />
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-lg font-bold text-foreground mb-2 text-balance">{course.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4 flex-1 leading-relaxed">{course.description || 'No description provided.'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-muted-foreground">By {course.instructor_name}</span>
                      <span className="text-xs text-muted-foreground">{new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                    {profile?.role === 'student' ? (
                      isEnrolled ? (
                        <Link href="/student/dashboard">
                          <Button className="w-full bg-chart-4/20 text-chart-4 hover:bg-chart-4/30 border border-chart-4/30">
                            Go to Dashboard
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      )
                    ) : !user ? (
                      <Link href="/auth/login">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          Sign In to Enroll
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
