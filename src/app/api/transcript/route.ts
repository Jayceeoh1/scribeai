import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`)
    const data = await res.json()
    return data.title ?? `Video ${videoId}`
  } catch { return `Video ${videoId}` }
}

async function getTranscriptSupadata(videoId: string): Promise<{text: string, lang: string}> {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('SUPADATA_API_KEY lipsă')
  
  const res = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
    headers: { 'x-api-key': apiKey }
  })
  
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Supadata ${res.status}: ${errText}`)
  }
  
  const data = await res.json()
  
  // Log pentru debugging
  console.log('Supadata response keys:', Object.keys(data))
  console.log('Supadata data sample:', JSON.stringify(data).slice(0, 300))
  
  // Supadata v1 returnează { content: string, lang: string }
  // dar poate returna și alte formate
  let text = ''
  
  if (typeof data.content === 'string' && data.content.length > 0) {
    text = data.content
  } else if (typeof data.text === 'string' && data.text.length > 0) {
    text = data.text
  } else if (typeof data.transcript === 'string' && data.transcript.length > 0) {
    text = data.transcript
  } else if (Array.isArray(data.content)) {
    text = data.content.map((e: any) => e.text || e).join(' ')
  } else if (Array.isArray(data)) {
    text = data.map((e: any) => e.text || e).join(' ')
  } else if (data.segments && Array.isArray(data.segments)) {
    text = data.segments.map((e: any) => e.text || e).join(' ')
  }
  
  const lang = data.lang || data.language || data.availableLanguages?.[0] || 'auto'
  
  return { text, lang }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (session?.user?.id) {
      const plan = (session.user as any).plan || 'FREE'
      const isPro = plan === 'PRO' || plan === 'ENTERPRISE'
      if (!isPro) {
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { videosUsed: true } })
        if (user && user.videosUsed >= 3) {
          return NextResponse.json({
            error: 'Ai atins limita de 3 video-uri gratuite pe lună. Upgradează la Pro pentru video-uri nelimitate.'
          }, { status: 403 })
        }
      }
    }

    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL lipsă' }, { status: 400 })

    const videoId = extractVideoId(url)
    if (!videoId) return NextResponse.json({ error: 'URL YouTube invalid' }, { status: 400 })

    const title = await getVideoTitle(videoId)

    const result = await getTranscriptSupadata(videoId)
    
    if (!result.text || result.text.length < 10) {
      return NextResponse.json({
        error: `Transcriptul este gol sau prea scurt. Răspuns Supadata invalid.`
      }, { status: 400 })
    }

    return NextResponse.json({ 
      videoId, 
      title, 
      rawText: result.text, 
      detectedLang: result.lang 
    })
    
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Eroare necunoscută'
    console.error('Transcript error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
