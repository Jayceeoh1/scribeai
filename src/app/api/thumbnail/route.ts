import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  console.log('Thumbnail API called')
  try {
    const { script, videoTitle, niche, style, generateImage } = await req.json()
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY lipsă' }, { status: 500 })
    }

    // Step 1: Claude generează conceptele
    const conceptPrompt = `Ești un expert în design de thumbnail-uri YouTube virale. Analizează și creează 3 concepte.

VIDEO: "${videoTitle}"
NIȘĂ: ${niche || 'General'}
STIL: ${style || 'Energic'}
SCRIPT: ${(script || '').slice(0, 1500)}

Răspunde DOAR cu JSON valid:
{
  "thumbnails": [
    {
      "concept": "Shock Value",
      "hook": "TEXT MARE MAX 5 CUVINTE",
      "subtext": "text secundar optional",
      "background": "descriere fundal detaliată",
      "foreground": "ce apare în față",
      "colorPalette": ["#FF0000", "#FFFFFF", "#000000"],
      "font": "Impact",
      "emotion": "Curiozitate",
      "ctaElement": "săgeată roșie",
      "whyItWorks": "de ce funcționează acest concept",
      "imagePrompt": "Professional YouTube thumbnail, [hook text] in large bold white text with black outline, [background description], [foreground element], high contrast, vibrant colors, 16:9 ratio, photorealistic, professional photography, dramatic lighting"
    }
  ],
  "generalTips": ["sfat 1", "sfat 2", "sfat 3"],
  "avoidMistakes": ["greșeală 1", "greșeală 2"]
}`

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: conceptPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const conceptData = JSON.parse(clean)
    console.log('Concepts generated:', conceptData.thumbnails?.length)

    // Step 2: Dacă are cheie Replicate, generează imaginile reale
    if (process.env.REPLICATE_API_KEY && generateImage !== false) {
      const thumbnailsWithImages = await Promise.all(
        (conceptData.thumbnails || []).map(async (t: any, i: number) => {
          try {
            console.log(`Generating image ${i+1} with Replicate...`)
            const replicateRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait'
              },
              body: JSON.stringify({
                input: {
                  prompt: t.imagePrompt,
                  width: 1280,
                  height: 720,
                  output_format: 'jpg',
                  output_quality: 90,
                  safety_tolerance: 2,
                }
              })
            })

            if (!replicateRes.ok) {
              const err = await replicateRes.text()
              console.error(`Replicate error ${i+1}:`, err.slice(0, 200))
              return { ...t, imageUrl: null, imageError: err.slice(0, 100) }
            }

            const prediction = await replicateRes.json()
            console.log(`Image ${i+1} status:`, prediction.status)
            
            // Dacă e completed direct
            if (prediction.status === 'succeeded' && prediction.output) {
              const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
              return { ...t, imageUrl }
            }

            // Polling dacă nu e gata
            if (prediction.id && prediction.status !== 'failed') {
              let attempts = 0
              while (attempts < 30) {
                await new Promise(r => setTimeout(r, 2000))
                const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                  headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}` }
                })
                const poll = await pollRes.json()
                if (poll.status === 'succeeded' && poll.output) {
                  const imageUrl = Array.isArray(poll.output) ? poll.output[0] : poll.output
                  return { ...t, imageUrl }
                }
                if (poll.status === 'failed') break
                attempts++
              }
            }

            return { ...t, imageUrl: null }
          } catch(e: any) {
            console.error(`Image ${i+1} error:`, e.message)
            return { ...t, imageUrl: null, imageError: e.message }
          }
        })
      )
      conceptData.thumbnails = thumbnailsWithImages
      conceptData.imagesGenerated = true
    }

    return NextResponse.json(conceptData)

  } catch(err: any) {
    console.error('Thumbnail route error:', err.message)
    return NextResponse.json({ error: err.message || 'Eroare necunoscută' }, { status: 500 })
  }
}
