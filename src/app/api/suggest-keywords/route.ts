import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Generează 7 keywords SEO pentru un video YouTube cu titlul: "${title}". Răspunde DOAR cu keywords separate prin virgulă, fără explicații, fără punct final.`
      }]
    })
    const keywords = (msg.content[0] as any).text?.trim() || ''
    return NextResponse.json({ keywords })
  } catch (e: any) {
    console.error('[suggest-keywords] error:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Eroare internă' }, { status: 500 })
  }
}
