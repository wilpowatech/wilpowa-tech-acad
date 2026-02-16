'use client'

import { useState, useEffect } from 'react'

interface DeadlineCountdownProps {
  deadline: string | null
  graceDeadline: string | null
}

export function DeadlineCountdown({ deadline, graceDeadline }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [status, setStatus] = useState<'active' | 'urgent' | 'grace' | 'expired'>('active')

  useEffect(() => {
    if (!deadline) return

    const tick = () => {
      const now = Date.now()
      const deadMs = new Date(deadline).getTime()
      const graceMs = graceDeadline ? new Date(graceDeadline).getTime() : null

      if (graceMs && now > graceMs) {
        setTimeLeft('Closed')
        setStatus('expired')
        return
      }

      if (now > deadMs) {
        if (graceMs) {
          const diff = graceMs - now
          setTimeLeft(formatTime(diff))
          setStatus('grace')
        } else {
          setTimeLeft('Expired')
          setStatus('expired')
        }
        return
      }

      const diff = deadMs - now
      setTimeLeft(formatTime(diff))
      setStatus(diff < 3600000 ? 'urgent' : 'active')
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline, graceDeadline])

  if (!deadline) return null

  const colors = {
    active: 'text-foreground bg-muted/50 border-border',
    urgent: 'text-destructive bg-destructive/10 border-destructive/30 animate-pulse',
    grace: 'text-secondary bg-secondary/10 border-secondary/30',
    expired: 'text-destructive bg-destructive/10 border-destructive/30',
  }

  const labels = {
    active: '',
    urgent: 'DUE SOON ',
    grace: 'LATE (60% max) ',
    expired: '',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${colors[status]}`}>
      {labels[status]}
      {timeLeft}
    </span>
  )
}

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function DeadlineBadge({ deadline, graceDeadline }: DeadlineCountdownProps) {
  const [status, setStatus] = useState<'ok' | 'urgent' | 'grace' | 'expired'>('ok')

  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const now = Date.now()
      const deadMs = new Date(deadline).getTime()
      const graceMs = graceDeadline ? new Date(graceDeadline).getTime() : null
      if (graceMs && now > graceMs) { setStatus('expired'); return }
      if (now > deadMs) { setStatus('grace'); return }
      if (deadMs - now < 3600000) { setStatus('urgent'); return }
      setStatus('ok')
    }
    tick()
    const interval = setInterval(tick, 30000)
    return () => clearInterval(interval)
  }, [deadline, graceDeadline])

  if (!deadline || status === 'ok') return null

  const config = {
    urgent: { label: 'Due Soon', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    grace: { label: 'Grace Period', className: 'bg-secondary/10 text-secondary border-secondary/30' },
    expired: { label: 'Closed', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  }

  const c = config[status]
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.className}`}>
      {c.label}
    </span>
  )
}
