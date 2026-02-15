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
    .from('labs')
    .select('*')
    .eq('module_id', moduleId)
    .order('day_number', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ labs: data })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { module_id, title, instructions, github_repo_url, sandbox_url, order_number, max_score, day_number, deadline } = body

  if (!module_id || !title) {
    return NextResponse.json({ error: 'module_id and title are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('labs')
    .insert({
      module_id,
      title,
      instructions: instructions || '',
      github_repo_url: github_repo_url || null,
      sandbox_url: sandbox_url || null,
      order_number: order_number || 1,
      total_points: max_score || 100,
      day_number: day_number || null,
      deadline: deadline || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lab: data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, max_score, ...rest } = body

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  // Map max_score to total_points (the actual DB column name)
  const updates: Record<string, any> = { ...rest }
  if (max_score !== undefined) updates.total_points = max_score

  const { data, error } = await supabaseAdmin
    .from('labs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lab: data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('labs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
