import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export async function POST(req: NextRequest) {
  const { text, title, format } = await req.json()

  if (format === 'md') {
    const mdContent = `# ${title}\n\n${text}`
    return new NextResponse(mdContent, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.md"`,
      },
    })
  }

  if (format === 'docx') {
    // Parsează textul markdown în paragrafe
    const lines = text.split('\n')
    const children: Paragraph[] = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ]

    for (const line of lines) {
      if (line.startsWith('## ')) {
        children.push(new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        }))
      } else if (line.startsWith('# ')) {
        children.push(new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }))
      } else if (line.trim() === '' || line === '---') {
        children.push(new Paragraph({ text: '' }))
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
          spacing: { after: 120 },
        }))
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children }],
      creator: 'ScribeAI',
      title,
    })

    const buffer = await Packer.toBuffer(doc)
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.docx"`,
        'Content-Length': String(uint8.length),
      },
    })
  }

  return NextResponse.json({ error: 'Format necunoscut' }, { status: 400 })
}
