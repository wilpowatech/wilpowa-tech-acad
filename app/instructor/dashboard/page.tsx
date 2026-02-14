'use client'

import React from "react"

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Course {
  id: string
  title: string
  description: string
  created_at: string
}

export default function InstructorDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    total_modules: 12,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
    if (!loading && profile?.role !== 'instructor') {
      router.push('/')
    }
  }, [user, loading, profile, router])

  useEffect(() => {
    if (user && profile?.role === 'instructor') {
      fetchCourses()
    }
  }, [user, profile])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      console.error('Error fetching courses:', err)
    } finally {
      setCoursesLoading(false)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setCreateError('You must be logged in to create a course.')
      return
    }

    setCreatingCourse(true)
    setCreateError('')

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description,
          instructor_id: user.id,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create course')
      }

      setCourses([...courses, result.course])
      setNewCourse({ title: '', description: '', total_modules: 12 })
      setShowCreateCourse(false)
    } catch (err) {
      console.error('Error creating course:', err)
      setCreateError((err as Error).message || 'Failed to create course. Please try again.')
    } finally {
      setCreatingCourse(false)
    }
  }

  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Instructor Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome, {profile?.full_name}</p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowCreateCourse(!showCreateCourse)}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Create Course
            </button>
            <Button onClick={() => router.push('/profile')} variant="outline" className="border-border">
              Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showCreateCourse && (
          <div className="bg-card/80 border border-border rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Create New Course</h2>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Course Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Duration (weeks)</label>
                <input
                  type="number"
                  value={newCourse.total_modules}
                  onChange={(e) => setNewCourse({ ...newCourse, total_modules: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={creatingCourse}
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {creatingCourse ? 'Creating...' : 'Create Course'}
                </button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border bg-transparent"
                  onClick={() => setShowCreateCourse(false)}
                >
                  Cancel
                </Button>
              </div>
              {createError && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                  {createError}
                </div>
              )}
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-6">My Courses</h2>
          {courses.length === 0 ? (
            <p className="text-muted-foreground">No courses created yet. Create your first course to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function CourseCard({ course }: { course: Course }) {
  const router = useRouter()

  return (
    <div className="bg-card/80 border border-border rounded-xl p-6 hover:border-primary/50 transition">
      <h3 className="text-xl font-bold text-foreground mb-2">{course.title}</h3>
      <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
      <div className="flex gap-3">
        <Button
          onClick={() => router.push(`/instructor/course/${course.id}`)}
          className="flex-1"
        >
          Manage Content
        </Button>
        <Button onClick={() => router.push(`/instructor/analytics/${course.id}`)} variant="outline" className="flex-1 border-border">
          Analytics
        </Button>
      </div>
    </div>
  )
}
