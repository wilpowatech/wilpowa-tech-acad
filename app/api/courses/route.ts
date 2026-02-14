import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, instructor_id } = body

    if (!title || !instructor_id) {
      return NextResponse.json(
        { error: 'Title and instructor_id are required' },
        { status: 400 }
      )
    }

    // Use service role client to bypass any RLS issues
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user exists and is an instructor
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', instructor_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (userProfile.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Only instructors can create courses' },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert({
        instructor_id,
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

    return NextResponse.json({ course: data[0] }, { status: 201 })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Internal server error' },
      { status: 500 }
    )
  }
}
