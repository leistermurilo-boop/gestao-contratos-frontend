interface LogoProps {
  className?: string
  dark?: boolean
  svgBg?: boolean
}

export function Logo({ className = 'h-12 w-auto', dark = false, svgBg = false }: LogoProps) {
  const svgEl = (
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
        stroke={dark && !svgBg ? 'rgba(255,255,255,0.15)' : 'none'}
        strokeWidth={dark && !svgBg ? 1.5 : 0}
      />
      {/* Torre Direita - Verde Esmeralda */}
      <path
        d="M52 15 L78 5 L78 75 L52 85 Z"
        fill="#10B981"
      />
    </svg>
  )

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {svgBg ? (
        <div className="flex aspect-square h-full items-center justify-center rounded-full bg-white p-1.5 shadow-sm">
          {svgEl}
        </div>
      ) : svgEl}
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
