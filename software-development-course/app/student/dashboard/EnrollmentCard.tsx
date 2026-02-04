'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Course {
  id: string
  title: string
  description: string
}

interface Enrollment {
  id: string
  course: Course
  start_date: string
  status: string
  student_id: string
}

export default function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const [timeRemaining, setTimeRemaining] = useState<{
    weeks: number
    days: number
    hours: number
    minutes: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      // Course is 12 weeks, so calculate end date from start date
      const startDate = new Date(enrollment.start_date).getTime()
      const endDate = startDate + 12 * 7 * 24 * 60 * 60 * 1000 // 12 weeks in milliseconds
      const difference = endDate - now

      if (difference > 0) {
        const weeks = Math.floor(difference / (1000 * 60 * 60 * 24 * 7))
        const days = Math.floor((difference / (1000 * 60 * 60 * 24)) % 7)
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)

        setTimeRemaining({ weeks, days, hours, minutes })
      } else {
        setTimeRemaining({ weeks: 0, days: 0, hours: 0, minutes: 0 })
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000)

    return () => clearInterval(interval)
  }, [enrollment.start_date])

  const course = enrollment.course as Course

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">{course.title}</h2>
        <p className="text-muted-foreground mb-6">{course.description}</p>

        {/* Countdown Timer */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-4">Time Remaining in Course</p>
          {timeRemaining ? (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{timeRemaining.weeks}</div>
                <p className="text-muted-foreground text-sm">Weeks</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{timeRemaining.days}</div>
                <p className="text-muted-foreground text-sm">Days</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{timeRemaining.hours}</div>
                <p className="text-muted-foreground text-sm">Hours</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{timeRemaining.minutes}</div>
                <p className="text-muted-foreground text-sm">Minutes</p>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Loading...</div>
          )}
        </div>

        {/* Progress and Actions */}
        <div className="flex gap-4">
          <Link href={`/student/course/${enrollment.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              Continue Course
            </Button>
          </Link>
          <Link href={`/student/progress/${enrollment.id}`} className="flex-1">
            <Button variant="outline" className="w-full border-border bg-transparent">
              View Progress
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
