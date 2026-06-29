import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const entry = await prisma.history.findUnique({ where: { shareId: params.id } })
  if (!entry) return { title: 'Script not found' }
  return {
    title: `${entry.videoTitle} — ScribeAI`,
    description: entry.scriptText?.slice(0, 160) || 'Script generat cu ScribeAI',
    openGraph: {
      title: entry.videoTitle,
      description: entry.scriptText?.slice(0, 160) || '',
      images: entry.thumbnail ? [entry.thumbnail] : [],
    }
  }
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const entry = await prisma.history.findUnique({ where: { shareId: params.id } })
  if (!entry) notFound()

  const modeLabel: Record<string,string> = { extract:'Transcript', translate:'Tradus', trello:'Trello', download:'Download', generate:'Script AI' }
  const modeColor: Record<string,string> = { extract:'#2DD4BF', translate:'#8B5CF6', trello:'#38BDF8', download:'#F472B6', generate:'#F0C444' }

  return (
    <html lang="ro">
      <body style={{ margin:0, background:'#08080E', color:'#EEEEF2', fontFamily:'Inter,sans-serif', minHeight:'100vh' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap');
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-thumb { background: rgba(139,92,246,.3); border-radius: 4px; }
        `}</style>

        {/* Nav */}
        <nav style={{ background:'rgba(8,8,16,.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
          <a href="/" style={{ fontSize:'20px', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', color:'#EEEEF2', textDecoration:'none' }}>
            Scribe<span style={{color:'#F0C444'}}>AI</span>
          </a>
          <a href="/app" style={{ padding:'8px 18px', borderRadius:'8px', background:'linear-gradient(135deg,#7C3AED,#6366F1)', color:'white', textDecoration:'none', fontSize:'13px', fontWeight:700 }}>
            Încearcă gratuit →
          </a>
        </nav>

        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'40px 20px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom:'28px' }}>
            {entry.thumbnail && (
              <img src={entry.thumbnail} alt="" style={{ width:'100%', maxHeight:'240px', objectFit:'cover', borderRadius:'14px', marginBottom:'20px', border:'1px solid rgba(255,255,255,.08)' }}/>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', flexWrap:'wrap' }}>
              <span style={{ padding:'4px 12px', borderRadius:'100px', fontSize:'11px', fontWeight:700,
                background:`${modeColor[entry.mode] || '#8B5CF6'}15`,
                border:`1px solid ${modeColor[entry.mode] || '#8B5CF6'}30`,
                color: modeColor[entry.mode] || '#8B5CF6' }}>
                {modeLabel[entry.mode] || entry.mode}
              </span>
              <span style={{ fontSize:'12px', color:'rgba(238,238,242,.35)' }}>
                {entry.sourceLang} → {entry.targetLang}
              </span>
              {entry.videoDuration && <span style={{ fontSize:'12px', color:'rgba(238,238,242,.35)' }}>⏱ {entry.videoDuration}</span>}
              <span style={{ fontSize:'12px', color:'rgba(238,238,242,.35)' }}>
                {new Date(entry.createdAt).toLocaleDateString('ro-RO', { day:'numeric', month:'long', year:'numeric' })}
              </span>
            </div>
            <h1 style={{ fontSize:'clamp(22px,4vw,36px)', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', letterSpacing:'-.02em', margin:'0 0 8px', lineHeight:1.2 }}>
              {entry.videoTitle}
            </h1>
            {entry.videoChannel && (
              <p style={{ fontSize:'14px', color:'#8B5CF6', margin:0 }}>📺 {entry.videoChannel}</p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'24px', flexWrap:'wrap' }}>
            {entry.videoUrl && !entry.videoUrl.startsWith('generated:') && (
              <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding:'9px 18px', borderRadius:'9px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'rgba(238,238,242,.7)', textDecoration:'none', fontSize:'13px', fontWeight:600 }}>
                ▶ Videoclip original
              </a>
            )}
            {entry.trelloCardUrl && (
              <a href={entry.trelloCardUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding:'9px 18px', borderRadius:'9px', background:'rgba(0,121,191,.15)', border:'1px solid rgba(0,121,191,.3)', color:'#38BDF8', textDecoration:'none', fontSize:'13px', fontWeight:600 }}>
                ⬡ Card Trello
              </a>
            )}
            <a href={`javascript:navigator.clipboard.writeText(window.location.href)`}
              style={{ padding:'9px 18px', borderRadius:'9px', background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.25)', color:'#8B5CF6', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', textDecoration:'none', display:'inline-block' }}>
              🔗 Copiază link
            </a>
          </div>

          {/* Script content */}
          {entry.scriptText ? (
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'16px', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'12px', fontWeight:600, color:'rgba(238,238,242,.4)', letterSpacing:'.08em', textTransform:'uppercase' }}>
                  Script · {entry.scriptText.length.toLocaleString()} caractere
                </span>
                <span style={{ fontSize:'12px', color:'rgba(238,238,242,.3)' }}>
                  Generat cu ScribeAI
                </span>
              </div>
              <div style={{ padding:'24px', fontSize:'14px', lineHeight:1.9, color:'rgba(238,238,242,.75)', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                {entry.scriptText}
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(238,238,242,.3)' }}>
              <p>Scriptul nu este disponibil public.</p>
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop:'40px', textAlign:'center', padding:'40px 20px', background:'linear-gradient(135deg,rgba(124,58,237,.08),rgba(240,196,68,.04))', border:'1px solid rgba(139,92,246,.2)', borderRadius:'16px' }}>
            <p style={{ fontSize:'18px', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', marginBottom:'8px' }}>
              Generează scripturi pentru orice video YouTube
            </p>
            <p style={{ fontSize:'14px', color:'rgba(238,238,242,.45)', marginBottom:'20px' }}>
              Transcript, traducere în 32+ limbi, publicare Trello — în secunde.
            </p>
            <a href="/app" style={{ display:'inline-block', padding:'14px 32px', borderRadius:'10px', background:'linear-gradient(135deg,#7C3AED,#6366F1)', color:'white', textDecoration:'none', fontSize:'15px', fontWeight:700, boxShadow:'0 4px 20px rgba(139,92,246,.3)' }}>
              🚀 Încearcă gratuit — 3 video-uri incluse
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
