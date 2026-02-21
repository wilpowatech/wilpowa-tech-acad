'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Certificate {
  id: string
  certificate_number: string
  final_score: number
  issued_at: string
  status: string
  course: {
    title: string
  }
}

export default function CertificatesPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certLoading, setCertLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile?.role === 'student') {
      fetchCertificates()
    }
  }, [user, profile])

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(
          `
          id,
          certificate_number,
          final_score,
          issued_at,
          status,
          course:courses(title)
        `
        )
        .eq('student_id', user?.id)
        .eq('status', 'issued')
        .order('issued_at', { ascending: false })

      if (error) throw error
      setCertificates(data || [])
    } catch (err) {
      console.error('Error fetching certificates:', err)
    } finally {
      setCertLoading(false)
    }
  }

  if (loading || certLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading certificates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Certificates</h1>
            <p className="text-muted-foreground mt-1">Your earned course completion certificates</p>
          </div>
          <Link href="/student/dashboard">
            <Button variant="outline" className="border-border">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {certificates.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t earned any certificates yet. Complete courses with a passing grade to earn certificates.
            </p>
            <Link href="/student/dashboard">
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">Continue Learning</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function CertificateCard({ certificate }: { certificate: Certificate }) {
  const handleDownload = async () => {
    const element = document.createElement('a')
    element.href = `/api/certificate/${certificate.id}`
    element.download = `Certificate_${certificate.certificate_number}.pdf`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleView = () => {
    window.open(`/certificate/${certificate.id}`, '_blank')
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-secondary/50 transition shadow-sm">
      <div className="bg-primary border-b border-border p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-4xl font-bold text-primary-foreground mb-2">Certificate</div>
          <div className="text-primary-foreground/80 text-lg">{certificate.course.title}</div>
          <div className="text-primary-foreground/60 text-sm mt-2">Score: {certificate.final_score}%</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm">Certificate Number</p>
          <p className="text-foreground font-mono text-lg">{certificate.certificate_number}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Issued Date</p>
            <p className="text-foreground font-semibold">
              {new Date(certificate.issued_at).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-muted border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-sm">Final Score</p>
            <p className="text-emerald-600 font-semibold">{certificate.final_score}%</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleView} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            View Certificate
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1 border-border">
            Download PDF
          </Button>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
          <p className="text-emerald-600 text-sm">Verified Certificate</p>
        </div>
      </div>
    </div>
  )
}
