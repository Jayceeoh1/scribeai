'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Settings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [keys, setKeys] = useState({ anthropicKey:'', openaiKey:'', geminiKey:'', deepseekKey:'', trelloApiKey:'', trelloToken:'', trelloListId:'' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const plan = (session?.user as any)?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE'

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (isPro) {
      fetch('/api/settings/keys').then(r => r.json()).then(d => {
        if (d.keys) setKeys(d.keys)
      })
    }
  }, [isPro])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/settings/keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(keys) })
    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!session) return null

  return (
    <main style={{ minHeight: '100vh', background: '#07090F', color: '#E2E8F0', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, background: 'linear-gradient(135deg,#A5B4FC,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>ScribeAI</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px' }}>App</button>
          <button onClick={() => router.push('/dashboard')} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '13px' }}>Dashboard</button>
        </div>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Setări</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>Configurează cheile API personale și preferințele contului.</p>

        {!isPro ? (
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.07))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔑</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>Feature exclusiv Pro</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '24px' }}>
              Cu planul Pro poți salva propriile chei API — Anthropic, OpenAI, Gemini, DeepSeek și Trello — și le folosești direct, fără să le introduci la fiecare sesiune.
            </p>
            <button onClick={() => router.push('/pricing')} style={{ padding: '13px 28px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: 700, boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
              Upgrade la Pro — $19/lună →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* AI Keys */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#A5B4FC' }}>🤖 Chei AI</h3>
              {[
                { key: 'anthropicKey', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...' },
                { key: 'openaiKey',    label: 'OpenAI (ChatGPT)',   placeholder: 'sk-...' },
                { key: 'geminiKey',    label: 'Google Gemini',      placeholder: 'AIza...' },
                { key: 'deepseekKey',  label: 'DeepSeek',           placeholder: 'sk-...' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>{f.label}</label>
                  <input type="password" placeholder={f.placeholder} value={(keys as any)[f.key]}
                    onChange={e => setKeys(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '9px', padding: '10px 14px', color: '#F1F5F9', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              ))}
            </div>

            {/* Trello Keys */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#38BDF8' }}>⬡ Trello</h3>
              {[
                { key: 'trelloApiKey', label: 'Trello API Key',  placeholder: '...' },
                { key: 'trelloToken',  label: 'Trello Token',    placeholder: '...' },
                { key: 'trelloListId', label: 'Trello List ID',  placeholder: '...' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>{f.label}</label>
                  <input type="password" placeholder={f.placeholder} value={(keys as any)[f.key]}
                    onChange={e => setKeys(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '9px', padding: '10px 14px', color: '#F1F5F9', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: '10px', background: saved ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: saved ? '1px solid rgba(16,185,129,0.4)' : 'none', color: saved ? '#6EE7B7' : 'white', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
              {loading ? 'Se salvează...' : saved ? '✓ Salvat!' : 'Salvează cheile'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
