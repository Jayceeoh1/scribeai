import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { YoutubeTranscript } from 'youtube-transcript'

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

    // Încearcă mai multe limbi
    const langs = ['en', 'ro', 'fr', 'de', 'es', 'it', 'pt', 'ru', 'auto']
    let rawText = ''
    let detectedLang = 'auto'

    // Prima încercare fără limbă specificată
    try {
      const entries = await YoutubeTranscript.fetchTranscript(videoId)
      rawText = entries.map((e: any) => e.text).join(' ').replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim()
      detectedLang = 'auto'
    } catch {
      // Încearcă cu limbi specifice
      for (const lang of langs.slice(0, -1)) {
        try {
          const entries = await YoutubeTranscript.fetchTranscript(videoId, { lang })
          rawText = entries.map((e: any) => e.text).join(' ').replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim()
          detectedLang = lang
          break
        } catch { continue }
      }
    }

    if (!rawText) {
      return NextResponse.json({
        error: 'Acest video nu are subtitrări disponibile. Încearcă un alt video cu CC activat.'
      }, { status: 400 })
    }

    return NextResponse.json({ videoId, title, rawText, detectedLang })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Eroare necunoscută'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
