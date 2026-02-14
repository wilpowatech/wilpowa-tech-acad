import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: fetch student progress for a course or specific module
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('student_id')
  const courseId = searchParams.get('course_id')
  const moduleId = searchParams.get('module_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  let query = supabaseAdmin.from('student_daily_progress').select('*')
  query = query.eq('student_id', studentId)

  if (courseId) query = query.eq('course_id', courseId)
  if (moduleId) query = query.eq('module_id', moduleId)

  query = query.order('day_number', { ascending: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Calculate overall stats
  const totalEntries = data?.length || 0
  let totalQuizScore = 0
  let totalLabScore = 0
  let completedLectures = 0
  let quizCount = 0
  let labCount = 0

  for (const p of (data || [])) {
    if (p.lecture_completed) completedLectures++
    if (p.quiz_score !== null) { totalQuizScore += p.quiz_score; quizCount++ }
    if (p.lab_score !== null) { totalLabScore += p.lab_score; labCount++ }
  }

  const avgQuizScore = quizCount > 0 ? Math.round(totalQuizScore / quizCount) : 0
  const avgLabScore = labCount > 0 ? Math.round(totalLabScore / labCount) : 0
  // Daily scoring: 40% Quiz + 60% Lab
  const overallScore = (quizCount > 0 || labCount > 0)
    ? Math.round(avgQuizScore * 0.4 + avgLabScore * 0.6)
    : 0

  return NextResponse.json({
    progress: data,
    stats: {
      totalDays: totalEntries,
      completedLectures,
      avgQuizScore,
      avgLabScore,
      overallScore,
      quizCount,
      labCount,
    }
  })
}

// POST: upsert progress for a specific day
export async function POST(req: Request) {
  const body = await req.json()
  const { student_id, course_id, module_id, day_number, lecture_completed, quiz_score, lab_score } = body

  if (!student_id || !course_id || !module_id || !day_number) {
    return NextResponse.json({ error: 'student_id, course_id, module_id, and day_number required' }, { status: 400 })
  }

  // Check if record exists
  const { data: existing } = await supabaseAdmin
    .from('student_daily_progress')
    .select('id')
    .eq('student_id', student_id)
    .eq('module_id', module_id)
    .eq('day_number', day_number)
    .limit(1)

  const updates: any = { updated_at: new Date().toISOString() }
  if (lecture_completed !== undefined) updates.lecture_completed = lecture_completed
  if (quiz_score !== undefined) updates.quiz_score = quiz_score
  if (lab_score !== undefined) updates.lab_score = lab_score

  // Calculate overall_day_score using 40% Quiz + 60% Lab
  const currentQuiz = quiz_score ?? 0
  const currentLab = lab_score ?? 0
  updates.overall_day_score = Math.round((currentQuiz * 0.4 + currentLab * 0.6) * 100) / 100

  let result
  if (existing && existing.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('student_daily_progress')
      .update(updates)
      .eq('id', existing[0].id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabaseAdmin
      .from('student_daily_progress')
      .insert({
        student_id,
        course_id,
        module_id,
        day_number,
        lecture_completed: lecture_completed || false,
        quiz_score: quiz_score || null,
        lab_score: lab_score || null,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json({ progress: result })
}
