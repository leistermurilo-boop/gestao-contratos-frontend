'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const { user, usuario, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Auth Context - Teste</CardTitle>
          <CardDescription>Verificação de autenticação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                <p className="text-sm font-semibold text-green-800">✅ Autenticado</p>
                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                </div>
              </div>

              {usuario && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                  <p className="text-sm font-semibold text-blue-800">👤 Dados do Usuário</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Nome:</strong> {usuario.nome}</p>
                    <p><strong>Perfil:</strong> {usuario.perfil}</p>
                    <p><strong>Empresa ID:</strong> {usuario.empresa_id}</p>
                    <p><strong>Ativo:</strong> {usuario.ativo ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              )}

              <Button onClick={signOut} variant="destructive" className="w-full">
                Sair
              </Button>
            </>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">⚠️ Não autenticado</p>
              <p className="text-xs text-yellow-600 mt-1">Faça login para testar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
