'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/navbar'

interface Course { id: string; title: string; description: string }
interface Enrollment { id: string; course: Course; start_date: string; status: string; student_id: string; course_id: string }
interface Module { id: string; week_number: number; title: string; course_id: string }
interface DayContent { lesson?: any; lab?: any; quiz?: any; assignment?: any; progress?: any }
interface ProgressStats { totalDays: number; completedLectures: number; avgQuizScore: number; avgLabScore: number; overallScore: number; quizCount: number; labCount: number }

export default function StudentDashboard() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [modules, setModules] = useState<Record<string, Module[]>>({})
  const [dailyContent, setDailyContent] = useState<Record<string, Record<number, DayContent>>>({})
  const [progressStats, setProgressStats] = useState<Record<string, ProgressStats>>({})
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => { if (!loading && !user) router.push('/auth/login') }, [user, loading, router])

  useEffect(() => {
    if (user && profile?.role === 'student') fetchData()
  }, [user, profile])

  const fetchData = async () => {
    try {
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('id, start_date, status, course_id, courses(id, title, description)')
        .eq('student_id', user?.id)

      const mapped = (enrollData || []).map((e: any) => ({
        ...e,
        course: e.courses,
      }))
      setEnrollments(mapped)

      // Fetch progress for each course
      const statsMap: Record<string, ProgressStats> = {}
      for (const e of mapped) {
        const res = await fetch(`/api/progress?student_id=${user?.id}&course_id=${e.course?.id || e.course_id}`)
        const data = await res.json()
        statsMap[e.course?.id || e.course_id] = data.stats || { totalDays: 0, completedLectures: 0, avgQuizScore: 0, avgLabScore: 0, overallScore: 0, quizCount: 0, labCount: 0 }
      }
      setProgressStats(statsMap)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setCoursesLoading(false)
    }
  }

  const loadCourseContent = async (courseId: string) => {
    if (expandedCourse === courseId) { setExpandedCourse(null); return }
    setExpandedCourse(courseId)

    if (modules[courseId]) return // Already loaded

    try {
      // Fetch modules
      const { data: mods } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('week_number', { ascending: true })

      setModules(prev => ({ ...prev, [courseId]: mods || [] }))

      // For each module, fetch all daily content assigned to this student
      const content: Record<string, Record<number, DayContent>> = {}
      for (const mod of (mods || [])) {
        content[mod.id] = {}

        const [lessonsRes, labsRes, quizzesRes, assignRes, progressRes] = await Promise.all([
          fetch(`/api/lessons?module_id=${mod.id}`),
          fetch(`/api/labs?module_id=${mod.id}`),
          fetch(`/api/quizzes?module_id=${mod.id}`),
          fetch(`/api/assignments?module_id=${mod.id}&student_id=${user?.id}`),
          fetch(`/api/progress?student_id=${user?.id}&module_id=${mod.id}`),
        ])

        const [lessonsData, labsData, quizzesData, assignData, progressData] = await Promise.all([
          lessonsRes.json(), labsRes.json(), quizzesRes.json(), assignRes.json(), progressRes.json(),
        ])

        for (let d = 1; d <= 5; d++) {
          const assignment = (assignData.assignments || []).find((a: any) => a.day_number === d)
          const progress = (progressData.progress || []).find((p: any) => p.day_number === d)

          content[mod.id][d] = {
            lesson: (lessonsData.lessons || []).find((l: any) => l.day_number === d),
            lab: (labsData.labs || []).find((l: any) => l.day_number === d),
            quiz: (quizzesData.quizzes || []).find((q: any) => q.day_number === d),
            assignment,
            progress,
          }
        }
      }
      setDailyContent(prev => ({ ...prev, ...content }))
    } catch (err) {
      console.error('Error loading content:', err)
    }
  }

  const isAccessible = (dayContent: DayContent) => {
    if (!dayContent.assignment) return false
    const now = new Date()
    const availableAt = new Date(dayContent.assignment.available_at)
    return now >= availableAt
  }

  const getDeadlineStatus = (lesson: any) => {
    if (!lesson?.deadline) return null
    const now = new Date()
    const deadline = new Date(lesson.deadline)
    const diff = deadline.getTime() - now.getTime()
    if (diff <= 0) return 'expired'
    if (diff < 3600000) return 'urgent'
    return 'active'
  }

  if (loading || coursesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <>
      <Navbar user={user} profile={profile} />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome, {profile?.full_name}</h1>
            <p className="text-muted-foreground mt-1">Your daily learning progress</p>
          </div>

          {enrollments.length === 0 ? (
            <div className="text-center py-16 bg-card/80 border border-border rounded-xl">
              <p className="text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
              <Link href="/courses"><Button>Browse Courses</Button></Link>
            </div>
          ) : (
            <div className="space-y-6">
              {enrollments.map(enrollment => {
                const course = enrollment.course
                const courseId = course?.id || enrollment.course_id
                const stats = progressStats[courseId]
                const isExpanded = expandedCourse === courseId

                return (
                  <div key={enrollment.id} className="bg-card/80 border border-border rounded-xl overflow-hidden">
                    {/* Course header */}
                    <button onClick={() => loadCourseContent(courseId)} className="w-full text-left p-6 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-foreground">{course?.title}</h2>
                          <p className="text-sm text-muted-foreground mt-1">{course?.description}</p>
                        </div>
                        <svg className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </div>

                      {/* Overall score bar */}
                      {stats && (
                        <div className="mt-4 grid grid-cols-4 gap-4">
                          <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-primary">{stats.overallScore}%</p>
                            <p className="text-xs text-muted-foreground">Overall Score</p>
                          </div>
                          <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-foreground">{stats.avgQuizScore}%</p>
                            <p className="text-xs text-muted-foreground">Avg Quiz</p>
                          </div>
                          <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-foreground">{stats.avgLabScore}%</p>
                            <p className="text-xs text-muted-foreground">Avg Lab</p>
                          </div>
                          <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-foreground">{stats.completedLectures}</p>
                            <p className="text-xs text-muted-foreground">Lectures Done</p>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Expanded daily content */}
                    {isExpanded && modules[courseId] && (
                      <div className="border-t border-border">
                        {modules[courseId].map(mod => (
                          <div key={mod.id} className="border-b border-border last:border-0">
                            <div className="px-6 py-3 bg-muted/20">
                              <h3 className="text-sm font-bold text-foreground">Week {mod.week_number}: {mod.title}</h3>
                            </div>
                            <div className="px-6 py-4 space-y-3">
                              {[1, 2, 3, 4, 5].map(day => {
                                const dc = dailyContent[mod.id]?.[day]
                                if (!dc?.lesson && !dc?.assignment) return null

                                const accessible = isAccessible(dc)
                                const deadlineStatus = getDeadlineStatus(dc.lesson)
                                const progress = dc.progress

                                // Calculate day completion percentage
                                let completed = 0
                                let total = 0
                                if (dc.lesson) { total++; if (progress?.lecture_completed) completed++ }
                                if (dc.quiz) { total++; if (progress?.quiz_score !== null && progress?.quiz_score !== undefined) completed++ }
                                if (dc.lab) { total++; if (progress?.lab_score !== null && progress?.lab_score !== undefined) completed++ }
                                const pct = total > 0 ? Math.round((completed / total) * 100) : 0

                                return (
                                  <div key={day} className={`rounded-lg border p-4 transition-colors ${accessible ? 'border-border bg-background/40 hover:border-primary/30' : 'border-border/50 bg-muted/10 opacity-60'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${accessible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>Day {day}</span>
                                        <span className="text-sm font-medium text-foreground">{dc.lesson?.title || `Day ${day}`}</span>
                                        {!accessible && (
                                          <span className="text-xs text-muted-foreground">
                                            Available: {dc.assignment?.available_at ? new Date(dc.assignment.available_at).toLocaleString() : 'Not scheduled'}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {deadlineStatus === 'expired' && <span className="text-xs font-medium px-2 py-0.5 rounded bg-destructive/10 text-destructive">Expired</span>}
                                        {deadlineStatus === 'urgent' && <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">Due Soon</span>}
                                        <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
                                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                      </div>
                                    </div>

                                    {accessible && (
                                      <div className="grid grid-cols-3 gap-3">
                                        {/* Lecture */}
                                        {dc.lesson && (
                                          <Link href={`/student/lesson/${dc.lesson.id}`} className="flex items-center gap-2 px-3 py-2 bg-card/60 border border-border rounded-lg hover:border-primary/40 transition-colors">
                                            <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                            <div className="min-w-0">
                                              <p className="text-xs font-medium text-foreground truncate">Lecture</p>
                                              {progress?.lecture_completed && <p className="text-[10px] text-green-500">Completed</p>}
                                            </div>
                                          </Link>
                                        )}

                                        {/* Quiz */}
                                        {dc.quiz && (
                                          <Link href={`/student/quiz/${dc.quiz.id}`} className="flex items-center gap-2 px-3 py-2 bg-card/60 border border-border rounded-lg hover:border-primary/40 transition-colors">
                                            <svg className="w-4 h-4 text-secondary shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                                            <div className="min-w-0">
                                              <p className="text-xs font-medium text-foreground truncate">Quiz</p>
                                              {progress?.quiz_score !== null && progress?.quiz_score !== undefined
                                                ? <p className={`text-[10px] font-bold ${progress.quiz_score >= 70 ? 'text-green-500' : 'text-destructive'}`}>{progress.quiz_score}%</p>
                                                : <p className="text-[10px] text-muted-foreground">Not taken</p>
                                              }
                                            </div>
                                          </Link>
                                        )}

                                        {/* Lab */}
                                        {dc.lab && (
                                          <Link href={`/student/lab/${dc.lab.id}`} className="flex items-center gap-2 px-3 py-2 bg-card/60 border border-border rounded-lg hover:border-primary/40 transition-colors">
                                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                                            <div className="min-w-0">
                                              <p className="text-xs font-medium text-foreground truncate">Lab</p>
                                              {progress?.lab_score !== null && progress?.lab_score !== undefined
                                                ? <p className={`text-[10px] font-bold ${progress.lab_score >= 70 ? 'text-green-500' : 'text-destructive'}`}>{progress.lab_score}%</p>
                                                : <p className="text-[10px] text-muted-foreground">Not done</p>
                                              }
                                            </div>
                                          </Link>
                                        )}
                                      </div>
                                    )}

                                    {!accessible && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                        <span>Content locked until scheduled date</span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
