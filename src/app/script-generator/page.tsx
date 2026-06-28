'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

const LANGUAGES = [
  'Română','English','Français','Español','Deutsch','Italiano',
  'Português','Русский','日本語','中文','한국어','Arabic','Hindi',
  'Nederlands','Polski','Svenska','Dansk','Norsk','Čeština','Magyar',
]

const STYLES = [
  { key:'educational', label:'📚 Educativ', desc:'Informativ, explicații clare' },
  { key:'entertaining', label:'🎭 Distractiv', desc:'Energic, umor, storytelling' },
  { key:'motivational', label:'💪 Motivațional', desc:'Inspirațional, call to action' },
  { key:'documentary', label:'🎬 Documentar', desc:'Narativ, facts, ton serios' },
  { key:'tutorial', label:'🛠️ Tutorial', desc:'Pas cu pas, instrucțiuni' },
  { key:'vlog', label:'📱 Vlog', desc:'Personal, conversațional' },
]

const DURATIONS = [1,3,5,7,10,15,20,25]

const NICHES = [
  'Tech & AI','Business & Finance','Health & Fitness','Education',
  'Entertainment','Travel','Food & Cooking','Fashion & Beauty',
  'Gaming','Sports','Music','Science','Personal Development','Marketing',
]

function Section({ title, icon, children }: { title:string, icon:string, children:React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden', marginBottom:'12px' }}>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
        <span style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', fontWeight:700, color:'var(--text)' }}>
          <span>{icon}</span>{title}
        </span>
        <span style={{ color:'var(--text3)', fontSize:'12px', transform:open?'rotate(180deg)':'none', transition:'transform .2s' }}>▼</span>
      </button>
      {open && <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)' }}>{children}</div>}
    </div>
  )
}

export default function ScriptGenerator() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [title, setTitle]       = useState('')
  const [keywords, setKeywords] = useState('')
  const [language, setLanguage] = useState('Română')
  const [duration, setDuration] = useState(5)
  const [style, setStyle]       = useState('educational')
  const [niche, setNiche]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [output, setOutput]     = useState('')
  const [copied, setCopied]     = useState('')
  const outputRef = useRef<HTMLPreElement>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (status==='unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => { if(outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight }, [output])

  if (!mounted || !session) return null

  const plan = (session.user as any)?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE'

  // Parse secțiuni din output
  const sections = {
    titluri: output.match(/---TITLURI---\n([\s\S]*?)(?=---HOOK---|$)/)?.[1]?.trim() || '',
    hook:    output.match(/---HOOK---\n([\s\S]*?)(?=---SCRIPT---|$)/)?.[1]?.trim() || '',
    script:  output.match(/---SCRIPT---\n([\s\S]*?)(?=---DESCRIERE---|$)/)?.[1]?.trim() || '',
    descriere: output.match(/---DESCRIERE---\n([\s\S]*?)(?=---EDITARE---|$)/)?.[1]?.trim() || '',
    editare: output.match(/---EDITARE---\n([\s\S]*?)(?=---TOP_TITLURI---|$)/)?.[1]?.trim() || '',
    topTitluri: output.match(/---TOP_TITLURI---\n([\s\S]*?)$/)?.[1]?.trim() || '',
  }

  async function generate() {
    if (!title || !keywords) return
    if (!isPro) return
    setLoading(true); setOutput('')
    try {
      const res = await fetch('/api/generate-script', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ title, keywords, language, duration, style, niche }),
      })
      if (!res.ok || !res.body) { setOutput('Eroare la generare.'); setLoading(false); return }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setOutput(prev => prev + decoder.decode(value, { stream:true }))
      }
    } catch(e) { setOutput(`Eroare: ${e}`) }
    setLoading(false)
  }

  function copySection(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(()=>setCopied(''), 2000)
  }

  function downloadAll() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([output], {type:'text/plain'}))
    a.download = `${title || 'script'}.txt`
    a.click()
  }

  const inp: React.CSSProperties = {
    width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
    borderRadius:'10px', padding:'11px 14px', color:'var(--text)', fontSize:'14px',
    fontFamily:'Inter,sans-serif', outline:'none'
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'Inter,sans-serif', position:'relative', overflow:'hidden' }}>
      <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,8,16,0.88)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div className="nav-line"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <span className="font-display" onClick={()=>router.push('/')} style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-.02em', cursor:'pointer' }}>
              Scribe<span style={{color:'var(--gold)'}}>AI</span>
            </span>
            <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'100px', background:'var(--goldbg)', border:'1px solid var(--goldbdr)', color:'var(--gold)', fontWeight:700 }}>✦ Script Generator</span>
          </div>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <span style={{ padding:'4px 11px', borderRadius:'100px', fontSize:'11px', fontWeight:700,
              background: isPro?'rgba(139,92,246,.1)':'var(--tealbg)',
              border: `1px solid ${isPro?'rgba(139,92,246,.3)':'var(--tealbdr)'}`,
              color: isPro?'var(--violet)':'var(--teal)' }}>{plan}</span>
            <button onClick={()=>router.push('/app')} style={{ padding:'6px 14px', borderRadius:'7px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>← App</button>
            <button onClick={()=>signOut({callbackUrl:'/'})} style={{ padding:'6px 14px', borderRadius:'7px', background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.18)', color:'#FCA5A5', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>Ieșire</button>
          </div>
        </div>
      </nav>

      {!isPro ? (
        // PRO gate
        <div style={{ maxWidth:'500px', margin:'100px auto', padding:'0 20px', textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--goldbdr)', borderRadius:'20px', padding:'48px 32px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }}/>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>✦</div>
            <h2 className="font-display" style={{ fontSize:'24px', fontWeight:700, marginBottom:'12px' }}>Feature Pro</h2>
            <p style={{ color:'var(--text2)', fontSize:'15px', lineHeight:1.6, marginBottom:'28px' }}>
              Script Generator AI este disponibil exclusiv pentru utilizatorii Pro. Generează scripturi complete, titluri optimizate SEO și sugestii de editare cu un singur click.
            </p>
            <a href="/pricing" style={{ display:'inline-block', padding:'14px 32px', borderRadius:'10px', background:'linear-gradient(135deg,var(--gold),var(--gold2))', color:'#0A0800', fontSize:'15px', fontWeight:700, textDecoration:'none' }}>
              ⚡ Upgrade la Pro — $19/lună
            </a>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'28px 20px 80px', position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'420px 1fr', gap:'20px', alignItems:'start' }}>

          {/* LEFT — Form */}
          <div style={{ position:'sticky', top:'76px' }}>
            <div style={{ background:'var(--bg2)', border:'1px solid rgba(139,92,246,.2)', borderRadius:'18px', padding:'24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(139,92,246,.5),rgba(240,196,68,.3),transparent)' }}/>

              <h2 className="font-display" style={{ fontSize:'18px', fontWeight:700, marginBottom:'20px', letterSpacing:'-.01em' }}>✦ Configurează scriptul</h2>

              {/* Titlu */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'7px' }}>Subiect / Titlu video *</label>
                <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Cum să faci bani online în 2026"
                  style={inp} onFocus={e=>e.target.style.borderColor='rgba(139,92,246,.5)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}/>
              </div>

              {/* Keywords */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'7px' }}>Keywords principale *</label>
                <input value={keywords} onChange={e=>setKeywords(e.target.value)} placeholder="Ex: bani online, freelancing, venituri pasive"
                  style={inp} onFocus={e=>e.target.style.borderColor='rgba(139,92,246,.5)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}/>
                <p style={{ fontSize:'11px', color:'var(--text3)', marginTop:'4px' }}>Separă keywords cu virgulă</p>
              </div>

              {/* Nișă */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'7px' }}>Nișă / Categorie</label>
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                  {NICHES.map(n => (
                    <button key={n} type="button" onClick={()=>setNiche(niche===n?'':n)}
                      style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif',
                        background: niche===n?'rgba(139,92,246,.15)':'var(--surface)',
                        border: `1px solid ${niche===n?'rgba(139,92,246,.4)':'var(--border)'}`,
                        color: niche===n?'var(--violet)':'var(--text3)' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limbă */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'7px' }}>Limbă script</label>
                <select value={language} onChange={e=>setLanguage(e.target.value)}
                  style={{ ...inp, cursor:'pointer' }}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Durată */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'7px' }}>
                  Durată video: <span style={{ color:'var(--violet)', fontWeight:700 }}>{duration} minute</span>
                </label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'5px' }}>
                  {DURATIONS.map(d => (
                    <button key={d} type="button" onClick={()=>setDuration(d)}
                      style={{ padding:'8px 4px', borderRadius:'8px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'center',
                        background: duration===d?'rgba(139,92,246,.15)':'var(--surface)',
                        border: `1px solid ${duration===d?'rgba(139,92,246,.4)':'var(--border)'}`,
                        color: duration===d?'var(--violet)':'var(--text3)' }}>
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Stil */}
              <div style={{ marginBottom:'24px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--text3)', marginBottom:'7px' }}>Stil video</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {STYLES.map(s => (
                    <button key={s.key} type="button" onClick={()=>setStyle(s.key)}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'9px', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left',
                        background: style===s.key?'rgba(139,92,246,.12)':'var(--surface)',
                        border: `1px solid ${style===s.key?'rgba(139,92,246,.35)':'var(--border)'}` }}>
                      <span style={{ fontSize:'16px' }}>{s.label.split(' ')[0]}</span>
                      <div>
                        <p style={{ fontSize:'12px', fontWeight:600, color: style===s.key?'var(--violet)':'var(--text)', margin:0 }}>{s.label.split(' ').slice(1).join(' ')}</p>
                        <p style={{ fontSize:'11px', color:'var(--text3)', margin:0 }}>{s.desc}</p>
                      </div>
                      {style===s.key && <span style={{ marginLeft:'auto', color:'var(--violet)', fontSize:'14px' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button onClick={generate} disabled={loading||!title||!keywords}
                style={{ width:'100%', padding:'15px', borderRadius:'11px', border:'none', cursor: loading||!title||!keywords?'not-allowed':'pointer',
                  background: loading||!title||!keywords?'rgba(139,92,246,.1)':'linear-gradient(135deg,var(--violet2),var(--indigo))',
                  color: loading||!title||!keywords?'var(--text3)':'white',
                  fontSize:'15px', fontWeight:700, fontFamily:'Inter,sans-serif',
                  boxShadow: loading||!title||!keywords?'none':'0 4px 20px rgba(139,92,246,.3)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', position:'relative', overflow:'hidden' }}>
                {!loading && !(!title||!keywords) && <span style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'rgba(255,255,255,.2)' }}/>}
                {loading ? (
                  <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg> Generez scriptul...</>
                ) : '✦ Generează script complet'}
              </button>

              {loading && (
                <p style={{ textAlign:'center', fontSize:'12px', color:'var(--text3)', marginTop:'10px' }}>
                  Claude AI scrie scriptul tău... ~30-60 secunde
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — Output */}
          <div>
            {!output && !loading && (
              <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--text3)' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px', opacity:.5 }}>✦</div>
                <p style={{ fontSize:'18px', fontWeight:600, marginBottom:'8px', color:'var(--text2)' }}>Scriptul tău apare aici</p>
                <p style={{ fontSize:'14px' }}>Completează formularul și apasă "Generează script complet"</p>
              </div>
            )}

            {(output || loading) && (
              <div>
                {/* Actions bar */}
                {output && (
                  <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
                    <button onClick={downloadAll}
                      style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.3)', color:'var(--violet)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                      ↓ Descarcă tot (.txt)
                    </button>
                    <button onClick={()=>copySection(output,'all')}
                      style={{ padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:600, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                      {copied==='all'?'✓ Copiat':'⎘ Copiază tot'}
                    </button>
                  </div>
                )}

                {/* Secțiuni parsed */}
                {sections.titluri && (
                  <div style={{ background:'var(--bg2)', border:'1px solid var(--goldbdr)', borderRadius:'14px', padding:'20px', marginBottom:'12px', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,var(--gold),transparent)' }}/>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <h3 style={{ fontSize:'13px', fontWeight:700, color:'var(--gold)' }}>🏆 Titluri YouTube Optimizate</h3>
                      <button onClick={()=>copySection(sections.titluri,'titluri')}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', background:'var(--goldbg)', border:'1px solid var(--goldbdr)', color:'var(--gold)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        {copied==='titluri'?'✓':'⎘'}
                      </button>
                    </div>
                    <pre style={{ fontSize:'13px', lineHeight:1.8, color:'var(--text2)', whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>{sections.titluri}</pre>
                  </div>
                )}

                {sections.hook && (
                  <div style={{ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.2)', borderRadius:'14px', padding:'20px', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <h3 style={{ fontSize:'13px', fontWeight:700, color:'#F87171' }}>⚡ Hook (primele 30 secunde)</h3>
                      <button onClick={()=>copySection(sections.hook,'hook')}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#F87171', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        {copied==='hook'?'✓':'⎘'}
                      </button>
                    </div>
                    <p style={{ fontSize:'13px', lineHeight:1.8, color:'var(--text2)', margin:0 }}>{sections.hook}</p>
                  </div>
                )}

                {sections.script && (
                  <div style={{ background:'var(--bg2)', border:'1px solid rgba(139,92,246,.2)', borderRadius:'14px', padding:'20px', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <h3 style={{ fontSize:'13px', fontWeight:700, color:'var(--violet)' }}>📝 Script Complet ({duration} minute)</h3>
                      <button onClick={()=>copySection(sections.script,'script')}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', background:'rgba(139,92,246,.1)', border:'1px solid rgba(139,92,246,.2)', color:'var(--violet)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        {copied==='script'?'✓':'⎘'}
                      </button>
                    </div>
                    <pre style={{ fontSize:'13px', lineHeight:1.9, color:'var(--text2)', whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0, maxHeight:'600px', overflowY:'auto' }}>{sections.script}</pre>
                  </div>
                )}

                {sections.descriere && (
                  <div style={{ background:'rgba(45,212,191,.06)', border:'1px solid rgba(45,212,191,.2)', borderRadius:'14px', padding:'20px', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <h3 style={{ fontSize:'13px', fontWeight:700, color:'var(--teal)' }}>📋 Descriere YouTube SEO</h3>
                      <button onClick={()=>copySection(sections.descriere,'descriere')}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', background:'rgba(45,212,191,.1)', border:'1px solid rgba(45,212,191,.2)', color:'var(--teal)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        {copied==='descriere'?'✓':'⎘'}
                      </button>
                    </div>
                    <pre style={{ fontSize:'13px', lineHeight:1.8, color:'var(--text2)', whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>{sections.descriere}</pre>
                  </div>
                )}

                {sections.editare && (
                  <div style={{ background:'rgba(244,114,182,.06)', border:'1px solid rgba(244,114,182,.2)', borderRadius:'14px', padding:'20px', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <h3 style={{ fontSize:'13px', fontWeight:700, color:'#F472B6' }}>🎬 Sugestii Editare Video</h3>
                      <button onClick={()=>copySection(sections.editare,'editare')}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', background:'rgba(244,114,182,.1)', border:'1px solid rgba(244,114,182,.2)', color:'#F472B6', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        {copied==='editare'?'✓':'⎘'}
                      </button>
                    </div>
                    <pre style={{ fontSize:'13px', lineHeight:1.8, color:'var(--text2)', whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>{sections.editare}</pre>
                  </div>
                )}

                {sections.topTitluri && (
                  <div style={{ background:'linear-gradient(135deg,rgba(139,92,246,.08),rgba(240,196,68,.05))', border:'1px solid rgba(139,92,246,.25)', borderRadius:'14px', padding:'20px', marginBottom:'12px', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,var(--violet),var(--gold),transparent)' }}/>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <h3 style={{ fontSize:'13px', fontWeight:700, color:'var(--text)' }}>🥇 Top 3 Titluri Finale Recomandate</h3>
                      <button onClick={()=>copySection(sections.topTitluri,'top')}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                        {copied==='top'?'✓':'⎘'}
                      </button>
                    </div>
                    <pre style={{ fontSize:'13px', lineHeight:1.8, color:'var(--text2)', whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0 }}>{sections.topTitluri}</pre>
                  </div>
                )}

                {/* Raw output dacă nu s-au parsat secțiunile */}
                {output && !sections.titluri && (
                  <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px' }}>
                    <pre ref={outputRef} style={{ fontSize:'13px', lineHeight:1.8, color:'var(--text2)', whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0, maxHeight:'600px', overflowY:'auto' }}>{output}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
