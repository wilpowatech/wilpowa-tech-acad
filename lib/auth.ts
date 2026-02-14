import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings (Vars section in the sidebar).'
  )
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder')

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: 'student' | 'instructor'
) {
  try {
    console.log('[v0] Starting signup for:', email)
    
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error('[v0] Auth error:', authError)
      throw authError
    }
    
    if (!authData.user) {
      console.error('[v0] No user returned from signup')
      throw new Error('Failed to create user')
    }

    console.log('[v0] User created, now creating profile:', authData.user.id)

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      })
      .select()

    if (profileError) {
      console.error('[v0] Profile creation error:', profileError)
      throw profileError
    }

    console.log('[v0] Profile created successfully')
    return { success: true, user: authData.user }
  } catch (error) {
    const errorMsg = (error as Error).message
    console.error('[v0] Signup error:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.session) throw new Error('No session created')

    return { success: true, session: data.session }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  } catch (error) {
    return null
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    return null
  }
}
