import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: List students enrolled in a course
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('course_id')

  if (!courseId) {
    return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
  }

  const { data: enrollments, error } = await supabaseAdmin
    .from('enrollments')
    .select('*, users(id, full_name, email)')
    .eq('course_id', courseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const students = (enrollments || []).map((e: any) => ({
    id: e.users?.id,
    full_name: e.users?.full_name,
    email: e.users?.email,
    enrollment_id: e.id,
    enrolled_at: e.enrolled_at || e.created_at,
  }))

  return NextResponse.json({ students })
}
