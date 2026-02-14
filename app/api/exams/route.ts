import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('course_id')

  if (!courseId) {
    return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('exams')
    .select('*, exam_questions(*, exam_answers(*))')
    .eq('course_id', courseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ exams: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { course_id, title, description, duration_minutes, questions, week_number } = body

  if (!course_id || !title) {
    return NextResponse.json({ error: 'course_id and title are required' }, { status: 400 })
  }

  // Default week_number to 1 if not provided
  const resolvedWeek = week_number || 1

  const { data: exam, error: examError } = await supabaseAdmin
    .from('exams')
    .insert({
      course_id,
      title,
      description: description || '',
      duration_minutes: duration_minutes || 60,
      total_questions: questions?.length || 0,
      passing_score: 70,
      week_number: resolvedWeek,
    })
    .select()
    .single()

  if (examError) return NextResponse.json({ error: examError.message }, { status: 500 })

  if (questions && questions.length > 0) {
    for (const q of questions) {
      const { data: question, error: qError } = await supabaseAdmin
        .from('exam_questions')
        .insert({
          exam_id: exam.id,
          question_text: q.question_text,
          question_type: 'multiple_choice',
          points: q.points || 10,
        })
        .select()
        .single()

      if (qError) continue

      if (q.answers && q.answers.length > 0) {
        const answersToInsert = q.answers.map((a: any, idx: number) => ({
          question_id: question.id,
          answer_text: a.answer_text,
          is_correct: a.is_correct || false,
          order_number: idx + 1,
        }))

        await supabaseAdmin.from('exam_answers').insert(answersToInsert)
      }
    }
  }

  const { data: fullExam, error: fetchError } = await supabaseAdmin
    .from('exams')
    .select('*, exam_questions(*, exam_answers(*))')
    .eq('id', exam.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  return NextResponse.json({ exam: fullExam })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { data: questions } = await supabaseAdmin
    .from('exam_questions')
    .select('id')
    .eq('exam_id', id)

  if (questions) {
    for (const q of questions) {
      await supabaseAdmin.from('exam_answers').delete().eq('question_id', q.id)
    }
    await supabaseAdmin.from('exam_questions').delete().eq('exam_id', id)
  }

  const { error } = await supabaseAdmin.from('exams').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
