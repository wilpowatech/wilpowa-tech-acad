'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signIn, supabase } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn(email, password)
      if (result.success) {
        // Fetch user profile to determine role-based redirect
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profile?.role === 'instructor') {
            router.push('/instructor/dashboard')
          } else if (profile?.role === 'student') {
            router.push('/student/dashboard')
          } else if (profile?.role === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/')
          }
        } else {
          router.push('/')
        }
      } else {
        setError(result.error || 'Failed to sign in')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Wilpowa Tech Academy"
          width={240}
          height={66}
          className="h-16 w-auto object-contain mb-3"
          priority
        />
        <p className="text-muted-foreground">Professional Software Development Platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card/80 p-8 rounded-xl border border-border">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80">
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full font-semibold py-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <p className="text-center text-muted-foreground text-sm">
          {"Don't have an account? "}
          <Link href="/auth/signup" className="text-primary hover:text-primary/80 font-semibold">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
