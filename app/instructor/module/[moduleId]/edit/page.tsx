'use client'

import React from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Navbar from '@/components/navbar'

// ─── Types ───
interface Module { id: string; week_number: number; title: string; course_id: string }
interface Lesson { id: string; title: string; content: string; description: string; day_number: number; module_id: string; deadline: string | null; scheduled_at: string | null; available_at: string | null }
interface Lab { id: string; title: string; instructions: string; github_repo_url: string | null; sandbox_url: string | null; total_points: number; day_number: number | null; deadline: string | null; module_id: string }
interface QuizAnswer { id?: string; answer_text: string; is_correct: boolean; order_number: number }
interface QuizQuestion { id?: string; question_text: string; points: number; quiz_answers: QuizAnswer[] }
interface Quiz { id: string; title: string; day_number: number | null; quiz_questions: QuizQuestion[] }
interface Student { id: string; full_name: string; email: string }
interface Assignment { student_id: string; day_number: number; available_at: string }

const DAYS = [1, 2, 3, 4, 5]
const OPTION_LABELS = ['A', 'B', 'C', 'D']

function emptyQuestions(): QuizQuestion[] {
  return Array.from({ length: 10 }, (_, i) => ({
    question_text: '',
    points: 10,
    quiz_answers: OPTION_LABELS.map((_, j) => ({ answer_text: '', is_correct: j === 0, order_number: j + 1 })),
  }))
}

export default function ModuleEditPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { moduleId } = useParams()

  const [mod, setMod] = useState<Module | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(1)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saveMsg, setSaveMsg] = useState<Record<string, string>>({})

  // Per-day form state
  const [lessonForms, setLessonForms] = useState<Record<number, { title: string; description: string; content: string; scheduled_at: string; deadline: string }>>({})
  const [labForms, setLabForms] = useState<Record<number, { title: string; instructions: string; github_repo_url: string; sandbox_url: string; total_points: number }>>({})
  const [quizForms, setQuizForms] = useState<Record<number, QuizQuestion[]>>({})
  const [selectedStudents, setSelectedStudents] = useState<Record<number, Set<string>>>({})
  const [scheduleDates, setScheduleDates] = useState<Record<number, string>>({})

  // ─── Auth guard ───
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'instructor')) router.push('/')
  }, [user, profile, authLoading, router])

  // ─── Fetch all data ───
  const fetchData = useCallback(async () => {
    if (!moduleId) return
    try {
      // Module info
      const { data: modData } = await supabase.from('modules').select('*').eq('id', moduleId).single()
      if (!modData) { router.push('/instructor/dashboard'); return }
      setMod(modData)

      // Fetch all content in parallel
      const [lessonsRes, labsRes, quizzesRes, studentsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/lessons?module_id=${moduleId}`),
        fetch(`/api/labs?module_id=${moduleId}`),
        fetch(`/api/quizzes?module_id=${moduleId}`),
        fetch(`/api/students?course_id=${modData.course_id}`),
        fetch(`/api/assignments?module_id=${moduleId}`),
      ])

      const lessonsData = await lessonsRes.json()
      const labsData = await labsRes.json()
      const quizzesData = await quizzesRes.json()
      const studentsData = await studentsRes.json()
      const assignmentsData = await assignmentsRes.json()

      setLessons(lessonsData.lessons || [])
      setLabs(labsData.labs || [])
      setQuizzes(quizzesData.quizzes || [])
      setStudents(studentsData.students || [])
      setAssignments(assignmentsData.assignments || [])

      // Initialize forms from existing data
      const lForms: typeof lessonForms = {}
      const laForms: typeof labForms = {}
      const qForms: typeof quizForms = {}
      const selStudents: typeof selectedStudents = {}
      const schDates: typeof scheduleDates = {}

      for (const d of DAYS) {
        const lesson = (lessonsData.lessons || []).find((l: Lesson) => l.day_number === d)
        lForms[d] = {
          title: lesson?.title || '',
          description: lesson?.description || '',
          content: lesson?.content || '',
          scheduled_at: lesson?.scheduled_at ? lesson.scheduled_at.slice(0, 16) : '',
          deadline: lesson?.deadline ? lesson.deadline.slice(0, 16) : '',
        }

        const lab = (labsData.labs || []).find((l: Lab) => l.day_number === d)
        laForms[d] = {
          title: lab?.title || '',
          instructions: lab?.instructions || '',
          github_repo_url: lab?.github_repo_url || '',
          sandbox_url: lab?.sandbox_url || '',
          total_points: lab?.total_points || 100,
        }

        const quiz = (quizzesData.quizzes || []).find((q: Quiz) => q.day_number === d)
        qForms[d] = quiz?.quiz_questions?.length > 0
          ? quiz.quiz_questions.map((q: QuizQuestion) => ({
              ...q,
              quiz_answers: q.quiz_answers.length > 0 ? q.quiz_answers : OPTION_LABELS.map((_, j) => ({ answer_text: '', is_correct: j === 0, order_number: j + 1 }))
            }))
          : emptyQuestions()

        // Load assigned students for this day
        const dayAssignments = (assignmentsData.assignments || []).filter((a: Assignment) => a.day_number === d)
        selStudents[d] = new Set(dayAssignments.map((a: Assignment) => a.student_id))
        if (dayAssignments.length > 0) {
          schDates[d] = dayAssignments[0].available_at?.slice(0, 16) || ''
        }
      }

      setLessonForms(lForms)
      setLabForms(laForms)
      setQuizForms(qForms)
      setSelectedStudents(selStudents)
      setScheduleDates(schDates)
    } catch (err) {
      console.error('Error fetching module data:', err)
    } finally {
      setLoading(false)
    }
  }, [moduleId, router])

  useEffect(() => { if (user && moduleId) fetchData() }, [user, moduleId, fetchData])

  // ─── Helpers ───
  const getLessonForDay = (day: number) => lessons.find(l => l.day_number === day)
  const getLabForDay = (day: number) => labs.find(l => l.day_number === day)
  const getQuizForDay = (day: number) => quizzes.find(q => q.day_number === day)
  const dayStatus = (day: number) => {
    let count = 0
    if (getLessonForDay(day)) count++
    if (getLabForDay(day)) count++
    if (getQuizForDay(day)) count++
    return count
  }

  const toggleStudent = (day: number, studentId: string) => {
    setSelectedStudents(prev => {
      const s = new Set(prev[day] || [])
      if (s.has(studentId)) s.delete(studentId); else s.add(studentId)
      return { ...prev, [day]: s }
    })
  }
  const selectAll = (day: number) => setSelectedStudents(prev => ({ ...prev, [day]: new Set(students.map(s => s.id)) }))
  const deselectAll = (day: number) => setSelectedStudents(prev => ({ ...prev, [day]: new Set() }))

  // ─── Save handlers ───
  const saveLecture = async (day: number) => {
    setSaving(p => ({ ...p, [`lecture-${day}`]: true }))
    setSaveMsg(p => ({ ...p, [`lecture-${day}`]: '' }))
    try {
      const form = lessonForms[day]
      const existing = getLessonForDay(day)
      const body: any = {
        module_id: moduleId,
        day_number: day,
        title: form.title,
        description: form.description,
        content: form.content,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        available_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      }

      let res
      if (existing) {
        res = await fetch('/api/lessons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id, ...body }) })
      } else {
        res = await fetch('/api/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Update local state
      if (existing) {
        setLessons(prev => prev.map(l => l.id === existing.id ? data.lesson : l))
      } else {
        setLessons(prev => [...prev, data.lesson])
      }
      setSaveMsg(p => ({ ...p, [`lecture-${day}`]: 'Saved!' }))
    } catch (err) {
      setSaveMsg(p => ({ ...p, [`lecture-${day}`]: (err as Error).message }))
    } finally {
      setSaving(p => ({ ...p, [`lecture-${day}`]: false }))
    }
  }

  const saveLab = async (day: number) => {
    setSaving(p => ({ ...p, [`lab-${day}`]: true }))
    setSaveMsg(p => ({ ...p, [`lab-${day}`]: '' }))
    try {
      const form = labForms[day]
      const existing = getLabForDay(day)
      const body: any = {
        module_id: moduleId,
        day_number: day,
        title: form.title,
        instructions: form.instructions,
        github_repo_url: form.github_repo_url || null,
        sandbox_url: form.sandbox_url || null,
        max_score: form.total_points,
        deadline: lessonForms[day]?.deadline ? new Date(lessonForms[day].deadline).toISOString() : null,
      }

      let res
      if (existing) {
        res = await fetch('/api/labs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id, ...body }) })
      } else {
        res = await fetch('/api/labs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (existing) {
        setLabs(prev => prev.map(l => l.id === existing.id ? data.lab : l))
      } else {
        setLabs(prev => [...prev, data.lab])
      }
      setSaveMsg(p => ({ ...p, [`lab-${day}`]: 'Saved!' }))
    } catch (err) {
      setSaveMsg(p => ({ ...p, [`lab-${day}`]: (err as Error).message }))
    } finally {
      setSaving(p => ({ ...p, [`lab-${day}`]: false }))
    }
  }

  const saveQuiz = async (day: number) => {
    setSaving(p => ({ ...p, [`quiz-${day}`]: true }))
    setSaveMsg(p => ({ ...p, [`quiz-${day}`]: '' }))
    try {
      const questions = quizForms[day]?.filter(q => q.question_text.trim()) || []
      if (questions.length === 0) { setSaveMsg(p => ({ ...p, [`quiz-${day}`]: 'Add at least one question' })); return }

      const existing = getQuizForDay(day)
      // Delete old quiz if it exists
      if (existing) {
        await fetch(`/api/quizzes?id=${existing.id}`, { method: 'DELETE' })
      }

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          course_id: mod?.course_id,
          title: `Week ${mod?.week_number} - Day ${day} Quiz`,
          day_number: day,
          deadline: lessonForms[day]?.deadline ? new Date(lessonForms[day].deadline).toISOString() : null,
          questions: questions.map(q => ({
            question_text: q.question_text,
            points: q.points,
            answers: q.quiz_answers.map(a => ({ answer_text: a.answer_text, is_correct: a.is_correct, order_number: a.order_number })),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (existing) {
        setQuizzes(prev => prev.map(q => q.id === existing.id ? data.quiz : q))
      } else {
        setQuizzes(prev => [...prev, data.quiz])
      }
      setSaveMsg(p => ({ ...p, [`quiz-${day}`]: 'Saved!' }))
    } catch (err) {
      setSaveMsg(p => ({ ...p, [`quiz-${day}`]: (err as Error).message }))
    } finally {
      setSaving(p => ({ ...p, [`quiz-${day}`]: false }))
    }
  }

  const saveAssignments = async (day: number) => {
    setSaving(p => ({ ...p, [`assign-${day}`]: true }))
    setSaveMsg(p => ({ ...p, [`assign-${day}`]: '' }))
    try {
      const studentIds = Array.from(selectedStudents[day] || [])
      if (studentIds.length === 0) { setSaveMsg(p => ({ ...p, [`assign-${day}`]: 'Select at least one student' })); return }

      const availableAt = scheduleDates[day]
        ? new Date(scheduleDates[day]).toISOString()
        : (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.toISOString() })()

      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          day_number: day,
          course_id: mod?.course_id,
          student_ids: studentIds,
          available_at: availableAt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaveMsg(p => ({ ...p, [`assign-${day}`]: `Assigned to ${studentIds.length} student(s)!` }))
    } catch (err) {
      setSaveMsg(p => ({ ...p, [`assign-${day}`]: (err as Error).message }))
    } finally {
      setSaving(p => ({ ...p, [`assign-${day}`]: false }))
    }
  }

  const saveAllForDay = async (day: number) => {
    await saveLecture(day)
    await saveLab(day)
    await saveQuiz(day)
    if ((selectedStudents[day]?.size || 0) > 0) await saveAssignments(day)
  }

  // ─── Render ───
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!mod) return null

  const dayForm = lessonForms[activeDay] || { title: '', description: '', content: '', scheduled_at: '', deadline: '' }
  const dayLab = labForms[activeDay] || { title: '', instructions: '', github_repo_url: '', sandbox_url: '', total_points: 100 }
  const dayQuiz = quizForms[activeDay] || emptyQuestions()
  const dayStudents = selectedStudents[activeDay] || new Set()

  return (
    <div className="min-h-screen">
      <Navbar user={user} profile={profile} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href={`/instructor/course/${mod.course_id}`} className="text-primary hover:text-primary/80 text-sm">&larr; Back to Course</Link>
            <h1 className="text-3xl font-bold text-foreground mt-1">Week {mod.week_number}: {mod.title}</h1>
          </div>
          <button onClick={() => saveAllForDay(activeDay)} className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Save All for Day {activeDay}
          </button>
        </div>

        {/* Day Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {DAYS.map(day => {
            const status = dayStatus(day)
            const isActive = activeDay === day
            return (
              <button key={day} onClick={() => setActiveDay(day)} className={`relative flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card/60 text-foreground border-border hover:border-primary/50'}`}>
                Day {day}
                {status === 3 && <span className="w-2 h-2 rounded-full bg-green-400" />}
                {status > 0 && status < 3 && <span className="text-xs opacity-60">{status}/3</span>}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ──────── Left Column: Lecture + Scheduling ──────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* LECTURE */}
            <div className="bg-card/80 border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Lecture - Day {activeDay}</h2>
                <div className="flex items-center gap-2">
                  {saveMsg[`lecture-${activeDay}`] && <span className="text-xs text-muted-foreground">{saveMsg[`lecture-${activeDay}`]}</span>}
                  <button onClick={() => saveLecture(activeDay)} disabled={saving[`lecture-${activeDay}`]} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {saving[`lecture-${activeDay}`] ? 'Saving...' : 'Save Lecture'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                  <input type="text" value={dayForm.title} onChange={e => setLessonForms(p => ({ ...p, [activeDay]: { ...p[activeDay], title: e.target.value } }))} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Day lecture title..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                  <input type="text" value={dayForm.description} onChange={e => setLessonForms(p => ({ ...p, [activeDay]: { ...p[activeDay], description: e.target.value } }))} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Brief description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Content (Markdown)</label>
                  <textarea value={dayForm.content} onChange={e => setLessonForms(p => ({ ...p, [activeDay]: { ...p[activeDay], content: e.target.value } }))} rows={8} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm" placeholder="Write lecture content here..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Available From (Date & Time)</label>
                    <input type="datetime-local" value={dayForm.scheduled_at} onChange={e => setLessonForms(p => ({ ...p, [activeDay]: { ...p[activeDay], scheduled_at: e.target.value } }))} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">Students cannot access before this date/time</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Deadline (Date & Time)</label>
                    <input type="datetime-local" value={dayForm.deadline} onChange={e => setLessonForms(p => ({ ...p, [activeDay]: { ...p[activeDay], deadline: e.target.value } }))} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">Quiz and lab must be submitted before this time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* LAB */}
            <div className="bg-card/80 border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Lab - Day {activeDay}</h2>
                <div className="flex items-center gap-2">
                  {saveMsg[`lab-${activeDay}`] && <span className="text-xs text-muted-foreground">{saveMsg[`lab-${activeDay}`]}</span>}
                  <button onClick={() => saveLab(activeDay)} disabled={saving[`lab-${activeDay}`]} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {saving[`lab-${activeDay}`] ? 'Saving...' : 'Save Lab'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Lab Title</label>
                  <input type="text" value={dayLab.title} onChange={e => setLabForms(p => ({ ...p, [activeDay]: { ...p[activeDay], title: e.target.value } }))} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Lab title..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Instructions (the AI reads this to score submissions)</label>
                  <textarea value={dayLab.instructions} onChange={e => setLabForms(p => ({ ...p, [activeDay]: { ...p[activeDay], instructions: e.target.value } }))} rows={6} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="Detailed lab instructions. The AI will use these to score student submissions..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Starter GitHub Repo URL</label>
                    <input type="url" value={dayLab.github_repo_url} onChange={e => setLabForms(p => ({ ...p, [activeDay]: { ...p[activeDay], github_repo_url: e.target.value } }))} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" placeholder="https://github.com/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Max Score</label>
                    <input type="number" value={dayLab.total_points} onChange={e => setLabForms(p => ({ ...p, [activeDay]: { ...p[activeDay], total_points: parseInt(e.target.value) || 100 } }))} className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" min={1} />
                  </div>
                </div>
              </div>
            </div>

            {/* QUIZ */}
            <div className="bg-card/80 border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Quiz - Day {activeDay} (10 Questions, A-D)</h2>
                <div className="flex items-center gap-2">
                  {saveMsg[`quiz-${activeDay}`] && <span className="text-xs text-muted-foreground">{saveMsg[`quiz-${activeDay}`]}</span>}
                  <button onClick={() => saveQuiz(activeDay)} disabled={saving[`quiz-${activeDay}`]} className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {saving[`quiz-${activeDay}`] ? 'Saving...' : 'Save Quiz'}
                  </button>
                </div>
              </div>
              <div className="space-y-6">
                {dayQuiz.map((q, qIdx) => (
                  <div key={qIdx} className="border border-border rounded-lg p-4 bg-background/40">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded mt-1">Q{qIdx + 1}</span>
                      <input
                        type="text"
                        value={q.question_text}
                        onChange={e => {
                          const updated = [...dayQuiz]
                          updated[qIdx] = { ...updated[qIdx], question_text: e.target.value }
                          setQuizForms(p => ({ ...p, [activeDay]: updated }))
                        }}
                        className="flex-1 px-3 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        placeholder="Question text..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-9">
                      {q.quiz_answers.map((a, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...dayQuiz]
                              updated[qIdx] = {
                                ...updated[qIdx],
                                quiz_answers: updated[qIdx].quiz_answers.map((ans, i) => ({ ...ans, is_correct: i === aIdx }))
                              }
                              setQuizForms(p => ({ ...p, [activeDay]: updated }))
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${a.is_correct ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                          >
                            {OPTION_LABELS[aIdx]}
                          </button>
                          <input
                            type="text"
                            value={a.answer_text}
                            onChange={e => {
                              const updated = [...dayQuiz]
                              const answers = [...updated[qIdx].quiz_answers]
                              answers[aIdx] = { ...answers[aIdx], answer_text: e.target.value }
                              updated[qIdx] = { ...updated[qIdx], quiz_answers: answers }
                              setQuizForms(p => ({ ...p, [activeDay]: updated }))
                            }}
                            className="flex-1 px-3 py-1.5 bg-input border border-border text-foreground rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder={`Option ${OPTION_LABELS[aIdx]}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ──────── Right Column: Student Selection & Scheduling ──────── */}
          <div className="space-y-6">
            {/* Schedule & Assign */}
            <div className="bg-card/80 border border-border rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-bold text-foreground mb-4">Assign to Students</h2>
              <p className="text-xs text-muted-foreground mb-4">Select which students can access Day {activeDay} content. They will not see it until the scheduled date.</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Access Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleDates[activeDay] || ''}
                  onChange={e => setScheduleDates(p => ({ ...p, [activeDay]: e.target.value }))}
                  className="w-full px-3 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Default: today at 12:00 PM</p>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={() => selectAll(activeDay)} className="text-xs px-3 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors">Select All</button>
                <button onClick={() => deselectAll(activeDay)} className="text-xs px-3 py-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors">Deselect All</button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No enrolled students found.</p>
                ) : (
                  students.map(s => (
                    <label key={s.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${dayStudents.has(s.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'}`}>
                      <input
                        type="checkbox"
                        checked={dayStudents.has(s.id)}
                        onChange={() => toggleStudent(activeDay, s.id)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="flex items-center gap-2">
                {saveMsg[`assign-${activeDay}`] && <span className="text-xs text-muted-foreground flex-1">{saveMsg[`assign-${activeDay}`]}</span>}
                <button
                  onClick={() => saveAssignments(activeDay)}
                  disabled={saving[`assign-${activeDay}`] || dayStudents.size === 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                >
                  {saving[`assign-${activeDay}`] ? 'Publishing...' : `Publish to ${dayStudents.size} Student(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
