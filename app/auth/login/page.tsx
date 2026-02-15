import { Login } from '@/components/auth/login'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Wilpowa Tech Academy',
  description: 'Sign in to your Wilpowa Tech Academy account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Login />
    </div>
  )
}
