'use client'
import { useState, useRef, useEffect } from 'react'

type Mode = 'extract' | 'translate' | 'trello' | 'download' | 'generate'
type Step = 'idle' | 'fetching' | 'translating' | 'uploading' | 'downloading' | 'done' | 'error'

const LANGUAGES = [
  {code:'ro',label:'Română',short:'RO'},{code:'en',label:'Engleză',short:'EN'},
  {code:'fr',label:'Franceză',short:'FR'},{code:'es',label:'Spaniolă',short:'ES'},
  {code:'de',label:'Germană',short:'DE'},{code:'it',label:'Italiană',short:'IT'},
  {code:'pt',label:'Portugheză',short:'PT'},{code:'nl',label:'Olandeză',short:'NL'},
  {code:'pl',label:'Poloneză',short:'PL'},{code:'ru',label:'Rusă',short:'RU'},
  {code:'tr',label:'Turcă',short:'TR'},{code:'ar',label:'Arabă',short:'AR'},
  {code:'zh',label:'Chineză',short:'ZH'},{code:'ja',label:'Japoneză',short:'JA'},
  {code:'ko',label:'Coreeană',short:'KO'},{code:'hi',label:'Hindi',short:'HI'},
  {code:'uk',label:'Ucraineană',short:'UK'},{code:'sv',label:'Suedeză',short:'SV'},
  {code:'da',label:'Daneză',short:'DA'},{code:'fi',label:'Finlandeză',short:'FI'},
  {code:'no',label:'Norvegiană',short:'NO'},{code:'cs',label:'Cehă',short:'CS'},
  {code:'hu',label:'Maghiară',short:'HU'},{code:'el',label:'Greacă',short:'EL'},
  {code:'he',label:'Ebraică',short:'HE'},{code:'id',label:'Indoneziană',short:'ID'},
  {code:'th',label:'Tailandeză',short:'TH'},{code:'vi',label:'Vietnameză',short:'VI'},
]

const DL_FORMATS = [
  {key:'mp4',label:'MP4 1080p',icon:'🎬'},{key:'mp4-720',label:'MP4 720p',icon:'📹'},
  {key:'mp4-480',label:'MP4 480p',icon:'📱'},{key:'mp3',label:'MP3 Audio',icon:'🎵'},
]

const AI_PROVIDERS = [
  {key:'claude',label:'Claude',color:'#D97757',models:[{key:'claude-sonnet-4-6',label:'Sonnet 4.6'},{key:'claude-opus-4-6',label:'Opus 4.6'},{key:'claude-haiku-4-5-20251001',label:'Haiku 4.5'}]},
  {key:'openai',label:'ChatGPT',color:'#10A37F',models:[{key:'gpt-4o',label:'GPT-4o'},{key:'gpt-4o-mini',label:'GPT-4o Mini'}]},
  {key:'gemini',label:'Gemini',color:'#4285F4',models:[{key:'gemini-2.0-flash',label:'2.0 Flash'},{key:'gemini-1.5-pro',label:'1.5 Pro'}]},
  {key:'deepseek',label:'DeepSeek',color:'#536DFE',models:[{key:'deepseek-chat',label:'V3'},{key:'deepseek-reasoner',label:'R1'}]},
]

const MODES = [
  {key:'extract'  as Mode,icon:'▶',label:'Transcript',badge:'FREE',bcolor:'var(--teal)',bbg:'var(--tealbg)',bbdr:'var(--tealbdr)'},
  {key:'translate'as Mode,icon:'✦',label:'Traduce',badge:'FREE',bcolor:'var(--teal)',bbg:'var(--tealbg)',bbdr:'var(--tealbdr)'},
  {key:'trello'   as Mode,icon:'⬡',label:'Trello',badge:'PRO',bcolor:'var(--gold)',bbg:'var(--goldbg)',bbdr:'var(--goldbdr)'},
  {key:'download' as Mode,icon:'↓',label:'Download',badge:'PRO',bcolor:'var(--gold)',bbg:'var(--goldbg)',bbdr:'var(--goldbdr)'},
  {key:'generate' as Mode,icon:'✦',label:'Script AI',badge:'PRO',bcolor:'#F0C444',bbg:'var(--goldbg)',bbdr:'var(--goldbdr)'},
]

const PROMPT_TEMPLATES = [
  {icon:'📝',label:'Articol blog',prompt:'Rescrie ca articol de blog profesional cu introducere, 3-5 secțiuni și concluzie.'},
  {icon:'🐦',label:'Thread Twitter',prompt:'Transformă în thread de Twitter cu 8-12 tweet-uri numerotate, fiecare sub 280 caractere.'},
  {icon:'📧',label:'Newsletter',prompt:'Rescrie ca newsletter captivant cu subiect, introducere, puncte cheie și call-to-action.'},
  {icon:'📋',label:'Rezumat',prompt:'Creează un rezumat executiv de 200 cuvinte cu cele mai importante idei.'},
  {icon:'🎯',label:'Bullet points',prompt:'Extrage și prezintă toate informațiile cheie ca bullet points clare și concise.'},
  {icon:'📚',label:'Ghid pas cu pas',prompt:'Transformă în ghid pas cu pas numerotate, ușor de urmărit.'},
]

const GEN_STYLES = [
  {key:'educational',label:'📚 Educativ'},{key:'entertaining',label:'🎭 Distractiv'},
  {key:'motivational',label:'💪 Motivațional'},{key:'documentary',label:'🎬 Documentar'},
  {key:'tutorial',label:'🛠️ Tutorial'},{key:'vlog',label:'📱 Vlog'},
]
const GEN_DURATIONS = [1,3,5,7,10,15,20,25]
const GEN_NICHES = ['Tech & AI','Business','Health','Education','Entertainment','Travel','Food','Gaming','Music','Marketing']
const GEN_LANGS = ['Română','English','Français','Español','Deutsch','Italiano','Português','Русский','中文','日本語','한국어']

const GEN_OUTPUT_SECTIONS = [
  {key:'ANALIZA',label:'🔍 Analiză Original',color:'#A78BFA',bg:'rgba(167,139,250,.06)',border:'rgba(167,139,250,.2)'},
  {key:'TITLURI',label:'🏆 Titluri YouTube',color:'var(--gold)',bg:'var(--goldbg)',border:'var(--goldbdr)'},
  {key:'HOOK',label:'⚡ Hook (30 secunde)',color:'#F87171',bg:'rgba(248,113,113,.06)',border:'rgba(248,113,113,.2)'},
  {key:'SCRIPT',label:'📝 Script Complet',color:'var(--violet)',bg:'rgba(139,92,246,.06)',border:'rgba(139,92,246,.2)'},
  {key:'SEO',label:'📈 SEO & Retenție',color:'var(--green)',bg:'rgba(52,211,153,.06)',border:'rgba(52,211,153,.2)'},
  {key:'DESCRIERE',label:'📋 Descriere YouTube',color:'var(--teal)',bg:'var(--tealbg)',border:'var(--tealbdr)'},
  {key:'EDITARE',label:'🎬 Sugestii Editare',color:'#F472B6',bg:'rgba(244,114,182,.06)',border:'rgba(244,114,182,.2)'},
  {key:'TOP_TITLURI',label:'🥇 Top 3 Titluri Finale',color:'var(--text)',bg:'var(--bg2)',border:'rgba(139,92,246,.25)'},
]

function Spin() {
  return <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.15)" strokeWidth="3"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
}

function extractYtId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function Tool({ session }: { session: any }) {
  // Main tool state
  const [mode, setMode]           = useState<Mode>('extract')
  const [url, setUrl]             = useState('')
  const [targetLang, setTargetLang] = useState(LANGUAGES[0])
  const [langOpen, setLangOpen]   = useState(false)
  const [dlFormat, setDlFormat]   = useState(DL_FORMATS[1])
  const [aiProvider, setAiProvider] = useState(AI_PROVIDERS[0])
  const [aiModel, setAiModel]     = useState(AI_PROVIDERS[0].models[0])
  const [customPrompt, setCustomPrompt] = useState('')
  const [promptOpen, setPromptOpen]     = useState(false)
  const [step, setStep]           = useState<Step>('idle')
  const [status, setStatus]       = useState('')
  const [preview, setPreview]     = useState('')
  const [cardUrl, setCardUrl]     = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [videoThumb, setVideoThumb] = useState('')
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)
  const [detectedLang, setDetectedLang] = useState('')
  const [dlBytes, setDlBytes]     = useState(0)
  const [dlTotal, setDlTotal]     = useState(0)
  const [dlProgress, setDlProgress] = useState('')
  const [history, setHistory]     = useState<any[]>([])
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const [exportLoading, setExportLoading] = useState<string|null>(null)
  // Script Generator state
  const [genMode, setGenMode]         = useState<'generate'|'rewrite'>('generate')
  const [genTitle, setGenTitle]       = useState('')
  const [genKeywords, setGenKeywords] = useState('')
  const [genLanguage, setGenLanguage] = useState('Română')
  const [genDuration, setGenDuration] = useState(5)
  const [genStyle, setGenStyle]       = useState('educational')
  const [genNiche, setGenNiche]       = useState('')
  const [genRewriteUrl, setGenRewriteUrl] = useState('')
  const [genLoading, setGenLoading]   = useState(false)
  const [genOutput, setGenOutput]     = useState('')
  const [genCopied, setGenCopied]     = useState('')

  const previewRef = useRef<HTMLDivElement>(null)
  const langRef    = useRef<HTMLDivElement>(null)

  const plan = session?.user?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE'
  const videosUsed = (session?.user as any)?.videosUsed || 0

  useEffect(() => {
    fetch('/api/history').then(r=>r.json()).then(d=>setHistory((d.history||[]).slice(0,5))).catch(()=>{})
  }, [step, genOutput])

  useEffect(() => {
    const id = extractYtId(url)
    if (id) {
      setVideoThumb(`https://img.youtube.com/vi/${id}/mqdefault.jpg`)
      setVideoInfo(null)
      fetch(`/api/video-info?videoId=${id}`)
        .then(r=>r.json())
        .then(d=>{ if(!d.error){ setVideoInfo(d); setVideoTitle(d.title||''); setVideoThumb(d.thumbnailMq||`https://img.youtube.com/vi/${id}/mqdefault.jpg`) }})
        .catch(()=>{})
    } else { setVideoThumb(''); setVideoTitle(''); setVideoInfo(null) }
  }, [url])

  useEffect(() => { if(previewRef.current) previewRef.current.scrollTop=previewRef.current.scrollHeight }, [preview])

  useEffect(() => {
    function h(e:MouseEvent) { if(langRef.current&&!langRef.current.contains(e.target as Node)) setLangOpen(false) }
    document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h)
  }, [])

  function reset() {
    setStep('idle');setPreview('');setCardUrl('');setError('');setDetectedLang('');
    setCopied(false);setDlBytes(0);setDlTotal(0);setDlProgress('')
  }

  async function downloadExport(format: 'md'|'docx'|'txt') {
    if (!preview) return
    setExportLoading(format)
    try {
      if (format==='txt') {
        const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([preview],{type:'text/plain'}))
        a.download=`${videoTitle||'script'}.txt`; a.click(); setExportLoading(null); return
      }
      const res = await fetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:preview,title:videoTitle||'script',format})})
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition')??''; const nm=cd.match(/filename="(.+?)"/)
      const fileName=nm?decodeURIComponent(nm[1]):`script.${format}`
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fileName; a.click()
    } catch(e){console.error(e)}
    setExportLoading(null)
  }

  async function saveGeneratedScript(output: string) {
    if (!output) return
    try {
      await fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        videoUrl: genMode==='rewrite'?genRewriteUrl:`generated:${genTitle}`,
        videoTitle: genMode==='rewrite'?`[Rescris] ${genTitle||'Video'}`:genTitle,
        videoChannel: genMode==='rewrite'?'Rewrite & SEO':`Keywords: ${genKeywords}`,
        videoDuration: genMode==='generate'?`${genDuration} minute`:null,
        sourceLang: genMode==='rewrite'?'rewrite':'generated',
        targetLang: genLanguage, mode:'generate', scriptText:output,
        aiProvider:'claude', aiModel:'claude-sonnet-4-6',
      })})
    } catch(e){console.error(e)}
  }

  async function generateScript() {
    if (!isPro) return
    if (genMode==='generate'&&(!genTitle||!genKeywords)) return
    if (genMode==='rewrite'&&!genRewriteUrl) return
    setGenLoading(true); setGenOutput('')

    let transcript='', rewriteTitle=''
    if (genMode==='rewrite') {
      try {
        const tRes=await fetch('/api/transcript',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:genRewriteUrl})})
        const tData=await tRes.json()
        if (!tRes.ok){setGenOutput(`Eroare transcript: ${tData.error}`);setGenLoading(false);return}
        transcript=tData.rawText; rewriteTitle=tData.title
      } catch(e){setGenOutput(`Eroare: ${e}`);setGenLoading(false);return}
    }

    try {
      const res=await fetch('/api/generate-script',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(genMode==='rewrite'
          ?{mode:'rewrite',transcript,videoTitle:rewriteTitle,targetLanguage:genLanguage}
          :{mode:'generate',title:genTitle,keywords:genKeywords,language:genLanguage,duration:genDuration,style:genStyle,niche:genNiche}
        )})
      if (!res.ok||!res.body){setGenOutput('Eroare la generare.');setGenLoading(false);return}
      const reader=res.body.getReader(); const decoder=new TextDecoder(); let full=''
      while(true){const{done,value}=await reader.read();if(done)break;const chunk=decoder.decode(value,{stream:true});full+=chunk;setGenOutput(prev=>prev+chunk)}
      await saveGeneratedScript(full)
    } catch(e){setGenOutput(`Eroare: ${e}`)}
    setGenLoading(false)
  }

  function copyGen(text:string,key:string){navigator.clipboard.writeText(text);setGenCopied(key);setTimeout(()=>setGenCopied(''),2000)}

  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault(); reset()

    if ((mode==='trello'||mode==='download')&&!isPro){setStep('error');setError('Acest feature necesită planul Pro.');return}
    if (!isPro&&videosUsed>=3){setStep('error');setError('Ai atins limita de 3 video-uri gratuite pe lună. Upgradează la Pro.');return}

    if (mode==='download'){
      setStep('downloading');setStatus('Se procesează...');setDlProgress('Inițializez...')
      try {
        const res=await fetch('/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,format:dlFormat.key})})
        if(!res.ok){const d=await res.json();setStep('error');setError(d.error);return}
        const cl=Number(res.headers.get('Content-Length')??0)
        const cd=res.headers.get('Content-Disposition')??''; const nm=cd.match(/filename="(.+?)"/)
        const fileName=nm?decodeURIComponent(nm[1]):`video.${dlFormat.key==='mp3'?'mp3':'mp4'}`
        setDlTotal(cl);setStatus('Se transferă...');setDlProgress(fileName)
        const reader=res.body!.getReader();const chunks:BlobPart[]=[]; let recv=0
        while(true){const{done,value}=await reader.read();if(done)break;chunks.push(value);recv+=value.length;setDlBytes(recv)}
        const blob=new Blob(chunks);const obj=URL.createObjectURL(blob)
        const a=document.createElement('a');a.href=obj;a.download=fileName;a.click()
        setTimeout(()=>URL.revokeObjectURL(obj),5000);setStep('done')
      } catch(err){setStep('error');setError(`${err}`)}
      return
    }

    setStep('fetching');setStatus('Extrag transcriptul...')
    const tRes=await fetch('/api/transcript',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})})
    const tData=await tRes.json()
    if(!tRes.ok){setStep('error');setError(tData.error);return}
    const{rawText,detectedLang:dl,title}=tData
    if(!videoTitle)setVideoTitle(title);setDetectedLang(dl)

    if(mode==='extract'){
      setPreview(rawText);setStep('done')
      await fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        videoUrl:url,videoTitle:title||videoTitle,videoChannel:videoInfo?.channel,videoDuration:videoInfo?.duration,
        thumbnail:videoInfo?.thumbnailMq,sourceLang:dl,targetLang:targetLang.label,mode,scriptText:rawText,aiProvider:aiProvider.key,aiModel:aiModel.key
      })})
      return
    }

    setStep('translating');setStatus(`Traduc în ${targetLang.label}...`)
    const pRes=await fetch('/api/process',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rawText,detectedLang:dl,targetLang:targetLang.label,title:title||videoTitle,aiProvider:aiProvider.key,aiModel:aiModel.key,customPrompt})})
    if(!pRes.ok||!pRes.body){setStep('error');setError('Eroare API.');return}
    const reader=pRes.body.getReader();const decoder=new TextDecoder();let translated=''
    while(true){const{done,value}=await reader.read();if(done)break;translated+=decoder.decode(value,{stream:true});setPreview(translated)}

    if(mode==='translate'){
      setStep('done')
      await fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        videoUrl:url,videoTitle:title||videoTitle,videoChannel:videoInfo?.channel,videoDuration:videoInfo?.duration,
        thumbnail:videoInfo?.thumbnailMq,sourceLang:dl,targetLang:targetLang.label,mode,scriptText:translated,aiProvider:aiProvider.key,aiModel:aiModel.key
      })})
      return
    }

    setStep('uploading');setStatus('Creez cardul Trello...')
    const trRes=await fetch('/api/trello',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title||videoTitle,youtubeUrl:url,detectedLang:dl,targetLang:targetLang.label,translatedText:translated})})
    const trData=await trRes.json()
    if(!trRes.ok){setStep('error');setError(trData.error);return}
    setCardUrl(trData.cardUrl);setStep('done')
    await fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      videoUrl:url,videoTitle:title||videoTitle,videoChannel:videoInfo?.channel,videoDuration:videoInfo?.duration,
      thumbnail:videoInfo?.thumbnailMq,sourceLang:dl,targetLang:targetLang.label,mode,scriptText:translated,trelloCardUrl:trData.cardUrl,aiProvider:aiProvider.key,aiModel:aiModel.key
    })})
  }

  const isLoading=['fetching','translating','uploading','downloading'].includes(step)
  const needsLang=mode==='translate'||mode==='trello'
  const isGenerate=mode==='generate'
  const stepsFor=mode==='extract'?['fetching','done']:mode==='translate'?['fetching','translating','done']:mode==='trello'?['fetching','translating','uploading','done']:['downloading','done']
  const allKeys=['fetching','translating','uploading','downloading','done']
  const stepIdx=allKeys.indexOf(step)
  const stepLbl:Record<string,string>={fetching:'Transcript',translating:'Traducere',uploading:'Trello',downloading:'Descărcare',done:'Gata'}

  const inp:React.CSSProperties={width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'10px',padding:'12px 14px',color:'var(--text)',fontSize:'14px',fontFamily:'Inter,sans-serif',outline:'none',transition:'border-color .2s'}

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:'18px',maxWidth:'1080px',margin:'0 auto',padding:'24px 20px 80px',alignItems:'start'}}>

      {/* ── LEFT ── */}
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

        {/* Mode tabs */}
        <div style={{display:'flex',gap:'4px',padding:'4px',background:'rgba(255,255,255,0.04)',borderRadius:'12px',border:'1px solid var(--border)'}}>
          {MODES.map(m=>{
            const active=mode===m.key
            const locked=m.badge==='PRO'&&!isPro
            return (
              <button key={m.key} type="button" disabled={isLoading}
                onClick={()=>{if(locked){window.location.href='/pricing';return}setMode(m.key);reset();setGenOutput('')}}
                style={{flex:1,padding:'10px 6px',borderRadius:'9px',cursor:'pointer',transition:'all .2s',outline:'none',
                  background:active?'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.1))':'transparent',
                  border:active?'1px solid rgba(139,92,246,0.35)':'1px solid transparent',
                  textAlign:'center',opacity:locked?.6:1,position:'relative'}}>
                {locked&&<span style={{position:'absolute',top:'4px',right:'4px',fontSize:'10px'}}>🔒</span>}
                <div style={{fontSize:'16px',color:active?'var(--violet)':'var(--text3)',marginBottom:'3px'}}>{m.icon}</div>
                <div style={{fontSize:'11px',fontWeight:700,color:active?'var(--text)':'var(--text3)'}}>{m.label}</div>
                <div style={{fontSize:'9px',fontWeight:700,marginTop:'3px',padding:'1px 6px',borderRadius:'100px',display:'inline-block',
                  color:m.badge==='PRO'?'var(--gold)':'var(--teal)',
                  background:m.badge==='PRO'?'var(--goldbg)':'var(--tealbg)',
                  border:`1px solid ${m.badge==='PRO'?'var(--goldbdr)':'var(--tealbdr)'}`}}>{m.badge}</div>
              </button>
            )
          })}
        </div>

        {/* Main card */}
        <div style={{background:'var(--bg2)',border:'1px solid rgba(139,92,246,0.15)',borderRadius:'18px',padding:'24px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.4),rgba(240,196,68,0.3),transparent)'}}/>

          {/* ── GENERATE MODE ── */}
          {isGenerate && (
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {!isPro ? (
                <div style={{textAlign:'center',padding:'32px 20px',background:'var(--goldbg)',border:'1px solid var(--goldbdr)',borderRadius:'14px'}}>
                  <div style={{fontSize:'32px',marginBottom:'10px'}}>✦</div>
                  <p style={{fontWeight:700,color:'var(--gold)',marginBottom:'6px'}}>Feature exclusiv Pro</p>
                  <p style={{fontSize:'13px',color:'var(--text2)',marginBottom:'16px'}}>Generează scripturi complete cu AI, optimizate SEO.</p>
                  <a href="/pricing" style={{display:'inline-block',padding:'10px 24px',borderRadius:'9px',background:'linear-gradient(135deg,var(--gold),var(--gold2))',color:'#0A0800',fontWeight:700,textDecoration:'none',fontSize:'13px'}}>⚡ Upgrade la Pro</a>
                </div>
              ) : (
                <>
                  {/* Mode switcher */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',padding:'4px',background:'var(--surface)',borderRadius:'10px',border:'1px solid var(--border)'}}>
                    <button type="button" onClick={()=>{setGenMode('generate');setGenOutput('')}}
                      style={{padding:'9px',borderRadius:'8px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',border:'none',
                        background:genMode==='generate'?'linear-gradient(135deg,var(--violet2),var(--indigo))':'transparent',
                        color:genMode==='generate'?'white':'var(--text3)'}}>
                      ✦ Generează din zero
                    </button>
                    <button type="button" onClick={()=>{setGenMode('rewrite');setGenOutput('')}}
                      style={{padding:'9px',borderRadius:'8px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',border:'none',
                        background:genMode==='rewrite'?'linear-gradient(135deg,var(--gold2),var(--gold))':'transparent',
                        color:genMode==='rewrite'?'#0A0800':'var(--text3)'}}>
                      🔄 Rescrie din URL
                    </button>
                  </div>

                  {/* Rewrite URL */}
                  {genMode==='rewrite' && (
                    <div>
                      <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>URL Video YouTube de rescris *</label>
                      <input value={genRewriteUrl} onChange={e=>setGenRewriteUrl(e.target.value)} placeholder="https://youtu.be/..."
                        style={inp} onFocus={e=>e.target.style.borderColor='var(--goldbdr)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}/>
                      <p style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>Extrage transcriptul și rescrie complet cu SEO optimizat</p>
                    </div>
                  )}

                  {/* Generate fields */}
                  {genMode==='generate' && (
                    <>
                      <div>
                        <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Subiect / Titlu *</label>
                        <input value={genTitle} onChange={e=>setGenTitle(e.target.value)} placeholder="Ex: Cum să faci bani online în 2026"
                          style={inp} onFocus={e=>e.target.style.borderColor='var(--goldbdr)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}/>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Keywords *</label>
                        <input value={genKeywords} onChange={e=>setGenKeywords(e.target.value)} placeholder="Ex: bani online, freelancing, venituri pasive"
                          style={inp} onFocus={e=>e.target.style.borderColor='var(--goldbdr)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}/>
                        <p style={{fontSize:'11px',color:'var(--text3)',marginTop:'4px'}}>Separă keywords cu virgulă</p>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                        <div>
                          <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Durată: <span style={{color:'var(--gold)',fontWeight:700}}>{genDuration}m</span></label>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'4px'}}>
                            {GEN_DURATIONS.map(d=>(
                              <button key={d} type="button" onClick={()=>setGenDuration(d)}
                                style={{padding:'7px 4px',borderRadius:'7px',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                  background:genDuration===d?'var(--goldbg)':'var(--surface)',
                                  border:`1px solid ${genDuration===d?'var(--goldbdr)':'var(--border)'}`,
                                  color:genDuration===d?'var(--gold)':'var(--text3)'}}>
                                {d}m
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Stil</label>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'4px'}}>
                            {GEN_STYLES.map(s=>(
                              <button key={s.key} type="button" onClick={()=>setGenStyle(s.key)}
                                style={{padding:'6px 4px',borderRadius:'7px',fontSize:'10px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                  background:genStyle===s.key?'var(--goldbg)':'var(--surface)',
                                  border:`1px solid ${genStyle===s.key?'var(--goldbdr)':'var(--border)'}`,
                                  color:genStyle===s.key?'var(--gold)':'var(--text3)'}}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Nișă</label>
                        <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                          {GEN_NICHES.map(n=>(
                            <button key={n} type="button" onClick={()=>setGenNiche(genNiche===n?'':n)}
                              style={{padding:'4px 9px',borderRadius:'6px',fontSize:'11px',fontWeight:500,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                background:genNiche===n?'var(--goldbg)':'var(--surface)',
                                border:`1px solid ${genNiche===n?'var(--goldbdr)':'var(--border)'}`,
                                color:genNiche===n?'var(--gold)':'var(--text3)'}}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Limbă (ambele moduri) */}
                  <div>
                    <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>
                      {genMode==='rewrite'?'Limbă output':'Limbă script'}
                    </label>
                    <select value={genLanguage} onChange={e=>setGenLanguage(e.target.value)}
                      style={{...inp,cursor:'pointer',colorScheme:'dark'}}>
                      {GEN_LANGS.map(l=><option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  {/* Generate button */}
                  <button type="button" onClick={generateScript}
                    disabled={genLoading||(genMode==='generate'&&(!genTitle||!genKeywords))||(genMode==='rewrite'&&!genRewriteUrl)}
                    style={{width:'100%',padding:'14px',borderRadius:'11px',border:'none',fontFamily:'Inter,sans-serif',
                      fontSize:'15px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                      cursor:genLoading?'not-allowed':'pointer',
                      background:genMode==='rewrite'
                        ?'linear-gradient(135deg,var(--gold),var(--gold2))'
                        :'linear-gradient(135deg,var(--violet2),var(--indigo))',
                      color:genMode==='rewrite'?'#0A0800':'white',
                      opacity:genLoading?0.7:1}}>
                    {genLoading
                      ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke={genMode==='rewrite'?'#0A0800':'white'} strokeWidth="3" strokeLinecap="round"/></svg>{genMode==='rewrite'?'Extrag + rescriu...':'Generez scriptul...'}</>
                      : genMode==='rewrite'?'🔄 Rescrie & Optimizează SEO':'✦ Generează script complet'
                    }
                  </button>
                  {genLoading&&<p style={{textAlign:'center',fontSize:'12px',color:'var(--text3)'}}>Claude AI lucrează... ~30-60 secunde</p>}
                </>
              )}
            </div>
          )}

          {/* ── NORMAL FORM ── */}
          <form onSubmit={handleSubmit} style={{display:isGenerate?'none':'flex',flexDirection:'column',gap:'16px'}}>

            {/* URL */}
            <div>
              <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'8px'}}>URL Video YouTube</label>
              <div style={{display:'flex',gap:'10px',alignItems:'stretch'}}>
                <div style={{flex:1,position:'relative'}}>
                  <span style={{position:'absolute',left:'13px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',color:'var(--text3)',pointerEvents:'none'}}>▶</span>
                  <input type="url" required disabled={isLoading} value={url} onChange={e=>setUrl(e.target.value)}
                    placeholder="https://youtu.be/... sau youtube.com/watch?v=..."
                    style={{...inp,paddingLeft:'38px'}}
                    onFocus={e=>e.target.style.borderColor='rgba(139,92,246,0.5)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.09)'}
                  />
                </div>
                {videoThumb&&<div style={{width:'72px',borderRadius:'10px',overflow:'hidden',border:'1px solid rgba(139,92,246,0.3)',flexShrink:0}}>
                  <img src={videoThumb} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                </div>}
              </div>
              {videoInfo ? (
                <div style={{marginTop:'8px',padding:'10px 12px',background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:'10px',display:'flex',alignItems:'center',gap:'10px'}}>
                  <img src={videoInfo.thumbnailMq} alt="" style={{width:'64px',height:'40px',borderRadius:'6px',objectFit:'cover',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:'12px',fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',margin:'0 0 2px'}}>{videoInfo.title}</p>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <span style={{fontSize:'11px',color:'var(--violet)'}}>📺 {videoInfo.channel}</span>
                      {videoInfo.duration&&<span style={{fontSize:'11px',color:'var(--text3)'}}>⏱ {videoInfo.duration}</span>}
                    </div>
                  </div>
                </div>
              ):videoTitle?(
                <p style={{fontSize:'11px',color:'var(--violet)',marginTop:'5px',display:'flex',alignItems:'center',gap:'5px'}}><span>✓</span>{videoTitle}</p>
              ):null}
            </div>

            {/* AI Provider */}
            {needsLang&&(
              <div>
                <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'8px'}}>Model AI</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px',marginBottom:'7px'}}>
                  {AI_PROVIDERS.map(p=>(
                    <button key={p.key} type="button" disabled={isLoading} onClick={()=>{setAiProvider(p);setAiModel(p.models[0])}}
                      style={{padding:'8px 6px',borderRadius:'8px',border:`1px solid ${aiProvider.key===p.key?p.color+'55':'var(--border)'}`,background:aiProvider.key===p.key?`${p.color}12`:'var(--surface)',cursor:'pointer',fontSize:'11px',fontWeight:700,color:aiProvider.key===p.key?p.color:'var(--text3)',textAlign:'center'}}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  {aiProvider.models.map(m=>(
                    <button key={m.key} type="button" disabled={isLoading} onClick={()=>setAiModel(m)}
                      style={{padding:'5px 10px',borderRadius:'6px',border:`1px solid ${aiModel.key===m.key?aiProvider.color+'55':'var(--border)'}`,background:aiModel.key===m.key?`${aiProvider.color}10`:'var(--surface)',cursor:'pointer',fontSize:'11px',fontWeight:600,color:aiModel.key===m.key?aiProvider.color:'var(--text3)'}}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language */}
            {needsLang&&(
              <div ref={langRef} style={{position:'relative'}}>
                <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'8px'}}>Traduce în</label>
                <button type="button" disabled={isLoading} onClick={()=>setLangOpen(o=>!o)}
                  style={{...inp,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',borderColor:langOpen?'rgba(139,92,246,.5)':'rgba(255,255,255,.09)'}}>
                  <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{fontWeight:700,fontSize:'11px',color:'var(--violet)',background:'rgba(139,92,246,0.12)',padding:'3px 7px',borderRadius:'5px'}}>{targetLang.short}</span>
                    {targetLang.label}
                  </span>
                  <span style={{color:'var(--text3)',fontSize:'10px',transform:langOpen?'rotate(180deg)':'none',transition:'transform .2s'}}>▼</span>
                </button>
                {langOpen&&(
                  <div style={{position:'absolute',top:'calc(100% + 5px)',left:0,right:0,zIndex:50,borderRadius:'12px',background:'#0C0C18',border:'1px solid rgba(139,92,246,0.2)',boxShadow:'0 20px 48px rgba(0,0,0,0.6)',maxHeight:'240px',overflowY:'auto',animation:'dropIn .15s ease'}}>
                    {LANGUAGES.map(lang=>(
                      <div key={lang.code} onClick={()=>{setTargetLang(lang);setLangOpen(false)}}
                        style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',cursor:'pointer',fontSize:'13px',color:targetLang.code===lang.code?'var(--violet)':'var(--text2)',background:targetLang.code===lang.code?'rgba(139,92,246,0.08)':'transparent'}}>
                        <span style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <span style={{fontWeight:600,fontSize:'11px',color:'var(--text3)',background:'var(--surface2)',padding:'2px 6px',borderRadius:'4px',minWidth:'28px',textAlign:'center'}}>{lang.short}</span>
                          {lang.label}
                        </span>
                        {targetLang.code===lang.code&&<span style={{color:'var(--violet)',fontSize:'12px'}}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Custom prompt */}
            {needsLang&&(
              <div>
                <button type="button" onClick={()=>setPromptOpen(o=>!o)}
                  style={{display:'flex',alignItems:'center',gap:'7px',fontSize:'12px',color:'var(--text3)',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'Inter,sans-serif'}}>
                  <span style={{fontSize:'10px',transform:promptOpen?'rotate(90deg)':'none',transition:'transform .2s',display:'inline-block'}}>▶</span>
                  Prompt personalizat
                  <span style={{fontSize:'9px',fontWeight:700,padding:'2px 7px',borderRadius:'100px',background:'var(--goldbg)',border:'1px solid var(--goldbdr)',color:'var(--gold)'}}>PRO</span>
                </button>
                {promptOpen&&(
                  <div style={{marginTop:'8px'}}>
                    <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'8px'}}>
                      {PROMPT_TEMPLATES.map(t=>(
                        <button key={t.label} type="button" onClick={()=>setCustomPrompt(t.prompt)}
                          style={{padding:'4px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                            background:customPrompt===t.prompt?'rgba(139,92,246,.15)':'var(--surface)',
                            border:`1px solid ${customPrompt===t.prompt?'rgba(139,92,246,.4)':'var(--border)'}`,
                            color:customPrompt===t.prompt?'var(--violet)':'var(--text3)'}}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} rows={3} disabled={isLoading}
                      placeholder='"Rescrie ca articol de blog" sau alege un template de mai sus'
                      style={{...inp,resize:'vertical',fontSize:'13px',borderColor:'rgba(139,92,246,0.2)'}}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Download format */}
            {mode==='download'&&(
              <div>
                <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'8px'}}>Format</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
                  {DL_FORMATS.map(f=>(
                    <button key={f.key} type="button" onClick={()=>setDlFormat(f)}
                      style={{padding:'10px 6px',borderRadius:'9px',border:`1px solid ${dlFormat.key===f.key?'var(--goldbdr)':'var(--border)'}`,background:dlFormat.key===f.key?'var(--goldbg)':'var(--surface)',cursor:'pointer',textAlign:'center'}}>
                      <div style={{fontSize:'16px',marginBottom:'3px'}}>{f.icon}</div>
                      <div style={{fontSize:'10px',fontWeight:700,color:dlFormat.key===f.key?'var(--gold)':'var(--text3)'}}>{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isLoading||!url}
              style={{width:'100%',padding:'14px',borderRadius:'10px',border:'none',cursor:isLoading||!url?'not-allowed':'pointer',
                fontSize:'15px',fontWeight:700,fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                background:isLoading||!url?'rgba(139,92,246,0.12)':'linear-gradient(135deg,var(--violet2),var(--indigo))',
                color:isLoading||!url?'var(--text3)':'white',
                boxShadow:isLoading||!url?'none':'0 4px 20px rgba(139,92,246,0.3)',position:'relative',overflow:'hidden'}}>
              {!isLoading&&!!url&&<span style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'rgba(255,255,255,.2)'}}/>}
              {isLoading?<><Spin/>{status}</>:<>
                <span>{mode==='extract'?'▶':mode==='translate'?'✦':mode==='trello'?'⬡':'↓'}</span>
                {mode==='extract'&&'Extrage scriptul'}
                {mode==='translate'&&`Traduce în ${targetLang.label}`}
                {mode==='trello'&&'Procesează și urcă pe Trello'}
                {mode==='download'&&`Descarcă ${dlFormat.label}`}
              </>}
            </button>
          </form>

          {/* Progress steps */}
          {!isGenerate&&step!=='idle'&&step!=='error'&&(
            <div style={{marginTop:'22px',display:'flex',alignItems:'center'}}>
              {stepsFor.map((s,i)=>{
                const si=allKeys.indexOf(s),done=stepIdx>si||step==='done',active=step===s&&step!=='done'
                const c=done?'var(--green)':active?'var(--violet)':'rgba(255,255,255,0.15)'
                return <div key={s} style={{display:'flex',alignItems:'center',flex:i<stepsFor.length-1?1:'none'}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',width:'52px'}}>
                    <div style={{width:26,height:26,borderRadius:'50%',border:`1px solid ${c}`,background:`${c}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:c,transition:'all .4s'}}>
                      {done?'✓':active?<span style={{display:'flex',gap:'2px'}}>{[0,1,2].map(i=><span key={i} style={{width:3,height:3,borderRadius:'50%',background:c,display:'inline-block'}}/>)}</span>:'○'}
                    </div>
                    <span style={{fontSize:'9px',color:c,fontWeight:500,whiteSpace:'nowrap'}}>{stepLbl[s]}</span>
                  </div>
                  {i<stepsFor.length-1&&<div style={{flex:1,height:'1px',background:done?'rgba(139,92,246,0.3)':'var(--border)',marginBottom:'14px',transition:'background .5s'}}/>}
                </div>
              })}
            </div>
          )}

          {/* Error */}
          {step==='error'&&(
            <div style={{marginTop:'16px',padding:'12px 15px',background:'rgba(248,113,113,0.07)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:'10px',color:'#FCA5A5',fontSize:'13px'}}>
              <strong style={{display:'block',marginBottom:'2px'}}>❌ Eroare</strong>{error}
              <button onClick={reset} style={{marginTop:'7px',color:'#F87171',fontSize:'11px',background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'underline'}}>Încearcă din nou</button>
            </div>
          )}
        </div>

        {/* Download progress */}
        {step==='downloading'&&dlBytes>0&&(
          <div style={{background:'var(--bg2)',border:'1px solid var(--goldbdr)',borderRadius:'12px',padding:'16px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'7px'}}>
              <span style={{fontSize:'12px',color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{dlProgress}</span>
              <span style={{fontSize:'12px',color:'var(--gold)',fontWeight:600,flexShrink:0}}>{dlTotal>0?`${(dlBytes/1024/1024).toFixed(1)}/${(dlTotal/1024/1024).toFixed(1)} MB`:`${(dlBytes/1024/1024).toFixed(1)} MB`}</span>
            </div>
            <div style={{height:'3px',background:'var(--surface2)',borderRadius:'100px',overflow:'hidden'}}>
              <div style={{height:'100%',background:'linear-gradient(90deg,var(--violet),var(--gold))',borderRadius:'100px',width:dlTotal>0?`${Math.min(100,(dlBytes/dlTotal)*100)}%`:'50%',transition:'width .3s'}}/>
            </div>
          </div>
        )}

        {/* Preview transcript/traducere */}
        {preview&&(
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'16px',overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <span style={{fontSize:'10px',fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--text3)'}}>
                  {mode==='extract'?'Transcript':`Tradus — ${targetLang.label}`}
                </span>
                {detectedLang&&<span style={{fontSize:'10px',color:'var(--text3)',background:'var(--surface2)',padding:'2px 7px',borderRadius:'100px'}}>sursă: {detectedLang}</span>}
              </div>
              <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                <button onClick={()=>{navigator.clipboard.writeText(preview);setCopied(true);setTimeout(()=>setCopied(false),2000)}}
                  style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                    background:copied?'rgba(52,211,153,0.1)':'var(--surface)',border:`1px solid ${copied?'rgba(52,211,153,0.3)':'var(--border)'}`,color:copied?'var(--green)':'var(--text3)'}}>
                  {copied?'✓ Copiat':'⎘ Copiază'}
                </button>
                <button onClick={()=>downloadExport('txt')} disabled={!!exportLoading}
                  style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)'}}>
                  {exportLoading==='txt'?'..':'↓ .txt'}
                </button>
                <button onClick={()=>downloadExport('md')} disabled={!!exportLoading}
                  style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',color:'var(--violet)'}}>
                  {exportLoading==='md'?'..':'↓ .md'}
                </button>
                <button onClick={()=>downloadExport('docx')} disabled={!!exportLoading}
                  style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',color:'#60A5FA'}}>
                  {exportLoading==='docx'?'..':'↓ .docx'}
                </button>
              </div>
            </div>
            <div ref={previewRef} style={{padding:'16px',fontSize:'13px',lineHeight:1.8,color:'var(--text2)',maxHeight:'360px',overflowY:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
              {preview}
            </div>
            <div style={{padding:'9px 16px',borderTop:'1px solid var(--border)',textAlign:'right'}}>
              <span style={{fontSize:'11px',color:'var(--text3)'}}>{preview.length.toLocaleString()} caractere · {preview.split(/\s+/).filter(Boolean).length.toLocaleString()} cuvinte</span>
            </div>
          </div>
        )}

        {/* Generate output */}
        {isGenerate&&genOutput&&(
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <button onClick={()=>copyGen(genOutput,'all')}
                style={{padding:'7px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:600,background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                {genCopied==='all'?'✓ Copiat tot':'⎘ Copiază tot'}
              </button>
              <button onClick={()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([genOutput],{type:'text/plain'}));a.download=`${genTitle||'script'}.txt`;a.click()}}
                style={{padding:'7px 14px',borderRadius:'8px',fontSize:'12px',fontWeight:600,background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.25)',color:'var(--violet)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                ↓ Descarcă .txt
              </button>
            </div>
            {GEN_OUTPUT_SECTIONS.map(sec=>{
              const text=genOutput.match(new RegExp(`---${sec.key}---\\n([\\s\\S]*?)(?=---[A-Z_]+---|$)`))?.[1]?.trim()
              if(!text)return null
              return (
                <div key={sec.key} style={{background:sec.bg,border:`1px solid ${sec.border}`,borderRadius:'12px',overflow:'hidden'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderBottom:`1px solid ${sec.border}`}}>
                    <span style={{fontSize:'12px',fontWeight:700,color:sec.color}}>{sec.label}</span>
                    <button onClick={()=>copyGen(text,sec.key)}
                      style={{padding:'3px 9px',borderRadius:'5px',fontSize:'11px',background:'rgba(255,255,255,.05)',border:`1px solid ${sec.border}`,color:sec.color,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                      {genCopied===sec.key?'✓':'⎘ Copiază'}
                    </button>
                  </div>
                  <div style={{padding:'12px 14px',fontSize:'13px',lineHeight:1.8,color:'var(--text2)',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:sec.key==='SCRIPT'?'500px':'none',overflowY:sec.key==='SCRIPT'?'auto':'visible'}}>
                    {text}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Success states */}
        {step==='done'&&cardUrl&&(
          <div style={{padding:'18px 20px',background:'rgba(56,189,248,0.06)',border:'1px solid rgba(56,189,248,0.2)',borderRadius:'12px'}}>
            <p style={{fontWeight:700,color:'#38BDF8',marginBottom:'4px'}}>⬡ Card creat în Trello!</p>
            <p style={{fontSize:'12px',color:'var(--text3)',marginBottom:'12px'}}>Scriptul tradus este publicat cu formatare completă.</p>
            <div style={{display:'flex',gap:'8px'}}>
              <a href={cardUrl} target="_blank" rel="noopener noreferrer" style={{padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:700,background:'#0079BF',color:'white',textDecoration:'none'}}>⬡ Deschide cardul</a>
              <button onClick={reset} style={{padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:500,background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Alt video</button>
            </div>
          </div>
        )}
        {step==='done'&&mode==='download'&&(
          <div style={{padding:'18px 20px',background:'var(--goldbg)',border:'1px solid var(--goldbdr)',borderRadius:'12px'}}>
            <p style={{fontWeight:700,color:'var(--gold)',marginBottom:'4px'}}>✓ Descărcare completă!</p>
            <p style={{fontSize:'12px',color:'var(--text3)',marginBottom:'12px',wordBreak:'break-all'}}>{dlProgress}</p>
            <button onClick={reset} style={{padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:500,background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Descarcă alt video</button>
          </div>
        )}
        {step==='done'&&!cardUrl&&preview&&mode!=='download'&&(
          <div style={{padding:'12px 16px',background:'rgba(52,211,153,0.07)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
            <p style={{fontSize:'13px',fontWeight:700,color:'var(--green)'}}>✓ {mode==='extract'?'Transcript extras!':'Script tradus!'}</p>
            <button onClick={reset} style={{padding:'6px 12px',borderRadius:'7px',fontSize:'12px',fontWeight:500,background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Alt video</button>
          </div>
        )}
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{display:'flex',flexDirection:'column',gap:'12px',position:'sticky',top:'76px'}}>

        {/* User card */}
        <div style={{background:'var(--bg2)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:'16px',padding:'16px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),rgba(240,196,68,0.4),transparent)'}}/>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
            {session?.user?.image
              ? <img src={session.user.image} alt="" style={{width:'36px',height:'36px',borderRadius:'50%',border:'2px solid rgba(139,92,246,.4)'}}/>
              : <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,var(--violet2),var(--gold))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:700,color:'white'}}>{session?.user?.name?.[0]||'U'}</div>
            }
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontWeight:600,fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{session?.user?.name}</p>
              <p style={{fontSize:'11px',color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{session?.user?.email}</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:'var(--surface)',borderRadius:'8px',marginBottom:'10px'}}>
            <span style={{fontSize:'11px',color:'var(--text3)'}}>Plan curent</span>
            <span style={{fontSize:'10px',fontWeight:700,padding:'3px 9px',borderRadius:'100px',
              background:isPro?'rgba(139,92,246,.1)':'var(--tealbg)',
              border:`1px solid ${isPro?'rgba(139,92,246,.3)':'var(--tealbdr)'}`,
              color:isPro?'var(--violet)':'var(--teal)'}}>{plan}</span>
          </div>
          {!isPro&&(
            <a href="/pricing" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px',borderRadius:'9px',background:'linear-gradient(135deg,var(--violet2),var(--indigo))',color:'white',fontSize:'12px',fontWeight:700,textDecoration:'none',boxShadow:'0 4px 16px rgba(139,92,246,.25)',position:'relative',overflow:'hidden'}}>
              <span style={{position:'absolute',top:0,left:0,right:0,height:'1px',background:'rgba(255,255,255,.2)'}}/>
              ⚡ Upgrade la Pro — $19/lună
            </a>
          )}
        </div>

        {/* Istoric recent */}
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'16px',padding:'16px'}}>
          <p style={{fontSize:'10px',fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'10px'}}>Istoric recent</p>
          {history.length===0
            ? <p style={{fontSize:'12px',color:'var(--text3)',textAlign:'center',padding:'12px 0'}}>Nicio procesare încă</p>
            : <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {history.map((h:any)=>{
                  const modeColors: Record<string,string>={extract:'var(--teal)',translate:'var(--violet)',trello:'#38BDF8',download:'#F472B6',generate:'var(--gold)'}
                  const modeIcons: Record<string,string>={extract:'▶',translate:'✦',trello:'⬡',download:'↓',generate:'✦'}
                  return (
                    <a key={h.id} href={h.videoUrl?.startsWith('generated:')?'#':h.videoUrl} target={h.videoUrl?.startsWith('generated:')?'_self':'_blank'} rel="noopener noreferrer"
                      style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 9px',borderRadius:'8px',background:'var(--surface)',border:'1px solid var(--border)',textDecoration:'none',transition:'border-color .15s'}}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(139,92,246,.3)')}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
                      <span style={{fontSize:'13px',flexShrink:0,color:modeColors[h.mode]||'var(--text3)'}}>{modeIcons[h.mode]||'•'}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'11px',color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'1px'}}>{h.videoTitle}</p>
                        <p style={{fontSize:'9px',color:'var(--text3)'}}>{h.targetLang} · {new Date(h.createdAt).toLocaleDateString('ro-RO')}</p>
                      </div>
                    </a>
                  )
                })}
              </div>
          }
          <div style={{display:'flex',gap:'6px',marginTop:'10px'}}>
            <a href="/history" style={{flex:1,display:'block',textAlign:'center',fontSize:'11px',color:'var(--violet)',textDecoration:'none',padding:'7px',borderRadius:'7px',border:'1px solid rgba(139,92,246,.25)',background:'rgba(139,92,246,.06)'}}>
              📋 Istoric complet
            </a>
            <a href="/dashboard" style={{flex:1,display:'block',textAlign:'center',fontSize:'11px',color:'var(--text3)',textDecoration:'none',padding:'7px',borderRadius:'7px',border:'1px solid var(--border)'}}>
              Dashboard →
            </a>
          </div>
        </div>

        {/* Tips */}
        <div style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.15)',borderRadius:'14px',padding:'14px'}}>
          <p style={{fontSize:'10px',fontWeight:700,color:'var(--violet)',marginBottom:'9px',letterSpacing:'.07em',textTransform:'uppercase'}}>💡 Tips</p>
          {['Transcript → Traduce → Trello în 3 click-uri','Script AI generează titluri SEO optimizate','Rescrie din URL = conținut nou din videoclipuri existente','Prompt custom = control total asupra outputului'].map(t=>(
            <p key={t} style={{fontSize:'11px',color:'var(--text2)',lineHeight:1.5,marginBottom:'5px'}}>· {t}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
