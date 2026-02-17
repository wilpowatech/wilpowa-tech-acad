import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Prefer server-only SUPABASE_URL if you have it, fallback to NEXT_PUBLIC_SUPABASE_URL
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: fetch assignments for a module or specific content
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const moduleId = searchParams.get('module_id')
  const dayNumber = searchParams.get('day_number')
  const studentId = searchParams.get('student_id')

  let query = supabaseAdmin
    .from('content_assignments')
    .select('*, users!content_assignments_student_id_fkey(id, full_name, email)')

  if (moduleId) query = query.eq('module_id', moduleId)
  if (dayNumber) query = query.eq('day_number', parseInt(dayNumber, 10))
  if (studentId) query = query.eq('student_id', studentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ assignments: data })
}

// POST: assign content to selected students (bulk)
export async function POST(req: Request) {
  const body = await req.json()
  const { module_id, day_number, student_ids, course_id, available_at, deadline } = body

  if (!module_id || day_number === undefined || !student_ids?.length || !course_id) {
    return NextResponse.json(
      { error: 'module_id, day_number, course_id, and student_ids are required' },
      { status: 400 }
    )
  }

  // Default available_at to today at 12:00 PM if not specified
  const resolvedAvailableAt =
    available_at ||
    (() => {
      const d = new Date()
      d.setHours(12, 0, 0, 0)
      return d.toISOString()
    })()

  // Calculate grace_deadline automatically: same duration as first window, starting after deadline
  const resolvedDeadline: string | null = deadline || null
  let graceDeadline: string | null = null

  if (resolvedDeadline) {
    const availDate = new Date(resolvedAvailableAt)
    const deadDate = new Date(resolvedDeadline)
    const durationMs = deadDate.getTime() - availDate.getTime()

    // Grace period = deadline + same duration (auto second window)
    graceDeadline = new Date(deadDate.getTime() + durationMs).toISOString()
  }

  // Lookup actual content IDs for this module + day
  const [
    { data: lesson, error: lessonErr },
    { data: quiz, error: quizErr },
    { data: lab, error: labErr },
  ] = await Promise.all([
    supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('module_id', module_id)
      .eq('day_number', day_number)
      .maybeSingle(),
    supabaseAdmin
      .from('quizzes')
      .select('id')
      .eq('module_id', module_id)
      .eq('day_number', day_number)
      .maybeSingle(),
    supabaseAdmin
      .from('labs')
      .select('id')
      .eq('module_id', module_id)
      .eq('day_number', day_number)
      .maybeSingle(),
  ])

  if (lessonErr || quizErr || labErr) {
    return NextResponse.json(
      {
        error: 'Failed to lookup content for module/day',
        details: {
          lesson: lessonErr?.message,
          quiz: quizErr?.message,
          lab: labErr?.message,
        },
      },
      { status: 500 }
    )
  }

  // Build content items that actually exist for this day
  const contentItems: { type: 'lesson' | 'quiz' | 'lab'; id: string }[] = []
  if (lesson?.id) contentItems.push({ type: 'lesson', id: lesson.id })
  if (quiz?.id) contentItems.push({ type: 'quiz', id: quiz.id })
  if (lab?.id) contentItems.push({ type: 'lab', id: lab.id })

  // If no content exists yet, create a placeholder assignment with module_id as content_id
  // (keeps your original behavior)
  if (contentItems.length === 0) {
    contentItems.push({ type: 'lesson', id: module_id })
  }

  // Remove existing assignments for this module/day combo first
  const { error: deleteErr } = await supabaseAdmin
    .from('content_assignments')
    .delete()
    .eq('module_id', module_id)
    .eq('day_number', day_number)

  if (deleteErr) {
    return NextResponse.json(
      { error: 'Failed to delete existing assignments', details: deleteErr.message },
      { status: 500 }
    )
  }

  // Insert one assignment per student per content item
  const records = (student_ids as string[]).flatMap((sid) =>
    contentItems.map((ci) => {
      const record: Record<string, any> = {
        student_id: sid,
        module_id,
        day_number,
        course_id,
        content_type: ci.type,
        content_id: ci.id,
        available_at: resolvedAvailableAt,
      }

      if (resolvedDeadline) {
        record.deadline = resolvedDeadline
        if (graceDeadline) record.grace_deadline = graceDeadline
      }

      return record
    })
  )

  const { data, error } = await supabaseAdmin.from('content_assignments').insert(records).select()

  if (error) {
    console.error('[v0] Assignments insert error:', error.message, error.details, error.hint)
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 500 }
    )
  }

  return NextResponse.json({ assignments: data, grace_deadline: graceDeadline })
}
