'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const STYLES = ['Dramatic','Minimal','Colorat','Profesional','Gaming','Tutorial','Motivațional','Documentary']
const NICHES = ['Tech & AI','Business & Finance','Gaming','Education','Entertainment','Fitness & Health','Travel','Food & Cooking','Music','Personal Development','Marketing','Science']
const TEXT_POSITIONS = ['top-left','top-center','top-right','center','bottom-left','bottom-center','bottom-right']
const TEXT_COLORS = ['#FFFFFF','#FF0000','#FFD700','#00FF00','#FF6B00','#00BFFF','#FF1493','#000000']

const AI_SUGGESTIONS = [
  'Față șocată privind ecran, fundal întunecat roșu',
  'Split screen before/after, contrast puternic',
  'Close-up ochi cu reflecție dramatică, lumini neon',
  'Persoană cu mâinile la cap, expresie disperare',
  'Grafic spectaculos care explodează în sus',
  'Peisaj urban noaptea cu lumini vibrante',
  'Studio profesional, iluminare cinematică',
  'Fundal abstract cu particule de lumină',
]

function extractYtId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function ThumbnailGenerator() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Form state
  const [prompt, setPrompt] = useState('')
  const [hookText, setHookText] = useState('')
  const [subText, setSubText] = useState('')
  const [style, setStyle] = useState('Dramatic')
  const [niche, setNiche] = useState('Tech & AI')
  const [inspireUrl, setInspireUrl] = useState('')
  const [variants, setVariants] = useState(1)

  // Text overlay — acum textul e generat direct de AI în imagine (prin prompt),
  // păstrăm doar poziția/culoarea pentru preview-ul live din UI
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [textStroke, setTextStroke] = useState(true)
  const [fontSize, setFontSize] = useState(80)
  const [textPos, setTextPos] = useState('bottom-center')
  const [bgOverlay, setBgOverlay] = useState(true)

  // Inspiratie
  const [imageProvider, setImageProvider] = useState<'replicate'|'grok'>('replicate')
  const [inspireImages, setInspireImages] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  // Results
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{url: string, canvas?: string}[]>([])
  const [error, setError] = useState('')
  const [thumbsUsed, setThumbsUsed] = useState(0)
  const [selectedResult, setSelectedResult] = useState(0)

  const FREE_LIMIT = 3

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  useEffect(() => {
    if (session) {
      const used = parseInt(localStorage.getItem(`thumbs_${session?.user?.email}`) || '0')
      setThumbsUsed(used)
    }
  }, [session])

  if (!mounted || !session) return null

  const plan = (session.user as any)?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE'
  const thumbsLeft = isPro ? 999 : Math.max(0, FREE_LIMIT - thumbsUsed)
  const canGenerate = thumbsLeft > 0 || isPro

  async function handleInspireUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const base64s: string[] = []
    for (const file of files.slice(0, 2)) {
      const b64 = await new Promise<string>((res) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result as string)
        reader.readAsDataURL(file)
      })
      base64s.push(b64)
    }
    setInspireImages(base64s)
    setAnalysisResult(null)
  }

  async function analyzeInspiration() {
    if (!inspireImages.length) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: inspireImages, hookText, niche, style })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysisResult(data)
      if (data.fluxPrompt) setPrompt(data.fluxPrompt)
      if (data.suggestedTextColor) setTextColor(data.suggestedTextColor)
    } catch(e: any) {
      setError(e.message)
    }
    setAnalyzing(false)
  }

  async function generateThumbnails() {
    if (!prompt && !hookText) return
    if (!canGenerate) return
    setLoading(true); setError(''); setResults([])

    try {
      // Construiesc prompt-ul optimizat
      let ytInspiration = ''
      if (inspireUrl) {
        const ytId = extractYtId(inspireUrl)
        if (ytId) ytInspiration = ` Inspired by YouTube thumbnail style, vibrant and eye-catching like popular ${niche} videos.`
      }

      const textInstruction = hookText
        ? ` Include bold, large, eye-catching YouTube thumbnail text overlay that reads exactly: "${hookText.toUpperCase()}"${subText ? ` with smaller secondary text below it that reads: "${subText.toUpperCase()}"` : ''}. Text must be in a bold sans-serif font, white or bright color with black outline/shadow for maximum readability, positioned for clear visibility, professionally integrated into the composition like a real viral YouTube thumbnail.`
        : ''

      const fullPrompt = `Professional YouTube thumbnail, ${style.toLowerCase()} style, ${niche} niche. ${prompt}. ${ytInspiration}${textInstruction} Photorealistic, high contrast, dramatic lighting, 16:9 ratio, clean professional composition. Professional photography quality.`

      const generated: {url: string}[] = []
      for (let i = 0; i < variants; i++) {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt, width: 1280, height: 720, provider: imageProvider })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Eroare generare')
        generated.push({ url: data.imageUrl })
      }

      setResults(generated)
      setSelectedResult(0)
      if (!isPro) {
        const newUsed = thumbsUsed + variants
        setThumbsUsed(newUsed)
        localStorage.setItem(`thumbs_${session?.user?.email}`, String(newUsed))
      }
    } catch(e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)',
    borderRadius: '9px', padding: '10px 12px', color: 'var(--text)', fontSize: '13px',
    fontFamily: 'Inter,sans-serif', outline: 'none'
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'Inter,sans-serif', position:'relative', overflow:'hidden' }}>
      <div className="orb orb-1"/><div className="orb orb-2"/>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,8,16,.9)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div className="nav-line"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <span className="font-display" onClick={()=>router.push('/')} style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-.02em', cursor:'pointer' }}>
              Scribe<span style={{color:'var(--gold)'}}>AI</span>
            </span>
            <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background:'var(--goldbg)', border:'1px solid var(--goldbdr)', color:'var(--gold)', fontWeight:700 }}>🖼️ Thumbnail Generator</span>
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            {!isPro && <span style={{ fontSize:'12px', color:'var(--text3)' }}>{thumbsLeft} gratuite rămase</span>}
            <span style={{ padding:'4px 11px', borderRadius:'100px', fontSize:'11px', fontWeight:700, background:isPro?'rgba(139,92,246,.1)':'var(--tealbg)', border:`1px solid ${isPro?'rgba(139,92,246,.3)':'var(--tealbdr)'}`, color:isPro?'var(--violet)':'var(--teal)' }}>{plan}</span>
            <button onClick={()=>router.push('/app')} style={{ padding:'6px 14px', borderRadius:'7px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>← App</button>
            <button onClick={()=>signOut({callbackUrl:'/'})} style={{ padding:'6px 14px', borderRadius:'7px', background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.18)', color:'#FCA5A5', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>Ieșire</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'24px 20px 80px', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:'24px', display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h1 className="font-display" style={{ fontSize:'26px', fontWeight:700, letterSpacing:'-.02em', margin:'0 0 6px' }}>Thumbnail Generator AI</h1>
            <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>Generează imagini cu Flux 1.1 Pro — textul e desenat direct de AI în imagine</p>
          </div>
          {!isPro && !canGenerate && (
            <a href="/pricing" style={{ padding:'10px 20px', borderRadius:'9px', background:'linear-gradient(135deg,var(--gold),var(--gold2))', color:'#0A0800', fontWeight:700, textDecoration:'none', fontSize:'13px' }}>
              ⚡ Upgrade Pro — nelimitat
            </a>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'18px', alignItems:'start' }}>

          {/* ── FORM STÂNGA ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', position:'sticky', top:'76px' }}>

            {/* Card generare imagine */}
            <div style={{ background:'var(--bg2)', border:'1px solid rgba(240,196,68,.15)', borderRadius:'14px', padding:'16px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }}/>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 12px' }}>🎨 Generare imagine</p>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Descrie imaginea de fundal *</label>
                  <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} disabled={loading}
                    placeholder="Ex: persoană cu expresie șocată, fundal întunecat dramatic, iluminare cinematică..."
                    style={{...inp, resize:'vertical'}}
                    onFocus={e=>e.target.style.borderColor='var(--goldbdr)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}
                  />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Stil vizual</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                    {STYLES.map(s=>(
                      <button key={s} type="button" onClick={()=>setStyle(s)} disabled={loading}
                        style={{ padding:'6px', borderRadius:'6px', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif',
                          background: style===s?'var(--goldbg)':'var(--surface)', border:`1px solid ${style===s?'var(--goldbdr)':'var(--border)'}`, color:style===s?'var(--gold)':'var(--text3)' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Nișă</label>
                  <select value={niche} onChange={e=>setNiche(e.target.value)} disabled={loading}
                    style={{...inp, colorScheme:'dark', cursor:'pointer'}}>
                    {NICHES.map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>URL YouTube inspirație</label>
                  <input value={inspireUrl} onChange={e=>setInspireUrl(e.target.value)} disabled={loading}
                    placeholder="https://youtu.be/..."
                    style={inp} onFocus={e=>e.target.style.borderColor='var(--goldbdr)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}
                  />
                  <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'3px' }}>Stilul nișei va fi adaptat</p>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>
                    Variante: <span style={{color:'var(--gold)',fontWeight:700}}>{variants}</span>
                  </label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'4px' }}>
                    {[1,2,3].map(n=>(
                      <button key={n} type="button" onClick={()=>setVariants(n)} disabled={loading}
                        style={{ padding:'7px', borderRadius:'7px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif',
                          background:variants===n?'var(--goldbg)':'var(--surface)', border:`1px solid ${variants===n?'var(--goldbdr)':'var(--border)'}`, color:variants===n?'var(--gold)':'var(--text3)' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider selector */}
                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Provider imagine AI</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                    <button type="button" onClick={()=>setImageProvider('replicate')} disabled={loading}
                      style={{ padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', border:'none',
                        background:imageProvider==='replicate'?'linear-gradient(135deg,var(--violet2),var(--indigo))':'var(--surface)',
                        color:imageProvider==='replicate'?'white':'var(--text3)' }}>
                      ⚡ Flux 1.1 Pro
                    </button>
                    <button type="button" onClick={()=>setImageProvider('grok')} disabled={loading}
                      style={{ padding:'9px', borderRadius:'8px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', border:'none',
                        background:imageProvider==='grok'?'linear-gradient(135deg,#1DA1F2,#0d8fd9)':'var(--surface)',
                        color:imageProvider==='grok'?'white':'var(--text3)' }}>
                      𝕏 Grok Imagine
                    </button>
                  </div>
                  <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'4px' }}>
                    {imageProvider==='replicate'?'Flux 1.1 Pro — calitate maximă (~$0.04/img)':'Grok Imagine — rapid și gratuit cu cheia xAI'}
                  </p>
                </div>

                <button onClick={generateThumbnails} disabled={loading||(!prompt&&!hookText)||!canGenerate}
                  style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'none', fontFamily:'Inter,sans-serif', fontSize:'14px', fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', cursor:loading||(!prompt&&!hookText)||!canGenerate?'not-allowed':'pointer',
                    background:loading||(!prompt&&!hookText)||!canGenerate?'var(--surface)':'linear-gradient(135deg,var(--gold),var(--gold2))',
                    color:loading||(!prompt&&!hookText)||!canGenerate?'var(--text3)':'#0A0800' }}>
                  {loading
                    ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#0A0800" strokeWidth="3" strokeLinecap="round"/></svg>Se generează...</>
                    : '🎨 Generează imagini'}
                </button>
                {loading && <p style={{textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>Flux 1.1 Pro lucrează... ~30-60 sec</p>}
                {error && <div style={{padding:'8px 10px',background:'rgba(248,113,113,.07)',border:'1px solid rgba(248,113,113,.2)',borderRadius:'7px',fontSize:'12px',color:'#FCA5A5'}}>❌ {error}</div>}
              </div>
            </div>

            {/* Card text overlay */}
            <div style={{ background:'var(--bg2)', border:'1px solid rgba(139,92,246,.15)', borderRadius:'14px', padding:'16px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(139,92,246,.5),transparent)' }}/>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 12px' }}>✍️ Text pe thumbnail (generat de AI)</p>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Text principal (HOOK)</label>
                  <input value={hookText} onChange={e=>setHookText(e.target.value)}
                    placeholder='Ex: NU MAI FACE ASTA!'
                    style={inp} onFocus={e=>e.target.style.borderColor='rgba(139,92,246,.5)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}
                  />
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Text secundar</label>
                  <input value={subText} onChange={e=>setSubText(e.target.value)}
                    placeholder='Ex: Secretul pe care nu ți-l spune nimeni'
                    style={inp} onFocus={e=>e.target.style.borderColor='rgba(139,92,246,.5)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}
                  />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Culoare text</label>
                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                      {TEXT_COLORS.map(c=>(
                        <div key={c} onClick={()=>setTextColor(c)}
                          style={{ width:'24px', height:'24px', borderRadius:'5px', background:c, border:`2px solid ${textColor===c?'var(--violet)':'rgba(255,255,255,.2)'}`, cursor:'pointer', flexShrink:0 }}/>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Dimensiune: {fontSize}px</label>
                    <input type="range" min="40" max="150" value={fontSize} onChange={e=>setFontSize(parseInt(e.target.value))}
                      style={{ width:'100%', accentColor:'var(--violet)' }}/>
                  </div>
                </div>

                <div>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'5px' }}>Poziție text</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'3px' }}>
                    {TEXT_POSITIONS.map(p=>(
                      <button key={p} type="button" onClick={()=>setTextPos(p)}
                        style={{ padding:'5px 3px', borderRadius:'5px', fontSize:'9px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif',
                          background:textPos===p?'rgba(139,92,246,.15)':'var(--surface)', border:`1px solid ${textPos===p?'rgba(139,92,246,.4)':'var(--border)'}`, color:textPos===p?'var(--violet)':'var(--text3)' }}>
                        {p.replace('-',' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:'flex', gap:'12px' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'12px', color:'var(--text2)' }}>
                    <input type="checkbox" checked={textStroke} onChange={e=>setTextStroke(e.target.checked)} style={{ accentColor:'var(--violet)' }}/>
                    Contur negru
                  </label>
                  <label style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontSize:'12px', color:'var(--text2)' }}>
                    <input type="checkbox" checked={bgOverlay} onChange={e=>setBgOverlay(e.target.checked)} style={{ accentColor:'var(--violet)' }}/>
                    Fundal semi-transparent
                  </label>
                </div>
              </div>
            </div>

            {/* Inspiratie vizuala */}
            <div style={{ background:'var(--bg2)', border:'1px solid rgba(52,211,153,.15)', borderRadius:'14px', padding:'16px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(52,211,153,.5),transparent)' }}/>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--green)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 10px' }}>🎯 Inspirație vizuală</p>
              <p style={{ fontSize:'12px', color:'var(--text3)', margin:'0 0 10px', lineHeight:1.5 }}>
                Încarcă 1-2 thumbnail-uri de referință și Claude le analizează automat pentru a genera un prompt perfect.
              </p>

              {/* Upload zone */}
              <label style={{ display:'block', padding:'16px', border:'2px dashed rgba(52,211,153,.3)', borderRadius:'10px', cursor:'pointer', textAlign:'center', marginBottom:'10px', background:'rgba(52,211,153,.03)' }}>
                <input type="file" accept="image/*" multiple onChange={handleInspireUpload} style={{ display:'none' }}/>
                {inspireImages.length > 0 ? (
                  <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
                    {inspireImages.map((img, i) => (
                      <img key={i} src={img} alt={`Inspirație ${i+1}`} style={{ height:'60px', borderRadius:'6px', objectFit:'cover', border:'1px solid rgba(52,211,153,.3)' }}/>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize:'24px', margin:'0 0 4px' }}>📁</p>
                    <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>Click pentru a încărca thumbnail-uri (max 2)</p>
                  </div>
                )}
              </label>

              {inspireImages.length > 0 && (
                <div style={{ display:'flex', gap:'6px' }}>
                  <button onClick={analyzeInspiration} disabled={analyzing}
                    style={{ flex:1, padding:'9px', borderRadius:'8px', border:'none', cursor:analyzing?'not-allowed':'pointer', fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:700,
                      background:analyzing?'var(--surface)':'linear-gradient(135deg,#059669,#10B981)',
                      color:analyzing?'var(--text3)':'white', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    {analyzing
                      ? <><svg className="spin" width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>Analizez...</>
                      : '🔍 Analizează cu Claude'}
                  </button>
                  <button onClick={()=>{setInspireImages([]);setAnalysisResult(null)}}
                    style={{ padding:'9px 12px', borderRadius:'8px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:'12px' }}>
                    ✕
                  </button>
                </div>
              )}

              {analysisResult && (
                <div style={{ marginTop:'10px', padding:'10px 12px', background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.2)', borderRadius:'9px' }}>
                  <p style={{ fontSize:'11px', fontWeight:700, color:'var(--green)', margin:'0 0 6px' }}>✓ Analiză completă — promptul a fost setat automat!</p>
                  <p style={{ fontSize:'11px', color:'var(--text3)', margin:'0 0 4px' }}>🎨 Stil: {analysisResult.style}</p>
                  <p style={{ fontSize:'11px', color:'var(--text3)', margin:'0 0 6px' }}>📐 Compoziție: {analysisResult.composition}</p>
                  {analysisResult.colorPalette && (
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <span style={{ fontSize:'10px', color:'var(--text3)' }}>Culori:</span>
                      {analysisResult.colorPalette.map((c: string, i: number) => (
                        <div key={i} style={{ width:'18px', height:'18px', borderRadius:'4px', background:c, border:'1px solid rgba(255,255,255,.1)' }}/>
                      ))}
                    </div>
                  )}
                  {analysisResult.tips && <p style={{ fontSize:'11px', color:'var(--text2)', margin:'6px 0 0', fontStyle:'italic' }}>💡 {analysisResult.tips}</p>}
                </div>
              )}
            </div>

            {/* Idei */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>💡 Idei rapide</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {AI_SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={()=>setPrompt(s)}
                    style={{ padding:'7px 10px', borderRadius:'7px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:'11px', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left' }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(240,196,68,.3)')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── DREAPTA — PREVIEW ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* Tabs variante */}
            {results.length > 1 && (
              <div style={{ display:'flex', gap:'6px' }}>
                {results.map((_, i) => (
                  <button key={i} onClick={()=>setSelectedResult(i)}
                    style={{ padding:'7px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif',
                      background:selectedResult===i?'var(--goldbg)':'var(--surface)', border:`1px solid ${selectedResult===i?'var(--goldbdr)':'var(--border)'}`, color:selectedResult===i?'var(--gold)':'var(--text3)' }}>
                    Varianta {i+1}
                  </button>
                ))}
              </div>
            )}

            {/* Preview principal */}
            {results[selectedResult] ? (
              <div style={{ background:'var(--bg2)', border:'1px solid rgba(240,196,68,.2)', borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'12px', fontWeight:600, color:'var(--gold)' }}>🖼️ Preview 1280×720</span>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <span style={{ fontSize:'11px', color:'var(--green)', background:'rgba(52,211,153,.1)', padding:'2px 8px', borderRadius:'100px', border:'1px solid rgba(52,211,153,.2)' }}>{imageProvider==='grok'?'𝕏 Grok Imagine':'⚡ Flux 1.1 Pro'}</span>
                    {hookText && <span style={{ fontSize:'11px', color:'var(--violet)', background:'rgba(139,92,246,.1)', padding:'2px 8px', borderRadius:'100px', border:'1px solid rgba(139,92,246,.2)' }}>+ text AI</span>}
                  </div>
                </div>

                {/* Imagine finală — textul e deja generat de AI direct în imagine */}
                <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden' }}>
                  <img
                    src={results[selectedResult].url}
                    alt="Thumbnail"
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ padding:'12px 14px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <a href={results[selectedResult].url} download={`thumbnail-${selectedResult+1}.jpg`} target="_blank" rel="noopener noreferrer"
                    style={{ flex:1, padding:'10px', borderRadius:'9px', border:'none', background:'linear-gradient(135deg,var(--gold),var(--gold2))', color:'#0A0800', fontSize:'13px', fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                    ↓ Download
                  </a>
                  <button onClick={()=>navigator.clipboard.writeText(results[selectedResult].url)}
                    style={{ padding:'10px 14px', borderRadius:'9px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                    ⎘ URL
                  </button>
                  <button onClick={generateThumbnails}
                    style={{ padding:'10px 14px', borderRadius:'9px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                    🔄
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'16px', overflow:'hidden' }}>
                {loading ? (
                  <div style={{ aspectRatio:'16/9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
                    <svg className="spin" width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(240,196,68,.2)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:'14px', color:'var(--text2)', fontWeight:600, margin:'0 0 4px' }}>Flux 1.1 Pro generează...</p>
                      <p style={{ fontSize:'12px', color:'var(--text3)', margin:0 }}>~30-60 secunde per imagine</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ aspectRatio:'16/9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
                    <span style={{ fontSize:'60px', opacity:.3 }}>🖼️</span>
                    <p style={{ fontSize:'15px', color:'var(--text3)', margin:0, fontWeight:600 }}>Thumbnail-ul apare aici</p>
                    <p style={{ fontSize:'12px', color:'var(--text3)', margin:0, opacity:.7 }}>Completează formularul și generează</p>
                  </div>
                )}
              </div>
            )}

            {/* Tips virale */}
            <div style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.15)', borderRadius:'14px', padding:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 8px' }}>🎯 Secrete pentru thumbnailuri virale</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                {[
                  ['Max 5 cuvinte', 'Mai puțin = mai impactant'],
                  ['Contrast maxim', 'Alb pe negru sau invers'],
                  ['Față cu emoție', 'Crește CTR cu 30%+'],
                  ['Curiozitate', 'Nu dezvălui totul'],
                  ['Roșu/galben/portocaliu', 'Culorile care atrag atenția'],
                  ['Test pe mobil', 'Trebuie lizibil mic'],
                ].map(([title, desc]) => (
                  <div key={title} style={{ padding:'8px 10px', background:'rgba(139,92,246,.06)', borderRadius:'8px' }}>
                    <p style={{ fontSize:'12px', fontWeight:600, color:'var(--violet)', margin:'0 0 2px' }}>{title}</p>
                    <p style={{ fontSize:'11px', color:'var(--text3)', margin:0 }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cum funcționează */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 10px' }}>⚙️ Cum funcționează</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  ['1️⃣', 'Flux 1.1 Pro', 'Cel mai bun model AI open-source generează fundalul imaginii'],
                  ['2️⃣', 'Text AI integrat', 'Hook-ul tău e inclus direct în prompt — AI-ul desenează textul în imagine'],
                  ['3️⃣', 'Download', 'Imaginea finală 1280×720 gata de upload pe YouTube'],
                ].map(([icon, title, desc]) => (
                  <div key={title} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                    <span style={{ fontSize:'18px', flexShrink:0 }}>{icon}</span>
                    <div>
                      <p style={{ fontSize:'12px', fontWeight:700, color:'var(--text)', margin:'0 0 2px' }}>{title}</p>
                      <p style={{ fontSize:'11px', color:'var(--text3)', margin:0, lineHeight:1.4 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
