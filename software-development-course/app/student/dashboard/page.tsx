'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'
import EnrollmentCard from './EnrollmentCard' // Import EnrollmentCard component

interface Course {
  id: string
  title: string
  description: string
}

interface Enrollment {
  id: string
  course: Course
  start_date: string
  status: string
  student_id: string
}

export default function StudentDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile?.role === 'student') {
      fetchEnrollments()
    }
  }, [user, profile])

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          `
          id,
          start_date,
          status,
          course:courses(id, title, description)
        `
        )
        .eq('student_id', user?.id)

      if (error) throw error
      setEnrollments(data || [])
    } catch (err) {
      console.error('Error fetching enrollments:', err)
    } finally {
      setCoursesLoading(false)
    }
  }

  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar user={user} profile={profile} />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome, {profile?.full_name}
              </h1>
              <p className="text-muted-foreground mt-2">Your learning journey awaits</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-6">You haven't enrolled in any courses yet.</p>
              <Link href="/courses">
                <Button className="bg-blue-600 hover:bg-blue-700">Browse Courses</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {enrollments.map((enrollment) => (
                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
