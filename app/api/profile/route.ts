import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: fetch user profile
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, avatar_url, date_of_birth, phone, sex, github_url, country, bio, created_at')
    .eq('id', userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}

// PUT: update user profile
export async function PUT(req: Request) {
  const body = await req.json()
  const { user_id, full_name, phone, sex, github_url, country, bio, date_of_birth, avatar_url } = body

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  // Validate github_url format if provided
  if (github_url && github_url.trim() !== '') {
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/
    if (!githubUrlPattern.test(github_url.trim())) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Please use format: https://github.com/username' },
        { status: 400 }
      )
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (full_name !== undefined) updates.full_name = full_name
  if (phone !== undefined) updates.phone = phone
  if (sex !== undefined) updates.sex = sex
  if (github_url !== undefined) updates.github_url = github_url.trim()
  if (country !== undefined) updates.country = country
  if (bio !== undefined) updates.bio = bio
  if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth
  if (avatar_url !== undefined) updates.avatar_url = avatar_url

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', user_id)
    .select('id, email, full_name, role, avatar_url, date_of_birth, phone, sex, github_url, country, bio, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
