import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User negăsit' }, { status: 404 })

    const isPro = user.plan === 'PRO' || user.plan === 'ENTERPRISE'
    const maxClips = isPro ? 15 : 3

    const { transcript, title, count = 3 } = await req.json()
    if (!transcript) return NextResponse.json({ error: 'Transcript lipsă' }, { status: 400 })

    const clipsCount = Math.min(count, maxClips)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key lipsă' }, { status: 500 })

    const prompt = `Ești un expert în viral content pentru YouTube Shorts, TikTok și Instagram Reels.

Analizează acest transcript video${title ? ` cu titlul: "${title}"` : ''} și identifică ${clipsCount} momente cu cel mai mare potențial viral pentru Shorts (30-60 secunde).

TRANSCRIPT:
${transcript.slice(0, 8000)}

Răspunde DOAR cu un JSON valid, fără explicații, fără markdown, exact în acest format:
{
  "clips": [
    {
      "startTime": "02:14",
      "endTime": "02:58",
      "startSeconds": 134,
      "endSeconds": 178,
      "hook": "textul exact din transcript care reprezintă hook-ul momentului (max 120 caractere)",
      "viralScore": 94,
      "tags": ["HOOK PUTERNIC", "CURIOZITATE"],
      "reason": "De ce acest moment e viral (max 80 caractere)"
    }
  ]
}

Taguri posibile: HOOK PUTERNIC, CURIOZITATE, REVELAȚIE, RELATABLE, STORYTELLING, CLIFFHANGER, ȘOCANT, EMOȚIONAL, EDUCATIV, AMUZANT
viralScore: număr între 60-99 (estimare potențial viral)
Returnează exact ${clipsCount} clipuri ordonate descrescător după viralScore.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Claude error: ${err.slice(0, 200)}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text?.trim() || ''

    let clips
    try {
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      clips = parsed.clips || []
    } catch {
      return NextResponse.json({ error: 'Eroare parsare răspuns AI', raw: text.slice(0, 300) }, { status: 500 })
    }

    return NextResponse.json({ clips, isPro, maxClips })
  } catch (e: any) {
    console.error('[shorts] error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Eroare internă' }, { status: 500 })
  }
}
