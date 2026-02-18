import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "DUO Governance - Gestão de Contratos",
  description: "Sistema de gestão de contratos multi-tenant",
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
