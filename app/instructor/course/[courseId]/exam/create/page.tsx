'use client'

import React from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

interface QuestionForm {
  question_text: string
  points: number
  answers: { answer_text: string; is_correct: boolean }[]
}

const EMPTY_QUESTION = (): QuestionForm => ({
  question_text: '',
  points: 10,
  answers: [
    { answer_text: '', is_correct: true },
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
  ],
})

export default function CreateExamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { courseId } = useParams()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [weekNumber, setWeekNumber] = useState(1)
  const [questions, setQuestions] = useState<QuestionForm[]>(
    Array.from({ length: 10 }, () => EMPTY_QUESTION())
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const addMoreQuestions = () => {
    setQuestions((prev) => [...prev, ...Array.from({ length: 5 }, () => EMPTY_QUESTION())])
  }

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateQuestion = (qIdx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev]
      updated[qIdx] = { ...updated[qIdx], [field]: value }
      return updated
    })
  }

  const updateAnswer = (qIdx: number, aIdx: number, field: string, value: any) => {
    setQuestions((prev) => {
      const updated = [...prev]
      const answers = [...updated[qIdx].answers]
      if (field === 'is_correct' && value === true) {
        answers.forEach((a, i) => { answers[i] = { ...a, is_correct: i === aIdx } })
      } else {
        answers[aIdx] = { ...answers[aIdx], [field]: value }
      }
      updated[qIdx] = { ...updated[qIdx], answers }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Exam title is required')
      return
    }

    const validQuestions = questions.filter((q) => q.question_text.trim() !== '')
    if (validQuestions.length === 0) {
      setError('Please add at least one question')
      return
    }

    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i]
      const filledAnswers = q.answers.filter((a) => a.answer_text.trim() !== '')
      if (filledAnswers.length < 2) {
        setError(`Question ${i + 1} needs at least 2 answer options`)
        return
      }
      if (!q.answers.some((a) => a.is_correct && a.answer_text.trim() !== '')) {
        setError(`Question ${i + 1} needs a correct answer marked`)
        return
      }
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        course_id: courseId,
        title,
        description,
        duration_minutes: durationMinutes,
        week_number: weekNumber,
        questions: validQuestions.map((q) => ({
          question_text: q.question_text,
          points: q.points,
          answers: q.answers.filter((a) => a.answer_text.trim() !== '').map((a, idx) => ({
            answer_text: a.answer_text,
            is_correct: a.is_correct,
            order_number: idx + 1,
          })),
        })),
      }

      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      router.push(`/instructor/course/${courseId}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/instructor/course/${courseId}`} className="text-primary hover:text-primary/80 text-sm mb-2 inline-block">
            &larr; Back to Course
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create Monthly Exam</h1>
          <p className="text-muted-foreground mt-1">Comprehensive exam covering everything taught this month. A-D multiple choice, auto-scored on submit.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Details */}
          <div className="bg-card/80 border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Exam Details</h2>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Exam Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Month 1 Comprehensive Exam"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="This exam covers all topics from Week 1-4..."
              />
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  min={10}
                  className="w-32 px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Month / Week Number</label>
                <input
                  type="number"
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-32 px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Questions ({questions.filter(q => q.question_text.trim()).length} filled)</h2>
            <button
              type="button"
              onClick={addMoreQuestions}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              + Add 5 More Questions
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-card/80 border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Question {qIdx + 1}</h4>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-destructive hover:text-destructive/80 text-xs font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Question</label>
                <textarea
                  value={q.question_text}
                  onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  placeholder={`Enter question ${qIdx + 1}...`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">Answer Options (select the correct one)</label>
                {q.answers.map((a, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateAnswer(qIdx, aIdx, 'is_correct', true)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                        a.is_correct
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {OPTION_LABELS[aIdx]}
                    </button>
                    <input
                      type="text"
                      value={a.answer_text}
                      onChange={(e) => updateAnswer(qIdx, aIdx, 'answer_text', e.target.value)}
                      className="flex-1 px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder={`Option ${OPTION_LABELS[aIdx]}...`}
                    />
                    {a.is_correct && (
                      <span className="text-xs text-secondary font-semibold shrink-0">Correct</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating Exam...' : 'Create Exam'}
            </button>
            <Button type="button" variant="outline" className="border-border bg-transparent" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
