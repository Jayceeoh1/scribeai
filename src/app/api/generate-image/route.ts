import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1280, height = 720 } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt lipsă' }, { status: 400 })
    if (!process.env.REPLICATE_API_KEY) return NextResponse.json({ error: 'REPLICATE_API_KEY lipsă — adaugă cheia în Railway Variables' }, { status: 500 })

    console.log('Generating image with Replicate Flux:', prompt.slice(0, 80))

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
      console.error('Replicate error:', res.status, err.slice(0, 300))
      return NextResponse.json({ error: `Replicate error ${res.status}: ${err.slice(0, 200)}` }, { status: 500 })
    }

    const prediction = await res.json()
    console.log('Prediction status:', prediction.status, 'id:', prediction.id)

    // Dacă e gata direct
    if (prediction.status === 'succeeded' && prediction.output) {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return NextResponse.json({ imageUrl })
    }

    // Polling
    if (prediction.id) {
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}` }
        })
        const poll = await pollRes.json()
        console.log(`Poll ${i+1}: ${poll.status}`)
        if (poll.status === 'succeeded' && poll.output) {
          const imageUrl = Array.isArray(poll.output) ? poll.output[0] : poll.output
          return NextResponse.json({ imageUrl })
        }
        if (poll.status === 'failed') {
          return NextResponse.json({ error: poll.error || 'Generare eșuată' }, { status: 500 })
        }
      }
      return NextResponse.json({ error: 'Timeout — încearcă din nou' }, { status: 500 })
    }

    return NextResponse.json({ error: 'Răspuns invalid de la Replicate' }, { status: 500 })
  } catch(err: any) {
    console.error('Generate image error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
