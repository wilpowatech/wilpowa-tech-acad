import ForgotPassword from '@/components/auth/forgot-password'

export const metadata = {
  title: 'Forgot Password | DevCourse',
  description: 'Reset your DevCourse account password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <ForgotPassword />
      </div>
    </div>
  )
}
