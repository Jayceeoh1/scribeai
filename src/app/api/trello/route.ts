import { NextRequest, NextResponse } from 'next/server'

// Convertește Markdown simplu (##, ---, **text**) în Markdown Trello-friendly
function formatForTrello(text: string, title: string, youtubeUrl: string, detectedLang: string, targetLang: string): string {
  // Extrage rezumatul dacă există (prima secțiune ## Rezumat)
  const rezumatMatch = text.match(/##\s*Rezumat\s*\n([\s\S]*?)(?=\n##|\n---|\z)/i)
  const rezumat = rezumatMatch ? rezumatMatch[1].trim() : ''

  // Curăță textul: elimină liniile "---" izolate și normalizează spațiile
  const cleanText = text
    .replace(/^---+\s*$/gm, '')           // elimină separatoare ---
    .replace(/\n{3,}/g, '\n\n')           // max 2 linii goale consecutive
    .trim()

  // Construiește descrierea cardului în format Markdown Trello
  const lines: string[] = []

  // Header info
  lines.push(`📺 [${title}](${youtubeUrl})`)
  lines.push('')
  lines.push(`🌐 Limbă originală: **${detectedLang}**  |  📝 Tradus în: **${targetLang}**`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Rezumat scurt în descriere dacă există
  if (rezumat) {
    lines.push('## 📋 Rezumat')
    lines.push('')
    lines.push(rezumat)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // Scriptul complet
  lines.push('## 📄 Script complet')
  lines.push('')
  lines.push(cleanText)

  return lines.join('\n')
}

// Adaugă label pe card (creează dacă nu există)
async function addLabel(
  base: string, qs: string, boardId: string, cardId: string,
  labelName: string, color: string
) {
  try {
    // Caută label-ul existent pe board
    const labelsRes = await fetch(`${base}/boards/${boardId}/labels?${qs}&limit=50`)
    const labels = await labelsRes.json()
    let labelId = labels.find((l: {name:string,color:string}) => l.name === labelName && l.color === color)?.id

    // Dacă nu există, creează-l
    if (!labelId) {
      const newLabelRes = await fetch(`${base}/labels?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: labelName, color, idBoard: boardId }),
      })
      const newLabel = await newLabelRes.json()
      labelId = newLabel.id
    }

    // Adaugă label pe card
    if (labelId) {
      await fetch(`${base}/cards/${cardId}/idLabels?${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: labelId }),
      })
    }
  } catch {}
}

export async function POST(req: NextRequest) {
  const { title, youtubeUrl, detectedLang, targetLang, translatedText } = await req.json()

  const apiKey = process.env.TRELLO_API_KEY
  const token  = process.env.TRELLO_TOKEN
  const listId = process.env.TRELLO_LIST_ID

  if (!apiKey || !token || !listId) {
    return NextResponse.json(
      { error: 'TRELLO_API_KEY, TRELLO_TOKEN sau TRELLO_LIST_ID lipsesc din env.' },
      { status: 500 }
    )
  }

  const base = 'https://api.trello.com/1'
  const qs   = `key=${apiKey}&token=${token}`

  // Formatează descrierea frumos
  const description = formatForTrello(translatedText, title, youtubeUrl, detectedLang, targetLang)

  // Titlu curat: elimină caractere speciale dar păstrează diacriticele
  const cleanTitle = title
    .replace(/[<>:"/\\|?*]/g, '')
    .trim()
    .slice(0, 100)

  // 1. Creează cardul cu descrierea formatată
  const cardRes = await fetch(`${base}/cards?${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idList: listId,
      name: `🎬 ${cleanTitle}`,
      desc: description,
    }),
  })

  if (!cardRes.ok) {
    const err = await cardRes.text()
    return NextResponse.json({ error: `Eroare creare card: ${err}` }, { status: 500 })
  }

  const card    = await cardRes.json()
  const cardId  = card.id
  const cardUrl = card.shortUrl
  const boardId = card.idBoard

  // 2. Adaugă label "YouTube" pe card
  await addLabel(base, qs, boardId, cardId, 'YouTube', 'red')

  // 3. Atașează link-ul YouTube direct (nu fișier .txt)
  await fetch(`${base}/cards/${cardId}/attachments?${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: youtubeUrl, name: `▶ ${cleanTitle}` }),
  })

  return NextResponse.json({ success: true, cardUrl, cardId })
}
