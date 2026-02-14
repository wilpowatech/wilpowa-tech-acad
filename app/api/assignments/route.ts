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
  const { module_id, day_number, student_ids, course_id, available_at } = body

  if (!module_id || !day_number || !student_ids?.length || !course_id) {
    return NextResponse.json({ error: 'module_id, day_number, course_id, and student_ids are required' }, { status: 400 })
  }

  // Default available_at to today at 12:00 PM if not specified
  const resolvedAvailableAt = available_at || (() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d.toISOString()
  })()

  // Remove existing assignments for this module/day combo first
  await supabaseAdmin
    .from('content_assignments')
    .delete()
    .eq('module_id', module_id)
    .eq('day_number', day_number)

  // Insert new assignments
  const records = student_ids.map((sid: string) => ({
    student_id: sid,
    module_id,
    day_number,
    course_id,
    available_at: resolvedAvailableAt,
  }))

  const { data, error } = await supabaseAdmin
    .from('content_assignments')
    .insert(records)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignments: data })
}
