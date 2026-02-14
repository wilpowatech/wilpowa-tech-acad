import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params

  const { data, error } = await supabaseAdmin
    .from('quizzes')
    .select('*, quiz_questions(id, question_text, points, quiz_answers(id, answer_text, order_number))')
    .eq('id', quizId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort questions and answers, and strip is_correct from answers (students shouldn't see this)
  if (data.quiz_questions) {
    data.quiz_questions = data.quiz_questions.map((q: any) => ({
      ...q,
      quiz_answers: (q.quiz_answers || []).sort((a: any, b: any) => a.order_number - b.order_number),
    }))
  }

  return NextResponse.json({ quiz: data })
}
