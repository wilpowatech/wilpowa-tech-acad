import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { course_id, week_number, title, description, instructor_id } = body

    if (!course_id || !title || !instructor_id) {
      return NextResponse.json(
        { error: 'course_id, title, and instructor_id are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the instructor owns this course
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, instructor_id')
      .eq('id', course_id)
      .eq('instructor_id', instructor_id)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found or you do not own this course' },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert({
        course_id,
        week_number: week_number || 1,
        title,
        description: description || '',
      })
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ module: data[0] }, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
