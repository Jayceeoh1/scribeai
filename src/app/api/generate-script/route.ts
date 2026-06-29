import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { 
    mode, // 'generate' | 'rewrite'
    // Generate mode
    title, keywords, language, duration, style, niche,
    // Rewrite mode
    transcript, videoTitle, targetLanguage,
  } = await req.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY lipsă' }, { status: 500 })
  }

  const wordCount: Record<number,string> = {
    1:'130-150', 3:'390-450', 5:'650-750', 7:'900-1050',
    10:'1300-1500', 15:'1950-2250', 20:'2600-3000', 25:'3250-3750'
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

  if (mode === 'rewrite') {
    prompt = `Ești un expert SEO și scriptwriter YouTube cu milioane de vizualizări generate. Analizează și rescrie complet acest transcript.

TRANSCRIPT ORIGINAL (video: "${videoTitle}"):
${transcript.slice(0, 6000)}

LIMBĂ OUTPUT: ${targetLanguage || 'Română'}

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
