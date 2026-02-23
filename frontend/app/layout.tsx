import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { EmpresaProvider } from "@/contexts/empresa-context"
import { Toaster } from "react-hot-toast"

export const metadata: Metadata = {
  title: "DUO Governance - Gestão de Contratos",
  description: "Sistema de gestão de contratos multi-tenant",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
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
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
