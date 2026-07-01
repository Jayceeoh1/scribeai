import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Generează 7 keywords SEO pentru un video YouTube cu titlul: "${title}". Răspunde DOAR cu keywords separate prin virgulă, fără explicații, fără punct final.`
      }]
    })

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[suggest-keywords] Anthropic error:', err)
      return NextResponse.json({ error: `Anthropic error: ${res.status}` }, { status: 500 })
    }

    const data = await res.json()
    const keywords = data.content?.[0]?.text?.trim() || ''
    return NextResponse.json({ keywords })
  } catch (e: any) {
    console.error('[suggest-keywords] error:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Eroare internă' }, { status: 500 })
  }
}
