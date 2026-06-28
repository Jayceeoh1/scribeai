import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const videoId = searchParams.get('videoId')
  if (!videoId) return NextResponse.json({ error: 'videoId lipsă' }, { status: 400 })

  try {
    // oEmbed pentru titlu și canal
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`
    )
    const oembed = await oembedRes.json()

    // YouTube page pentru durată (fără API key)
    let duration = ''
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      const html = await pageRes.text()
      // Extrage durata din meta tag
      const durationMatch = html.match(/"lengthSeconds":"(\d+)"/)
      if (durationMatch) {
        const secs = parseInt(durationMatch[1])
        const h = Math.floor(secs / 3600)
        const m = Math.floor((secs % 3600) / 60)
        const s = secs % 60
        duration = h > 0
          ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
          : `${m}:${String(s).padStart(2,'0')}`
      }
      // Extrage numărul de vizualizări
    } catch {}

    return NextResponse.json({
      title: oembed.title || '',
      channel: oembed.author_name || '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailMq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      duration,
      videoId,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Nu am putut obține informații video' }, { status: 500 })
  }
}
