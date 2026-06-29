'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'

const Tool = dynamic(() => import('@/components/Tool'), { ssr: false })

export default function AppPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (!session) return null

  const plan = (session.user as any)?.plan || 'FREE'
  const planColor = plan==='FREE'?'#2DD4BF':plan==='PRO'?'#8B5CF6':'#F0C444'
  const planBg    = plan==='FREE'?'rgba(45,212,191,.1)':plan==='PRO'?'rgba(139,92,246,.1)':'rgba(240,196,68,.1)'
  const planBdr   = plan==='FREE'?'rgba(45,212,191,.25)':plan==='PRO'?'rgba(139,92,246,.3)':'rgba(240,196,68,.25)'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'Inter,sans-serif', position:'relative', overflow:'hidden' }}>
      <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(8,8,16,0.88)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div className="nav-line"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 28px' }}>
          <span className="font-display" onClick={()=>router.push('/')} style={{ fontSize:'20px', fontWeight:700, letterSpacing:'-.02em', cursor:'pointer' }}>
            Scribe<span style={{color:'var(--gold)'}}>AI</span>
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ padding:'4px 11px', borderRadius:'100px', fontSize:'11px', fontWeight:700, background:planBg, border:`1px solid ${planBdr}`, color:planColor }}>{plan}</span>
            {plan==='FREE' && (
              <button onClick={()=>router.push('/pricing')} style={{ padding:'6px 14px', borderRadius:'7px', background:'linear-gradient(135deg,#7C3AED,#6366F1)', color:'white', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:'Inter,sans-serif' }}>⚡ Upgrade</button>
            )}
            <button onClick={()=>router.push('/script-generator')} style={{ padding:'6px 13px', borderRadius:'7px', background:'var(--goldbg)', border:'1px solid var(--goldbdr)', color:'var(--gold)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif', fontWeight:600 }}>✦ Script AI</button>
            <button onClick={()=>router.push('/thumbnail-generator')} style={{ padding:'6px 13px', borderRadius:'7px', background:'rgba(240,196,68,.08)', border:'1px solid rgba(240,196,68,.2)', color:'var(--gold)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif', fontWeight:600 }}>🖼️ Thumbnails</button>
            <button onClick={()=>router.push('/dashboard')} style={{ padding:'6px 13px', borderRadius:'7px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>Dashboard</button>
            <button onClick={()=>router.push('/settings')} style={{ padding:'6px 13px', borderRadius:'7px', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', color:'rgba(255,255,255,.5)', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>Setări</button>
            <div style={{ width:'1px', height:'18px', background:'rgba(255,255,255,.08)' }}/>
            {session.user?.image
              ? <img src={session.user.image} alt="" style={{ width:'28px', height:'28px', borderRadius:'50%', border:'2px solid rgba(139,92,246,.4)' }}/>
              : <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#7C3AED,#F0C444)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'white' }}>{session.user?.name?.[0]||'U'}</div>
            }
            <button onClick={()=>signOut({callbackUrl:'/'})} style={{ padding:'6px 13px', borderRadius:'7px', background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.18)', color:'#FCA5A5', cursor:'pointer', fontSize:'12px', fontFamily:'Inter,sans-serif' }}>Ieșire</button>
          </div>
        </div>
      </nav>
      <Tool session={session}/>
    </div>
  )
}
