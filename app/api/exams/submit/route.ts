import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { exam_id, student_id, answers } = body

  if (!exam_id || !student_id || !answers) {
    return NextResponse.json({ error: 'exam_id, student_id, and answers are required' }, { status: 400 })
  }

  // Fetch exam with questions and correct answers
  const { data: exam, error: examError } = await supabaseAdmin
    .from('exams')
    .select('*, exam_questions(*, exam_answers(*))')
    .eq('id', exam_id)
    .single()

  if (examError) return NextResponse.json({ error: examError.message }, { status: 500 })

  // Score the exam
  let totalPoints = 0
  let earnedPoints = 0
  const responseRecords: any[] = []

  for (const question of exam.exam_questions) {
    const points = question.points || 10
    totalPoints += points

    const studentAnswerId = answers[question.id]
    const correctAnswer = question.exam_answers.find((a: any) => a.is_correct)
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

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const passed = score >= (exam.passing_score || 70)

  // Save submission
  const { data: submission, error: subError } = await supabaseAdmin
    .from('exam_submissions')
    .insert({
      exam_id,
      student_id,
      score,
      passed,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

  // Save individual responses
  const responsesToInsert = responseRecords.map((r) => ({
    ...r,
    submission_id: submission.id,
  }))

  await supabaseAdmin.from('exam_responses').insert(responsesToInsert)

  return NextResponse.json({
    submission,
    score,
    passed,
    total_points: totalPoints,
    earned_points: earnedPoints,
    results: responseRecords,
  })
}
