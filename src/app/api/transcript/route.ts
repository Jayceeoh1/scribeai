import { NextRequest, NextResponse } from 'next/server'

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

async function getTranscriptSupadata(videoId: string) {
  const apiKey = process.env.SUPADATA_API_KEY
  if (!apiKey) throw new Error('SUPADATA_API_KEY lipsă')
  
  const res = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
    headers: { 'x-api-key': apiKey }
  })
  if (!res.ok) throw new Error(`Supadata error: ${res.status}`)
  const data = await res.json()
  return {
    text: data.content || '',
    lang: data.lang || 'auto'
  }
}

async function getTranscriptDirect(videoId: string) {
  // Fallback: youtube-transcript
  const { YoutubeTranscript } = await import('youtube-transcript')
  const entries = await YoutubeTranscript.fetchTranscript(videoId)
  const text = entries.map((e: any) => e.text).join(' ').replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim()
  return { text, lang: 'auto' }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL lipsă' }, { status: 400 })

    const videoId = extractVideoId(url)
    if (!videoId) return NextResponse.json({ error: 'URL YouTube invalid' }, { status: 400 })

    const title = await getVideoTitle(videoId)

    let rawText = ''
    let detectedLang = 'auto'

    // Încearcă Supadata mai întâi (merge pe cloud)
    try {
      const result = await getTranscriptSupadata(videoId)
      rawText = result.text
      detectedLang = result.lang
    } catch {
      // Fallback la youtube-transcript direct
      try {
        const result = await getTranscriptDirect(videoId)
        rawText = result.text
        detectedLang = result.lang
      } catch (err: any) {
        return NextResponse.json({
          error: 'Acest video nu are subtitrări disponibile sau sunt dezactivate. Încearcă alt video.'
        }, { status: 400 })
      }
    }

    if (!rawText) {
      return NextResponse.json({ error: 'Transcriptul este gol.' }, { status: 400 })
    }

    return NextResponse.json({ videoId, title, rawText, detectedLang })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Eroare necunoscută'
    return NextResponse.json({ error: `Eroare: ${msg}` }, { status: 500 })
  }
}
