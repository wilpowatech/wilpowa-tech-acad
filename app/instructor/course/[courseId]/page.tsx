'use client'

import React from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Module {
  id: string
  week_number: number
  title: string
  description: string
}

interface CourseData {
  id: string
  title: string
  description: string
  total_modules: number
}

interface Exam {
  id: string
  title: string
  description: string
  total_questions: number
  passing_score: number
  duration_minutes: number
}

export default function CoursePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { courseId } = useParams()
  const [course, setCourse] = useState<CourseData | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModule, setShowAddModule] = useState(false)
  const [addingModule, setAddingModule] = useState(false)
  const [addModuleError, setAddModuleError] = useState('')
  const [activeSection, setActiveSection] = useState<'modules' | 'exams'>('modules')
  const [newModule, setNewModule] = useState({
    week_number: 1,
    title: '',
    description: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData()
    }
  }, [courseId, user])

  const fetchCourseData = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('instructor_id', user?.id)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('week_number', { ascending: true })

      if (modulesError) throw modulesError
      setModules(modulesData || [])

      // Fetch exams
      const examsRes = await fetch(`/api/exams?course_id=${courseId}`)
      const examsData = await examsRes.json()
      setExams(examsData.exams || [])
    } catch (err) {
      console.error('Error fetching course:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setAddModuleError('You must be logged in to add a module.')
      return
    }

    setAddingModule(true)
    setAddModuleError('')

    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          week_number: newModule.week_number,
          title: newModule.title,
          description: newModule.description,
          instructor_id: user.id,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to add module')
      }

      setModules([...modules, result.module].sort((a, b) => a.week_number - b.week_number))
      setNewModule({ week_number: modules.length + 2, title: '', description: '' })
      setShowAddModule(false)
    } catch (err) {
      console.error('Error adding module:', err)
      setAddModuleError((err as Error).message || 'Failed to add module. Please try again.')
    } finally {
      setAddingModule(false)
    }
  }

  const handleDeleteExam = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams?id=${examId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete exam')
      setExams((prev) => prev.filter((e) => e.id !== examId))
    } catch (err) {
      console.error('Error deleting exam:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-6">Course not found</p>
          <Link href="/instructor/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Link href="/instructor/dashboard" className="text-primary hover:text-primary/80 text-sm mb-2 inline-block">
                &larr; Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
              <p className="text-muted-foreground mt-1">{course.description}</p>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-6 mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setActiveSection('modules')}
              className={`text-sm font-semibold pb-2 border-b-2 -mb-4 transition ${
                activeSection === 'modules'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              Weekly Modules ({modules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('exams')}
              className={`text-sm font-semibold pb-2 border-b-2 -mb-4 transition ${
                activeSection === 'exams'
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              Monthly Exams ({exams.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========== MODULES SECTION ========== */}
        {activeSection === 'modules' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Course Modules</h2>
              <button
                type="button"
                onClick={() => setShowAddModule(!showAddModule)}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Add Module/Week
              </button>
            </div>

            {/* Add Module Form */}
            {showAddModule && (
              <div className="bg-card/80 border border-border rounded-xl p-8 mb-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Add New Module/Week</h3>
                <form onSubmit={handleAddModule} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Week Number</label>
                      <input
                        type="number"
                        value={newModule.week_number}
                        onChange={(e) => setNewModule({ ...newModule, week_number: parseInt(e.target.value) })}
                        min="1"
                        max="12"
                        className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Module Title</label>
                      <input
                        type="text"
                        value={newModule.title}
                        onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                        className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <textarea
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={addingModule}
                      className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                    >
                      {addingModule ? 'Adding...' : 'Add Module'}
                    </button>
                    <Button type="button" variant="outline" className="border-border bg-transparent" onClick={() => setShowAddModule(false)}>
                      Cancel
                    </Button>
                  </div>
                  {addModuleError && (
                    <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
                      {addModuleError}
                    </div>
                  )}
                </form>
              </div>
            )}

            {modules.length === 0 ? (
              <div className="text-center py-12 bg-card/80 border border-border rounded-xl">
                <p className="text-muted-foreground mb-4">No modules added yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddModule(true)}
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Add First Module
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {modules.map((mod) => (
                  <ModuleCard key={mod.id} module={mod} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ========== EXAMS SECTION ========== */}
        {activeSection === 'exams' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Monthly Exams</h2>
                <p className="text-muted-foreground text-sm mt-1">Comprehensive exams covering everything taught that month. A-D multiple choice, auto-scored.</p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/instructor/course/${courseId}/exam/create`)}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shrink-0"
              >
                Create Exam
              </button>
            </div>

            {exams.length === 0 ? (
              <div className="text-center py-12 bg-card/80 border border-border rounded-xl">
                <p className="text-muted-foreground mb-4">No exams created yet.</p>
                <button
                  type="button"
                  onClick={() => router.push(`/instructor/course/${courseId}/exam/create`)}
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Create First Exam
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="bg-card/80 border border-border rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{exam.title}</h3>
                        {exam.description && <p className="text-muted-foreground text-sm mt-1">{exam.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-3">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                            {exam.total_questions} Questions
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                            {exam.duration_minutes} Minutes
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                            Pass: {exam.passing_score}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/instructor/exam/${exam.id}/edit`)}
                          variant="outline"
                          className="border-border"
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-destructive hover:text-destructive/80 text-sm font-medium px-3 py-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function ModuleCard({ module }: { module: Module }) {
  const router = useRouter()

  return (
    <div className="bg-card/80 border border-border rounded-xl p-6 hover:border-primary/50 transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Week {module.week_number}: {module.title}</h3>
          {module.description && <p className="text-muted-foreground mt-1 text-sm">{module.description}</p>}
        </div>
      </div>
      <p className="text-muted-foreground text-xs mb-4">Day 1-5 Lectures | Labs | Weekly Quiz</p>
      <div className="flex gap-3">
        <Button
          onClick={() => router.push(`/instructor/module/${module.id}/edit`)}
          className="flex-1"
        >
          Manage Content
        </Button>
      </div>
    </div>
  )
}
