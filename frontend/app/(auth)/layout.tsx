export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo DUO — Esquerda Navy + Direita Verde Esmeralda */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1">
            <div className="w-2.5 h-10 bg-[#0F172A] rounded-sm" />
            <div className="w-2.5 h-10 bg-[#10B981] rounded-sm" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">DUO</h1>
            <p className="text-sm text-slate-500">Governance</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
