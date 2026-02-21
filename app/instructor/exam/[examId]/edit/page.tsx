'use client'

import React from "react"

import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Exam {
  id: string
  title: string
  exam_number: number
  course_id: string
}

interface Question {
  id: string
  question_text: string
  question_type: string
  points: number
  order_number: number
}

export default function ExamEditorPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { examId } = useParams()
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    answers: [
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (examId && user) {
      fetchExamData()
    }
  }, [examId, user])

  const fetchExamData = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExam(examData)

      const { data: questionsData } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_number', { ascending: true })

      setQuestions(questionsData || [])
    } catch (err) {
      console.error('Error fetching exam:', err)
    } finally {
      setPageLoading(false)
    }
  }

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const hasCorrectAnswer = formData.answers.some((a) => a.is_correct && a.text.trim())

      if (!hasCorrectAnswer) {
        alert('Please mark at least one answer as correct')
        return
      }

      const { data: questionData, error: questionError } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: examId,
          question_text: formData.question_text,
          question_type: formData.question_type,
          points: formData.points,
          order_number: questions.length + 1,
        })
        .select()

      if (questionError) throw questionError

      for (let i = 0; i < formData.answers.length; i++) {
        if (formData.answers[i].text.trim()) {
          await supabase.from('exam_answers').insert({
            question_id: questionData[0].id,
            answer_text: formData.answers[i].text,
            is_correct: formData.answers[i].is_correct,
            order_number: i + 1,
          })
        }
      }

      setQuestions([...questions, questionData[0]])
      setFormData({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        answers: [
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
          { text: '', is_correct: false },
        ],
      })
      setShowAddQuestion(false)
    } catch (err) {
      console.error('Error adding question:', err)
      alert('Failed to add question')
    }
  }

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4"></div>
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

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href={`/instructor/course/${exam.course_id}`} className="text-primary hover:text-primary/80 text-sm mb-2 inline-block">
            &larr; Back to Course
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Edit Exam {exam.exam_number}: {exam.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showAddQuestion && (
          <div className="bg-card border border-border rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Add Exam Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Question Text</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Question Type</label>
                  <select
                    value={formData.question_type}
                    onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="true_false">True/False</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Points</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Answer Choices</label>
                <div className="space-y-3">
                  {formData.answers.map((answer, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={answer.is_correct}
                        onChange={(e) => {
                          const newAnswers = [...formData.answers]
                          newAnswers[index].is_correct = e.target.checked
                          setFormData({ ...formData, answers: newAnswers })
                        }}
                        className="mt-2"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) => {
                          const newAnswers = [...formData.answers]
                          newAnswers[index].text = e.target.value
                          setFormData({ ...formData, answers: newAnswers })
                        }}
                        placeholder={`Answer choice ${index + 1}`}
                        className="flex-1 px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-muted-foreground text-sm pt-2">
                        {answer.is_correct ? 'Correct' : 'Option'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs mt-2">Check the checkbox to mark as the correct answer</p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Add Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={() => setShowAddQuestion(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Questions ({questions.length})</h2>
            <Button
              onClick={() => setShowAddQuestion(!showAddQuestion)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground mb-4">No questions added yet</p>
              <Button
                onClick={() => setShowAddQuestion(true)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                Add First Question
              </Button>
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.id} className="bg-card border border-border rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-foreground">Q{index + 1}: {question.question_text}</h3>
                  <span className="text-sm bg-secondary/10 text-secondary px-3 py-1 rounded">{question.points} pts</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Type: {question.question_type}</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push(`/instructor/question/${question.id}/edit`)}
                    variant="outline"
                    className="border-border"
                  >
                    Edit
                  </Button>
                  <Button variant="outline" className="border-destructive/50 text-destructive bg-transparent">
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
