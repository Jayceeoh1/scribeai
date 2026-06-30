'use client'
import { useEffect, useState } from 'react'

const MODE_COLORS: Record<string, string> = { extract: '#0CCFB0', translate: '#7C3AED', trello: '#38BDF8', download: '#F472B6', generate: '#F0C444' }
const MODE_ICONS: Record<string, string> = { extract: '▶', translate: '✦', trello: '⬡', download: '↓', generate: '✦' }

export default function HistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/history')
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  // grupare pe zile (Astăzi / Ieri / Mai vechi)
  const groups = (() => {
    const today: any[] = []
    const yesterday: any[] = []
    const older: any[] = []
    const now = new Date()
    const todayStr = now.toDateString()
    const y = new Date(now); y.setDate(y.getDate() - 1)
    const yStr = y.toDateString()
    for (const h of history) {
      const d = new Date(h.createdAt).toDateString()
      if (d === todayStr) today.push(h)
      else if (d === yStr) yesterday.push(h)
      else older.push(h)
    }
    return [
      { label: 'Astăzi', items: today },
      { label: 'Ieri', items: yesterday },
      { label: 'Mai vechi', items: older },
    ].filter(g => g.items.length > 0)
  })()

  return (
    <>
      {/* Overlay — închide la click în afara panoului */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s',
        }}
      />
      {/* Panou */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 'min(360px, 92vw)', background: '#080B14',
        borderLeft: '1px solid rgba(255,255,255,.08)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '-20px 0 60px rgba(0,0,0,.4)' : 'none',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.75)' }}>📋 Istoric procesări</span>
          <button onClick={onClose} style={{
            width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.08)', color: 'rgba(255,255,255,.4)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontFamily: 'Inter,sans-serif',
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
          {loading && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', textAlign: 'center', padding: '20px 0' }}>Se încarcă...</p>
          )}
          {!loading && history.length === 0 && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', textAlign: 'center', padding: '20px 0' }}>Nicio procesare încă</p>
          )}
          {!loading && groups.map(g => (
            <div key={g.label} style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.2)', margin: '0 0 7px' }}>{g.label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {g.items.map((h: any) => (
                  <a key={h.id}
                    href={h.videoUrl?.startsWith('generated:') ? '#' : h.videoUrl}
                    target={h.videoUrl?.startsWith('generated:') ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 11px', borderRadius: '9px',
                      background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                      textDecoration: 'none', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,.3)'; e.currentTarget.style.background = 'rgba(124,58,237,.06)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'; e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}
                  >
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '7px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                      background: `${MODE_COLORS[h.mode] || '#888'}1a`,
                    }}>{MODE_ICONS[h.mode] || '•'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 1px' }}>{h.videoTitle}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,.25)', margin: 0 }}>{h.targetLang} · {new Date(h.createdAt).toLocaleDateString('ro-RO')}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <a href="/history" style={{
            display: 'block', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#A78BFA',
            textDecoration: 'none', padding: '9px', borderRadius: '8px',
            border: '1px solid rgba(124,58,237,.25)', background: 'rgba(124,58,237,.08)',
          }}>Vezi tot istoricul →</a>
        </div>
      </div>
    </>
  )
}
