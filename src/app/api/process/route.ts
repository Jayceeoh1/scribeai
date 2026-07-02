import { NextRequest, NextResponse } from 'next/server'

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
  const model    = aiModel || 'claude-haiku-4-5-20251001'

  try {
    if (provider === 'claude') {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY lipsă')

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Claude error ${res.status}: ${err.slice(0, 200)}`)
      }

      const data = await res.json()
      const text = data.content?.[0]?.text ?? ''
      return new NextResponse(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

    } else if (provider === 'gemini') {
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY lipsă')
      // Map model names la versiunile corecte pentru API
      const geminiModel = aiModel || 'gemini-1.5-flash-latest'
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`
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

    } else if (provider === 'grok') {
      if (!process.env.GROK_API_KEY) throw new Error('GROK_API_KEY lipsă')
      console.log('Grok request model:', model)
      const grokRes = await fetch('https://api.x.ai/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROK_API_KEY}` },
        body: JSON.stringify({
          model: model || 'grok-4.3',
          input: [
            { role: 'system', content: 'You are a helpful AI assistant.' },
            { role: 'user', content: prompt }
          ]
        }),
      })
      console.log('Grok response status:', grokRes.status)
      if (!grokRes.ok) {
        const err = await grokRes.text()
        console.error('Grok error:', err.slice(0, 500))
        throw new Error(`Grok error ${grokRes.status}: ${err.slice(0, 200)}`)
      }
      const grokData = await grokRes.json()
      console.log('Grok output type:', typeof grokData?.output, JSON.stringify(grokData).slice(0, 300))
      
      let grokText = ''
      if (typeof grokData?.output === 'string') {
        grokText = grokData.output
      } else if (Array.isArray(grokData?.output)) {
        // output e array de mesaje
        for (const item of grokData.output) {
          if (item?.type === 'message' && Array.isArray(item?.content)) {
            for (const c of item.content) {
              if (c?.type === 'output_text' || c?.type === 'text') {
                grokText += c.text || ''
              }
            }
          } else if (typeof item?.content === 'string') {
            grokText += item.content
          }
        }
      }
      
      if (!grokText) {
        console.error('Grok full response:', JSON.stringify(grokData).slice(0, 1000))
        throw new Error('Grok a returnat text gol')
      }
      return new NextResponse(grokText, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    throw new Error('Provider necunoscut')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
