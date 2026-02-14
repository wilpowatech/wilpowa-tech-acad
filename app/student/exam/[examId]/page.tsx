'use client'

import React from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

interface Answer {
  id: string
  answer_text: string
  order_number: number
}

interface Question {
  id: string
  question_text: string
  points: number
  exam_answers: Answer[]
}

interface Exam {
  id: string
  title: string
  description: string
  passing_score: number
  duration_minutes: number
  exam_questions: Question[]
}

interface SubmissionResult {
  score: number
  passed: boolean
  total_points: number
  earned_points: number
  results: { question_id: string; selected_answer_id: string; is_correct: boolean }[]
}

export default function StudentExamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { examId } = useParams()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSubmitRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (examId && user) {
      fetchExam()
    }
  }, [examId, user])

  useEffect(() => {
    if (started && timeLeft > 0 && !result) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            autoSubmitRef.current = true
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [started, result])

  // Auto-submit when time runs out
  useEffect(() => {
    if (autoSubmitRef.current && timeLeft === 0 && !result && !submitting) {
      autoSubmitRef.current = false
      submitExam()
    }
  }, [timeLeft, result, submitting])

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExam(data.exam)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const startExam = () => {
    if (!exam) return
    setStarted(true)
    setTimeLeft(exam.duration_minutes * 60)
  }

  const selectAnswer = (questionId: string, answerId: string) => {
    if (result) return
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }))
  }

  const submitExam = useCallback(async () => {
    if (!exam || !user || submitting) return

    setSubmitting(true)
    setError('')
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const res = await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId,
          student_id: user.id,
          answers,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }, [exam, user, answers, examId, submitting])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Exam not found</p>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = exam.exam_questions.length

  // Start screen
  if (!started && !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card/80 border border-border rounded-xl p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">{exam.title}</h1>
          {exam.description && <p className="text-muted-foreground mb-6">{exam.description}</p>}

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-muted rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="text-lg font-bold text-foreground">{totalQuestions}</p>
            </div>
            <div className="bg-muted rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-bold text-foreground">{exam.duration_minutes} min</p>
            </div>
            <div className="bg-muted rounded-lg px-4 py-3">
              <p className="text-xs text-muted-foreground">Pass Score</p>
              <p className="text-lg font-bold text-foreground">{exam.passing_score}%</p>
            </div>
          </div>

          <div className="bg-background/50 border border-border rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-foreground mb-2">Instructions</h3>
            <ul className="space-y-1 text-muted-foreground text-sm">
              <li>- You have {exam.duration_minutes} minutes to complete this exam</li>
              <li>- Answer all {totalQuestions} questions (A-D multiple choice)</li>
              <li>- You must score at least {exam.passing_score}% to pass</li>
              <li>- The exam auto-submits when time runs out</li>
              <li>- This exam covers everything taught this month</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startExam}
            className="inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Start Exam
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header with Timer */}
      <header className="border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{exam.title}</h1>
            <p className="text-sm text-muted-foreground">{answeredCount}/{totalQuestions} answered</p>
          </div>
          <div className="flex items-center gap-4">
            {!result && (
              <div className={`font-mono text-lg font-bold px-3 py-1 rounded-lg ${
                timeLeft <= 60 ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-muted text-foreground'
              }`}>
                {formatTime(timeLeft)}
              </div>
            )}
            {!result && (
              <button
                type="button"
                onClick={submitExam}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-md px-6 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Result Banner */}
        {result && (
          <div className={`rounded-xl p-6 mb-8 border ${
            result.passed
              ? 'bg-secondary/10 border-secondary/50'
              : 'bg-destructive/10 border-destructive/50'
          }`}>
            <h2 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-secondary' : 'text-destructive'}`}>
              {result.passed ? 'Exam Passed!' : 'Exam Not Passed'}
            </h2>
            <p className="text-foreground text-lg">Score: <span className="font-bold">{result.score}%</span></p>
            <p className="text-muted-foreground text-sm mt-1">
              {result.earned_points}/{result.total_points} points earned | Passing: {exam.passing_score}%
            </p>
            <div className="mt-4">
              <Button variant="outline" className="border-border" onClick={() => router.back()}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {exam.exam_questions.map((question, qIdx) => {
            const selectedId = answers[question.id]
            const questionResult = result?.results.find((r) => r.question_id === question.id)

            return (
              <div key={question.id} className="bg-card/80 border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    <span className="text-muted-foreground mr-2">Q{qIdx + 1}.</span>
                    {question.question_text}
                  </h3>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground shrink-0 ml-4">
                    {question.points} pts
                  </span>
                </div>

                <div className="space-y-2">
                  {question.exam_answers.map((answer, aIdx) => {
                    const isSelected = selectedId === answer.id
                    let borderColor = 'border-border'
                    let bgColor = 'bg-background/50'
                    let textColor = 'text-foreground'

                    if (result && questionResult) {
                      if (questionResult.is_correct && isSelected) {
                        borderColor = 'border-secondary'
                        bgColor = 'bg-secondary/10'
                        textColor = 'text-secondary'
                      } else if (!questionResult.is_correct && isSelected) {
                        borderColor = 'border-destructive'
                        bgColor = 'bg-destructive/10'
                        textColor = 'text-destructive'
                      }
                    } else if (isSelected) {
                      borderColor = 'border-primary'
                      bgColor = 'bg-primary/10'
                    }

                    return (
                      <button
                        key={answer.id}
                        type="button"
                        onClick={() => selectAnswer(question.id, answer.id)}
                        disabled={!!result}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-left ${borderColor} ${bgColor} ${
                          !result ? 'hover:border-primary/50 hover:bg-primary/5 cursor-pointer' : ''
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {OPTION_LABELS[aIdx]}
                        </span>
                        <span className={`text-sm ${textColor}`}>{answer.answer_text}</span>
                      </button>
                    )
                  })}
                </div>

                {result && questionResult && (
                  <p className={`text-xs font-medium mt-3 ${questionResult.is_correct ? 'text-secondary' : 'text-destructive'}`}>
                    {questionResult.is_correct ? 'Correct!' : 'Incorrect'}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom Submit */}
        {!result && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={submitExam}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : `Submit Exam (${answeredCount}/${totalQuestions} answered)`}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
