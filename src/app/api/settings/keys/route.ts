import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  if (session.user.plan === 'FREE') return NextResponse.json({ error: 'Plan Pro necesar' }, { status: 403 })
  const keys = await prisma.apiKeys.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  if (session.user.plan === 'FREE') return NextResponse.json({ error: 'Plan Pro necesar' }, { status: 403 })
  const data = await req.json()
  const keys = await prisma.apiKeys.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  })
  return NextResponse.json({ keys })
}
