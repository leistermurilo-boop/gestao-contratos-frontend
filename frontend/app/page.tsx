import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function Home() {
  const supabase = await createClient()

  // Testar conexão com query simples
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id, nome')
    .limit(1)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Teste de Conexão Supabase</CardTitle>
          <CardDescription>Sistema de Gestão de Contratos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-semibold">❌ Erro na conexão:</p>
              <p className="text-xs text-red-600 mt-1">{error.message}</p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-semibold">✅ Conexão estabelecida!</p>
              {empresas && empresas.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Empresa encontrada: {empresas[0].nome}
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>📡 URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            <p>🔑 Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
