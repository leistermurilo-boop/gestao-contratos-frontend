import { Logo } from '@/components/ui/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo className="h-14 w-auto" />
        </div>

        {children}
      </div>
    </div>
  )
}
