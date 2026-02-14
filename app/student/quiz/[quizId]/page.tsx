'use client'

import React from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  quiz_answers: Answer[]
}

interface Quiz {
  id: string
  title: string
  passing_score: number
  deadline: string | null
  available_at: string | null
  module_id: string
  day_number: number | null
  quiz_questions: Question[]
}

interface SubmissionResult {
  score: number
  passed: boolean
  total_points: number
  earned_points: number
  results: { question_id: string; selected_answer_id: string; is_correct: boolean }[]
}

function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const now = new Date().getTime()
      const end = new Date(deadline).getTime()
      const diff = end - now
      if (diff <= 0) { setTimeLeft('Expired'); setExpired(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  return { timeLeft, expired }
}

export default function StudentQuizPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const { timeLeft, expired } = useCountdown(quiz?.deadline || null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (quizId && user) {
      fetchQuiz()
    }
  }, [quizId, user])

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Check access: if quiz has available_at, check if current time is past it
      if (data.quiz.available_at) {
        const now = new Date()
        const available = new Date(data.quiz.available_at)
        if (now < available) {
          setLocked(true)
          setLoading(false)
          return
        }
      }

      setQuiz(data.quiz)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (questionId: string, answerId: string) => {
    if (result) return // Quiz already submitted
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }))
  }

  const handleSubmit = async () => {
    if (!quiz || !user) return

    const unanswered = quiz.quiz_questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} unanswered.`)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId,
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
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          <p className="text-muted-foreground mb-4">This quiz is not available yet.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz.quiz_questions.length

  return (
    <div className="min-h-screen">
      {/* Expired overlay */}
      {expired && !result && (
        <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center">
          <div className="bg-card border border-destructive rounded-xl p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-destructive mb-2">Time Expired</h2>
            <p className="text-muted-foreground mb-4">The 24-hour deadline for this quiz has passed. You can no longer submit answers.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground">{answeredCount}/{totalQuestions} answered | Pass: {quiz.passing_score}%</p>
          </div>
          {quiz.deadline && !result && (
            <div className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg border ${
              expired ? 'bg-destructive/10 border-destructive text-destructive'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}>
              {expired ? 'EXPIRED' : timeLeft}
            </div>
          )}
          {!result && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md px-6 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
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
              {result.passed ? 'Passed!' : 'Not Passed'}
            </h2>
            <p className="text-foreground text-lg">Score: <span className="font-bold">{result.score}%</span></p>
            <p className="text-muted-foreground text-sm mt-1">
              {result.earned_points}/{result.total_points} points earned | Passing score: {quiz.passing_score}%
            </p>
            <div className="mt-4">
              <Button variant="outline" className="border-border" onClick={() => router.back()}>
                Back to Course
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
          {quiz.quiz_questions.map((question, qIdx) => {
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
                  {question.quiz_answers.map((answer, aIdx) => {
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

        {/* Bottom Submit Button */}
        {!result && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${totalQuestions} answered)`}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
