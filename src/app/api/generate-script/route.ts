import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { 
    mode, title, keywords, language, duration, style, niche,
    transcript, videoTitle, targetLanguage,
    aiProvider, aiModel,
  } = await req.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY lipsă' }, { status: 500 })
  }

  const styleGuide: Record<string,string> = {
    educational: 'educativ și informativ, explicații clare, exemple concrete',
    entertaining: 'distractiv și energic, umor, storytelling captivant',
    motivational: 'motivațional și inspirațional, povești de succes, call to action puternic',
    documentary: 'documentar, narativ, facts și statistici, ton serios',
    tutorial: 'tutorial pas cu pas, instrucțiuni clare, demonstrații practice',
    vlog: 'vlog personal, conversațional, autentic, relatable',
  }

  let prompt = ''

  const wordCount: Record<number,string> = {
    1:'130-150', 3:'390-450', 5:'650-750', 7:'900-1050',
    10:'1300-1500', 15:'1950-2250', 20:'2600-3000', 25:'3250-3750'
  }

  const styleGuideMap: Record<string,string> = {
    educational: 'educativ și informativ, explicații clare, exemple concrete',
    entertaining: 'distractiv și energic, umor, storytelling captivant',
    motivational: 'motivațional și inspirațional, povești de succes, call to action puternic',
    documentary: 'documentar, narativ, facts și statistici, ton serios',
    tutorial: 'tutorial pas cu pas, instrucțiuni clare, demonstrații practice',
    vlog: 'vlog personal, conversațional, autentic, relatable',
  }

  if (mode === 'rewrite') {
    const words = wordCount[duration as number] || '650-750'
    const styleDesc = styleGuideMap[style] || 'natural și captivant'
    prompt = `Ești un expert SEO și scriptwriter YouTube cu milioane de vizualizări generate. Analizează și rescrie complet acest transcript.

TRANSCRIPT ORIGINAL (video: "${videoTitle}"):
${transcript.slice(0, 6000)}

LIMBĂ OUTPUT: ${targetLanguage || 'Română'}
DURATĂ ȚINTĂ: ${duration || 5} minute (~${words} cuvinte)
STIL: ${styleDesc}

TASK: Rescrie complet conținutul păstrând ACEEAȘI temă, concluzie și valoare principală, dar cu:
- Cuvinte complet diferite
- Unghi narativ nou și mai captivant  
- Exemple și analogii proaspete
- Hook mai puternic
- Structură optimizată pentru retenție maximă

Generează EXACT în acest format:

---ANALIZA---
🎯 TEMA PRINCIPALĂ: [1 propoziție]
💡 CONCLUZIA CHEIE: [ce trebuie păstrat]
📊 PUBLICUL ȚINTĂ: [cine sunt spectatorii ideali]
⚠️ PUNCTE SLABE ALE ORIGINALULUI: [ce poate fi îmbunătățit]

---TITLURI---
5 titluri complet diferite de original, ultra-optimizate SEO:
1. [titlu cu cifre/statistici]
2. [titlu cu întrebare provocatoare]
3. [titlu cu promisiune clară]
4. [titlu cu urgență]
5. [titlu storytelling]

---HOOK---
[Nou hook pentru primele 30 secunde - complet diferit de original, 60-80 cuvinte]

---SCRIPT---
[Script rescris complet în ${targetLanguage || 'Română'}, cu structură:
[INTRO - nou unghi]
[SECȚIUNEA 1: Titlu nou]
[SECȚIUNEA 2: Titlu nou]
[SECȚIUNEA 3: Titlu nou]
[RETENTION HOOK la mijloc - să nu dea skip]
[OUTRO + CTA puternic]]

---SEO---
🔑 KEYWORDS PRINCIPALE (5): [lista cu volume de căutare estimat]
🔑 KEYWORDS SECUNDARE (8): [lista]
📈 SCOR SEO ESTIMAT: [X/100 cu explicație]
📋 TAGS YOUTUBE (15): [lista]
🎯 THUMBNAIL CONCEPT: [descriere detaliată]
📊 STRATEGIE RETENȚIE:
  - [0:00-0:30] Hook strategy
  - [La 30%] Mid-roll retention hook
  - [La 70%] Pre-outro hook
  - [Final] CTA optimal

---DESCRIERE---
[Descriere YouTube SEO completă 250-300 cuvinte cu timestamps, keywords, hashtag-uri]

---EDITARE---
🎬 EFECTE: [3-4 sugestii]
📹 B-ROLL: [4-5 momente]
✍️ TEXT ON SCREEN: [3-4 momente cu textul exact]
🎵 MUZICĂ: [recomandări specifice]
🖼️ THUMBNAIL: [descriere detaliată cu layout, culori, text]
⚡ RITM: [sfaturi editare]

---TOP_TITLURI---
Top 3 titluri finale cu explicație SEO și CTR:`

  } else {
    // Generate from scratch
    const words = wordCount[duration as number] || '650-750'
    prompt = `Ești un expert în crearea de scripturi YouTube virale și optimizate SEO. Creează un script complet și profesional.

DETALII VIDEO:
- Subiect: ${title}
- Keywords principale: ${keywords}
- Limbă: ${language}
- Durată: ${duration} minute (~${words} cuvinte)
- Stil: ${styleGuide[style] || style}
- Nișă: ${niche || 'General'}

Generează în ${language} EXACT în acest format:

---TITLURI---
5 titluri YouTube ultra-optimizate SEO:
1. [titlu cu cifre/statistici]
2. [titlu cu întrebare provocatoare]
3. [titlu cu promisiune clară de valoare]
4. [titlu cu urgență/exclusivitate]
5. [titlu storytelling/narativ]

---HOOK---
[Hook pentru primele 30 secunde - 60-80 cuvinte - șocant sau cu valoare imediată]

---SCRIPT---
[Script complet de ${duration} minute cu ~${words} cuvinte]
[INTRO - primele 10%]
[SECȚIUNEA 1: Titlu]
[SECȚIUNEA 2: Titlu]
[SECȚIUNEA 3: Titlu]
[RETENTION HOOK la mijloc]
[OUTRO + CTA]

---SEO---
🔑 KEYWORDS PRINCIPALE (5): [lista]
🔑 KEYWORDS SECUNDARE (8): [lista]
📈 SCOR SEO ESTIMAT: [X/100 cu explicație]
📋 TAGS YOUTUBE (15): [lista]
🎯 THUMBNAIL CONCEPT: [descriere]
📊 STRATEGIE RETENȚIE:
  - [0:00-0:30] Hook strategy
  - [La 30%] Mid-roll retention hook
  - [La 70%] Pre-outro hook
  - [Final] CTA optimal

---DESCRIERE---
[Descriere YouTube SEO 250-300 cuvinte cu timestamps, keywords, 15 hashtag-uri]

---EDITARE---
🎬 EFECTE & TRANZIȚII: [3-4 sugestii]
📹 B-ROLL: [4-5 momente]
✍️ TEXT ON SCREEN: [3-4 momente]
🎵 MUZICĂ: [tip, intensitate, momente]
🖼️ THUMBNAIL: [culori, text, layout, font]
⚡ RITM EDITARE: [sfaturi pacing]

---TOP_TITLURI---
Top 3 titluri finale recomandate cu explicație SEO și CTR:`
  }

  const provider = aiProvider || 'claude'
  const model = aiModel || 'claude-sonnet-4-6'

  // Claude
  if (provider === 'claude') {
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY lipsă' }, { status: 500 })
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const stream = await client.messages.stream({ model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] })
    return new Response(new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') controller.enqueue(enc.encode(chunk.delta.text))
        }
        controller.close()
      }
    }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  // Gemini
  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY lipsă' }, { status: 500 })
    const gemModel = model || 'gemini-2.0-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}&alt=sse`
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{maxOutputTokens:4096} }) })
    if (!res.ok || !res.body) return NextResponse.json({ error: `Gemini error ${res.status}` }, { status: 500 })
    return new Response(new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder(); const reader = res.body!.getReader(); const decoder = new TextDecoder(); let buf = ''
        while (true) {
          const { done, value } = await reader.read(); if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n'); buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const json = line.slice(6).trim(); if (!json || json === "[DONE]") continue
            try { const obj = JSON.parse(json); const text = obj?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''; if (text) controller.enqueue(enc.encode(text)) } catch {}
          }
        }
        controller.close()
      }
    }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  // OpenAI / DeepSeek
  if (provider === 'openai' || provider === 'deepseek') {
    const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY
    const baseURL = provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com/v1'
    if (!apiKey) return NextResponse.json({ error: `${provider.toUpperCase()}_API_KEY lipsă` }, { status: 500 })
    const res = await fetch(`${baseURL}/chat/completions`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`}, body: JSON.stringify({ model, max_tokens:4096, stream:true, messages:[{role:'user',content:prompt}] }) })
    if (!res.ok || !res.body) return NextResponse.json({ error: `API error ${res.status}` }, { status: 500 })
    return new Response(new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder(); const reader = res.body!.getReader(); const decoder = new TextDecoder(); let buf = ''
        while (true) {
          const { done, value } = await reader.read(); if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n'); buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const json = line.slice(6).trim(); if (!json || json === "[DONE]") continue
            try { const obj = JSON.parse(json); const text = obj?.choices?.[0]?.delta?.content ?? ''; if (text) controller.enqueue(enc.encode(text)) } catch {}
          }
        }
        controller.close()
      }
    }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  // Grok
  if (provider === 'grok') {
    if (!process.env.GROK_API_KEY) return NextResponse.json({ error: 'GROK_API_KEY lipsă' }, { status: 500 })
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.GROK_API_KEY}`},
      body: JSON.stringify({ model: model || 'grok-2-latest', max_tokens:4096, stream:true, messages:[{role:'user',content:prompt}] })
    })
    if (!res.ok || !res.body) return NextResponse.json({ error: `Grok error ${res.status}` }, { status: 500 })
    return new Response(new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder(); const reader = res.body!.getReader(); const decoder = new TextDecoder(); let buf = ''
        while (true) {
          const { done, value } = await reader.read(); if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n'); buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const json = line.slice(6).trim(); if (!json || json === '[DONE]') continue
            try { const obj = JSON.parse(json); const text = obj?.choices?.[0]?.delta?.content ?? ''; if (text) controller.enqueue(enc.encode(text)) } catch {}
          }
        }
        controller.close()
      }
    }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  return NextResponse.json({ error: 'Provider necunoscut' }, { status: 400 })
}
