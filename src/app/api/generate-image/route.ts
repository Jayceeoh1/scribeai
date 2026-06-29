import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1280, height = 720, provider = 'replicate' } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt lipsă' }, { status: 400 })

    console.log('Generate image provider:', provider, 'prompt:', prompt.slice(0, 80))

    // ── GROK IMAGINE ──
    if (provider === 'grok') {
      if (!process.env.GROK_API_KEY) return NextResponse.json({ error: 'GROK_API_KEY lipsă' }, { status: 500 })
      
      const res = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROK_API_KEY}` },
        body: JSON.stringify({
          model: 'grok-imagine-image-quality',
          prompt,
          n: 1,
          size: '1280x720',
        })
      })

      console.log('Grok imagine status:', res.status)
      if (!res.ok) {
        const err = await res.text()
        console.error('Grok imagine error:', err.slice(0, 300))
        return NextResponse.json({ error: `Grok error ${res.status}: ${err.slice(0, 200)}` }, { status: 500 })
      }

      const data = await res.json()
      console.log('Grok imagine response:', JSON.stringify(data).slice(0, 200))
      const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json
      if (!imageUrl) return NextResponse.json({ error: 'Grok nu a returnat imagine' }, { status: 500 })
      
      // Dacă e b64, convertim la data URL
      const finalUrl = imageUrl.startsWith('http') ? imageUrl : `data:image/png;base64,${imageUrl}`
      return NextResponse.json({ imageUrl: finalUrl })
    }

    // ── REPLICATE FLUX ──
    if (!process.env.REPLICATE_API_KEY) return NextResponse.json({ error: 'REPLICATE_API_KEY lipsă — adaugă cheia în Railway Variables' }, { status: 500 })

    const res = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt,
          width,
          height,
          output_format: 'jpg',
          output_quality: 90,
          safety_tolerance: 2,
          prompt_upsampling: true,
        }
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Replicate error ${res.status}: ${err.slice(0, 200)}` }, { status: 500 })
    }

    const prediction = await res.json()
    if (prediction.status === 'succeeded' && prediction.output) {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return NextResponse.json({ imageUrl })
    }

    if (prediction.id) {
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}` }
        })
        const poll = await pollRes.json()
        if (poll.status === 'succeeded' && poll.output) {
          const imageUrl = Array.isArray(poll.output) ? poll.output[0] : poll.output
          return NextResponse.json({ imageUrl })
        }
        if (poll.status === 'failed') return NextResponse.json({ error: poll.error || 'Generare eșuată' }, { status: 500 })
      }
      return NextResponse.json({ error: 'Timeout' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Răspuns invalid' }, { status: 500 })
  } catch(err: any) {
    console.error('Generate image error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
