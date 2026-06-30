import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs'

export const maxDuration = 300

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function findYtDlp(): string {
  const candidates = [
    '/usr/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/nix/var/nix/profiles/default/bin/yt-dlp',
    '/run/current-system/sw/bin/yt-dlp',
    '/root/.local/bin/yt-dlp',
    `${process.env.HOME ?? '/root'}/.local/bin/yt-dlp`,
    process.env.YTDLP_PATH ?? '',
    'yt-dlp',
  ]
  for (const c of candidates) {
    if (!c) continue
    try { fs.accessSync(c, fs.constants.X_OK); return c } catch {}
  }
  return 'yt-dlp'
}

export async function POST(req: NextRequest) {
  const { url, format } = await req.json()

  const videoId = extractVideoId(url)
  if (!videoId) return NextResponse.json({ error: 'URL YouTube invalid.' }, { status: 400 })

  const ytdlp  = findYtDlp()
  const tmpDir = os.tmpdir()
  const outTpl = path.join(tmpDir, `yt_${videoId}_%(title)s.%(ext)s`)

  let fmtArgs: string[]
  let mimeType = 'video/mp4'

  if (format === 'mp3') {
    fmtArgs = ['-x', '--audio-format', 'mp3', '--audio-quality', '192K']
    mimeType = 'audio/mpeg'
  } else if (format === 'mp4-480') {
    fmtArgs = ['-f', 'bestvideo[height<=480]+bestaudio/best[height<=480]', '--merge-output-format', 'mp4']
  } else if (format === 'mp4-720') {
    fmtArgs = ['-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]', '--merge-output-format', 'mp4']
  } else {
    fmtArgs = ['-f', 'bestvideo[height<=1080]+bestaudio/best', '--merge-output-format', 'mp4']
  }

  const args = [
    ...fmtArgs,
    '-o', outTpl,
    '--no-playlist',
    '--no-warnings',
    '--print', 'after_move:filepath',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    url,
  ]

  return new Promise<NextResponse>((resolve) => {
    let filePath = ''
    let stderr = ''

    const proc = spawn(ytdlp, args)
    proc.stdout.on('data', (d: Buffer) => {
      const line = d.toString().trim()
      if (line && fs.existsSync(line)) filePath = line
    })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('error', (err) => {
      resolve(NextResponse.json({ error: `yt-dlp nu este instalat pe server (${err.message}). Verifică nixpacks.toml și fă un redeploy fără cache pe Railway.` }, { status: 500 }))
    })
    proc.on('close', (code) => {
      if (code !== 0 || !filePath || !fs.existsSync(filePath)) {
        const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(`yt_${videoId}_`))
        if (files.length > 0) {
          filePath = path.join(tmpDir, files[files.length - 1])
        } else {
          resolve(NextResponse.json({ error: `Download eșuat: ${stderr.slice(0, 200)}` }, { status: 500 }))
          return
        }
      }
      try {
        const stat = fs.statSync(filePath)
        const fileName = path.basename(filePath)
        const fileStream = fs.createReadStream(filePath)
        const readable = new ReadableStream({
          start(controller) {
            fileStream.on('data', (chunk: Buffer | string) => controller.enqueue(typeof chunk === 'string' ? Buffer.from(chunk) : chunk))
            fileStream.on('end', () => { controller.close(); try { fs.unlinkSync(filePath) } catch {} })
            fileStream.on('error', (e) => { controller.error(e); try { fs.unlinkSync(filePath) } catch {} })
          },
          cancel() { fileStream.destroy(); try { fs.unlinkSync(filePath) } catch {} },
        })
        resolve(new NextResponse(readable, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
            'Content-Length': String(stat.size),
            'Cache-Control': 'no-store',
          },
        }))
      } catch (e) {
        resolve(NextResponse.json({ error: `Eroare fișier: ${e}` }, { status: 500 }))
      }
    })
  })
}
