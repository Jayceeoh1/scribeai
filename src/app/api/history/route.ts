import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  
  const history = await prisma.history.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ history })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })
  
  const { 
    videoUrl, videoTitle, videoChannel, videoDuration, thumbnail,
    sourceLang, targetLang, mode, scriptText, 
    trelloCardUrl, aiProvider, aiModel 
  } = await req.json()
  
  const entry = await prisma.history.create({
    data: { 
      userId: session.user.id, 
      videoUrl, 
      videoTitle, 
      videoChannel: videoChannel || null,
      videoDuration: videoDuration || null,
      thumbnail: thumbnail || null,
      sourceLang, 
      targetLang, 
      mode,
      scriptText: scriptText || null,
      trelloCardUrl: trelloCardUrl || null,
      trelloDate: trelloCardUrl ? new Date() : null,
      aiProvider: aiProvider || null,
      aiModel: aiModel || null,
    },
  })
  
  await prisma.user.update({ 
    where: { id: session.user.id }, 
    data: { videosUsed: { increment: 1 } } 
  })
  
  return NextResponse.json({ entry })
}
