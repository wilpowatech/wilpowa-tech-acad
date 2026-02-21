import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const moduleId = searchParams.get('module_id')

  if (!moduleId) {
    return NextResponse.json({ error: 'module_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('day_number', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lessons: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { module_id, day_number, title, content, description, video_url, deadline, scheduled_at, available_at } = body

  if (!module_id || !day_number || !title) {
    return NextResponse.json({ error: 'module_id, day_number, and title are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      module_id,
      day_number,
      title,
      content: content || '',
      description: description || '',
      video_url: video_url || null,
      deadline: deadline || null,
      scheduled_at: scheduled_at || null,
      available_at: available_at || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('lessons').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
