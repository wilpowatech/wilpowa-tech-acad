import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const moduleId = searchParams.get('module_id')

  if (!moduleId) {
    return NextResponse.json({ error: 'module_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_answers(*))')
    .eq('module_id', moduleId)
    .order('day_number', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quizzes: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { module_id, course_id, title, questions, day_number, deadline, week_number } = body

  if (!module_id || !course_id || !title) {
    return NextResponse.json({ error: 'module_id, course_id, and title are required' }, { status: 400 })
  }

  // If week_number not provided, look it up from the module
  let resolvedWeek = week_number
  if (!resolvedWeek) {
    const { data: mod } = await supabaseAdmin
      .from('modules')
      .select('week_number')
      .eq('id', module_id)
      .single()
    resolvedWeek = mod?.week_number || 1
  }

  // Create quiz
  const { data: quiz, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .insert({
      module_id,
      course_id,
      title,
      total_questions: questions?.length || 0,
      passing_score: 70,
      day_number: day_number || null,
      deadline: deadline || null,
      week_number: resolvedWeek,
    })
    .select()
    .single()

  if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 })

  // Create questions and answers
  if (questions && questions.length > 0) {
    for (const q of questions) {
      const { data: question, error: qError } = await supabaseAdmin
        .from('quiz_questions')
        .insert({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_type: 'multiple_choice',
          points: q.points || 10,
        })
        .select()
        .single()

      if (qError) continue

      // Insert answers A-D
      if (q.answers && q.answers.length > 0) {
        const answersToInsert = q.answers.map((a: any, idx: number) => ({
          question_id: question.id,
          answer_text: a.answer_text,
          is_correct: a.is_correct || false,
          order_number: idx + 1,
        }))

        await supabaseAdmin.from('quiz_answers').insert(answersToInsert)
      }
    }
  }

  // Re-fetch the full quiz with questions and answers
  const { data: fullQuiz, error: fetchError } = await supabaseAdmin
    .from('quizzes')
    .select('*, quiz_questions(*, quiz_answers(*))')
    .eq('id', quiz.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  return NextResponse.json({ quiz: fullQuiz })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Delete answers, questions, then quiz
  const { data: questions } = await supabaseAdmin
    .from('quiz_questions')
    .select('id')
    .eq('quiz_id', id)

  if (questions) {
    for (const q of questions) {
      await supabaseAdmin.from('quiz_answers').delete().eq('question_id', q.id)
    }
    await supabaseAdmin.from('quiz_questions').delete().eq('quiz_id', id)
  }

  const { error } = await supabaseAdmin.from('quizzes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
