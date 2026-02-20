'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEmpresa } from '@/contexts/empresa-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestEmpresaPage() {
  const { usuario, loading: authLoading } = useAuth()
  const { empresa, loading: empresaLoading, margemAlerta, refreshEmpresa } = useEmpresa()

  if (authLoading || empresaLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Empresa Context - Teste</CardTitle>
          <CardDescription>Dados da empresa do usuário logado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usuario ? (
            <>
              {empresa ? (
                <>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                    <p className="text-sm font-semibold text-blue-800">🏢 Dados da Empresa</p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p><strong>ID:</strong> {empresa.id}</p>
                      <p><strong>Razão Social:</strong> {empresa.razao_social}</p>
                      {empresa.nome_fantasia && (
                        <p><strong>Nome Fantasia:</strong> {empresa.nome_fantasia}</p>
                      )}
                      <p><strong>Criada em:</strong> {new Date(empresa.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                    <p className="text-sm font-semibold text-green-800">⚙️ Configurações</p>
                    <div className="text-xs text-green-700 space-y-1">
                      <p><strong>Margem Alerta:</strong> {margemAlerta}%</p>
                      {empresa.config_json ? (
                        <pre className="text-xs bg-white p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(empresa.config_json, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhuma configuração personalizada</p>
                      )}
                    </div>
                  </div>

                  <Button onClick={refreshEmpresa} variant="outline" className="w-full">
                    Recarregar Dados
                  </Button>
                </>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">❌ Empresa não encontrada</p>
                  <p className="text-xs text-red-600 mt-1">
                    Usuário: {usuario.nome} (empresa_id: {usuario.empresa_id})
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">⚠️ Não autenticado</p>
              <p className="text-xs text-yellow-600 mt-1">Faça login para ver dados da empresa</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
