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
      // Succes DOAR dacă procesul a ieșit cu cod 0 ȘI a printat un filePath valid.
      // Nu mai facem fallback pe "orice fișier găsit în tmpDir" — acel mecanism
      // putea livra accidental un fișier rezidual de la o încercare anterioară
      // eșuată (ex: 360p) ca fiind rezultatul corect al cererii curente.
      if (code === 0 && filePath && fs.existsSync(filePath)) {
        resolve({ ok: true, filePath })
      } else {
        resolve({ ok: false, stderr: stderr || `yt-dlp exited with code ${code}` })
      }
    })
  })
}

export async function POST(req: NextRequest) {
  const { url, format } = await req.json()

  const videoId = extractVideoId(url)
  if (!videoId) return NextResponse.json({ error: 'URL YouTube invalid.' }, { status: 400 })

  const ytdlp  = findYtDlp()
  const tmpDir = os.tmpdir()
  const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  // Includem %(height)sp direct în numele fișierului — așa vedem garantat,
  // chiar și fără să ne uităm prin headere, ce rezoluție a livrat efectiv yt-dlp.
  const outTpl = path.join(tmpDir, `yt_${videoId}_${requestId}_[%(height)sp]_%(title)s.%(ext)s`)

  let fmtArgs: string[]
  let mimeType = 'video/mp4'

  if (format === 'mp3') {
    fmtArgs = ['-x', '--audio-format', 'mp3', '--audio-quality', '192K']
    mimeType = 'audio/mpeg'
  } else if (format === 'mp4-480') {
    // video-only la rezoluția cerută + cel mai bun audio separat, mergeuit cu ffmpeg.
    // Fără fallback pe "best" (stream combinat) — acela e adesea limitat de YouTube
    // la 360p și ar masca silențios eșecul, livrând calitate mult mai mică decât cea cerută.
    fmtArgs = ['-f', 'bestvideo[height<=480]+bestaudio/best[height<=480]', '--merge-output-format', 'mp4']
  } else if (format === 'mp4-720') {
    fmtArgs = ['-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]', '--merge-output-format', 'mp4']
  } else {
    fmtArgs = ['-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]', '--merge-output-format', 'mp4']
  }

  const baseArgs = [
    ...fmtArgs,
    '-o', outTpl,
    '--no-playlist',
    '--no-warnings',
    '--print', 'after_move:filepath',
    '--print', 'before_dl:[ytdlp-debug] selected format: %(format_id)s %(height)sp %(vcodec)s/%(acodec)s client=%(extractor_key)s',
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
  let successClient = ''

  for (const clientCombo of clientCombosToTry) {
    const res = await runYtDlp(ytdlp, baseArgs, clientCombo, tmpDir, videoId)
    if (res.ok) { resultPath = res.filePath; successClient = clientCombo; break }
    lastError = res.stderr
    // dacă yt-dlp nici nu există pe server, nu are sens să reîncercăm cu alt client
    if (lastError.startsWith('spawn-error')) break
    // dacă eroarea e despre bot-detection SAU despre format indisponibil pe acest
    // client (frecvent când un client nu expune deloc formatele DASH cerute),
    // schimbarea clientului poate ajuta — altfel (video privat/șters/geo-blocat)
    // nu are sens să mai încercăm celelalte combinații
    const worthRetrying = lastError.includes('Sign in to confirm')
      || lastError.includes('not a bot')
      || lastError.includes('Requested format is not available')
      || lastError.includes('not available on this app')
    if (!worthRetrying) break
  }

  if (!resultPath) {
    if (lastError.startsWith('spawn-error')) {
      return NextResponse.json({ error: `yt-dlp nu este instalat pe server (${lastError}). Verifică railpack.json și fă un redeploy fără cache pe Railway.` }, { status: 500 })
    }
    let friendly = `Download eșuat: ${lastError.slice(0, 250)}`
    if (lastError.includes('Sign in to confirm') || lastError.includes('not a bot')) {
      friendly = 'YouTube a blocat temporar acest server pentru descărcări automate. Încearcă din nou peste câteva minute sau alege un alt video.'
    } else if (lastError.includes('Requested format is not available')) {
      friendly = `Calitatea ${format === 'mp4-1080' || !format ? '1080p' : format} nu este disponibilă pentru acest video. Încearcă o calitate mai mică (720p, 480p) sau MP3.`
    }
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
        'X-Ytdlp-Client': successClient || 'unknown',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: `Eroare fișier: ${e}` }, { status: 500 })
  }
}
