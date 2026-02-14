import ResetPassword from '@/components/auth/reset-password'

export const metadata = {
  title: 'Reset Password | DevCourse',
  description: 'Reset your DevCourse account password',
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <ResetPassword />
      </div>
    </div>
  )
}
