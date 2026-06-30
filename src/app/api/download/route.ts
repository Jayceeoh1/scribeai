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

type RunResult = { ok: true; filePath: string } | { ok: false; stderr: string }

function runYtDlp(ytdlp: string, baseArgs: string[], playerClient: string, tmpDir: string, videoId: string): Promise<RunResult> {
  const args = [
    ...baseArgs,
    '--extractor-args', `youtube:player_client=${playerClient}`,
  ]
  return new Promise((resolve) => {
    let filePath = ''
    let stderr = ''
    const proc = spawn(ytdlp, args)
    proc.stdout.on('data', (d: Buffer) => {
      const line = d.toString().trim()
      if (line && fs.existsSync(line)) filePath = line
    })
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    proc.on('error', (err) => { resolve({ ok: false, stderr: `spawn-error: ${err.message}` }) })
    proc.on('close', (code) => {
      if (code !== 0 || !filePath || !fs.existsSync(filePath)) {
        // fallback: caută orice fișier generat în tmpDir pentru acest videoId
        const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(`yt_${videoId}_`))
        if (files.length > 0) {
          resolve({ ok: true, filePath: path.join(tmpDir, files[files.length - 1]) })
          return
        }
        resolve({ ok: false, stderr })
        return
      }
      resolve({ ok: true, filePath })
    })
  })
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
    // video-only la rezoluția cerută + cel mai bun audio separat, mergeuite cu ffmpeg.
    // Fără fallback pe "best" (stream combinat) — acela e limitat de YouTube la 360p/720p
    // și ar masca silențios eșecul, livrând calitate mult mai mică decât cea cerută.
    fmtArgs = ['-f', 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio', '--merge-output-format', 'mp4']
  } else if (format === 'mp4-720') {
    fmtArgs = ['-f', 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio', '--merge-output-format', 'mp4']
  } else {
    fmtArgs = ['-f', 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio', '--merge-output-format', 'mp4']
  }

  const baseArgs = [
    ...fmtArgs,
    '-o', outTpl,
    '--no-playlist',
    '--no-warnings',
    '--print', 'after_move:filepath',
    url,
  ]

  // Cu PO Token provider (bgutil) rulând local pe :4416, clientul "web" poate
  // servi acum rezoluții complete (1080p+) chiar de pe IP-uri de datacenter,
  // pentru că tokenul de proof-of-origin face traficul să pară legitim.
  // Păstrăm totuși fallback pe clienți mobili dacă serverul PO Token nu
  // pornește din vreun motiv (build vechi, eroare la boot etc.)
  const clientCombosToTry = ['web', 'android,web', 'ios,web', 'tv_embedded,web']

  let lastError = ''
  let resultPath = ''

  for (const clientCombo of clientCombosToTry) {
    const res = await runYtDlp(ytdlp, baseArgs, clientCombo, tmpDir, videoId)
    if (res.ok) { resultPath = res.filePath; break }
    lastError = res.stderr
    // dacă yt-dlp nici nu există pe server, nu are sens să reîncercăm cu alt client
    if (lastError.startsWith('spawn-error')) break
    // dacă eroarea nu e despre bot-detection (ex: video privat, șters, geo-blocat),
    // schimbarea clientului nu va ajuta — oprim din retry ca să nu pierdem timp
    const isBotDetection = lastError.includes('Sign in to confirm') || lastError.includes('not a bot')
    if (!isBotDetection) break
  }

  if (!resultPath) {
    if (lastError.startsWith('spawn-error')) {
      return NextResponse.json({ error: `yt-dlp nu este instalat pe server (${lastError}). Verifică railpack.json și fă un redeploy fără cache pe Railway.` }, { status: 500 })
    }
    const friendly = lastError.includes('Sign in to confirm')
      ? 'YouTube a blocat temporar acest server pentru descărcări automate. Încearcă din nou peste câteva minute sau alege un alt video.'
      : `Download eșuat: ${lastError.slice(0, 250)}`
    return NextResponse.json({ error: friendly }, { status: 500 })
  }

  try {
    const stat = fs.statSync(resultPath)
    const fileName = path.basename(resultPath)
    const fileStream = fs.createReadStream(resultPath)
    const readable = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk: Buffer | string) => controller.enqueue(typeof chunk === 'string' ? Buffer.from(chunk) : chunk))
        fileStream.on('end', () => { controller.close(); try { fs.unlinkSync(resultPath) } catch {} })
        fileStream.on('error', (e) => { controller.error(e); try { fs.unlinkSync(resultPath) } catch {} })
      },
      cancel() { fileStream.destroy(); try { fs.unlinkSync(resultPath) } catch {} },
    })
    return new NextResponse(readable, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(stat.size),
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: `Eroare fișier: ${e}` }, { status: 500 })
  }
}
