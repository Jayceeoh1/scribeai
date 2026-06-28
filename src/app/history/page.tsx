'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [history, setHistory] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => {
    if (session) {
      fetch('/api/history').then(r=>r.json()).then(d => setHistory(d.history || []))
    }
  }, [session])

  if (!mounted || !session) return null

  const filtered = history.filter(h => {
    const matchSearch = !search || 
      h.videoTitle?.toLowerCase().includes(search.toLowerCase()) ||
      h.scriptText?.toLowerCase().includes(search.toLowerCase()) ||
      h.videoChannel?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || h.mode === filter
    return matchSearch && matchFilter
  })

  const modeIcon: Record<string,string> = { extract:'▶', translate:'✦', trello:'⬡', download:'↓', generate:'✦' }
  const modeColor: Record<string,string> = { extract:'var(--teal)', translate:'var(--violet)', trello:'#38BDF8', download:'#F472B6', generate:'var(--gold)' }
  const modeLabel: Record<string,string> = { extract:'Transcript', translate:'Tradus', trello:'Trello', download:'Download', generate:'Script AI' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'Inter,sans-serif', position:'relative' }}>
      <div className="orb orb-1"/><div className="orb orb-2"/>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,8,16,0.88)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div className="nav-line"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 28px' }}>
          <span className="font-display" onClick={()=>router.push('/')} style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-.02em', cursor:'pointer' }}>
            Scribe<span style={{color:'var(--gold)'}}>AI</span>
          </span>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={()=>router.push('/app')} style={{ padding:'6px 14px', borderRadius:'7px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>← App</button>
            <button onClick={()=>router.push('/dashboard')} style={{ padding:'6px 14px', borderRadius:'7px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>Dashboard</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'28px 20px 80px', position:'relative', zIndex:1 }}>
        
        {/* Header */}
        <div style={{ marginBottom:'24px' }}>
          <h1 className="font-display" style={{ fontSize:'28px', fontWeight:700, letterSpacing:'-.02em', marginBottom:'6px' }}>
            Istoric scripturi
          </h1>
          <p style={{ fontSize:'14px', color:'var(--text3)' }}>{history.length} procesări salvate</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:'200px', position:'relative' }}>
            <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:'14px' }}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Caută în titluri, canale sau text..."
              style={{ width:'100%', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 14px 10px 38px', color:'var(--text)', fontSize:'14px', fontFamily:'Inter,sans-serif', outline:'none' }}
              onFocus={e=>e.target.style.borderColor='rgba(139,92,246,.5)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            {['all','extract','translate','trello','download','generate'].map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                style={{ padding:'8px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif',
                  background: filter===f ? 'rgba(139,92,246,.15)' : 'var(--surface)',
                  border: `1px solid ${filter===f ? 'rgba(139,92,246,.4)' : 'var(--border)'}`,
                  color: filter===f ? 'var(--violet)' : 'var(--text3)' }}>
                {f==='all' ? 'Toate' : modeLabel[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap:'16px', alignItems:'start' }}>
          
          {/* Lista */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
                <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
                <p style={{ fontSize:'16px', marginBottom:'6px' }}>{search ? 'Niciun rezultat găsit' : 'Nicio procesare încă'}</p>
                <p style={{ fontSize:'13px' }}>{search ? 'Încearcă alte cuvinte cheie' : 'Procesează primul tău video'}</p>
                {!search && <button onClick={()=>router.push('/app')} style={{ marginTop:'16px', padding:'10px 20px', borderRadius:'9px', background:'linear-gradient(135deg,var(--violet2),var(--indigo))', color:'white', border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:600 }}>→ Procesează video</button>}
              </div>
            ) : filtered.map(h => (
              <div key={h.id} onClick={()=>setSelected(selected?.id===h.id ? null : h)}
                style={{ display:'flex', gap:'14px', padding:'14px 16px', borderRadius:'14px', background: selected?.id===h.id ? 'rgba(139,92,246,.08)' : 'var(--bg2)', border:`1px solid ${selected?.id===h.id ? 'rgba(139,92,246,.35)' : 'var(--border)'}`, cursor:'pointer', transition:'all .15s', alignItems:'center' }}
                onMouseEnter={e=>{ if(selected?.id!==h.id) (e.currentTarget as HTMLElement).style.borderColor='rgba(139,92,246,.2)' }}
                onMouseLeave={e=>{ if(selected?.id!==h.id) (e.currentTarget as HTMLElement).style.borderColor='var(--border)' }}>
                
                {/* Thumbnail */}
                {h.thumbnail ? (
                  <img src={h.thumbnail} alt="" style={{ width:'80px', height:'50px', borderRadius:'8px', objectFit:'cover', flexShrink:0 }}/>
                ) : (
                  <div style={{ width:'80px', height:'50px', borderRadius:'8px', background:'var(--surface)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', color:'var(--text3)' }}>▶</div>
                )}

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'14px', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'4px' }}>{h.videoTitle}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                    {h.videoChannel && <span style={{ fontSize:'11px', color:'var(--violet)' }}>📺 {h.videoChannel}</span>}
                    {h.videoDuration && <span style={{ fontSize:'11px', color:'var(--text3)' }}>⏱ {h.videoDuration}</span>}
                    <span style={{ fontSize:'11px', color:'var(--text3)' }}>{h.sourceLang} → {h.targetLang}</span>
                  </div>
                </div>

                {/* Meta */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'100px', background:`${modeColor[h.mode]}15`, border:`1px solid ${modeColor[h.mode]}30`, marginBottom:'4px' }}>
                    <span style={{ fontSize:'11px', color:modeColor[h.mode] }}>{modeIcon[h.mode]}</span>
                    <span style={{ fontSize:'10px', fontWeight:600, color:modeColor[h.mode] }}>{modeLabel[h.mode]}</span>
                  </div>
                  <p style={{ fontSize:'11px', color:'var(--text3)', display:'block' }}>{new Date(h.createdAt).toLocaleDateString('ro-RO')}</p>
                  {h.trelloCardUrl && <p style={{ fontSize:'10px', color:'#38BDF8' }}>⬡ Pe Trello</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Preview script */}
          {selected && (
            <div style={{ background:'var(--bg2)', border:'1px solid rgba(139,92,246,.25)', borderRadius:'16px', overflow:'hidden', position:'sticky', top:'76px' }}>
              <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:'13px', fontWeight:600, marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'280px' }}>{selected.videoTitle}</p>
                  <p style={{ fontSize:'11px', color:'var(--text3)' }}>{new Date(selected.createdAt).toLocaleDateString('ro-RO', {day:'numeric',month:'long',year:'numeric'})}</p>
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:'18px', padding:'4px' }}>✕</button>
              </div>

              {/* Actions */}
              <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', display:'flex', gap:'8px', flexWrap:'wrap' }}>
                <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer"
                  style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'11px', fontWeight:600, background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', color:'var(--text2)', textDecoration:'none' }}>
                  ▶ YouTube
                </a>
                {selected.trelloCardUrl && (
                  <a href={selected.trelloCardUrl} target="_blank" rel="noopener noreferrer"
                    style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'11px', fontWeight:600, background:'rgba(56,189,248,.08)', border:'1px solid rgba(56,189,248,.2)', color:'#38BDF8', textDecoration:'none' }}>
                    ⬡ Trello
                  </a>
                )}
                {selected.scriptText && (
                  <>
                    <button onClick={()=>navigator.clipboard.writeText(selected.scriptText)}
                      style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'11px', fontWeight:600, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                      ⎘ Copiază
                    </button>
                    <button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([selected.scriptText],{type:'text/plain'}));a.download=`${selected.videoTitle}.txt`;a.click()}}
                      style={{ padding:'6px 12px', borderRadius:'7px', fontSize:'11px', fontWeight:600, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                      ↓ .txt
                    </button>
                  </>
                )}
              </div>

              {/* Script text */}
              <div style={{ padding:'16px 18px', maxHeight:'500px', overflowY:'auto' }}>
                {selected.scriptText ? (
                  <p style={{ fontSize:'13px', lineHeight:1.8, color:'var(--text2)', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                    {selected.scriptText}
                  </p>
                ) : (
                  <p style={{ fontSize:'13px', color:'var(--text3)', textAlign:'center', padding:'20px 0' }}>
                    Scriptul nu a fost salvat pentru această procesare.<br/>
                    <span style={{ fontSize:'11px' }}>Procesările viitoare vor salva textul automat.</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
