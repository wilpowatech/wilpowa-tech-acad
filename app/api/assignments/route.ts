import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: fetch assignments for a module or specific content
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const moduleId = searchParams.get('module_id')
  const dayNumber = searchParams.get('day_number')
  const studentId = searchParams.get('student_id')

  let query = supabaseAdmin.from('content_assignments').select('*, users!content_assignments_student_id_fkey(id, full_name, email)')

  if (moduleId) query = query.eq('module_id', moduleId)
  if (dayNumber) query = query.eq('day_number', parseInt(dayNumber))
  if (studentId) query = query.eq('student_id', studentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignments: data })
}

// POST: assign content to selected students (bulk)
export async function POST(req: Request) {
  const body = await req.json()
  const { module_id, day_number, student_ids, course_id, available_at, deadline } = body

  if (!module_id || !day_number || !student_ids?.length || !course_id) {
    return NextResponse.json({ error: 'module_id, day_number, course_id, and student_ids are required' }, { status: 400 })
  }

  // Default available_at to today at 12:00 PM if not specified
  const resolvedAvailableAt = available_at || (() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d.toISOString()
  })()

  // Calculate grace_deadline automatically: same duration as first window, starting after deadline
  let resolvedDeadline: string | null = deadline || null
  let graceDeadline: string | null = null

  if (resolvedDeadline) {
    const availDate = new Date(resolvedAvailableAt)
    const deadDate = new Date(resolvedDeadline)
    const durationMs = deadDate.getTime() - availDate.getTime()
    // Grace period = deadline + same duration (auto second window)
    graceDeadline = new Date(deadDate.getTime() + durationMs).toISOString()
  }

  // Lookup actual content IDs for this module + day
  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('module_id', module_id)
    .eq('day_number', day_number)
    .single()

  const { data: quiz } = await supabaseAdmin
    .from('quizzes')
    .select('id')
    .eq('module_id', module_id)
    .eq('day_number', day_number)
    .single()

  const { data: lab } = await supabaseAdmin
    .from('labs')
    .select('id')
    .eq('module_id', module_id)
    .eq('day_number', day_number)
    .single()

  // Build content items that actually exist for this day
  const contentItems: { type: string; id: string }[] = []
  if (lesson) contentItems.push({ type: 'lesson', id: lesson.id })
  if (quiz) contentItems.push({ type: 'quiz', id: quiz.id })
  if (lab) contentItems.push({ type: 'lab', id: lab.id })

  // If no content exists yet, create a placeholder assignment with module_id as content_id
  if (contentItems.length === 0) {
    contentItems.push({ type: 'lesson', id: module_id })
  }

  // Remove existing assignments for this module/day combo first
  await supabaseAdmin
    .from('content_assignments')
    .delete()
    .eq('module_id', module_id)
    .eq('day_number', day_number)

  // Insert one assignment per student per content item
  const records = student_ids.flatMap((sid: string) =>
    contentItems.map(ci => {
  // Insert new assignments (one per student per content type: lesson, quiz, lab)
  const contentTypes = ['lesson', 'quiz', 'lab']
  const records = student_ids.flatMap((sid: string) =>
    contentTypes.map(ct => {
      const record: Record<string, any> = {
        student_id: sid,
        module_id,
        day_number,
        course_id,
        content_type: ci.type,
        content_id: ci.id,
        content_type: ct,
        available_at: resolvedAvailableAt,
      }
      if (resolvedDeadline) {
        record.deadline = resolvedDeadline
        if (graceDeadline) record.grace_deadline = graceDeadline
      }
      return record
    })
  )

  const { data, error } = await supabaseAdmin
    .from('content_assignments')
    .insert(records)
    .select()

  if (error) {
    console.error('[v0] Assignments insert error:', error.message, error.details, error.hint)
    return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 })
  }
  return NextResponse.json({ assignments: data, grace_deadline: graceDeadline })
}
