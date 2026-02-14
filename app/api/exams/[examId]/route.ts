import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params

  const { data, error } = await supabaseAdmin
    .from('exams')
    .select('*, exam_questions(id, question_text, points, exam_answers(id, answer_text, order_number))')
    .eq('id', examId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data.exam_questions) {
    data.exam_questions = data.exam_questions.map((q: any) => ({
      ...q,
      exam_answers: (q.exam_answers || []).sort((a: any, b: any) => a.order_number - b.order_number),
    }))
  }

  return NextResponse.json({ exam: data })
}
