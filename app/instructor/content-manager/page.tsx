'use client'

import React from "react"

import { useState } from 'react'
import { supabase } from '@/lib/auth'
import { useAuth } from '@/hooks/useAuth'

export default function ContentManager() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'lectures' | 'labs' | 'quizzes' | 'exams'>('lectures')
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [loading, setLoading] = useState(false)
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    content: '',
    video_url: '',
  })

  const weeks = Array.from({ length: 12 }, (_, i) => i + 1)

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tableName = activeTab === 'lectures' ? 'lessons' : activeTab
      
      // Get the module ID for this week
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('week_number', selectedWeek)
        .single()

      if (!modules) {
        alert('Module not found for this week')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from(tableName)
        .insert({
          [activeTab === 'lectures' ? 'module_id' : 'course_id']: modules.id,
          title: newContent.title,
          description: newContent.description,
          ...(activeTab === 'lectures' && {
            content: newContent.content,
            video_url: newContent.video_url,
          }),
        })

      if (error) throw error

      alert('Content added successfully!')
      setNewContent({ title: '', description: '', content: '', video_url: '' })
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-foreground">
            Course Content Manager
          </h1>

          {/* Instructions */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">How to Add Course Content</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>1. Select the week (1-12) you want to add content for</p>
              <p>2. Choose the content type: Lectures, Labs, Quizzes, or Exams</p>
              <p>3. Fill in the content details and submit</p>
              <p>4. Content will be automatically available to enrolled students</p>
              <p className="text-primary font-semibold">For lectures: Paste your video URL (YouTube, Vimeo, etc.) in the video URL field</p>
            </div>
          </div>

          {/* Week Selector */}
          <div className="mb-8">
            <label className="block text-foreground font-semibold mb-3">Select Week:</label>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {weeks.map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`py-2 px-3 rounded-lg font-semibold transition ${
                    selectedWeek === week
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-foreground hover:border-primary'
                  }`}
                >
                  W{week}
                </button>
              ))}
            </div>
          </div>

          {/* Content Type Tabs */}
          <div className="mb-8 flex gap-2 border-b border-border">
            {(['lectures', 'labs', 'quizzes', 'exams'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold transition ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary -mb-2'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Form */}
          <form onSubmit={handleAddContent} className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-foreground font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  placeholder={`Enter ${activeTab.slice(0, -1)} title`}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>

              {activeTab === 'lectures' && (
                <div>
                  <label className="block text-foreground font-semibold mb-2">Video URL</label>
                  <input
                    type="url"
                    value={newContent.video_url}
                    onChange={(e) => setNewContent({ ...newContent, video_url: e.target.value })}
                    placeholder="https://youtube.com/embed/..."
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-foreground font-semibold mb-2">Description</label>
              <textarea
                value={newContent.description}
                onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                placeholder="Describe the content..."
                rows={3}
                required
                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>

            {activeTab === 'lectures' && (
              <div>
                <label className="block text-foreground font-semibold mb-2">Lecture Content (Markdown)</label>
                <textarea
                  value={newContent.content}
                  onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  placeholder="Enter lecture notes in markdown format..."
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition font-mono text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 disabled:opacity-50 transition"
            >
              {loading ? 'Adding Content...' : `Add ${activeTab.slice(0, -1)}`}
            </button>
          </form>

          {/* Content Summary */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-secondary text-2xl font-bold">12</div>
              <p className="text-muted-foreground text-sm">Weeks</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-primary text-2xl font-bold">~36</div>
              <p className="text-muted-foreground text-sm">Recommended Lectures</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-accent text-2xl font-bold">12</div>
              <p className="text-muted-foreground text-sm">Labs (1 per week)</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-secondary text-2xl font-bold">4</div>
              <p className="text-muted-foreground text-sm">Exams</p>
            </div>
          </div>
        </div>
      </div>
  )
}
