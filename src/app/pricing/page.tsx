'use client'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Pricing() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <main style={{ minHeight: '100vh', background: '#07090F', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, background: 'linear-gradient(135deg,#A5B4FC,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={() => router.push('/')}>ScribeAI</span>
        {session
          ? <button onClick={() => router.push('/app')} style={{ padding: '9px 20px', borderRadius: '9px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Deschide App</button>
          : <button onClick={() => signIn('google')} style={{ padding: '9px 20px', borderRadius: '9px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Începe gratuit</button>
        }
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '12px' }}>Prețuri simple</h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>Fără surprize. Anulezi oricând.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '16px' }}>
          {[
            {
              name: 'Free', price: '$0', period: '', color: '#10B981', popular: false,
              features: ['3 video-uri / lună', 'Transcript brut', 'Traducere AI', 'Export .txt / .md', 'Copiere în clipboard'],
              locked: ['Trello integration', 'Download video/audio', 'Chei API proprii', 'Istoric nelimitat'],
              cta: 'Începe gratuit', action: () => signIn('google', { callbackUrl: '/app' })
            },
            {
              name: 'Pro', price: '$19', period: '/lună', color: '#6366F1', popular: true,
              features: ['Video-uri nelimitate', 'Transcript + traducere AI', 'Export .txt / .md', '✓ Trello integration', '✓ Download MP4/MP3', '✓ Chei API proprii salvate', '✓ Istoric complet', '✓ Toate modelele AI', '32+ limbi'],
              locked: [],
              cta: 'Alege Pro', action: () => alert('Stripe coming soon! Contactează-ne la contact@scribeai.ro')
            },
            {
              name: 'Enterprise', price: 'Custom', period: '', color: '#F59E0B', popular: false,
              features: ['Tot din Pro', 'Echipe nelimitate', 'API access propriu', 'Workspace shared', 'Audit log', 'SLA garantat', 'Support dedicat', 'Onboarding personalizat'],
              locked: [],
              cta: 'Contactează-ne', action: () => alert('Trimite un email la enterprise@scribeai.ro')
            },
          ].map(p => (
            <div key={p.name} style={{ background: p.popular ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', border: `${p.popular ? '2px' : '1px'} solid ${p.popular ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '18px', padding: '30px', position: 'relative' }}>
              {p.popular && <span style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '4px 16px', borderRadius: '100px', whiteSpace: 'nowrap' }}>⚡ POPULAR</span>}
              <p style={{ fontWeight: 700, fontSize: '16px', color: p.color, marginBottom: '6px' }}>{p.name}</p>
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '42px', fontWeight: 800 }}>{p.price}</span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{p.period}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {p.features.map(f => <span key={f} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: '7px' }}><span style={{ color: p.color, flexShrink: 0 }}>✓</span>{f}</span>)}
                {p.locked.map(f => <span key={f} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '7px' }}><span style={{ flexShrink: 0 }}>✗</span>{f}</span>)}
              </div>
              <button onClick={p.action} style={{ width: '100%', padding: '13px', borderRadius: '10px', background: p.popular ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.06)', color: 'white', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
          {['🔒 Plată securizată Stripe', '↩ Anulezi oricând', '💳 Fără card pentru Free', '📧 Support prin email'].map(f => (
            <div key={f} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>{f}</div>
          ))}
        </div>
      </div>
    </main>
  )
}
