import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { images, hookText, niche, style } = await req.json()
    if (!images?.length) return NextResponse.json({ error: 'Nicio imagine' }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key lipsă' }, { status: 500 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const imageContent = images.map((img: string) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.startsWith('data:image/png') ? 'image/png' as const : 'image/jpeg' as const,
        data: img.split(',')[1],
      }
    }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `Analizează ${images.length > 1 ? 'aceste thumbnail-uri YouTube' : 'acest thumbnail YouTube'} și creează un prompt detaliat pentru Flux AI image generator.

Context:
- Text hook dorit: "${hookText || 'fără text specific'}"
- Nișă: ${niche || 'General'}
- Stil dorit: ${style || 'Similar cu imaginea'}

Analizează:
1. Compoziția și layout-ul
2. Paleta de culori dominante
3. Stilul de iluminare și atmosfera
4. Elementele vizuale principale (oameni, obiecte, background)
5. Mood-ul și emoția transmisă

Răspunde DOAR cu JSON:
{
  "fluxPrompt": "prompt detaliat în engleză pentru Flux AI, fără text, fără watermark, photorealistic/3D render/cinematic (alege ce se potrivește), 16:9 ratio, no text, no watermark, professional YouTube thumbnail background",
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "suggestedTextColor": "#hex",
  "style": "descriere scurtă a stilului în română",
  "composition": "descriere scurtă a compoziției în română",
  "tips": "un sfat scurt pentru a replica stilul"
}`
          }
        ]
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(clean)
    return NextResponse.json(data)

  } catch(err: any) {
    console.error('Analyze thumbnail error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
