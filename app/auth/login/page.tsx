import { Login } from '@/components/auth/login'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - DevCourse Platform',
  description: 'Login to your course account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Login />
    </div>
  )
}
