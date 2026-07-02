import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { prompt, provider = 'replicate', faceImage } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Prompt lipsă' }, { status: 400 })

    console.log('Generate image provider:', provider)

    // ── PULID — face reference (Flux PuLID pe Replicate) ──
    if (provider === 'pulid') {
      if (!process.env.REPLICATE_API_KEY) return NextResponse.json({ error: 'REPLICATE_API_KEY lipsă' }, { status: 500 })
      if (!faceImage) return NextResponse.json({ error: 'Trebuie să încarci o poză cu fața ta pentru PuLID' }, { status: 400 })

      // Trimitem poza ca data URI direct
      const pulidRes = await fetch('https://api.replicate.com/v1/models/bytedance/flux-pulid/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: {
            main_face_image: faceImage,
            prompt: `${prompt}, YouTube thumbnail style, 16:9 aspect ratio, high contrast, professional photography`,
            negative_prompt: 'bad quality, worst quality, blurry, low resolution, watermark, text, ugly, deformed',
            width: 1280,
            height: 720,
            num_outputs: 1,
            id_weight: 1.0,
            start_step: 4,
            num_inference_steps: 20,
          }
        })
      })

      if (!pulidRes.ok) {
        const err = await pulidRes.text()
        console.error('PuLID error:', err.slice(0, 300))
        return NextResponse.json({ error: `PuLID error: ${err.slice(0, 200)}` }, { status: 500 })
      }

      const pulidData = await pulidRes.json()
      console.log('PuLID response:', JSON.stringify(pulidData).slice(0, 300))

      // Replicate returnează array de URL-uri
      const imageUrl = Array.isArray(pulidData.output) ? pulidData.output[0] : pulidData.output
      if (!imageUrl) return NextResponse.json({ error: 'PuLID nu a returnat imagine' }, { status: 500 })

      return NextResponse.json({ imageUrl })
    }

    // ── GROK IMAGINE ──
    if (provider === 'grok') {
      if (!process.env.GROK_API_KEY) return NextResponse.json({ error: 'GROK_API_KEY lipsă' }, { status: 500 })
      
      const res = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROK_API_KEY}` },
        body: JSON.stringify({
          model: 'grok-imagine-image-quality',
          prompt: prompt,
          n: 1,
        })
      })

      console.log('Grok imagine status:', res.status)
      if (!res.ok) {
        const err = await res.text()
        console.error('Grok imagine error:', err.slice(0, 300))
        return NextResponse.json({ error: `Grok error ${res.status}: ${err.slice(0, 200)}` }, { status: 500 })
      }

      const data = await res.json()
      console.log('Grok imagine response:', JSON.stringify(data).slice(0, 300))
      
      const imageUrl = data?.data?.[0]?.url
      const b64 = data?.data?.[0]?.b64_json
      
      if (imageUrl) return NextResponse.json({ imageUrl })
      if (b64) return NextResponse.json({ imageUrl: `data:image/png;base64,${b64}` })
      
      return NextResponse.json({ error: 'Grok nu a returnat imagine' }, { status: 500 })
    }

    // ── REPLICATE FLUX ──
    if (!process.env.REPLICATE_API_KEY) return NextResponse.json({ error: 'REPLICATE_API_KEY lipsă' }, { status: 500 })

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
          width: 1344,   // dimensiuni native Flux 16:9
          height: 768,
          output_format: 'jpg',
          output_quality: 95,
          safety_tolerance: 2,
          prompt_upsampling: true,
          aspect_ratio: '16:9',
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
