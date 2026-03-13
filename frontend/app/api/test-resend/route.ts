import { NextResponse } from 'next/server'

// ENDPOINT DESATIVADO — apenas para teste de integração, uso único.
// Substituído para evitar envio repetido de emails.
export async function GET() {
  return NextResponse.json(
    { disabled: true, message: 'Endpoint de teste desativado. Integração Resend validada com sucesso em 2026-03-11.' },
    { status: 200 }
  )
}

export async function POST() {
  return NextResponse.json(
    { disabled: true, message: 'Endpoint de teste desativado. Integração Resend validada com sucesso em 2026-03-11.' },
    { status: 200 }
  )
}
