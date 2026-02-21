'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'student' | 'instructor'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(email, password, fullName, role)
      if (result.success) {
        router.push('/auth/login?message=Check your email to confirm your account')
      } else {
        setError(result.error || 'Failed to sign up')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Wilpowa Tech Academy</h1>
        <p className="text-muted-foreground">Join Our Software Development Platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card p-8 rounded-xl border border-border shadow-sm">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-2">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
            Password
          </label>
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-2">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-input border-border text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-2">
            I am a
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'student' | 'instructor')}
            className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-2"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>

        <p className="text-center text-muted-foreground text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:text-primary/80 font-semibold">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
