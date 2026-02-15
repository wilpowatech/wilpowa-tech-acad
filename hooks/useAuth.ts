'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'instructor' | 'student'
  avatar_url?: string | null
  github_url?: string | null
  phone?: string | null
  sex?: string | null
  country?: string | null
  date_of_birth?: string | null
  bio?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial user and session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          // Fetch user profile
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(data as UserProfile)
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data as UserProfile)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    // Listen for profile update events (e.g. after avatar upload)
    const handleProfileUpdate = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data as UserProfile)
      }
    }
    window.addEventListener('profile-updated', handleProfileUpdate)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

  return { user, profile, loading, error }
}
