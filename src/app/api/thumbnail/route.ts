import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  console.log('Thumbnail API called')
  try {
    const { script, videoTitle, niche, style } = await req.json()
    console.log('Thumbnail for:', videoTitle)
    
    if (!script && !videoTitle) return NextResponse.json({ error: 'Date insuficiente' }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY lipsă' }, { status: 500 })

    const prompt = `Ești un expert în design de thumbnail-uri YouTube. Creează 3 concepte de thumbnail ultra-clickable.

VIDEO: "${videoTitle}"
NIȘĂ: ${niche || 'General'}
STIL: ${style || 'Energic'}
SCRIPT: ${(script || '').slice(0, 1500)}

Răspunde DOAR cu JSON valid, fără markdown:
{
  "thumbnails": [
    {
      "concept": "Shock Value",
      "hook": "TEXT MARE (max 5 cuvinte CAPS)",
      "subtext": "text secundar",
      "background": "descriere fundal",
      "foreground": "ce apare în față",
      "colorPalette": ["#hex1", "#hex2", "#hex3"],
      "font": "Impact Bold",
      "emotion": "Curiozitate",
      "ctaElement": "săgeată roșie",
      "whyItWorks": "de ce funcționează",
      "adobePrompt": "prompt pentru Midjourney în engleză"
    }
  ],
  "generalTips": ["sfat 1", "sfat 2", "sfat 3"],
  "avoidMistakes": ["greșeală 1", "greșeală 2"]
}`

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    console.log('Thumbnail response length:', text.length)
    
    const clean = text.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim()
    const data = JSON.parse(clean)
    return NextResponse.json(data)
    
  } catch(err: any) {
    console.error('Thumbnail error:', err.message)
    return NextResponse.json({ error: err.message || 'Eroare necunoscută' }, { status: 500 })
  }
}
