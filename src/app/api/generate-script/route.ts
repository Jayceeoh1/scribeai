import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { title, keywords, language, duration, style, niche } = await req.json()

  const wordCount: Record<number,string> = {
    1:'130-150', 3:'390-450', 5:'650-750', 7:'900-1050',
    10:'1300-1500', 15:'1950-2250', 20:'2600-3000', 25:'3250-3750'
  }
  const words = wordCount[duration as number] || '650-750'

  const styleGuide: Record<string,string> = {
    educational: 'educativ și informativ, explicații clare, exemple concrete',
    entertaining: 'distractiv și energic, umor, storytelling captivant',
    motivational: 'motivațional și inspirațional, povești de succes, call to action puternic',
    documentary: 'documentar, narativ, facts și statistici, ton serios',
    tutorial: 'tutorial pas cu pas, instrucțiuni clare, demonstrații practice',
    vlog: 'vlog personal, conversațional, autentic, relatable',
  }

  const prompt = `Ești un expert în crearea de scripturi YouTube virale și optimizate SEO cu peste 10 ani experiență. Creează un script complet și profesional.

DETALII VIDEO:
- Subiect: ${title}
- Keywords principale: ${keywords}
- Limbă: ${language}
- Durată: ${duration} minute (~${words} cuvinte)
- Stil: ${styleGuide[style] || style}
- Nișă: ${niche || 'General'}

Generează în ${language} EXACT în acest format:

---TITLURI---
5 titluri YouTube ultra-optimizate SEO care generează curiozitate maximă și CTR ridicat:
1. [titlu cu cifre/statistici]
2. [titlu cu întrebare provocatoare]
3. [titlu cu promisiune clară de valoare]
4. [titlu cu urgență/exclusivitate]
5. [titlu storytelling/narativ]

---HOOK---
[Hook pentru primele 30 secunde - 60-80 cuvinte - trebuie să fie șocant sau să promită valoare imediată, să oprească scroll-ul]

---SCRIPT---
[Script complet de ${duration} minute cu ~${words} cuvinte]

[INTRO - primele 10%]
[SECȚIUNEA 1: Titlu Secțiune]
Conținut...
[SECȚIUNEA 2: Titlu Secțiune]
Conținut...
[SECȚIUNEA 3: Titlu Secțiune]
Conținut...
[OUTRO + CTA - ultimele 5%]

---DESCRIERE---
[Descriere YouTube SEO optimizată 250-300 cuvinte cu timestamps, keywords și 15 hashtag-uri]

---EDITARE---
🎬 EFECTE & TRANZIȚII: [3-4 sugestii specifice cu momentele din script]
📹 B-ROLL: [4-5 momente exacte unde să insereze footage]
✍️ TEXT ON SCREEN: [3-4 momente cu textul exact de afișat]
🎵 MUZICĂ: [Tip muzică, intensitate, când fade in/out]
🖼️ THUMBNAIL: [Descriere detaliată - culori, text, imagini, layout, font]
⚡ RITM EDITARE: [Sfaturi despre lungimea shoturilor și pacing]

---TOP_TITLURI---
Top 3 titluri finale recomandate cu explicația de ce sunt cele mai bune pentru SEO și CTR:`

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY lipsă' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  return new Response(
    new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(enc.encode(chunk.delta.text))
          }
        }
        controller.close()
      }
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  )
}
