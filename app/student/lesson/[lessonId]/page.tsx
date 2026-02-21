'use client'

import React from "react"
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  video_url: string | null
  day_number: number
  module_id: string
  scheduled_at: string | null
  available_at: string | null
  deadline: string | null
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  // Direct video URL (mp4, webm, etc.)
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return url
  return null
}

export default function StudentLessonPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [marked, setMarked] = useState(false)
  const [marking, setMarking] = useState(false)

  useEffect(() => { if (!authLoading && !user) router.push('/auth/login') }, [user, authLoading, router])

  useEffect(() => {
    if (lessonId && user) fetchLesson()
  }, [lessonId, user])

  const fetchLesson = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons').select('*').eq('id', lessonId).single()
      if (error) throw error

      // Check access time
      if (data.available_at) {
        const now = new Date()
        const available = new Date(data.available_at)
        if (now < available) {
          setLesson(null)
          setLoading(false)
          return
        }
      }

      setLesson(data)

      // Check if already marked as completed
      const { data: progress } = await supabase
        .from('student_daily_progress')
        .select('lecture_completed')
        .eq('student_id', user?.id)
        .eq('module_id', data.module_id)
        .eq('day_number', data.day_number)
        .limit(1)

      if (progress && progress.length > 0 && progress[0].lecture_completed) {
        setMarked(true)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const markComplete = async () => {
    if (!lesson || !user) return
    setMarking(true)
    try {
      // Get the course_id from the module
      const { data: mod } = await supabase
        .from('modules').select('course_id').eq('id', lesson.module_id).single()

      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          course_id: mod?.course_id,
          module_id: lesson.module_id,
          day_number: lesson.day_number,
          lecture_completed: true,
        }),
      })
      setMarked(true)
    } catch (err) {
      console.error('Error marking complete:', err)
    } finally {
      setMarking(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
          <p className="text-muted-foreground mb-4">This lecture is not available yet.</p>
          <Link href="/student/dashboard"><Button>Back to Dashboard</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <Link href="/student/dashboard" className="text-primary hover:text-primary/80 text-sm">&larr; Dashboard</Link>
            <h1 className="text-xl font-bold text-foreground">Day {lesson.day_number}: {lesson.title}</h1>
          </div>
          {!marked ? (
            <button onClick={markComplete} disabled={marking} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {marking ? 'Marking...' : 'Mark as Complete'}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              Completed
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lesson.description && (
          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">{lesson.description}</p>
        )}

        {/* Video Player */}
        {lesson.video_url && (() => {
          const embedUrl = getEmbedUrl(lesson.video_url)
          if (!embedUrl) return null
          const isDirect = embedUrl.match(/\.(mp4|webm|ogg)(\?|$)/i)
          return (
            <div className="mb-8">
              <div className="rounded-xl overflow-hidden border border-border bg-primary shadow-lg">
                {isDirect ? (
                  <video
                    controls
                    controlsList="nodownload"
                    className="w-full aspect-video"
                    preload="metadata"
                  >
                    <source src={embedUrl} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <iframe
                    src={embedUrl}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Video: ${lesson.title}`}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Watch the lecture video above, then review the notes below.</p>
            </div>
          )
        })()}

        <article className="prose prose-invert max-w-none">
          <div className="text-foreground whitespace-pre-wrap leading-relaxed">{lesson.content}</div>
        </article>

        {/* Bottom actions */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <Link href="/student/dashboard" className="text-primary hover:text-primary/80 text-sm">&larr; Back to Dashboard</Link>
          {!marked && (
            <button onClick={markComplete} disabled={marking} className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {marking ? 'Marking...' : 'I have completed this lecture'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
