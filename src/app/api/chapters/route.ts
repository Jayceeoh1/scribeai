import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { transcript, videoTitle, duration } = await req.json()
  if (!transcript) return NextResponse.json({ error: 'Transcript lipsă' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'API key lipsă' }, { status: 500 })

  const prompt = `Ești un expert în structurarea conținutului video pentru YouTube. Analizează acest transcript și creează chaptering-ul perfect.

VIDEO: "${videoTitle}"
DURATĂ ESTIMATĂ: ${duration || 'necunoscută'}

TRANSCRIPT:
${transcript.slice(0, 8000)}

Creează chaptering-ul în EXACT acest format JSON (fără alte explicații, doar JSON valid):

{
  "chapters": [
    {
      "timestamp": "0:00",
      "title": "Titlu capitol scurt și captivant",
      "emoji": "🎯",
      "description": "Ce acoperă acest capitol în 1-2 propoziții",
      "keyPoints": ["punct cheie 1", "punct cheie 2", "punct cheie 3"]
    }
  ],
  "summary": "Rezumat general al videoclipului în 2-3 propoziții",
  "totalChapters": 5,
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

REGULI:
- Primul capitol ÎNTOTDEAUNA la 0:00
- Minimum 4, maximum 10 capitole
- Titluri scurte (max 50 caractere) și captivante
- Timestamps realiste bazate pe lungimea transcriptului
- Emoji relevant pentru fiecare capitol
- Răspunde DOAR cu JSON valid, fără \`\`\`json sau alte formatări`

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
    return NextResponse.json({ error: 'Eroare parsare răspuns AI', raw: text }, { status: 500 })
  }
}
