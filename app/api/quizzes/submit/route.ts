import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { quiz_id, student_id, answers } = body

  if (!quiz_id || !student_id || !answers) {
    return NextResponse.json({ error: 'quiz_id, student_id, and answers are required' }, { status: 400 })
  }

  // Fetch quiz with questions and correct answers
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_answers(*))')
    .eq('id', quiz_id)
    .single()

  if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 })

  // Check deadline from content_assignments
  let isLate = false
  let maxScorePercentage = 100
  const { data: assignment } = await supabaseAdmin
    .from('content_assignments')
    .select('*')
    .eq('content_type', 'quiz')
    .eq('content_id', quiz_id)
    .eq('student_id', student_id)
    .single()

  if (assignment) {
    const now = new Date()
    const deadline = assignment.deadline ? new Date(assignment.deadline) : null
    const graceDeadline = assignment.grace_deadline ? new Date(assignment.grace_deadline) : null

    if (graceDeadline && now > graceDeadline) {
      return NextResponse.json(
        { error: 'Quiz deadline has passed. The grace period has expired.' },
        { status: 403 }
      )
    }

    if (deadline && now > deadline) {
      isLate = true
      maxScorePercentage = 60
    }
  }

  // Score the quiz
  let totalPoints = 0
  let earnedPoints = 0
  const responseRecords: any[] = []

  for (const question of quiz.quiz_questions) {
    const points = question.points || 10
    totalPoints += points

    const studentAnswerId = answers[question.id]
    const correctAnswer = question.quiz_answers.find((a: any) => a.is_correct)
    const isCorrect = studentAnswerId === correctAnswer?.id

    if (isCorrect) {
      earnedPoints += points
    }

    responseRecords.push({
      question_id: question.id,
      selected_answer_id: studentAnswerId || null,
      is_correct: isCorrect,
    })
  }

  let score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

  // Apply late penalty (60% max if in grace period)
  if (isLate) {
    score = Math.round(score * (maxScorePercentage / 100))
  }

  const passed = score >= (quiz.passing_score || 70)

  // Save submission
  const { data: submission, error: subError } = await supabaseAdmin
    .from('quiz_submissions')
    .insert({
      quiz_id,
      student_id,
      score,
      passed,
      completed_at: new Date().toISOString(),
      is_late: isLate,
      max_score_percentage: maxScorePercentage,
    })
    .select()
    .single()

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

  // Save individual responses
  const responsesToInsert = responseRecords.map((r) => ({
    ...r,
    submission_id: submission.id,
  }))

  await supabaseAdmin.from('quiz_responses').insert(responsesToInsert)

  // Update daily progress if quiz has a day_number
  if (quiz.day_number && quiz.module_id) {
    const { data: mod } = await supabaseAdmin
      .from('modules')
      .select('course_id')
      .eq('id', quiz.module_id)
      .single()

    if (mod) {
      // Upsert progress
      const { data: existing } = await supabaseAdmin
        .from('student_daily_progress')
        .select('id')
        .eq('student_id', student_id)
        .eq('module_id', quiz.module_id)
        .eq('day_number', quiz.day_number)
        .limit(1)

      if (existing && existing.length > 0) {
        await supabaseAdmin
          .from('student_daily_progress')
          .update({ quiz_score: score })
          .eq('id', existing[0].id)
      } else {
        await supabaseAdmin
          .from('student_daily_progress')
          .insert({
            student_id,
            course_id: mod.course_id,
            module_id: quiz.module_id,
            day_number: quiz.day_number,
            quiz_score: score,
          })
      }
    }
  }

  return NextResponse.json({
    submission,
    score,
    passed,
    total_points: totalPoints,
    earned_points: earnedPoints,
    results: responseRecords,
    is_late: isLate,
    max_score_percentage: maxScorePercentage,
  })
}
