'use client'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Landing() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState<string|null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (session) router.push('/app') }, [session, router])

  if (!mounted) return null

  const features = [
    { icon: '▶', title: 'Transcript instant', desc: 'Extrage subtitrarile din orice video YouTube în secunde.', color: '#2DD4BF', bg: 'rgba(45,212,191,0.08)', border: 'rgba(45,212,191,0.2)' },
    { icon: '✦', title: 'Traducere AI', desc: 'Claude, GPT-4 sau Gemini traduce în 32+ limbi în timp real.', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
    { icon: '⬡', title: 'Publică pe Trello', desc: 'Card creat automat cu rezumat și secțiuni formatate.', color: '#38BDF8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)' },
    { icon: '↓', title: 'Descarcă media', desc: 'MP4 sau MP3 direct din browser, fără aplicații externe.', color: '#F472B6', bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.2)' },
    { icon: '🔑', title: 'Chei API proprii', desc: 'Conectează propriile chei și reduce costul la zero.', color: '#F0C444', bg: 'rgba(240,196,68,0.08)', border: 'rgba(240,196,68,0.2)' },
    { icon: '⚡', title: 'Prompt personalizat', desc: 'Instrucțiuni custom pentru AI — "rescrie ca articol".', color: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
  ]

  const plans = [
    { name:'Free', price:'$0', sub:'pentru totdeauna', color:'#2DD4BF', border:'rgba(45,212,191,0.2)', bg:'rgba(45,212,191,0.04)', popular:false,
      features:['3 video-uri / lună','Transcript brut','Traducere AI','Export .txt / .md'],
      locked:['Trello integration','Download video/audio','Chei API proprii','Prompt personalizat'] },
    { name:'Pro', price:'$19', sub:'per lună', color:'#8B5CF6', border:'rgba(139,92,246,0.4)', bg:'rgba(139,92,246,0.06)', popular:true,
      features:['Video-uri nelimitate','Toate modurile AI','32+ limbi','Trello + Download','Chei API proprii','Prompt personalizat','Istoric complet'],
      locked:[] },
    { name:'Enterprise', price:'Custom', sub:'contact', color:'#F0C444', border:'rgba(240,196,68,0.2)', bg:'rgba(240,196,68,0.04)', popular:false,
      features:['Tot din Pro','Echipe nelimitate','API access propriu','SLA garantat','Support dedicat'],
      locked:[] },
  ]

  return (
    <main style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'Inter,sans-serif', position:'relative', overflow:'hidden' }}>
      <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,8,16,0.8)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="nav-line"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 48px', maxWidth:'1100px', margin:'0 auto' }}>
          <div className="font-display" style={{ fontSize:'22px', fontWeight:700, letterSpacing:'-0.02em' }}>
            Scribe<span style={{ color:'var(--gold)' }}>AI</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'28px' }}>
            <a href="#features" style={{ color:'var(--text3)', fontSize:'14px', textDecoration:'none', fontWeight:500 }}>Features</a>
            <a href="#pricing" style={{ color:'var(--text3)', fontSize:'14px', textDecoration:'none', fontWeight:500 }}>Prețuri</a>
            <button onClick={() => signIn('google', { callbackUrl:'/app' })}
              style={{ padding:'9px 22px', borderRadius:'8px', background:'linear-gradient(135deg,var(--violet2),var(--indigo))', color:'white', fontSize:'14px', fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 4px 20px rgba(139,92,246,0.3)' }}>
              Începe gratuit
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign:'center', padding:'110px 20px 80px', maxWidth:'820px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'28px', padding:'6px 16px', borderRadius:'100px', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)' }}>
          <span className="pulse" style={{ width:6, height:6, borderRadius:'50%', background:'var(--violet)', display:'inline-block' }}/>
          <span style={{ fontSize:'11px', color:'var(--violet)', fontWeight:600, letterSpacing:'.07em' }}>POWERED BY CLAUDE · GPT-4 · GEMINI · DEEPSEEK</span>
        </div>

        <h1 className="font-display" style={{ fontSize:'clamp(38px,7vw,78px)', fontWeight:700, letterSpacing:'-0.04em', lineHeight:1.0, marginBottom:'24px' }}>
          <span style={{ color:'var(--text)' }}>Orice video YouTube</span>
          <br/>
          <span style={{ background:'linear-gradient(135deg,var(--violet),var(--gold))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            devine script perfect
          </span>
        </h1>

        <p style={{ fontSize:'18px', color:'var(--text2)', lineHeight:1.7, maxWidth:'500px', margin:'0 auto 48px' }}>
          Extrage, traduce în 32+ limbi cu AI și publică automat pe Trello — în secunde, nu ore.
        </p>

        <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'20px' }}>
          <button onClick={() => signIn('google', { callbackUrl:'/app' })}
            style={{ padding:'16px 36px', borderRadius:'10px', background:'linear-gradient(135deg,var(--violet2),var(--indigo))', color:'white', fontSize:'16px', fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 8px 32px rgba(139,92,246,0.3)', position:'relative', overflow:'hidden' }}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'rgba(255,255,255,0.2)' }}/>
            🚀 Începe gratuit cu Google
          </button>
          <a href="#features" style={{ padding:'16px 36px', borderRadius:'10px', background:'var(--surface)', border:'1px solid var(--border2)', color:'var(--text2)', fontSize:'16px', fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
            Cum funcționează ↓
          </a>
        </div>
        <p style={{ fontSize:'13px', color:'var(--text3)' }}>3 video-uri gratuit · Fără card de credit · Anulezi oricând</p>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:'rgba(255,255,255,0.06)', borderRadius:'16px', overflow:'hidden', margin:'60px auto 0', maxWidth:'700px' }}>
          {[['32+','Limbi'],['4','Modele AI'],['< 30s','Timp mediu'],['100%','Securizat']].map(([v,l]) => (
            <div key={l} style={{ background:'var(--bg2)', padding:'22px 16px', textAlign:'center' }}>
              <p className="font-display" style={{ fontSize:'28px', fontWeight:700, background:'linear-gradient(135deg,var(--violet),var(--gold))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'4px' }}>{v}</p>
              <p style={{ fontSize:'12px', color:'var(--text3)' }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ position:'relative', zIndex:1, maxWidth:'1000px', margin:'0 auto', padding:'40px 20px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <p style={{ fontSize:'11px', color:'var(--violet)', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'10px' }}>FEATURES</p>
          <h2 className="font-display" style={{ fontSize:'clamp(26px,4vw,44px)', fontWeight:700, letterSpacing:'-0.03em' }}>Tot ce ai nevoie, într-un singur loc</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:'12px' }}>
          {features.map(f => (
            <div key={f.title} style={{ background:f.bg, border:`1px solid ${f.border}`, borderRadius:'16px', padding:'28px 24px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg,transparent,${f.color}55,transparent)` }}/>
              <div style={{ width:'42px', height:'42px', borderRadius:'10px', background:`${f.color}15`, border:`1px solid ${f.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:f.color, marginBottom:'14px' }}>{f.icon}</div>
              <p style={{ fontWeight:600, fontSize:'15px', marginBottom:'7px' }}>{f.title}</p>
              <p style={{ fontSize:'13px', color:'var(--text2)', lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ position:'relative', zIndex:1, maxWidth:'950px', margin:'0 auto', padding:'40px 20px 100px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <p style={{ fontSize:'11px', color:'var(--violet)', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'10px' }}>PREȚURI</p>
          <h2 className="font-display" style={{ fontSize:'clamp(26px,4vw,44px)', fontWeight:700, letterSpacing:'-0.03em' }}>Simplu și transparent</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:'14px' }}>
          {plans.map(p => (
            <div key={p.name}
              onMouseEnter={() => setHoveredPlan(p.name)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{ background: p.popular ? 'linear-gradient(180deg,rgba(139,92,246,0.1) 0%,var(--bg2) 60%)' : p.bg, border:`1px solid ${hoveredPlan===p.name ? p.color+'66' : p.border}`, borderRadius:'20px', padding:'32px', position:'relative', overflow:'hidden', transition:'border-color .2s' }}>
              {p.popular && <>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,var(--violet),var(--gold),transparent)' }}/>
                <span style={{ position:'absolute', top:'18px', right:'18px', fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'100px', background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.3)', color:'var(--violet)', letterSpacing:'.05em' }}>POPULAR</span>
              </>}
              <p className="font-display" style={{ fontWeight:700, fontSize:'14px', color:p.color, marginBottom:'8px' }}>{p.name}</p>
              <div style={{ marginBottom:'6px', display:'flex', alignItems:'baseline', gap:'6px' }}>
                <span className="font-display" style={{ fontSize:'44px', fontWeight:700, color:'var(--text)' }}>{p.price}</span>
                <span style={{ fontSize:'13px', color:'var(--text3)' }}>{p.sub}</span>
              </div>
              <div style={{ height:'1px', background:'var(--border)', margin:'20px 0' }}/>
              <div style={{ display:'flex', flexDirection:'column', gap:'9px', marginBottom:'24px' }}>
                {p.features.map(f => (
                  <span key={f} style={{ fontSize:'13px', color:'var(--text2)', display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ color:p.color, fontSize:'11px', flexShrink:0 }}>✓</span>{f}
                  </span>
                ))}
                {p.locked.map(f => (
                  <span key={f} style={{ fontSize:'13px', color:'var(--text3)', display:'flex', alignItems:'center', gap:'8px', opacity:.45 }}>
                    <span style={{ fontSize:'11px', flexShrink:0 }}>✗</span>{f}
                  </span>
                ))}
              </div>
              <button onClick={() => signIn('google', { callbackUrl:'/app' })}
                style={{ width:'100%', padding:'13px', borderRadius:'10px', cursor:'pointer', fontSize:'14px', fontWeight:700, border:'none', position:'relative', overflow:'hidden',
                  background: p.popular ? 'linear-gradient(135deg,var(--violet2),var(--indigo))' : 'var(--surface2)',
                  color: p.popular ? 'white' : 'var(--text2)',
                  boxShadow: p.popular ? '0 4px 20px rgba(139,92,246,0.3)' : 'none' }}>
                {p.popular && <span style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'rgba(255,255,255,0.2)' }}/>}
                {p.name==='Free'?'Începe gratuit':p.name==='Pro'?'⚡ Alege Pro':'Contactează-ne'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ position:'relative', zIndex:1, textAlign:'center', padding:'0 20px 120px' }}>
        <div className="shimmer-line" style={{ maxWidth:'500px', margin:'0 auto 60px', opacity:.5 }}/>
        <h2 className="font-display" style={{ fontSize:'clamp(28px,5vw,56px)', fontWeight:700, letterSpacing:'-0.03em', marginBottom:'20px' }}>
          Gata să transformi<br/>
          <span style={{ background:'linear-gradient(135deg,var(--violet),var(--gold))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            orice video în conținut?
          </span>
        </h2>
        <button onClick={() => signIn('google', { callbackUrl:'/app' })}
          style={{ padding:'18px 42px', borderRadius:'12px', background:'linear-gradient(135deg,var(--violet2),var(--indigo))', color:'white', fontSize:'17px', fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 8px 40px rgba(139,92,246,0.3)', position:'relative', overflow:'hidden' }}>
          <span style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'rgba(255,255,255,0.2)' }}/>
          🚀 Începe gratuit — 3 video-uri incluse
        </button>
        <p style={{ marginTop:'14px', fontSize:'13px', color:'var(--text3)' }}>Fără card de credit · Anulezi oricând</p>
      </section>

      <footer style={{ position:'relative', zIndex:1, borderTop:'1px solid var(--border)', padding:'26px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <span className="font-display" style={{ fontSize:'18px', fontWeight:700 }}>Scribe<span style={{ color:'var(--gold)' }}>AI</span></span>
        <span style={{ fontSize:'12px', color:'var(--text3)' }}>© 2026 ScribeAI · Toate drepturile rezervate</span>
      </footer>
    </main>
  )
}
