import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

import './globals.css'
import Navbar from '@/components/navbar'

const _inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Wilpowa Tech Academy - Professional Software Development Bootcamp',
  description: 'Master full-stack development in 12 weeks with real-world projects, hands-on labs, and expert instruction.',
  keywords: ['bootcamp', 'software development', 'education', 'coding', 'learning platform'],
  authors: [{ name: 'Wilpowa Tech Academy' }],
  openGraph: {
    title: 'Wilpowa Tech Academy - Professional Software Development Bootcamp',
    description: 'Master full-stack development in 12 weeks',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1f36',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Navbar />
        <main>{children}</main>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
