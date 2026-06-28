import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { apiKeys: true },
  })
  return NextResponse.json({ user })
}
