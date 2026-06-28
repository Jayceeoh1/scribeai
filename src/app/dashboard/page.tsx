'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [history, setHistory] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])
  useEffect(() => {
    if (session) {
      fetch('/api/history').then(r=>r.json()).then(d=>setHistory(d.history||[]))
      fetch('/api/user').then(r=>r.json()).then(d=>setUser(d.user))
    }
  }, [session])

  if (!mounted || !session) return null

  const plan = (session.user as any)?.plan || 'FREE'
  const name = session.user?.name || 'Utilizator'
  const email = session.user?.email || ''
  const image = session.user?.image || ''
  const initials = name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase()
  const videosUsed = user?.videosUsed || 0
  const videosLimit = plan === 'FREE' ? 3 : 999
  const usagePct = plan === 'FREE' ? Math.min(100, (videosUsed/3)*100) : 0

  const planColor = plan==='FREE'?'#2DD4BF':plan==='PRO'?'#8B5CF6':'#F0C444'
  const planBg    = plan==='FREE'?'rgba(45,212,191,.1)':plan==='PRO'?'rgba(139,92,246,.1)':'rgba(240,196,68,.1)'
  const planBdr   = plan==='FREE'?'rgba(45,212,191,.25)':plan==='PRO'?'rgba(139,92,246,.25)':'rgba(240,196,68,.25)'

  const modeStats = {
    extract:  history.filter(h=>h.mode==='extract').length,
    translate:history.filter(h=>h.mode==='translate').length,
    trello:   history.filter(h=>h.mode==='trello').length,
    download: history.filter(h=>h.mode==='download').length,
  }

  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ro-RO',{month:'long',year:'numeric'}) : 'Iunie 2026'

  const S: React.CSSProperties = { fontFamily:'Inter,sans-serif', minHeight:'100vh', background:'var(--bg)', color:'var(--text)', position:'relative', overflow:'hidden' }

  return (
    <div style={S}>
      <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>

      {/* Nav */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(8,8,16,0.85)',backdropFilter:'blur(24px)',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
        <div className="nav-line"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 32px',maxWidth:'1100px',margin:'0 auto'}}>
          <span className="font-display" onClick={()=>router.push('/dashboard')} style={{fontSize:'20px',fontWeight:700,letterSpacing:'-.02em',cursor:'pointer'}}>
            Scribe<span style={{color:'var(--gold)'}}>AI</span>
          </span>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <button onClick={()=>router.push('/dashboard')} style={{padding:'7px 14px',borderRadius:'8px',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',fontSize:'13px',fontFamily:'Inter,sans-serif'}}>← App</button>
            <button onClick={()=>router.push('/settings')} style={{padding:'7px 14px',borderRadius:'8px',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',fontSize:'13px',fontFamily:'Inter,sans-serif'}}>Setări</button>
            <button onClick={()=>signOut({callbackUrl:'/'})} style={{padding:'7px 14px',borderRadius:'8px',background:'rgba(248,113,113,.07)',border:'1px solid rgba(248,113,113,.2)',color:'#FCA5A5',cursor:'pointer',fontSize:'13px',fontFamily:'Inter,sans-serif'}}>Ieșire</button>
          </div>
        </div>
      </nav>

      <div style={{maxWidth:'1000px',margin:'0 auto',padding:'32px 20px 80px',position:'relative',zIndex:1}}>

        {/* Hero banner */}
        <div style={{background:'linear-gradient(135deg,rgba(124,58,237,.12) 0%,rgba(99,102,241,.07) 50%,rgba(240,196,68,.05) 100%)',border:'1px solid rgba(139,92,246,.2)',borderRadius:'20px',padding:'28px 32px',marginBottom:'20px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,rgba(139,92,246,.6),rgba(240,196,68,.5),transparent)'}}/>
          {/* Decorative orb inside card */}
          <div style={{position:'absolute',right:'-60px',top:'-60px',width:'200px',height:'200px',borderRadius:'50%',background:'rgba(139,92,246,.08)',filter:'blur(40px)',pointerEvents:'none'}}/>

          <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
            {/* Avatar */}
            <div style={{position:'relative',flexShrink:0}}>
              {image
                ? <img src={image} alt="" style={{width:'72px',height:'72px',borderRadius:'50%',border:'3px solid rgba(139,92,246,.4)',display:'block'}}/>
                : <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'linear-gradient(135deg,var(--violet2),var(--gold))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',fontWeight:700,color:'white',border:'3px solid rgba(139,92,246,.4)'}}>{initials}</div>
              }
              <div style={{position:'absolute',bottom:'2px',right:'2px',width:'14px',height:'14px',borderRadius:'50%',background:'var(--green)',border:'2px solid var(--bg)'}}/>
            </div>

            {/* Info */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',marginBottom:'4px'}}>
                <h1 className="font-display" style={{fontSize:'24px',fontWeight:700,letterSpacing:'-.02em',margin:0}}>{name}</h1>
                <span style={{padding:'4px 12px',borderRadius:'100px',background:planBg,border:`1px solid ${planBdr}`,color:planColor,fontSize:'11px',fontWeight:700}}>{plan}</span>
              </div>
              <p style={{fontSize:'13px',color:'var(--text3)',margin:'0 0 8px'}}>{email} · membru din {joinDate}</p>
              <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                <span style={{fontSize:'12px',color:'var(--text3)',display:'flex',alignItems:'center',gap:'5px'}}>
                  <span style={{color:'var(--violet)'}}>▶</span>{history.length} procesări totale
                </span>
                <span style={{fontSize:'12px',color:'var(--text3)',display:'flex',alignItems:'center',gap:'5px'}}>
                  <span style={{color:'var(--teal)'}}>✦</span>{modeStats.translate} scripturi traduse
                </span>
                <span style={{fontSize:'12px',color:'var(--text3)',display:'flex',alignItems:'center',gap:'5px'}}>
                  <span style={{color:'#38BDF8'}}>⬡</span>{modeStats.trello} carduri Trello
                </span>
              </div>
            </div>

            {/* Plan badge */}
            {plan === 'FREE' && (
              <a href="/pricing" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'14px 20px',borderRadius:'14px',background:'linear-gradient(135deg,rgba(124,58,237,.2),rgba(99,102,241,.12))',border:'1px solid rgba(139,92,246,.3)',textDecoration:'none',flexShrink:0,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'rgba(255,255,255,.15)'}}/>
                <span style={{fontSize:'22px',marginBottom:'4px'}}>⚡</span>
                <span style={{fontSize:'12px',fontWeight:700,color:'white',marginBottom:'2px'}}>Upgrade la Pro</span>
                <span style={{fontSize:'20px',fontWeight:700,background:'linear-gradient(135deg,#8B5CF6,#F0C444)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>$19<span style={{fontSize:'11px',fontWeight:400}}>/lună</span></span>
              </a>
            )}
          </div>
        </div>

        {/* Grid principal */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}>

          {/* Usage meter */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'16px',padding:'22px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(45,212,191,.3),transparent)'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
              <div>
                <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',margin:'0 0 4px'}}>Utilizare lunară</p>
                <p style={{fontSize:'28px',fontWeight:700,margin:0,letterSpacing:'-.02em'}}>
                  {videosUsed}<span style={{fontSize:'16px',color:'var(--text3)',fontWeight:400}}>/{plan==='FREE'?3:'∞'}</span>
                </p>
              </div>
              <span style={{fontSize:'11px',fontWeight:700,padding:'4px 11px',borderRadius:'100px',background:'var(--tealbg)',border:'1px solid var(--tealbdr)',color:'var(--teal)'}}>
                {plan==='FREE'?`${3-videosUsed} rămase`:'Nelimitat'}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{height:'6px',background:'rgba(255,255,255,.07)',borderRadius:'100px',overflow:'hidden',marginBottom:'16px'}}>
              <div style={{height:'100%',width:`${usagePct}%`,background:usagePct>80?'linear-gradient(90deg,#F59E0B,#EF4444)':'linear-gradient(90deg,#2DD4BF,#8B5CF6)',borderRadius:'100px',transition:'width 1s ease'}}/>
            </div>

            {/* Breakdown */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
              {[
                {label:'Transcript',value:modeStats.extract,icon:'▶',color:'var(--teal)',bg:'var(--tealbg)',bdr:'var(--tealbdr)'},
                {label:'Traduse',value:modeStats.translate,icon:'✦',color:'var(--violet)',bg:'rgba(139,92,246,.08)',bdr:'rgba(139,92,246,.2)'},
                {label:'Trello',value:modeStats.trello,icon:'⬡',color:'#38BDF8',bg:'rgba(56,189,248,.07)',bdr:'rgba(56,189,248,.2)'},
                {label:'Download',value:modeStats.download,icon:'↓',color:'#F472B6',bg:'rgba(244,114,182,.07)',bdr:'rgba(244,114,182,.2)'},
              ].map(s=>(
                <div key={s.label} style={{padding:'10px 8px',borderRadius:'10px',background:s.bg,border:`1px solid ${s.bdr}`,textAlign:'center'}}>
                  <div style={{fontSize:'14px',color:s.color,marginBottom:'4px'}}>{s.icon}</div>
                  <div style={{fontSize:'18px',fontWeight:700,marginBottom:'2px'}}>{s.value}</div>
                  <div style={{fontSize:'9px',color:'var(--text3)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan + upgrade */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'16px',padding:'22px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(139,92,246,.3),rgba(240,196,68,.2),transparent)'}}/>
            <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',margin:'0 0 14px'}}>Planul tău</p>

            {plan==='FREE' ? (
              <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px'}}>
                  {[
                    {name:'Free',active:true,price:'$0',color:'var(--teal)',features:['3 video/lună','Transcript + traducere']},
                    {name:'Pro',active:false,price:'$19/lună',color:'var(--violet)',features:['Nelimitat','Trello + Download']},
                  ].map(p=>(
                    <div key={p.name} style={{padding:'14px',borderRadius:'12px',background:p.active?'rgba(45,212,191,.06)':'rgba(139,92,246,.06)',border:`1px solid ${p.active?'rgba(45,212,191,.25)':'rgba(139,92,246,.25)'}`,position:'relative'}}>
                      {p.active && <div style={{position:'absolute',top:'8px',right:'8px',width:'6px',height:'6px',borderRadius:'50%',background:'var(--teal)'}} className="pulse"/>}
                      <p style={{fontSize:'13px',fontWeight:700,color:p.color,margin:'0 0 2px'}}>{p.name}</p>
                      <p style={{fontSize:'11px',color:'var(--text3)',margin:'0 0 8px'}}>{p.price}</p>
                      {p.features.map(f=><p key={f} style={{fontSize:'11px',color:'var(--text2)',margin:'0 0 3px',display:'flex',alignItems:'center',gap:'5px'}}><span style={{color:p.color,fontSize:'10px'}}>✓</span>{f}</p>)}
                    </div>
                  ))}
                </div>
                <a href="/pricing" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'7px',padding:'12px',borderRadius:'10px',background:'linear-gradient(135deg,var(--violet2),var(--indigo))',color:'white',textDecoration:'none',fontSize:'13px',fontWeight:700,boxShadow:'0 4px 20px rgba(139,92,246,.25)',position:'relative',overflow:'hidden'}}>
                  <span style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'rgba(255,255,255,.2)'}}/>
                  ⚡ Upgrade la Pro — deblochează totul
                </a>
              </>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <div style={{padding:'14px',borderRadius:'12px',background:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.25)',display:'flex',alignItems:'center',gap:'10px'}}>
                  <span style={{fontSize:'24px'}}>⚡</span>
                  <div>
                    <p style={{fontSize:'14px',fontWeight:700,color:'var(--violet)',margin:'0 0 2px'}}>Pro Plan activ</p>
                    <p style={{fontSize:'12px',color:'var(--text3)',margin:0}}>Video-uri nelimitate · Toate funcțiile</p>
                  </div>
                </div>
                {['Trello integration','Download video/audio','Chei API proprii','Prompt personalizat'].map(f=>(
                  <div key={f} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'var(--text2)'}}>
                    <span style={{color:'var(--green)',fontSize:'12px'}}>✓</span>{f}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings rapide + Istoric */}
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'16px'}}>

          {/* Setări rapide */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'16px',padding:'20px'}}>
            <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',margin:'0 0 14px'}}>Setări rapide</p>
            <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
              {[
                {icon:'🔑',label:'Chei API',sub:'Salvează cheile tale',badge:'PRO',badgeColor:'var(--gold)',href:'/settings'},
                {icon:'📊',label:'Export istoric',sub:'Descarcă toate datele',badge:null,href:'#'},
                {icon:'🎨',label:'Preferințe',sub:'Limbă și format implicit',badge:null,href:'#'},
              ].map((item,i)=>(
                <a key={i} href={item.href} style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 12px',borderRadius:'10px',textDecoration:'none',transition:'background .15s',border:'1px solid transparent'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='var(--surface)';(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.borderColor='transparent'}}>
                  <span style={{fontSize:'18px',flexShrink:0}}>{item.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:'13px',color:'var(--text)',fontWeight:500,margin:'0 0 1px'}}>{item.label}</p>
                    <p style={{fontSize:'11px',color:'var(--text3)',margin:0}}>{item.sub}</p>
                  </div>
                  {item.badge && <span style={{fontSize:'9px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:'var(--goldbg)',border:'1px solid var(--goldbdr)',color:item.badgeColor!,flexShrink:0}}>{item.badge}</span>}
                  {!item.badge && <span style={{fontSize:'12px',color:'var(--text3)',flexShrink:0}}>→</span>}
                </a>
              ))}

              <div style={{height:'1px',background:'var(--border)',margin:'8px 0'}}/>

              <button onClick={()=>signOut({callbackUrl:'/'})}
                style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 12px',borderRadius:'10px',background:'transparent',border:'1px solid transparent',cursor:'pointer',width:'100%',fontFamily:'Inter,sans-serif',transition:'all .15s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(248,113,113,.07)';(e.currentTarget as HTMLElement).style.borderColor='rgba(248,113,113,.2)'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.borderColor='transparent'}}>
                <span style={{fontSize:'18px'}}>🚪</span>
                <div style={{flex:1,textAlign:'left'}}>
                  <p style={{fontSize:'13px',color:'#FCA5A5',fontWeight:500,margin:'0 0 1px'}}>Deconectare</p>
                  <p style={{fontSize:'11px',color:'var(--text3)',margin:0}}>Ieși din cont</p>
                </div>
              </button>
            </div>
          </div>

          {/* Istoric */}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'16px',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
              <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',margin:0}}>Istoric procesări</p>
              <span style={{fontSize:'12px',color:'var(--violet)',fontWeight:600}}>{history.length} total</span>
            </div>

            {history.length===0 ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',gap:'10px'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'50%',background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>📋</div>
                <p style={{fontSize:'14px',color:'var(--text3)',margin:0}}>Nicio procesare încă</p>
                <a href="/app" style={{padding:'8px 18px',borderRadius:'8px',background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.25)',color:'var(--violet)',fontSize:'12px',fontWeight:600,textDecoration:'none'}}>+ Procesează primul video</a>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {history.slice(0,8).map((h:any)=>{
                  const modeIcon = h.mode==='extract'?'▶':h.mode==='translate'?'✦':h.mode==='trello'?'⬡':'↓'
                  const modeColor = h.mode==='extract'?'var(--teal)':h.mode==='translate'?'var(--violet)':h.mode==='trello'?'#38BDF8':'#F472B6'
                  return (
                    <a key={h.id} href={h.videoUrl} target="_blank" rel="noopener noreferrer"
                      style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'10px',background:'var(--surface)',border:'1px solid var(--border)',textDecoration:'none',transition:'all .15s'}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(139,92,246,.3)'}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)'}}>
                      <div style={{width:'30px',height:'30px',borderRadius:'8px',background:`${modeColor}15`,border:`1px solid ${modeColor}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',color:modeColor,flexShrink:0}}>{modeIcon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'13px',color:'var(--text)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:'0 0 2px'}}>{h.videoTitle}</p>
                        <p style={{fontSize:'11px',color:'var(--text3)',margin:0}}>{h.sourceLang} → {h.targetLang}</p>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <p style={{fontSize:'10px',color:'var(--text3)',margin:'0 0 2px'}}>{new Date(h.createdAt).toLocaleDateString('ro-RO')}</p>
                        <span style={{fontSize:'9px',fontWeight:700,padding:'2px 6px',borderRadius:'100px',background:`${modeColor}15`,color:modeColor}}>{h.mode.toUpperCase()}</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
