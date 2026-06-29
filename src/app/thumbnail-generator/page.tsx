'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const STYLES = ['Dramatic','Minimal','Colorat','Profesional','Gaming','Tutorial','Motivațional','Documentary']
const NICHES = ['Tech & AI','Business & Finance','Gaming','Education','Entertainment','Fitness & Health','Travel','Food & Cooking','Music','Personal Development','Marketing','Science']
const AI_SUGGESTIONS = [
  'Față șocată + cifră mare în roșu + fundal întunecat dramatic',
  'Before/After split screen cu transformare vizuală clară',
  'Text FOMO mare + fundal gradient violet + element curiozitate',
  'Contrast maxim alb/negru + titlu simplu dar puternic',
  'Persoană arătând spre text + expresie surprinsă + culori vibrante',
  'Close-up față cu emoție intensă + text overlay bold',
  'Grafic/chart spectaculos + cifre mari + fundal profesional',
  'Înainte/după transformare + săgeată roșie + rezultat șocant',
]

export default function ThumbnailGenerator() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [hookText, setHookText] = useState('')
  const [style, setStyle] = useState('Dramatic')
  const [niche, setNiche] = useState('Tech & AI')
  const [inspireUrl, setInspireUrl] = useState('')
  const [variants, setVariants] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingIdx, setLoadingIdx] = useState<number[]>([])
  const [results, setResults] = useState<{url:string, prompt:string}[]>([])
  const [error, setError] = useState('')
  const [thumbsUsed, setThumbsUsed] = useState(0)
  const FREE_LIMIT = 3

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => {
    if (session) {
      const used = parseInt(localStorage.getItem(`thumbs_${session.user?.email}`) || '0')
      setThumbsUsed(used)
    }
  }, [session])

  if (!mounted || !session) return null

  const plan = (session.user as any)?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE'
  const thumbsLeft = isPro ? 999 : Math.max(0, FREE_LIMIT - thumbsUsed)
  const canGenerate = thumbsLeft > 0 || isPro

  async function generateThumbnails() {
    if (!prompt && !hookText) return
    if (!canGenerate) return
    setLoading(true); setError(''); setResults([])
    const idxArr = Array.from({length: variants}, (_,i) => i)
    setLoadingIdx(idxArr)

    try {
      const fullPrompt = `${style} YouTube thumbnail${niche ? ` for ${niche}` : ''}${hookText ? `, text overlay: "${hookText}"` : ''}. ${prompt}. High contrast, vibrant, professional, 16:9 ratio.`

      const generated: {url:string, prompt:string}[] = []
      for (let i = 0; i < variants; i++) {
        setLoadingIdx(idxArr.slice(i))
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: fullPrompt, width: 1280, height: 720 })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Eroare generare')
        generated.push({ url: data.imageUrl, prompt: fullPrompt })
      }

      setResults(generated)
      if (!isPro) {
        const newUsed = thumbsUsed + variants
        setThumbsUsed(newUsed)
        localStorage.setItem(`thumbs_${session?.user?.email}`, String(newUsed))
      }
    } catch(e: any) {
      setError(e.message)
    }
    setLoading(false); setLoadingIdx([])
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
            {!isPro && (
              <span style={{ fontSize:'12px', color:'var(--text3)' }}>
                {thumbsLeft > 0 ? `${thumbsLeft} thumbnail${thumbsLeft !== 1 ? '-uri' : ''} gratuit${thumbsLeft !== 1 ? 'e' : ''}` : 'Limită atinsă'}
              </span>
            )}
            <span style={{ padding:'4px 11px', borderRadius:'100px', fontSize:'11px', fontWeight:700,
              background: isPro?'rgba(139,92,246,.1)':'var(--tealbg)',
              border: `1px solid ${isPro?'rgba(139,92,246,.3)':'var(--tealbdr)'}`,
              color: isPro?'var(--violet)':'var(--teal)' }}>{plan}</span>
            <button onClick={()=>router.push('/app')} style={{ padding:'6px 14px', borderRadius:'7px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>← App</button>
            <button onClick={()=>signOut({callbackUrl:'/'})} style={{ padding:'6px 14px', borderRadius:'7px', background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.18)', color:'#FCA5A5', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>Ieșire</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'28px 20px 80px', position:'relative', zIndex:1 }}>

        {/* PRO gate dacă Free și fără credite */}
        {!canGenerate && !isPro && (
          <div style={{ textAlign:'center', padding:'48px 20px', background:'var(--goldbg)', border:'1px solid var(--goldbdr)', borderRadius:'16px', marginBottom:'24px' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🖼️</div>
            <h2 className="font-display" style={{ fontSize:'22px', fontWeight:700, marginBottom:'8px' }}>Ai folosit cele 3 thumbnail-uri gratuite</h2>
            <p style={{ fontSize:'14px', color:'var(--text2)', marginBottom:'20px' }}>Upgradează la Pro pentru thumbnail-uri nelimitate cu Flux AI.</p>
            <a href="/pricing" style={{ display:'inline-block', padding:'12px 28px', borderRadius:'10px', background:'linear-gradient(135deg,var(--gold),var(--gold2))', color:'#0A0800', fontWeight:700, textDecoration:'none', fontSize:'14px' }}>
              ⚡ Upgrade la Pro — $19/lună
            </a>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:'18px', alignItems:'start' }}>

          {/* ── FORM ── */}
          <div style={{ background:'var(--bg2)', border:'1px solid rgba(240,196,68,.15)', borderRadius:'16px', padding:'20px', display:'flex', flexDirection:'column', gap:'14px', position:'sticky', top:'76px' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,var(--gold),transparent)', borderRadius:'16px 16px 0 0' }}/>

            <h2 className="font-display" style={{ fontSize:'16px', fontWeight:700, margin:0 }}>🖼️ Configurează thumbnail-ul</h2>

            {/* Prompt */}
            <div>
              <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Descrie thumbnail-ul *</label>
              <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} disabled={loading}
                placeholder="Ex: persoană șocată privind laptop, text mare roșu, fundal întunecat dramatic..."
                style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:'9px', padding:'10px 12px', color:'var(--text)', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', resize:'vertical' }}
                onFocus={e=>e.target.style.borderColor='var(--goldbdr)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}
              />
            </div>

            {/* Hook text */}
            <div>
              <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Text pe thumbnail (hook)</label>
              <input value={hookText} onChange={e=>setHookText(e.target.value)} disabled={loading}
                placeholder='Ex: "NU MAI FACE ASTA" sau "SECRETUL LOR"'
                style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:'9px', padding:'10px 12px', color:'var(--text)', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none' }}
                onFocus={e=>e.target.style.borderColor='var(--goldbdr)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}
              />
            </div>

            {/* Stil */}
            <div>
              <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Stil vizual</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                {STYLES.map(s=>(
                  <button key={s} type="button" onClick={()=>setStyle(s)} disabled={loading}
                    style={{ padding:'7px 6px', borderRadius:'7px', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif',
                      background: style===s?'var(--goldbg)':'var(--surface)',
                      border: `1px solid ${style===s?'var(--goldbdr)':'var(--border)'}`,
                      color: style===s?'var(--gold)':'var(--text3)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Nișă */}
            <div>
              <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>Nișă</label>
              <select value={niche} onChange={e=>setNiche(e.target.value)} disabled={loading}
                style={{ width:'100%', background:'#0C0C18', border:'1px solid rgba(255,255,255,.09)', borderRadius:'9px', padding:'10px 12px', color:'var(--text)', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none', colorScheme:'dark', cursor:'pointer' }}>
                {NICHES.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* URL inspirație */}
            <div>
              <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>URL inspirație (opțional)</label>
              <input value={inspireUrl} onChange={e=>setInspireUrl(e.target.value)} disabled={loading}
                placeholder="https://img.youtube.com/vi/..."
                style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)', borderRadius:'9px', padding:'10px 12px', color:'var(--text)', fontSize:'13px', fontFamily:'Inter,sans-serif', outline:'none' }}
              />
              <p style={{ fontSize:'11px', color:'var(--text3)', marginTop:'4px' }}>AI-ul se inspiră din stilul acestui thumbnail</p>
            </div>

            {/* Variante */}
            <div>
              <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'6px' }}>
                Variante: <span style={{ color:'var(--gold)', fontWeight:700 }}>{variants}</span>
                {!isPro && <span style={{ color:'var(--text3)', fontWeight:400 }}> (max 3 gratuit total)</span>}
              </label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'5px' }}>
                {[1,2,3].map(n=>(
                  <button key={n} type="button" onClick={()=>setVariants(n)} disabled={loading}
                    style={{ padding:'8px', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif',
                      background: variants===n?'var(--goldbg)':'var(--surface)',
                      border: `1px solid ${variants===n?'var(--goldbdr)':'var(--border)'}`,
                      color: variants===n?'var(--gold)':'var(--text3)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Buton */}
            <button onClick={generateThumbnails} disabled={loading||(!prompt&&!hookText)||!canGenerate}
              style={{ width:'100%', padding:'13px', borderRadius:'10px', border:'none', fontFamily:'Inter,sans-serif',
                fontSize:'14px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                cursor: loading||(!prompt&&!hookText)||!canGenerate?'not-allowed':'pointer',
                background: loading||(!prompt&&!hookText)||!canGenerate
                  ?'var(--surface)'
                  :'linear-gradient(135deg,var(--gold),var(--gold2))',
                color: loading||(!prompt&&!hookText)||!canGenerate?'var(--text3)':'#0A0800',
                opacity: loading?0.8:1 }}>
              {loading
                ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#0A0800" strokeWidth="3" strokeLinecap="round"/></svg>Se generează...</>
                : '🎨 Generează thumbnail-uri'
              }
            </button>

            {loading && (
              <p style={{ textAlign:'center', fontSize:'12px', color:'var(--text3)' }}>
                Flux 1.1 Pro generează... ~30-60 sec per imagine
              </p>
            )}

            {error && (
              <div style={{ padding:'10px 12px', background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.2)', borderRadius:'8px', fontSize:'12px', color:'#FCA5A5' }}>
                ❌ {error}
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* Results */}
            {results.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'var(--green)', margin:0 }}>✓ {results.length} thumbnail{results.length > 1 ? '-uri' : ''} generat{results.length > 1 ? 'e' : ''} cu Flux 1.1 Pro</p>
                {results.map((r, i) => (
                  <div key={i} style={{ background:'var(--bg2)', border:'1px solid rgba(240,196,68,.2)', borderRadius:'14px', overflow:'hidden' }}>
                    <img src={r.url} alt={`Thumbnail ${i+1}`} style={{ width:'100%', display:'block' }}/>
                    <div style={{ padding:'12px 14px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
                      <a href={r.url} download={`thumbnail-${i+1}.jpg`} target="_blank" rel="noopener noreferrer"
                        style={{ flex:1, padding:'8px 12px', borderRadius:'8px', background:'linear-gradient(135deg,var(--gold),var(--gold2))', color:'#0A0800', fontSize:'12px', fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                        ↓ Download PNG
                      </a>
                      <button onClick={()=>navigator.clipboard.writeText(r.url)}
                        style={{ padding:'8px 12px', borderRadius:'8px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        ⎘ Copiază URL
                      </button>
                      <button onClick={generateThumbnails}
                        style={{ padding:'8px 12px', borderRadius:'8px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        🔄 Regenerează
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loading placeholders */}
            {loading && loadingIdx.map(i => (
              <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
                <div style={{ aspectRatio:'16/9', background:'var(--surface)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
                  <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(240,196,68,.2)" strokeWidth="3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize:'13px', color:'var(--text3)', margin:0 }}>Flux 1.1 Pro generează varianta {i+1}...</p>
                </div>
              </div>
            ))}

            {/* Placeholder gol */}
            {results.length === 0 && !loading && (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
                <div style={{ aspectRatio:'16/9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', color:'var(--text3)' }}>
                  <span style={{ fontSize:'48px', opacity:.4 }}>🖼️</span>
                  <p style={{ fontSize:'14px', margin:0 }}>Thumbnail-ul apare aici după generare</p>
                  <p style={{ fontSize:'12px', margin:0, opacity:.6 }}>1280 × 720 px · Flux 1.1 Pro</p>
                </div>
              </div>
            )}

            {/* Idei AI */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'16px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 10px' }}>💡 Idei sugerate — click pentru a completa</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {AI_SUGGESTIONS.map((s,i) => (
                  <button key={i} onClick={()=>setPrompt(s)}
                    style={{ padding:'9px 12px', borderRadius:'8px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text2)', fontSize:'12px', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left', transition:'border-color .15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(240,196,68,.3)')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
                    💡 {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div style={{ background:'rgba(139,92,246,.06)', border:'1px solid rgba(139,92,246,.15)', borderRadius:'14px', padding:'14px' }}>
              <p style={{ fontSize:'11px', fontWeight:700, color:'var(--violet)', textTransform:'uppercase', letterSpacing:'.07em', margin:'0 0 8px' }}>🎯 Tips pentru thumbnailuri virale</p>
              {[
                'Folosește maxim 5 cuvinte pe thumbnail — mai puțin = mai impactant',
                'Contrast maxim: text alb pe fundal întunecat sau invers',
                'Fața umană cu emoție puternică crește CTR cu 30%+',
                'Culorile roșu, galben și portocaliu atrag cel mai mult atenția',
                'Thumbnail-ul trebuie să fie lizibil și pe mobil (dimensiune mică)',
                'Creează curiozitate — nu dezvălui tot în thumbnail',
              ].map((t,i) => (
                <p key={i} style={{ fontSize:'12px', color:'var(--text2)', lineHeight:1.5, margin:'0 0 5px' }}>· {t}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
