import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function buildPrompt(title: string, detectedLang: string, targetLang: string, rawText: string, customPrompt?: string) {
  return `Traduce și structurează transcriptul YouTube "${title}" din ${detectedLang} în ${targetLang}.

1. Curăță textul
2. Structurează în paragrafe cu ## titluri
3. Adaugă ## Rezumat la început (3 propoziții)
4. Traduce tot în ${targetLang}
${customPrompt ? `5. ${customPrompt}` : ''}

Transcript:
${rawText.slice(0, 6000)}`
}

export async function POST(req: NextRequest) {
  const { rawText, detectedLang, targetLang, title, aiProvider, aiModel, customPrompt } = await req.json()
  const prompt   = buildPrompt(title, detectedLang, targetLang, rawText, customPrompt)
  const provider = aiProvider ?? 'claude'
  const model    = 'claude-haiku-4-5-20251001' // Haiku - cel mai rapid

  try {
    if (provider === 'claude') {
      if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY lipsă')
      
      // NON-streaming - răspuns complet odată
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })
      
      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

    } else if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY lipsă')
      // Map model names la versiunile corecte pentru API
      const modelMap: Record<string,string> = {
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-1.5-pro': 'gemini-1.5-pro-latest',
        'gemini-1.5-flash': 'gemini-1.5-flash-latest',
      }
      const geminiModel = modelMap[aiModel] || 'gemini-2.0-flash'
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`
      const gemRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096 }
        }),
      })
      console.log('Gemini request model:', geminiModel)
      if (!gemRes.ok) {
        const errText = await gemRes.text()
        console.error('Gemini error:', gemRes.status, errText.slice(0, 500))
        throw new Error(`Gemini error ${gemRes.status}: ${errText.slice(0, 200)}`)
      }
      const gemData = await gemRes.json()
      console.log('Gemini response keys:', Object.keys(gemData))
      const gemText = gemData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      console.log('Gemini text length:', gemText.length)
      if (!gemText) {
        console.error('Gemini full response:', JSON.stringify(gemData).slice(0, 500))
        throw new Error('Gemini a returnat text gol')
      }
      return new NextResponse(gemText, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

    } else if (provider === 'openai') {
      if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY lipsă')
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content ?? ''
      return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

    } else if (provider === 'deepseek') {
      if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY lipsă')
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
        body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content ?? ''
      return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    throw new Error('Provider necunoscut')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
