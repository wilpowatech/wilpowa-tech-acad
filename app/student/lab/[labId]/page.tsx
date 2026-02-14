'use client'

import React from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import CodeSandbox, { type CodeSandboxHandle } from '@/components/code-sandbox'

interface Lab {
  id: string
  title: string
  description: string
  instructions: string
  total_points: number
  module_id: string
  github_repo_url: string | null
  sandbox_url: string | null
  deadline: string | null
  day_number: number | null
}

interface Submission {
  id: string
  code: string
  submitted_at: string
  grade: number | null
  feedback: string | null
  graded_at: string | null
}

function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const now = new Date().getTime()
      const end = new Date(deadline).getTime()
      const diff = end - now
      if (diff <= 0) { setTimeLeft('Expired'); setExpired(true); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  return { timeLeft, expired }
}

export default function LabPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { labId } = useParams()
  const [lab, setLab] = useState<Lab | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [code, setCode] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [submitMode, setSubmitMode] = useState<'sandbox' | 'github'>('sandbox')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const sandboxRef = useRef<CodeSandboxHandle>(null)
  const { timeLeft, expired } = useCountdown(lab?.deadline || null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (labId && user && profile?.role === 'student') fetchLabData()
  }, [labId, user, profile])

  const fetchLabData = async () => {
    try {
      const { data: labData, error: labError } = await supabase
        .from('labs').select('*').eq('id', labId).single()
      if (labError) throw labError
      setLab(labData)

      const { data: submissionData } = await supabase
        .from('lab_submissions').select('*')
        .eq('lab_id', labId).eq('student_id', user?.id)
        .order('submitted_at', { ascending: false }).limit(1)

      if (submissionData && submissionData.length > 0) {
        setSubmission(submissionData[0])
        setCode(submissionData[0].code || '')
        setGithubUrl(submissionData[0].code?.startsWith('http') ? submissionData[0].code : '')
      }
    } catch (err) {
      console.error('Error fetching lab:', err)
      setError('Failed to load lab')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const submittedContent = submitMode === 'github' ? githubUrl : (sandboxRef.current?.getCode() || code)
    if (!submittedContent.trim()) {
      setError(submitMode === 'github' ? 'Please provide your GitHub URL' : 'Please write some code in the sandbox')
      return
    }

    setSubmitting(true)
    setError('')
    setResult(null)

    // Get cheating data from sandbox
    const cheatingData = sandboxRef.current?.getCheatingData()

    try {
      const res = await fetch('/api/labs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lab_id: labId,
          student_id: user?.id,
          ...(submitMode === 'github' ? { github_url: submittedContent } : { code: submittedContent }),
          cheating_data: cheatingData || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSubmission(data.submission)
      setResult(data)
    } catch (err) {
      console.error('Error submitting lab:', err)
      setError((err as Error).message || 'Failed to submit lab')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!lab) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground mb-6">Lab not found</p>
        <Link href="/student/dashboard"><Button>Back</Button></Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Expired overlay */}
      {expired && !submission && (
        <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center">
          <div className="bg-card border border-destructive rounded-xl p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold text-destructive mb-2">Deadline Passed</h2>
            <p className="text-muted-foreground mb-4">The deadline for this lab has expired.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link href="/student/dashboard" className="text-primary hover:text-primary/80 text-sm">&larr; Back to Dashboard</Link>
            <h1 className="text-xl font-bold text-foreground">{lab.title}</h1>
            <p className="text-sm text-muted-foreground">Max Score: {lab.total_points} pts</p>
          </div>
          <div className="flex items-center gap-3">
            {lab.deadline && !result && (
              <div className={`text-sm font-mono font-bold px-3 py-1.5 rounded-lg border ${expired ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'}`}>
                {expired ? 'EXPIRED' : timeLeft}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Score result banner */}
        {result && (
          <div className={`rounded-xl p-6 mb-6 border ${result.cheat_flagged ? 'bg-destructive/10 border-destructive/50' : result.score >= 70 ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className={`text-xl font-bold ${result.cheat_flagged ? 'text-destructive' : result.score >= 70 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {result.cheat_flagged ? 'Integrity Warning' : result.score >= 70 ? 'Great Job!' : 'Needs Improvement'}
              </h2>
              <span className="text-2xl font-bold text-foreground">{result.scaled_grade}/{lab.total_points}</span>
            </div>
            {result.cheat_flagged && (
              <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-3 mb-3">
                <p className="text-sm font-medium text-destructive">Potential Academic Integrity Violation Detected</p>
                <ul className="text-xs text-destructive/80 mt-1 space-y-0.5">
                  {result.cheat_reasons?.map((r: string, i: number) => <li key={i}>- {r}</li>)}
                </ul>
                <p className="text-xs text-destructive/80 mt-2">Your score has been reduced. You may resubmit with original work.</p>
              </div>
            )}
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{result.feedback}</pre>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions panel */}
          <div className="space-y-4">
            <div className="bg-card/80 border border-border rounded-xl p-5">
              <h2 className="text-lg font-bold text-foreground mb-3">Lab Instructions</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{lab.instructions || 'No instructions provided.'}</p>
            </div>

            {lab.github_repo_url && (
              <a href={lab.github_repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-card/80 border border-border rounded-xl hover:border-primary transition-colors">
                <svg className="w-5 h-5 text-foreground shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                <div>
                  <p className="text-sm font-medium text-foreground">Starter Repo</p>
                  <p className="text-xs text-muted-foreground">Fork this to get started</p>
                </div>
              </a>
            )}

            {/* Previous submission info */}
            {submission && !result && (
              <div className="bg-card/80 border border-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-foreground mb-2">Previous Submission</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-bold text-foreground">{submission.grade !== null ? `${submission.grade}/${lab.total_points}` : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="text-foreground">{new Date(submission.submitted_at).toLocaleString()}</span>
                  </div>
                  {submission.feedback && (
                    <div className="pt-2 border-t border-border">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{submission.feedback}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Code sandbox / submission */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode toggle */}
              <div className="flex items-center gap-2 bg-card/80 border border-border rounded-xl p-3">
                <span className="text-sm text-muted-foreground mr-2">Submit via:</span>
                <button type="button" onClick={() => setSubmitMode('sandbox')} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${submitMode === 'sandbox' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  In-House Sandbox
                </button>
                <button type="button" onClick={() => setSubmitMode('github')} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${submitMode === 'github' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  GitHub URL
                </button>
              </div>

              {submitMode === 'sandbox' ? (
                <div>
                  <CodeSandbox
                    ref={sandboxRef}
                    initialCode={code || undefined}
                    language="javascript"
                    onCodeChange={setCode}
                    height="450px"
                    monitorCheating={true}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Write your code above, test it with "Run", then submit for grading.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-card/80 border border-border rounded-xl p-5">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Your GitHub Repository URL</label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={e => setGithubUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="https://github.com/yourusername/your-lab-repo"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Make sure your repository is public so the grading system can access it.</p>
                </div>
              )}

              {/* Warning box */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">Academic Integrity Notice</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your submission is automatically scanned for AI-generated code, plagiarism, and copy-paste indicators. Code flagged for violations will receive a score penalty. Write your own original code to avoid issues.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || expired}
                className="w-full inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting & Scoring...' : submission ? 'Resubmit for Re-Grading' : 'Submit Lab for Auto-Grading'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
