import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo centralizado acima do card */}
        <div className="flex justify-center">
          <Image
            src="/logo.svg"
            alt="DUO Governance"
            width={120}
            height={120}
            priority
            className="opacity-90"
          />
        </div>

        {children}
      </div>
    </div>
  )
}
