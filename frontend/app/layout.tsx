import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { EmpresaProvider } from "@/contexts/empresa-context"

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
      <body className="antialiased">
        <AuthProvider>
          <EmpresaProvider>
            {children}
          </EmpresaProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
