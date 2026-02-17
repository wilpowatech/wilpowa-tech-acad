'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/auth'
import Link from 'next/link'
import Navbar from '@/components/navbar'

// ─── Types ───
interface Module {
  id: string
  week_number: number
  title: string
  course_id: string
}
interface Lesson {
  id: string
  title: string
  content: string
  description: string
  day_number: number
  module_id: string
  deadline: string | null
  scheduled_at: string | null
  available_at: string | null
}
interface Lab {
  id: string
  title: string
  instructions: string
  github_repo_url: string | null
  sandbox_url: string | null
  total_points: number
  day_number: number | null
  deadline: string | null
  module_id: string
}
interface QuizAnswer {
  id?: string
  answer_text: string
  is_correct: boolean
  order_number: number
}
interface QuizQuestion {
  id?: string
  question_text: string
  points: number
  quiz_answers: QuizAnswer[]
}
interface Quiz {
  id: string
  title: string
  day_number: number | null
  quiz_questions: QuizQuestion[]
}
interface Student {
  id: string
  full_name: string
  email: string
}
interface Assignment {
  student_id: string
  day_number: number
  available_at: string
  deadline: string | null
  grace_deadline: string | null
}

const DAYS = [1, 2, 3, 4, 5]
const OPTION_LABELS = ['A', 'B', 'C', 'D']

function emptyQuestions(): QuizQuestion[] {
  return Array.from({ length: 10 }, () => ({
    question_text: '',
    points: 10,
    quiz_answers: OPTION_LABELS.map((_, j) => ({
      answer_text: '',
      is_correct: j === 0,
      order_number: j + 1,
    })),
  }))
}

export default function ModuleEditPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()

  // ✅ make moduleId always a string
  const params = useParams()
  const moduleId =
    typeof params?.moduleId === 'string'
      ? params.moduleId
      : Array.isArray(params?.moduleId)
        ? params.moduleId[0]
        : ''

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
  const [lessonForms, setLessonForms] = useState<
    Record<
      number,
      {
        title: string
        description: string
        content: string
        scheduled_at: string
        deadline: string
      }
    >
  >({})
  const [labForms, setLabForms] = useState<
    Record<
      number,
      {
        title: string
        instructions: string
        github_repo_url: string
        sandbox_url: string
        total_points: number
      }
    >
  >({})
  const [quizForms, setQuizForms] = useState<Record<number, QuizQuestion[]>>({})
  const [selectedStudents, setSelectedStudents] = useState<Record<number, Set<string>>>({})
  const [scheduleDates, setScheduleDates] = useState<Record<number, string>>({})
  const [deadlineHours, setDeadlineHours] = useState<Record<number, number>>({}) // hours until deadline from access date

  // ─── Auth guard ───
  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'instructor')) router.push('/')
  }, [user, profile, authLoading, router])

  // ─── Fetch all data ───
  const fetchData = useCallback(async () => {
    if (!moduleId) return
    try {
      const { data: modData } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single()
      if (!modData) {
        router.push('/instructor/dashboard')
        return
      }
      setMod(modData)

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

      const lForms: typeof lessonForms = {}
      const laForms: typeof labForms = {}
      const qForms: typeof quizForms = {}
      const selStudents: typeof selectedStudents = {}
      const schDates: typeof scheduleDates = {}
      const dlHours: typeof deadlineHours = {}

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
        qForms[d] =
          quiz?.quiz_questions?.length > 0
            ? quiz.quiz_questions.map((q: QuizQuestion) => ({
                ...q,
                quiz_answers:
                  q.quiz_answers.length > 0
                    ? q.quiz_answers
                    : OPTION_LABELS.map((_, j) => ({
                        answer_text: '',
                        is_correct: j === 0,
                        order_number: j + 1,
                      })),
              }))
            : emptyQuestions()

        const dayAssignments = (assignmentsData.assignments || []).filter(
          (a: Assignment) => a.day_number === d
        )
        selStudents[d] = new Set(dayAssignments.map((a: Assignment) => a.student_id))

        if (dayAssignments.length > 0) {
          schDates[d] = dayAssignments[0].available_at?.slice(0, 16) || ''
          if (dayAssignments[0].available_at && dayAssignments[0].deadline) {
            const avail = new Date(dayAssignments[0].available_at).getTime()
            const dead = new Date(dayAssignments[0].deadline).getTime()
            dlHours[d] = Math.max(1, Math.round((dead - avail) / 3600000))
          } else {
            dlHours[d] = 24
          }
        }
      }

      setLessonForms(lForms)
      setLabForms(laForms)
      setQuizForms(qForms)
      setSelectedStudents(selStudents)
      setScheduleDates(schDates)
      setDeadlineHours(dlHours)
    } catch (err) {
      console.error('Error fetching module data:', err)
    } finally {
      setLoading(false)
    }
  }, [moduleId, router])

  useEffect(() => {
    if (user && moduleId) fetchData()
  }, [user, moduleId, fetchData])

  // ─── Helpers ───
  const getLessonForDay = (day: number) => lessons.find((l) => l.day_number === day)
  const getLabForDay = (day: number) => labs.find((l) => l.day_number === day)
  const getQuizForDay = (day: number) => quizzes.find((q) => q.day_number === day)
  const dayStatus = (day: number) => {
    let count = 0
    if (getLessonForDay(day)) count++
    if (getLabForDay(day)) count++
    if (getQuizForDay(day)) count++
    return count
  }

  const toggleStudent = (day: number, studentId: string) => {
    setSelectedStudents((prev) => {
      const s = new Set(prev[day] || [])
      if (s.has(studentId)) s.delete(studentId)
      else s.add(studentId)
      return { ...prev, [day]: s }
    })
  }
  const selectAll = (day: number) =>
    setSelectedStudents((prev) => ({ ...prev, [day]: new Set(students.map((s) => s.id)) }))
  const deselectAll = (day: number) =>
    setSelectedStudents((prev) => ({ ...prev, [day]: new Set() }))

  // ─── Save handlers ───
  const saveLecture = async (day: number) => {
    setSaving((p) => ({ ...p, [`lecture-${day}`]: true }))
    setSaveMsg((p) => ({ ...p, [`lecture-${day}`]: '' }))
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
        res = await fetch('/api/lessons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing.id, ...body }),
        })
      } else {
        res = await fetch('/api/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (existing) setLessons((prev) => prev.map((l) => (l.id === existing.id ? data.lesson : l)))
      else setLessons((prev) => [...prev, data.lesson])

      setSaveMsg((p) => ({ ...p, [`lecture-${day}`]: 'Saved!' }))
    } catch (err) {
      setSaveMsg((p) => ({ ...p, [`lecture-${day}`]: (err as Error).message }))
    } finally {
      setSaving((p) => ({ ...p, [`lecture-${day}`]: false }))
    }
  }

  const saveLab = async (day: number) => {
    setSaving((p) => ({ ...p, [`lab-${day}`]: true }))
    setSaveMsg((p) => ({ ...p, [`lab-${day}`]: '' }))
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
        deadline: lessonForms[day]?.deadline
          ? new Date(lessonForms[day].deadline).toISOString()
          : null,
      }

      let res
      if (existing) {
        res = await fetch('/api/labs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing.id, ...body }),
        })
      } else {
        res = await fetch('/api/labs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (existing) setLabs((prev) => prev.map((l) => (l.id === existing.id ? data.lab : l)))
      else setLabs((prev) => [...prev, data.lab])

      setSaveMsg((p) => ({ ...p, [`lab-${day}`]: 'Saved!' }))
    } catch (err) {
      setSaveMsg((p) => ({ ...p, [`lab-${day}`]: (err as Error).message }))
    } finally {
      setSaving((p) => ({ ...p, [`lab-${day}`]: false }))
    }
  }

  const saveQuiz = async (day: number) => {
    setSaving((p) => ({ ...p, [`quiz-${day}`]: true }))
    setSaveMsg((p) => ({ ...p, [`quiz-${day}`]: '' }))
    try {
      const questions = quizForms[day]?.filter((q) => q.question_text.trim()) || []
      if (questions.length === 0) {
        setSaveMsg((p) => ({ ...p, [`quiz-${day}`]: 'Add at least one question' }))
        return
      }

      const existing = getQuizForDay(day)
      if (existing) await fetch(`/api/quizzes?id=${existing.id}`, { method: 'DELETE' })

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          course_id: mod?.course_id,
          title: `Week ${mod?.week_number} - Day ${day} Quiz`,
          day_number: day,
          deadline: lessonForms[day]?.deadline
            ? new Date(lessonForms[day].deadline).toISOString()
            : null,
          questions: questions.map((q) => ({
            question_text: q.question_text,
            points: q.points,
            answers: q.quiz_answers.map((a) => ({
              answer_text: a.answer_text,
              is_correct: a.is_correct,
              order_number: a.order_number,
            })),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (existing) setQuizzes((prev) => prev.map((q) => (q.id === existing.id ? data.quiz : q)))
      else setQuizzes((prev) => [...prev, data.quiz])

      setSaveMsg((p) => ({ ...p, [`quiz-${day}`]: 'Saved!' }))
    } catch (err) {
      setSaveMsg((p) => ({ ...p, [`quiz-${day}`]: (err as Error).message }))
    } finally {
      setSaving((p) => ({ ...p, [`quiz-${day}`]: false }))
    }
  }

  const saveAssignments = async (day: number) => {
    setSaving((p) => ({ ...p, [`assign-${day}`]: true }))
    setSaveMsg((p) => ({ ...p, [`assign-${day}`]: '' }))
    try {
      const studentIds = Array.from(selectedStudents[day] || [])
      if (studentIds.length === 0) {
        setSaveMsg((p) => ({ ...p, [`assign-${day}`]: 'Select at least one student' }))
        return
      }

      const availableAt = scheduleDates[day]
        ? new Date(scheduleDates[day]).toISOString()
        : (() => {
            const d = new Date()
            d.setHours(12, 0, 0, 0)
            return d.toISOString()
          })()

      const hours = deadlineHours[day] || 24
      const deadlineDate = new Date(availableAt)
      deadlineDate.setTime(deadlineDate.getTime() + hours * 3600000)
      const deadlineAt = deadlineDate.toISOString()

      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          day_number: day,
          course_id: mod?.course_id,
          student_ids: studentIds,
          available_at: availableAt,
          deadline: deadlineAt,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSaveMsg((p) => ({
        ...p,
        [`assign-${day}`]: `Assigned to ${studentIds.length} student(s)!`,
      }))
    } catch (err) {
      setSaveMsg((p) => ({ ...p, [`assign-${day}`]: (err as Error).message }))
    } finally {
      setSaving((p) => ({ ...p, [`assign-${day}`]: false }))
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

  const dayForm = lessonForms[activeDay] || {
    title: '',
    description: '',
    content: '',
    scheduled_at: '',
    deadline: '',
  }
  const dayLab = labForms[activeDay] || {
    title: '',
    instructions: '',
    github_repo_url: '',
    sandbox_url: '',
    total_points: 100,
  }
  const dayQuiz = quizForms[activeDay] || emptyQuestions()
  const dayStudents = selectedStudents[activeDay] || new Set()

  return (
    <div className="min-h-screen">
      <Navbar />
      {/* ... your JSX below is unchanged ... */}
    </div>
  )
}
