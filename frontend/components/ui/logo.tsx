interface LogoProps {
  className?: string
  dark?: boolean
}

export function Logo({ className = 'h-12 w-auto', dark = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Torre Esquerda - Azul Petróleo/Navy */}
        <path
          d="M22 35 L48 25 L48 85 L22 75 Z"
          fill="#0F172A"
          stroke={dark ? 'rgba(255,255,255,0.15)' : 'none'}
          strokeWidth={dark ? 1.5 : 0}
        />
        {/* Torre Direita - Verde Esmeralda */}
        <path
          d="M52 15 L78 5 L78 75 L52 85 Z"
          fill="#10B981"
        />
      </svg>
      <span
        className={`font-black text-xl tracking-tighter ${
          dark ? 'text-white' : 'text-zinc-900'
        }`}
      >
        DUO{' '}
        <span
          className={`font-light ${dark ? 'text-white/50' : 'text-zinc-400'}`}
        >
          Governance
        </span>
      </span>
    </div>
  )
}
