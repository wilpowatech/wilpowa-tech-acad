import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import Navbar from '@/components/navbar'

const _geist = Geist({ subsets: ["latin"] });
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
  themeColor: '#312e81',
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
      </body>
    </html>
  )
}
