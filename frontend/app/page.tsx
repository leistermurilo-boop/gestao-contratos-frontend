import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8 bg-gray-50">
      {/* ⭐ Logo DUO Governance */}
      <div className="mb-8">
        <Image
          src="/logo.svg"
          alt="DUO Governance"
          width={240}
          height={60}
          className="h-15 w-auto"
          priority
        />
      </div>

      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-brand-navy">Gestão de Contratos</CardTitle>
          <CardDescription>Sistema de gestão multi-tenant com Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full bg-brand-emerald hover:bg-brand-emerald/90">
            Entrar
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      {/* ⭐ Teste de cores da marca */}
      <div className="flex gap-4 mt-8">
        <div className="w-24 h-24 bg-brand-navy rounded-lg flex items-center justify-center text-white text-xs">
          Navy
        </div>
        <div className="w-24 h-24 bg-brand-emerald rounded-lg flex items-center justify-center text-white text-xs">
          Emerald
        </div>
      </div>
    </main>
  )
}
