import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { images, hookText, niche, style } = await req.json()
    if (!images?.length) return NextResponse.json({ error: 'Nicio imagine' }, { status: 400 })

    const textPrompt = `Analizează ${images.length > 1 ? 'aceste thumbnail-uri YouTube' : 'acest thumbnail YouTube'} și creează un prompt detaliat pentru Flux AI image generator.

Context:
- Text hook dorit: "${hookText || 'fără text specific'}"
- Nișă: ${niche || 'General'}
- Stil dorit: ${style || 'Similar cu imaginea'}

Răspunde DOAR cu JSON valid fără markdown:
{
  "fluxPrompt": "prompt detaliat în engleză pentru Flux AI, no text, no watermark, photorealistic, 16:9 ratio",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "suggestedTextColor": "#hex",
  "style": "descriere scurtă stil în română",
  "composition": "descriere scurtă compoziție în română",
  "tips": "sfat scurt pentru a replica stilul"
}`

    let responseText = ''

    // Încearcă Claude Vision (preferat)
    if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const imageContent = images.map((img: string) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.includes('png') ? 'image/png' as const : 'image/jpeg' as const,
          data: img.split(',')[1],
        }
      }))

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [...imageContent, { type: 'text', text: textPrompt }]
        }]
      })
      responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    } else if (process.env.GROK_API_KEY) {
      // Fallback Grok Vision
      const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROK_API_KEY}` },
        body: JSON.stringify({
          model: 'grok-2-vision-latest',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              ...images.map((img: string) => ({ type: 'image_url', image_url: { url: img } })),
              { type: 'text', text: textPrompt }
            ]
          }]
        })
      })
      const grokData = await grokRes.json()
      responseText = grokData?.choices?.[0]?.message?.content ?? ''
    } else {
      return NextResponse.json({ error: 'Nicio cheie API disponibilă' }, { status: 500 })
    }

    // Parse JSON din răspuns
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Nu am găsit JSON în răspuns')
    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json(data)

  } catch(err: any) {
    console.error('Analyze thumbnail error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
