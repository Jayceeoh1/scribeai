import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs'

export const maxDuration = 300

function findBin(name: string): string {
  const candidates = name === 'yt-dlp'
    ? ['/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp', 'yt-dlp']
    : ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', 'ffmpeg']
  for (const c of candidates) {
    try { fs.accessSync(c, fs.constants.X_OK); return c } catch {}
  }
  return name
}

function run(cmd: string, args: string[]): Promise<{ ok: boolean; stderr: string }> {
  return new Promise(resolve => {
    let stderr = ''
    const p = spawn(cmd, args)
    p.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
    p.on('error', err => resolve({ ok: false, stderr: err.message }))
    p.on('close', code => resolve({ ok: code === 0, stderr }))
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

    const { videoUrl, startSeconds, endSeconds, clipIndex = 0 } = await req.json()
    if (!videoUrl || startSeconds === undefined || endSeconds === undefined) {
      return NextResponse.json({ error: 'Parametri lipsă' }, { status: 400 })
    }

    const duration = endSeconds - startSeconds
    if (duration < 5 || duration > 180) {
      return NextResponse.json({ error: 'Durata clipului trebuie să fie între 5 și 180 secunde' }, { status: 400 })
    }

    const ytdlp = findBin('yt-dlp')
    const ffmpeg = findBin('ffmpeg')
    const tmpDir = os.tmpdir()
    const reqId = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const fullVideo = path.join(tmpDir, `shorts_full_${reqId}.mp4`)
    const clipOut = path.join(tmpDir, `shorts_clip_${reqId}_${clipIndex}.mp4`)

    // Descarcă video-ul complet (sau segmentul cu yt-dlp --download-sections)
    const dlRes = await run(ytdlp, [
      '-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]',
      '--merge-output-format', 'mp4',
      '--extractor-args', 'youtube:player_client=web,android',
      '--download-sections', `*${Math.max(0, startSeconds - 2)}-${endSeconds + 2}`,
      '-o', fullVideo,
      '--no-playlist',
      videoUrl,
    ])

    if (!dlRes.ok || !fs.existsSync(fullVideo)) {
      return NextResponse.json({ error: `Download eșuat: ${dlRes.stderr.slice(0, 300)}` }, { status: 500 })
    }

    // Taie clipul exact cu ffmpeg
    const offsetStart = Math.min(2, startSeconds)
    const ffRes = await run(ffmpeg, [
      '-y',
      '-i', fullVideo,
      '-ss', String(offsetStart),
      '-t', String(duration),
      '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      clipOut,
    ])

    try { fs.unlinkSync(fullVideo) } catch {}

    if (!ffRes.ok || !fs.existsSync(clipOut)) {
      return NextResponse.json({ error: `FFmpeg eșuat: ${ffRes.stderr.slice(0, 300)}` }, { status: 500 })
    }

    const stat = fs.statSync(clipOut)
    const stream = fs.createReadStream(clipOut)
    const readable = new ReadableStream({
      start(c) {
        stream.on('data', (chunk: Buffer | string) => c.enqueue(typeof chunk === 'string' ? Buffer.from(chunk) : chunk))
        stream.on('end', () => { c.close(); try { fs.unlinkSync(clipOut) } catch {} })
        stream.on('error', e => { c.error(e); try { fs.unlinkSync(clipOut) } catch {} })
      },
      cancel() { stream.destroy(); try { fs.unlinkSync(clipOut) } catch {} }
    })

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="short_clip_${clipIndex + 1}.mp4"`,
        'Content-Length': String(stat.size),
        'Cache-Control': 'no-store',
      }
    })
  } catch (e: any) {
    console.error('[cut-clip] error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Eroare internă' }, { status: 500 })
  }
}
