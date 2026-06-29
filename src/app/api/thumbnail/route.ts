import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { script, videoTitle, niche, style } = await req.json()
  if (!script && !videoTitle) return NextResponse.json({ error: 'Date insuficiente' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key lipsă' }, { status: 500 })

  const prompt = `Ești un expert în design de thumbnail-uri YouTube cu milioane de vizualizări generate. Analizează conținutul și creează concepte de thumbnail ultra-clickable.

VIDEO: "${videoTitle}"
NIȘĂ: ${niche || 'General'}
STIL: ${style || 'Energic'}
SCRIPT (primele 500 cuvinte): ${(script || '').slice(0, 1500)}

Creează 3 concepte de thumbnail diferite în format JSON:

{
  "thumbnails": [
    {
      "concept": "Nume concept (ex: Shock Value, Before/After, Face Reaction)",
      "hook": "Textul principal pe thumbnail (max 5 cuvinte, CAPS)",
      "subtext": "Text secundar opțional (max 3 cuvinte)",
      "background": "Descriere fundal: culori, gradient, imagine sugerată",
      "foreground": "Ce apare în față: persoană/obiect/grafic + poziție",
      "colorPalette": ["#culoare1", "#culoare2", "#culoare3"],
      "font": "Tipul de font recomandat (Bold Impact / Montserrat Bold / etc)",
      "emotion": "Emoția pe care o transmite: Curiozitate / Șoc / FOMO / etc",
      "ctaElement": "Element vizual de call-to-action: săgeată / cerc roșu / highlight",
      "whyItWorks": "De ce funcționează acest concept (1 propoziție)",
      "adobePrompt": "Prompt pentru AI image generator: descriere detaliată în engleză"
    }
  ],
  "generalTips": ["sfat 1", "sfat 2", "sfat 3"],
  "avoidMistakes": ["greșeală 1", "greșeală 2"]
}

Răspunde DOAR cu JSON valid.`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  try {
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const data = JSON.parse(clean)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Eroare parsare', raw: text }, { status: 500 })
  }
}
