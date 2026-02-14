import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select('student_id, users!enrollments_student_id_fkey(id, full_name, email)')
    .eq('course_id', courseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const students = (data || []).map((e: any) => ({
    id: e.users?.id || e.student_id,
    full_name: e.users?.full_name || 'Unknown',
    email: e.users?.email || '',
  }))

  return NextResponse.json({ students })
}
