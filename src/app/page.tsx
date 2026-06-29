'use client'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Landing() {
  const { data: session } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (session) router.push('/app') }, [session, router])

  if (!mounted) return null

  const features = [
    { icon: '▶', title: 'Transcript instant', desc: 'Extrage textul complet al oricărui video YouTube în câteva secunde. Detectează automat limba.', badge: 'FREE', badgeColor: '#0CCFB0' },
    { icon: '✦', title: 'Traducere AI', desc: 'Traduce și restructurează transcriptul în orice din cele 32 de limbi suportate. Formatat, cu rezumat.', badge: 'FREE', badgeColor: '#0CCFB0' },
    { icon: '📝', title: 'Script AI complet', desc: 'Generează din zero sau rescrie: hook, script, SEO, titluri virale și descriere YouTube optimizată.', badge: 'PRO', badgeColor: '#F59E0B' },
    { icon: '🎨', title: 'Thumbnail Generator', desc: 'Concepte AI cu Flux 1.1 Pro + overlay text personalizat. Gata pentru upload direct pe YouTube.', badge: 'PRO', badgeColor: '#F59E0B' },
    { icon: '⚡', title: 'Batch Processing', desc: 'Procesează 3 video-uri simultan. Perfect pentru canale cu output ridicat de conținut.', badge: 'PRO', badgeColor: '#F59E0B' },
    { icon: '⬡', title: 'Export & Integrări', desc: 'Export .md și .docx. Integrare Trello. Share link public pentru colaborare cu echipa.', badge: 'PRO', badgeColor: '#F59E0B' },
  ]

  const plans = [
    {
      name: 'Free', price: '$0', sub: 'pentru totdeauna', popular: false,
      features: ['3 video-uri / lună', 'Transcript brut', 'Traducere AI', 'Export .txt / .md', 'Copiere în clipboard'],
      locked: ['Script AI complet', 'Thumbnail Generator', 'Batch processing', 'Trello integration'],
      cta: 'Începe gratuit', ctaStyle: 'ghost',
    },
    {
      name: 'Pro', price: '$19', sub: '/lună · anulezi oricând', popular: true,
      features: ['Video-uri nelimitate', 'Script AI + SEO complet', 'Thumbnail Generator AI', 'Batch 3 video-uri simultan', 'Toate modelele AI (5 provideri)', 'Trello + export .docx', 'Chei API proprii', 'Istoric complet + share link'],
      locked: [],
      cta: '⚡ Alege Pro — $19/lună', ctaStyle: 'primary',
    },
    {
      name: 'Enterprise', price: 'Custom', sub: 'pentru echipe & agenții', popular: false,
      features: ['Tot din Pro', 'API access propriu', 'Workspace shared', 'Audit log complet', 'SLA garantat', 'Support dedicat', 'Onboarding personalizat'],
      locked: [],
      cta: 'Contactează-ne', ctaStyle: 'gold',
    },
  ]

  const demoCards = [
    { bg: 'linear-gradient(135deg,#1a0533,#0d1040)', title: '🤖 CE E GROK 4?', sub: 'Cel mai puternic AI din 2025', views: '2.4M views', tag: 'Tech', caption: 'Ce este Grok 4 și de ce sperie Google', time: '18s' },
    { bg: 'linear-gradient(135deg,#0a2010,#0d2a05)', title: 'AM PIERDUT $50,000', sub: 'Iată ce am învățat', views: '890K views', tag: 'Business', caption: 'Greșeala de $50K care mi-a schimbat viața', time: '22s', titleColor: '#4ADE80' },
    { bg: 'linear-gradient(135deg,#1a1000,#2a1500)', title: 'DUBAI 3.0', sub: 'Viitorul e acum', views: '1.2M views', tag: 'Travel', caption: 'Cum arată Dubai-ul în 2025 — tur complet', time: '14s', titleColor: '#FBBF24' },
  ]

  const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#07090F', color: '#E2E8F0', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' },
    nav: { position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 56px', background: 'rgba(7,9,15,.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.07)' },
    logo: { fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' },
    logoAccent: { color: '#7C3AED' },
    navLinks: { display: 'flex', gap: '28px' },
    navLink: { color: 'rgba(255,255,255,.42)', fontSize: '14px', textDecoration: 'none', fontWeight: 500 },
    btnGhost: { padding: '9px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.55)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
    btnMain: { padding: '9px 20px', borderRadius: '8px', background: '#7C3AED', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 0 20px rgba(124,58,237,.35)' },
  }

  return (
    <main style={s.page}>
      {/* Radial bg glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(124,58,237,.2) 0%, transparent 70%)' }}/>
      {/* Grid overlay */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)', backgroundSize: '56px 56px', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 100%)' }}/>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo}>Scribe<span style={s.logoAccent}>AI</span></div>
        <div style={s.navLinks}>
          <a href="#features" style={s.navLink}>Features</a>
          <a href="#demo" style={s.navLink}>Demo</a>
          <a href="#pricing" style={s.navLink}>Prețuri</a>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={s.btnGhost} onClick={() => signIn('google', { callbackUrl: '/app' })}>Log in</button>
          <button style={s.btnMain} onClick={() => signIn('google', { callbackUrl: '/app' })}>Start free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '100px 20px 72px', maxWidth: '860px', margin: '0 auto' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.3)', borderRadius: '100px', padding: '5px 16px', fontSize: '11px', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '28px' }}>
          <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', display: 'inline-block', flexShrink: 0 }}/>
          Claude · Grok · GPT-4o · Gemini · DeepSeek
        </div>

        <h1 className="font-display" style={{ fontSize: 'clamp(42px,6.5vw,84px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.035em', marginBottom: '24px' }}>
          Orice video YouTube<br/>
          în{' '}
          <span style={{ background: 'linear-gradient(135deg,#A5B4FC,#7C3AED,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>script viral</span>
          {' '}în{' '}
          <span style={{ color: '#0CCFB0' }}>secunde</span>
        </h1>

        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,.45)', maxWidth: '540px', margin: '0 auto 44px', lineHeight: 1.7 }}>
          Extrage transcrieri, traduce în 32+ limbi, generează scripturi optimizate SEO și thumbnail-uri AI — totul dintr-un singur URL.
        </p>

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px', padding: '8px 8px 8px 20px', maxWidth: '600px', margin: '0 auto 16px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: .4 }}>
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#FF0000"/>
            <polygon points="9.75,15.02 15.5,12 9.75,8.98" fill="white"/>
          </svg>
          <span style={{ flex: 1, fontSize: '15px', color: 'rgba(255,255,255,.25)', textAlign: 'left' }}>Lipește URL-ul video YouTube...</span>
          <button onClick={() => signIn('google', { callbackUrl: '/app' })} style={{ padding: '12px 24px', borderRadius: '10px', background: '#7C3AED', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(124,58,237,.4)' }}>
            ✦ Generează Script
          </button>
        </div>

        {/* Trust */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', color: 'rgba(255,255,255,.3)', fontSize: '12px' }}>
          {['Fără card de credit', '3 video-uri gratuit', 'Rezultat în < 30 sec'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#0CCFB0', fontWeight: 700 }}>✓</span>{t}
            </span>
          ))}
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.01)' }}>
        {[['127K+', 'Scripturi generate'], ['32', 'Limbi suportate'], ['5', 'Provideri AI'], ['4.9★', 'Rating mediu'], ['<30s', 'Timp procesare']].map(([n, l], i, arr) => (
          <div key={l} style={{ flex: 1, maxWidth: '200px', textAlign: 'center', padding: '22px 8px', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
            <div className="font-display" style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{n}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: '3px' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* DEMO CARDS */}
      <section id="demo" style={{ position: 'relative', zIndex: 1, padding: '80px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#7C3AED', marginBottom: '8px' }}>Văzut în acțiune</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '6px' }}>Mii de creatori îl folosesc</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.38)' }}>Scripturi generate din canale reale, în câteva secunde</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {demoCards.map(c => (
            <div key={c.caption} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', overflow: 'hidden', transition: 'border-color .25s, transform .25s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,.4)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
              {/* Thumbnail */}
              <div style={{ height: '140px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '16px', color: c.titleColor || '#fff', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>
                  {c.title}<br/><span style={{ fontSize: '12px', fontWeight: 500, opacity: .7, color: '#fff' }}>{c.sub}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '7px', right: '9px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.65)', background: 'rgba(0,0,0,.55)', borderRadius: '3px', padding: '2px 6px' }}>{c.views}</div>
              </div>
              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.4, marginBottom: '6px' }}>{c.caption}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>
                  <span style={{ background: 'rgba(12,207,176,.1)', border: '1px solid rgba(12,207,176,.2)', color: '#0CCFB0', fontSize: '9px', fontWeight: 700, borderRadius: '3px', padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{c.tag}</span>
                  generat în {c.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '0 40px 80px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#7C3AED', marginBottom: '8px' }}>Tot ce ai nevoie</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'end' }}>
            <h2 className="font-display" style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 }}>Un tool.<br/>Rezultate profesionale.</h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,.38)', lineHeight: 1.7 }}>De la extracție de transcript brut până la script complet cu hook viral, SEO, capitole și thumbnail — ScribeAI acoperă întreg fluxul de producție al unui creator.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', background: 'rgba(255,255,255,.06)', borderRadius: '16px', overflow: 'hidden' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#090D1A', padding: '30px 24px', transition: 'background .2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(124,58,237,.06)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#090D1A' }}>
              <div style={{ fontSize: '22px', marginBottom: '14px' }}>{f.icon}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '7px', fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.38)', lineHeight: 1.65 }}>{f.desc}</p>
              <span style={{ display: 'inline-block', marginTop: '14px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', borderRadius: '3px', padding: '2px 8px', background: f.badgeColor === '#0CCFB0' ? 'rgba(12,207,176,.1)' : 'rgba(245,158,11,.1)', color: f.badgeColor, border: `1px solid ${f.badgeColor === '#0CCFB0' ? 'rgba(12,207,176,.2)' : 'rgba(245,158,11,.2)'}` }}>{f.badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '0 40px 80px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#7C3AED', marginBottom: '8px' }}>Prețuri</div>
        <h2 className="font-display" style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '10px' }}>Simplu. Transparent.</h2>
        <p style={{ color: 'rgba(255,255,255,.38)', fontSize: '15px', marginBottom: '48px' }}>Începe gratuit, scalează când crești.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'left' }}>
          {plans.map(p => (
            <div key={p.name} style={{ background: 'rgba(255,255,255,.03)', border: p.popular ? '1px solid rgba(124,58,237,.45)' : '1px solid rgba(255,255,255,.07)', borderRadius: '18px', padding: '28px', position: 'relative', transition: 'border-color .2s' }}
              onMouseEnter={e => { if (!p.popular) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,.15)' }}
              onMouseLeave={e => { if (!p.popular) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,.07)' }}>
              {p.popular && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', fontSize: '10px', fontWeight: 700, borderRadius: '100px', padding: '4px 14px', whiteSpace: 'nowrap', letterSpacing: '.04em' }}>
                  🔥 Cel mai popular
                </div>
              )}
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.38)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>{p.name}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: p.price === 'Custom' ? '28px' : '40px', fontWeight: 800, lineHeight: 1, marginBottom: '3px', color: p.popular ? '#A78BFA' : '#fff' }}>{p.price}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', marginBottom: '20px' }}>{p.sub}</div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,.07)', marginBottom: '20px' }}/>
              {p.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,.6)', marginBottom: '8px' }}>
                  <span style={{ color: '#0CCFB0', fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
              {p.locked.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,.2)', marginBottom: '8px' }}>
                  <span style={{ flexShrink: 0 }}>✗</span>{f}
                </div>
              ))}
              <button onClick={() => signIn('google', { callbackUrl: '/app' })} style={{
                width: '100%', marginTop: '20px', padding: '12px', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                ...(p.ctaStyle === 'primary' ? { background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', border: 'none', color: '#fff', boxShadow: '0 4px 20px rgba(124,58,237,.4)' }
                  : p.ctaStyle === 'gold' ? { background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: '#F59E0B' }
                  : { background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.55)' })
              }}>{p.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ position: 'relative', zIndex: 1, margin: '0 40px 80px', borderRadius: '20px', background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)', padding: '72px 40px', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(124,58,237,.1), transparent)', pointerEvents: 'none' }}/>
        <h2 className="font-display" style={{ position: 'relative', fontSize: 'clamp(26px,4vw,50px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '14px' }}>Gata să creezi mai rapid?</h2>
        <p style={{ position: 'relative', color: 'rgba(255,255,255,.42)', fontSize: '17px', marginBottom: '36px' }}>Alătură-te a mii de creatori care economisesc 5+ ore pe săptămână cu ScribeAI.</p>
        <div style={{ position: 'relative', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => signIn('google', { callbackUrl: '/app' })} style={{ padding: '15px 34px', borderRadius: '11px', background: '#7C3AED', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 28px rgba(124,58,237,.45)' }}>
            ✦ Încearcă gratuit
          </button>
          <a href="#demo" style={{ padding: '15px 28px', borderRadius: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,.14)', color: 'rgba(255,255,255,.65)', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Vezi demo →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '24px 56px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Scribe<span style={{ color: '#7C3AED' }}>AI</span></div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Termeni', 'Confidențialitate', 'Contact', 'API'].map(l => (
            <a key={l} href="#" style={{ color: 'rgba(255,255,255,.25)', fontSize: '12px', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.2)' }}>© 2025 ScribeAI. Toate drepturile rezervate.</div>
      </footer>
    </main>
  )
}
