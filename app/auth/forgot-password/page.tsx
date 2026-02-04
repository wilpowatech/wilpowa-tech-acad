import ForgotPassword from '@/components/auth/forgot-password'

export const metadata = {
  title: 'Forgot Password | DevCourse',
  description: 'Reset your DevCourse account password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <ForgotPassword />
      </div>
    </div>
  )
}
