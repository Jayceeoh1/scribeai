import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  const history = await prisma.history.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ history })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  const { videoUrl, videoTitle, sourceLang, targetLang, mode } = await req.json()
  const entry = await prisma.history.create({
    data: { userId: session.user.id, videoUrl, videoTitle, sourceLang, targetLang, mode },
  })
  await prisma.user.update({ where: { id: session.user.id }, data: { videosUsed: { increment: 1 } } })
  return NextResponse.json({ entry })
}
