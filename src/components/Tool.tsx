'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

type Mode = 'extract' | 'translate' | 'trello' | 'download' | 'generate' | 'batch' | 'shorts'
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
  {key:'gemini',label:'Gemini',color:'#4285F4',models:[{key:'gemini-1.5-flash-latest',label:'1.5 Flash'},{key:'gemini-1.5-flash-8b',label:'1.5 Flash 8B'}]},
  {key:'deepseek',label:'DeepSeek',color:'#536DFE',models:[{key:'deepseek-chat',label:'V3'},{key:'deepseek-reasoner',label:'R1'}]},
  {key:'grok',label:'Grok',color:'#1DA1F2',models:[{key:'grok-4.3',label:'Grok 4'},{key:'grok-build-0.1',label:'Grok Build'}]},
]

const MODES = [
  {key:'extract'  as Mode,icon:'▶',label:'Transcript',badge:'FREE',bcolor:'var(--teal)',bbg:'var(--tealbg)',bbdr:'var(--tealbdr)'},
  {key:'translate'as Mode,icon:'✦',label:'Traduce',badge:'FREE',bcolor:'var(--teal)',bbg:'var(--tealbg)',bbdr:'var(--tealbdr)'},
  {key:'trello'   as Mode,icon:'⬡',label:'Trello',badge:'PRO',bcolor:'var(--gold)',bbg:'var(--goldbg)',bbdr:'var(--goldbdr)'},
  {key:'download' as Mode,icon:'↓',label:'Download',badge:'PRO',bcolor:'var(--gold)',bbg:'var(--goldbg)',bbdr:'var(--goldbdr)'},
  {key:'shorts'   as Mode,icon:'✂',label:'Shorts',   badge:'PRO',bcolor:'#D946EF',bbg:'rgba(217,70,239,.08)',bbdr:'rgba(217,70,239,.25)'},
  {key:'generate' as Mode,icon:'✦',label:'Script AI',badge:'PRO',bcolor:'#F0C444',bbg:'var(--goldbg)',bbdr:'var(--goldbdr)'},
  {key:'batch'    as Mode,icon:'⚡',label:'Batch',    badge:'PRO',bcolor:'#34D399',bbg:'rgba(52,211,153,.08)',bbdr:'rgba(52,211,153,.25)'},
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
const GEN_LANGS = [
  'Română','English','Français','Español','Deutsch','Italiano','Português (BR)','Português (PT)',
  'Русский','Українська','Polski','Čeština','Slovenčina','Magyar','Română','Български','Hrvatski','Srpski','Slovenščina',
  'Nederlands','Svenska','Dansk','Norsk','Suomi','Eesti','Latviešu','Lietuvių',
  '中文 (简体)','中文 (繁體)','日本語','한국어','Tiếng Việt','ภาษาไทย','Bahasa Indonesia','Bahasa Melayu','Filipino',
  'العربية','فارسی','עברית','Türkçe','Ελληνικά',
  'हिन्दी','বাংলা','తెలుగు','मराठी','தமிழ்','اردو','Gujarati','Punjabi',
  'Swahili','Hausa','Amharic','Afrikaans',
  'Georgian','Armenian','Azerbaijani','Kazakh','Uzbek',
]

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
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const [exportLoading, setExportLoading] = useState<string|null>(null)
  const [shareCopied, setShareCopied]     = useState(false)
  const [chapters, setChapters]           = useState<any>(null)
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [thumbnail, setThumbnail]         = useState<any>(null)
  const [thumbLoading, setThumbLoading]   = useState(false)
  const [previewTab, setPreviewTab]       = useState<'script'|'chapters'|'thumbnail'>('script')
  const [shareId, setShareId]   = useState<string|null>(null)
  const [batchUrls, setBatchUrls] = useState(['','',''])
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  // Script Generator state
  const [genMode, setGenMode]         = useState<'generate'|'rewrite'>('generate')
  const [genTitle, setGenTitle]       = useState('')
  const [genKeywords, setGenKeywords] = useState('')
  const [suggestingKw, setSuggestingKw] = useState(false)

  // ── SHORTS STATE ──
  const [shortsClips, setShortsClips] = useState<any[]>([])
  const [shortsLoading, setShortsLoading] = useState(false)
  const [shortsError, setShortsError] = useState('')
  const [shortsCount, setShortsCount] = useState(3)
  const [shortsMinDur, setShortsMinDur] = useState<'30-60'|'15-30'>('30-60')
  const [downloadingClip, setDownloadingClip] = useState<number|null>(null)
  const [clipMode, setClipMode] = useState<'auto'|'manual'>('auto')

  async function suggestKeywords() {
    if (!genTitle || suggestingKw) return
    setSuggestingKw(true)
    try {
      const res = await fetch('/api/suggest-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: genTitle })
      })
      const data = await res.json()
      if (data.keywords) setGenKeywords(data.keywords)
    } catch {}
    setSuggestingKw(false)
  }

  async function generateShorts() {
    if (!preview) { setShortsError('Extrage mai întâi un transcript din tab-ul Transcript.'); return }
    setShortsLoading(true); setShortsError(''); setShortsClips([])
    try {
      const res = await fetch('/api/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: preview, title: videoInfo?.title || '', count: shortsCount })
      })
      const data = await res.json()
      if (!res.ok) { setShortsError(data.error || 'Eroare'); return }
      setShortsClips(data.clips || [])
    } catch (e: any) {
      setShortsError(e?.message || 'Eroare rețea')
    } finally {
      setShortsLoading(false)
    }
  }

  async function downloadClip(clip: any, idx: number) {
    if (!url) { setShortsError('URL video lipsă — intră mai întâi pe tab-ul Transcript și pune URL-ul.'); return }
    setDownloadingClip(idx)
    try {
      const res = await fetch('/api/cut-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url, startSeconds: clip.startSeconds, endSeconds: clip.endSeconds, clipIndex: idx })
      })
      if (!res.ok) {
        const err = await res.json()
        setShortsError(err.error || 'Eroare download clip')
        return
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `short_clip_${idx + 1}.mp4`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e: any) {
      setShortsError(e?.message || 'Eroare rețea')
    } finally {
      setDownloadingClip(null)
    }
  }
  const [genLanguage, setGenLanguage] = useState('Română')
  const [genDuration, setGenDuration] = useState(5)
  const [genStyle, setGenStyle]       = useState('educational')
  const [genNiche, setGenNiche]       = useState('')
  const [genRewriteUrl, setGenRewriteUrl] = useState('')
  const [genAiProvider, setGenAiProvider] = useState(AI_PROVIDERS[0])
  const [genAiModel, setGenAiModel]       = useState(AI_PROVIDERS[0].models[0])
  const [genLoading, setGenLoading]   = useState(false)
  const [genOutput, setGenOutput]     = useState('')
  const [genCopied, setGenCopied]     = useState('')

  const previewRef = useRef<HTMLDivElement>(null)
  const langRef    = useRef<HTMLDivElement>(null)

  const plan = session?.user?.plan || 'FREE'
  const isPro = plan === 'PRO' || plan === 'ENTERPRISE'
  const videosUsed = (session?.user as any)?.videosUsed || 0

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

  async function shareScript(historyId: string, sid: string) {
    const shareUrl = `${window.location.origin}/share/${sid}`
    await navigator.clipboard.writeText(shareUrl)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 3000)
  }

  async function processBatch() {
    if (!isPro) return
    const validUrls = batchUrls.filter(u => u.trim())
    if (validUrls.length === 0) return
    setBatchLoading(true); setBatchResults([]); setBatchProgress(0)
    const results = []
    for (let i = 0; i < validUrls.length; i++) {
      try {
        setBatchProgress(i + 1)
        const tRes = await fetch('/api/transcript', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url: validUrls[i] }) })
        const tData = await tRes.json()
        if (!tRes.ok) { results.push({ url: validUrls[i], error: tData.error, title: validUrls[i] }); continue }
        const pRes = await fetch('/api/process', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ rawText: tData.rawText, detectedLang: tData.detectedLang, targetLang: targetLang.label, title: tData.title, aiProvider: aiProvider.key, aiModel: aiModel.key }) })
        if (!pRes.ok || !pRes.body) { results.push({ url: validUrls[i], error: 'Eroare procesare', title: tData.title }); continue }
        const reader = pRes.body.getReader(); const decoder = new TextDecoder(); let text = ''
        while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }) }
        const hRes = await fetch('/api/history', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ videoUrl: validUrls[i], videoTitle: tData.title, sourceLang: tData.detectedLang, targetLang: targetLang.label, mode: 'translate', scriptText: text, aiProvider: aiProvider.key, aiModel: aiModel.key }) })
        const hData = await hRes.json()
        results.push({ url: validUrls[i], title: tData.title, text, shareId: hData.entry?.shareId })
      } catch(e) { results.push({ url: validUrls[i], error: `${e}`, title: validUrls[i] }) }
    }
    setBatchResults(results); setBatchLoading(false)
  }

  async function generateChapters() {
    if (!preview) return
    setChaptersLoading(true); setPreviewTab('chapters')
    try {
      const res = await fetch('/api/chapters', {method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({transcript:preview, videoTitle, duration:videoInfo?.duration})})
      const data = await res.json()
      if (res.ok) setChapters(data)
    } catch(e) { console.error(e) }
    setChaptersLoading(false)
  }

  async function generateThumbnail() {
    if (!preview && !videoTitle) return
    setThumbLoading(true); setPreviewTab('thumbnail')
    try {
      const res = await fetch('/api/thumbnail', {method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({script:preview, videoTitle, niche:'', style:'Energic'})})
      const data = await res.json()
      if (res.ok) setThumbnail(data)
    } catch(e) { console.error(e) }
    setThumbLoading(false)
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
          :{mode:'generate',title:genTitle,keywords:genKeywords,language:genLanguage,duration:genDuration,style:genStyle,niche:genNiche,aiProvider:genAiProvider.key,aiModel:genAiModel.key}
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
  const isBatch=mode==='batch'
  const stepsFor=mode==='extract'?['fetching','done']:mode==='translate'?['fetching','translating','done']:mode==='trello'?['fetching','translating','uploading','done']:['downloading','done']
  const allKeys=['fetching','translating','uploading','downloading','done']
  const stepIdx=allKeys.indexOf(step)
  const stepLbl:Record<string,string>={fetching:'Transcript',translating:'Traducere',uploading:'Trello',downloading:'Descărcare',done:'Gata'}

  const inp:React.CSSProperties={width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'10px',padding:'12px 14px',color:'var(--text)',fontSize:'14px',fontFamily:'Inter,sans-serif',outline:'none',transition:'border-color .2s'}

  const genStarStyle: React.CSSProperties = { display: 'inline-block' }

  const tabsRef = useRef<HTMLDivElement>(null)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })

  const updatePill = useCallback((el: HTMLButtonElement) => {
    const container = tabsRef.current
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setPillStyle({
      left: elRect.left - containerRect.left,
      width: elRect.width,
    })
  }, [])

  useEffect(() => {
    // mic delay ca DOM-ul să se actualizeze cu noul tab activ
    const id = requestAnimationFrame(() => {
      const activeBtn = tabsRef.current?.querySelector('[data-active="true"]') as HTMLButtonElement
      if (activeBtn) updatePill(activeBtn)
    })
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  return (
    <div style={{ background: '#040507', minHeight: '100vh', position: 'relative', overflowX: 'hidden',
      ['--bg' as any]: '#07090F',
      ['--bg2' as any]: '#0A0C14',
      ['--surface' as any]: 'rgba(255,255,255,0.04)',
      ['--surface2' as any]: 'rgba(255,255,255,0.06)',
      ['--border' as any]: 'rgba(255,255,255,0.08)',
      ['--border2' as any]: 'rgba(255,255,255,0.14)',
      ['--violet' as any]: '#8B5CF6',
      ['--violet2' as any]: '#7C3AED',
      ['--indigo' as any]: '#6366F1',
      ['--gold' as any]: '#F0C444',
      ['--gold2' as any]: '#C8A030',
      ['--goldbg' as any]: 'rgba(240,196,68,0.08)',
      ['--goldbdr' as any]: 'rgba(240,196,68,0.28)',
      ['--teal' as any]: '#2DD4BF',
      ['--tealbg' as any]: 'rgba(45,212,191,0.08)',
      ['--tealbdr' as any]: 'rgba(45,212,191,0.28)',
      ['--green' as any]: '#34D399',
      ['--red' as any]: '#F87171',
      ['--text' as any]: '#EEEEF2',
      ['--text2' as any]: 'rgba(238,238,242,0.55)',
      ['--text3' as any]: 'rgba(238,238,242,0.28)',
    }}>
      {/* Ambient bg — grid de patrate static ca Pikzels */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, #040507 100%)' }}/>
        <div style={{ position: 'absolute', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(124,58,237,.08) 0%, transparent 70%)', top: 0, left: '50%', transform: 'translateX(-50%)' }}/>
      </div>

      <style>{`
        .tool-root { display: flex; min-height: 100vh; position: relative; z-index: 1; }
        .tool-sidebar-wrap {
          width: 200px; flex-shrink: 0; padding: 24px 10px;
          background: rgba(255,255,255,.015);
          border-right: 1px solid rgba(255,255,255,.05);
          position: sticky; top: 0; height: 100vh; overflow-y: auto;
          display: flex; flex-direction: column; gap: 2px;
        }
        .tool-main { flex: 1; min-width: 0; padding: 24px 32px 100px; }
        .sb-logo { font-size: 15px; font-weight: 800; color: #fff; padding: 0 10px 20px; letter-spacing: -.02em; }
        .sb-logo span { background: linear-gradient(135deg, #7C3AED, #0CCFB0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sb-btn { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px;
          cursor: pointer; font-family: Inter,sans-serif; font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,.4); background: transparent; border: none;
          transition: all .15s; width: 100%; text-align: left; }
        .sb-btn:hover { background: rgba(255,255,255,.05); color: rgba(255,255,255,.75); }
        .sb-btn.active { background: rgba(124,58,237,.12); color: #C4B5FD; font-weight: 600; }
        .sb-btn.active::before { content: ""; width: 3px; height: 16px; background: #7C3AED; border-radius: 2px; flex-shrink: 0; margin-right: -2px; }
        .sb-badge { font-size: 8px; font-weight: 700; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; margin-left: auto; }
        @media (max-width: 767px) {
          .tool-sidebar-wrap { display: none; }
          .tool-main { padding: 16px 14px 100px; max-width: 100%; }
          .tool-mobile-tabs { display: block !important; }
        }
        .tool-mobile-tabs { display: none; margin-bottom: 4px; }
      `}</style>
      <div className="tool-root">

        {/* ── SIDEBAR ── */}
        <div className="tool-sidebar-wrap">
          <div className="sb-logo"><span>Scribe</span>AI</div>
          {MODES.map(m => {
            const active = mode === m.key
            const locked = m.badge === 'PRO' && !isPro
            return (
              <button key={m.key} type="button"
                className={`sb-btn${active ? ' active' : ''}`}
                onClick={() => { if (locked) { window.location.href = '/pricing'; return } setMode(m.key); reset(); setGenOutput('') }}
                style={{ opacity: locked ? .6 : 1 }}>
                {m.label}
                <span className="sb-badge" style={{
                  background: m.badge === 'FREE' ? 'rgba(12,207,176,.12)' : 'rgba(245,158,11,.1)',
                  color: m.badge === 'FREE' ? '#0CCFB0' : '#F59E0B'
                }}>{m.badge}</span>
                {locked && <span style={{ fontSize: '9px' }}>🔒</span>}
              </button>
            )
          })}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="tool-main">

        {/* MOBILE TABS — ascuns pe desktop */}
        <div className="tool-mobile-tabs">
        <div style={{ position: 'relative' }}>
          <div ref={tabsRef} className="tabs-scroll" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '4px', bottom: '4px', left: pillStyle.left, width: pillStyle.width, background: '#7C3AED', borderRadius: '100px', transition: 'left .3s cubic-bezier(.4,0,.2,1), width .3s cubic-bezier(.4,0,.2,1)', boxShadow: '0 0 18px rgba(124,58,237,.45)', pointerEvents: 'none', zIndex: 0 }}/>
          {MODES.map(m => {
            const active = mode === m.key
            const locked = m.badge === 'PRO' && !isPro
            return (
              <button key={m.key} type="button" disabled={isLoading}
                data-active={active ? 'true' : 'false'}
                onClick={(e) => {
                  if (locked) { window.location.href = '/pricing'; return }
                  updatePill(e.currentTarget)
                  setMode(m.key); reset(); setGenOutput('')
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '7px 12px', borderRadius: '100px', cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                  background: 'transparent',
                  border: 'none',
                  color: active ? '#fff' : 'rgba(255,255,255,.38)',
                  opacity: locked ? .55 : 1, fontFamily: 'Inter,sans-serif', fontSize: '11px', fontWeight: 700,
                  position: 'relative', zIndex: 1, transition: 'color .2s' }}>
                {locked && <span style={{ fontSize: '9px' }}>🔒</span>}
                <span>{m.label}</span>
                <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px',
                  color: m.badge === 'PRO' ? '#F59E0B' : '#0CCFB0',
                  background: m.badge === 'PRO' ? 'rgba(245,158,11,.15)' : 'rgba(12,207,176,.15)' }}>{m.badge}</span>
              </button>
            )
          })}
          </div>
        </div>
        </div>{/* /tool-mobile-tabs */}

        {/* Main card */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '-1px', borderRadius: '21px', background: 'linear-gradient(135deg,rgba(124,58,237,.3),rgba(12,207,176,.07),rgba(124,58,237,.12))', zIndex: 0 }}/>
          <div style={{ position: 'relative', zIndex: 1, background: '#0A0C14', border: '1px solid rgba(124,58,237,.2)', borderRadius: '20px', padding: '24px', overflow: 'hidden' }}>

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
                      style={{padding:'9px',borderRadius:'100px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',border:'none',
                        background:genMode==='generate'?'#7C3AED':'transparent',
                        color:genMode==='generate'?'#fff':'rgba(255,255,255,.4)',
                        boxShadow:genMode==='generate'?'0 0 18px rgba(124,58,237,.45)':'none',transition:'all .2s'}}>
                      ✦ Generează din zero
                    </button>
                    <button type="button" onClick={()=>{setGenMode('rewrite');setGenOutput('')}}
                      style={{padding:'9px',borderRadius:'100px',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',border:'none',
                        background:genMode==='rewrite'?'#F0C444':'transparent',
                        color:genMode==='rewrite'?'#0A0800':'rgba(255,255,255,.4)',
                        boxShadow:genMode==='rewrite'?'0 0 18px rgba(240,196,68,.4)':'none',transition:'all .2s'}}>
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
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'7px'}}>
                          <label style={{fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)'}}>Keywords *</label>
                          <button type="button" onClick={suggestKeywords} disabled={!genTitle||suggestingKw}
                            style={{display:'flex',alignItems:'center',gap:'4px',padding:'3px 10px',borderRadius:'100px',border:'1px solid rgba(240,196,68,.3)',background:'rgba(240,196,68,.08)',color:'var(--gold)',fontSize:'11px',fontWeight:600,cursor:!genTitle||suggestingKw?'not-allowed':'pointer',opacity:!genTitle?.4:1,fontFamily:'Inter,sans-serif',transition:'all .2s'}}>
                            {suggestingKw ? '...' : '✨ Sugerează'}
                          </button>
                        </div>
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
                                style={{padding:'7px 4px',borderRadius:'100px',border:'none',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                  background:genDuration===d?'#F0C444':'rgba(255,255,255,.05)',boxShadow:genDuration===d?'0 0 12px rgba(240,196,68,.45)':'none',transition:'all .2s',color:genDuration===d?'#0A0800':'rgba(255,255,255,.4)'}}>
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
                                style={{padding:'6px 4px',borderRadius:'100px',border:'none',fontSize:'10px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                  background:genStyle===s.key?'#F0C444':'rgba(255,255,255,.05)',boxShadow:genStyle===s.key?'0 0 12px rgba(240,196,68,.45)':'none',transition:'all .2s',color:genStyle===s.key?'#0A0800':'rgba(255,255,255,.4)'}}>
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
                              style={{padding:'4px 9px',borderRadius:'100px',border:'none',fontSize:'11px',fontWeight:500,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                background:genNiche===n?'#F0C444':'rgba(255,255,255,.05)',boxShadow:genNiche===n?'0 0 12px rgba(240,196,68,.45)':'none',transition:'all .2s',color:genNiche===n?'#0A0800':'rgba(255,255,255,.4)'}}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* AI Provider pentru ambele moduri */}
                  <div>
                    <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'8px'}}>Model AI</label>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px',marginBottom:'7px'}}>
                      {AI_PROVIDERS.map(p=>(
                        <button key={p.key} type="button" onClick={()=>{setGenAiProvider(p);setGenAiModel(p.models[0])}}
                          style={{padding:'8px 6px',borderRadius:'100px',border:'none',background:genAiProvider.key===p.key?p.color:'rgba(255,255,255,.05)',cursor:'pointer',fontSize:'11px',fontWeight:700,color:genAiProvider.key===p.key?'#0A0A0F':'rgba(255,255,255,.4)',textAlign:'center',boxShadow:genAiProvider.key===p.key?`0 0 16px ${p.color}66`:'none',transition:'all .2s'}}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                      {genAiProvider.models.map(m=>(
                        <button key={m.key} type="button" onClick={()=>setGenAiModel(m)}
                          style={{padding:'5px 12px',borderRadius:'100px',border:'none',background:genAiModel.key===m.key?genAiProvider.color:'rgba(255,255,255,.05)',cursor:'pointer',fontSize:'11px',fontWeight:600,color:genAiModel.key===m.key?'#0A0A0F':'rgba(255,255,255,.4)',boxShadow:genAiModel.key===m.key?`0 0 12px ${genAiProvider.color}55`:'none',transition:'all .2s'}}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Durată și Stil pentru Rewrite */}
                  {genMode==='rewrite' && (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                      <div>
                        <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Durată output: <span style={{color:'var(--gold)',fontWeight:700}}>{genDuration}m</span></label>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'4px'}}>
                          {GEN_DURATIONS.map(d=>(
                            <button key={d} type="button" onClick={()=>setGenDuration(d)}
                              style={{padding:'7px 4px',borderRadius:'100px',border:'none',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                background:genDuration===d?'#F0C444':'rgba(255,255,255,.05)',boxShadow:genDuration===d?'0 0 12px rgba(240,196,68,.45)':'none',transition:'all .2s',color:genDuration===d?'#0A0800':'rgba(255,255,255,.4)'}}>
                              {d}m
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Stil output</label>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'4px'}}>
                          {GEN_STYLES.map(s=>(
                            <button key={s.key} type="button" onClick={()=>setGenStyle(s.key)}
                              style={{padding:'6px 4px',borderRadius:'100px',border:'none',fontSize:'10px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                                background:genStyle===s.key?'#F0C444':'rgba(255,255,255,.05)',boxShadow:genStyle===s.key?'0 0 12px rgba(240,196,68,.45)':'none',transition:'all .2s',color:genStyle===s.key?'#0A0800':'rgba(255,255,255,.4)'}}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Limbă (ambele moduri) */}
                  <div>
                    <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>
                      {genMode==='rewrite'?'Limbă output':'Limbă script'}
                    </label>
                    <select value={genLanguage} onChange={e=>setGenLanguage(e.target.value)}
                      style={{...inp,cursor:'pointer',colorScheme:'dark',background:'#0C0C18',color:'var(--text)'}}>
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

          {/* ── SHORTS MODE ── */}
          {mode === 'shorts' && (
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              {!isPro ? (
                <div style={{textAlign:'center',padding:'32px 20px',background:'rgba(217,70,239,.06)',border:'1px solid rgba(217,70,239,.2)',borderRadius:'14px'}}>
                  <div style={{fontSize:'32px',marginBottom:'10px'}}>✂️</div>
                  <p style={{fontWeight:700,marginBottom:'6px'}}>Shorts Generator — PRO</p>
                  <p style={{fontSize:'12px',color:'var(--text3)',marginBottom:'14px'}}>Extrage automat momentele virale din orice video YouTube</p>
                  <button onClick={()=>window.location.href='/pricing'} style={{padding:'10px 24px',borderRadius:'100px',border:'none',background:'linear-gradient(135deg,#D946EF,#6366F1)',color:'#fff',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Upgrade la PRO</button>
                </div>
              ) : (
                <>
                  {/* Opțiuni */}
                  <div style={{background:'rgba(217,70,239,.05)',border:'1px solid rgba(217,70,239,.15)',borderRadius:'14px',padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>

                    <div>
                      <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Număr clipuri (max 15 PRO)</label>
                      <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                        {[3,5,7,10,15].map(n=>(
                          <button key={n} type="button" onClick={()=>setShortsCount(n)}
                            style={{padding:'6px 14px',borderRadius:'100px',border:'none',background:shortsCount===n?'#D946EF':'rgba(255,255,255,.05)',color:shortsCount===n?'#fff':'rgba(255,255,255,.4)',boxShadow:shortsCount===n?'0 0 14px rgba(217,70,239,.45)':'none',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all .2s',fontFamily:'Inter,sans-serif'}}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Durată clipuri</label>
                      <div style={{display:'flex',gap:'6px'}}>
                        {(['30-60','15-30'] as const).map(d=>(
                          <button key={d} type="button" onClick={()=>setShortsMinDur(d)}
                            style={{padding:'6px 14px',borderRadius:'100px',border:'none',background:shortsMinDur===d?'#D946EF':'rgba(255,255,255,.05)',color:shortsMinDur===d?'#fff':'rgba(255,255,255,.4)',boxShadow:shortsMinDur===d?'0 0 14px rgba(217,70,239,.45)':'none',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all .2s',fontFamily:'Inter,sans-serif'}}>
                            ⏱ {d} sec
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Mod descărcare</label>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button type="button" onClick={()=>setClipMode('auto')}
                          style={{padding:'6px 14px',borderRadius:'100px',border:'none',background:clipMode==='auto'?'#D946EF':'rgba(255,255,255,.05)',color:clipMode==='auto'?'#fff':'rgba(255,255,255,.4)',boxShadow:clipMode==='auto'?'0 0 14px rgba(217,70,239,.45)':'none',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all .2s',fontFamily:'Inter,sans-serif'}}>
                          ✂️ Auto (ffmpeg)
                        </button>
                        <button type="button" onClick={()=>setClipMode('manual')}
                          style={{padding:'6px 14px',borderRadius:'100px',border:'none',background:clipMode==='manual'?'#D946EF':'rgba(255,255,255,.05)',color:clipMode==='manual'?'#fff':'rgba(255,255,255,.4)',boxShadow:clipMode==='manual'?'0 0 14px rgba(217,70,239,.45)':'none',fontSize:'12px',fontWeight:700,cursor:'pointer',transition:'all .2s',fontFamily:'Inter,sans-serif'}}>
                          📋 Manual (timestamps)
                        </button>
                      </div>
                    </div>

                    <button type="button" onClick={generateShorts} disabled={shortsLoading}
                      style={{width:'100%',padding:'13px',borderRadius:'100px',border:'none',background:'linear-gradient(135deg,#D946EF,#6366F1)',color:'#fff',fontSize:'14px',fontWeight:800,cursor:shortsLoading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',boxShadow:'0 0 24px rgba(217,70,239,.4)',opacity:shortsLoading?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                      {shortsLoading ? (
                        <><div style={{width:'14px',height:'14px',border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Analizez cu Claude...</>
                      ) : '✂️ Detectează momente virale'}
                    </button>
                  </div>

                  {/* Eroare */}
                  {shortsError && (
                    <div style={{padding:'12px 16px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'12px',fontSize:'12px',color:'#FCA5A5'}}>
                      ✕ {shortsError}
                    </div>
                  )}

                  {/* Rezultate */}
                  {shortsClips.length > 0 && (
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      <div style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'rgba(255,255,255,.3)',display:'flex',alignItems:'center',gap:'8px'}}>
                        Momente detectate
                        <span style={{background:'rgba(217,70,239,.15)',color:'#F0ABFC',padding:'1px 9px',borderRadius:'100px',fontSize:'9px'}}>{shortsClips.length} clipuri</span>
                        <div style={{flex:1,height:'1px',background:'rgba(255,255,255,.06)'}}/>
                      </div>

                      {shortsClips.map((clip,i)=>(
                        <div key={i} style={{background:'#101018',border:'1px solid rgba(217,70,239,.15)',borderRadius:'16px',overflow:'hidden',transition:'all .2s'}}>
                          <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                            {/* Header clip */}
                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                <span style={{background:'rgba(0,0,0,.4)',borderRadius:'7px',padding:'3px 9px',fontSize:'11px',fontWeight:700,color:'#fff',fontFamily:'monospace'}}>
                                  {clip.startTime} → {clip.endTime}
                                </span>
                                <span style={{fontSize:'11px',color:'rgba(255,255,255,.4)'}}>
                                  {clip.endSeconds - clip.startSeconds}s
                                </span>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:'4px',background:'rgba(0,0,0,.3)',borderRadius:'7px',padding:'3px 9px',fontSize:'11px',fontWeight:800,color:clip.viralScore>=90?'#6EE7B7':clip.viralScore>=80?'#FCD34D':'#FDA4AF'}}>
                                🔥 {clip.viralScore}
                              </div>
                            </div>

                            {/* Hook */}
                            <p style={{fontSize:'13px',fontWeight:600,lineHeight:1.4,color:'#ECECF1'}}>"{clip.hook}"</p>

                            {/* Tags */}
                            <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                              {clip.tags?.map((tag: string, ti: number)=>(
                                <span key={ti} style={{padding:'2px 8px',borderRadius:'5px',fontSize:'9px',fontWeight:700,textTransform:'uppercase',
                                  background:ti===0?'rgba(52,211,153,.12)':'rgba(217,70,239,.1)',
                                  color:ti===0?'#6EE7B7':'#F0ABFC'}}>
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {clip.reason && (
                              <p style={{fontSize:'11px',color:'rgba(255,255,255,.35)',fontStyle:'italic'}}>{clip.reason}</p>
                            )}

                            {/* Acțiuni */}
                            <div style={{display:'flex',gap:'7px'}}>
                              {clipMode === 'auto' ? (
                                <button type="button" onClick={()=>downloadClip(clip,i)} disabled={downloadingClip===i}
                                  style={{flex:1,padding:'9px',borderRadius:'9px',border:'none',background:'linear-gradient(135deg,#6366F1,#D946EF)',color:'#fff',fontSize:'12px',fontWeight:700,cursor:downloadingClip===i?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',opacity:downloadingClip===i?.6:1}}>
                                  {downloadingClip===i ? (
                                    <><div style={{width:'11px',height:'11px',border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Tai clipul...</>
                                  ) : '↓ Descarcă clip'}
                                </button>
                              ) : (
                                <button type="button" onClick={()=>navigator.clipboard.writeText(`${clip.startTime} - ${clip.endTime} (${clip.startSeconds}s - ${clip.endSeconds}s)`)}
                                  style={{flex:1,padding:'9px',borderRadius:'9px',border:'1px solid rgba(217,70,239,.3)',background:'rgba(217,70,239,.08)',color:'#F0ABFC',fontSize:'12px',fontWeight:700,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                                  ⎘ Copiază timestamps
                                </button>
                              )}
                              <button type="button" onClick={()=>navigator.clipboard.writeText(clip.hook)}
                                style={{padding:'9px 14px',borderRadius:'9px',border:'1px solid rgba(255,255,255,.09)',background:'rgba(255,255,255,.04)',color:'rgba(255,255,255,.5)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                                ⎘ Hook
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── BATCH MODE ── */}
          {isBatch && (
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {!isPro ? (
                <div style={{textAlign:'center',padding:'32px 20px',background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.2)',borderRadius:'14px'}}>
                  <div style={{fontSize:'32px',marginBottom:'10px'}}>⚡</div>
                  <p style={{fontWeight:700,color:'var(--green)',marginBottom:'6px'}}>Feature exclusiv Pro</p>
                  <p style={{fontSize:'13px',color:'var(--text2)',marginBottom:'16px'}}>Procesează 3 video-uri simultan cu traducere automată.</p>
                  <a href="/pricing" style={{display:'inline-block',padding:'10px 24px',borderRadius:'9px',background:'linear-gradient(135deg,var(--violet2),var(--indigo))',color:'white',fontWeight:700,textDecoration:'none',fontSize:'13px'}}>⚡ Upgrade la Pro</a>
                </div>
              ) : (
                <>
                  <div>
                    <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'8px'}}>3 URL-uri YouTube</label>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      {batchUrls.map((u,i)=>(
                        <div key={i} style={{position:'relative'}}>
                          <span style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'var(--text3)',fontWeight:700}}>{i+1}</span>
                          <input value={u} onChange={e=>{const n=[...batchUrls];n[i]=e.target.value;setBatchUrls(n)}}
                            placeholder={`https://youtu.be/... (URL ${i+1})`} disabled={batchLoading}
                            style={{...inp,paddingLeft:'30px'}}
                            onFocus={e=>e.target.style.borderColor='rgba(52,211,153,.4)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}/>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                    <div ref={langRef} style={{position:'relative'}}>
                      <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Traduce în</label>
                      <button type="button" disabled={batchLoading} onClick={()=>setLangOpen(o=>!o)}
                        style={{...inp,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',borderColor:langOpen?'rgba(52,211,153,.4)':'rgba(255,255,255,.09)'}}>
                        <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <span style={{fontWeight:700,fontSize:'11px',color:'var(--green)',background:'rgba(52,211,153,.1)',padding:'2px 6px',borderRadius:'5px'}}>{targetLang.short}</span>
                          {targetLang.label}
                        </span>
                        <span style={{color:'var(--text3)',fontSize:'10px'}}>▼</span>
                      </button>
                      {langOpen&&(
                        <div style={{position:'absolute',top:'calc(100% + 5px)',left:0,right:0,zIndex:50,borderRadius:'12px',background:'#0C0C18',border:'1px solid rgba(52,211,153,.2)',boxShadow:'0 20px 48px rgba(0,0,0,.6)',maxHeight:'200px',overflowY:'auto'}}>
                          {LANGUAGES.map(lang=>(
                            <div key={lang.code} onClick={()=>{setTargetLang(lang);setLangOpen(false)}}
                              style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 14px',cursor:'pointer',fontSize:'13px',color:targetLang.code===lang.code?'var(--green)':'var(--text2)',background:targetLang.code===lang.code?'rgba(52,211,153,.08)':'transparent'}}>
                              <span style={{fontWeight:600,fontSize:'11px',color:'var(--text3)',background:'var(--surface2)',padding:'2px 6px',borderRadius:'4px',minWidth:'28px',textAlign:'center'}}>{lang.short}</span>
                              {lang.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:'10px',fontWeight:600,letterSpacing:'.09em',textTransform:'uppercase',color:'var(--text3)',marginBottom:'7px'}}>Model AI</label>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                        {AI_PROVIDERS.map(p=>(
                          <button key={p.key} type="button" disabled={batchLoading} onClick={()=>{setAiProvider(p);setAiModel(p.models[0])}}
                            style={{padding:'6px 12px',borderRadius:'100px',border:'none',background:aiProvider.key===p.key?p.color:'rgba(255,255,255,.05)',cursor:'pointer',fontSize:'11px',fontWeight:700,color:aiProvider.key===p.key?'#0A0A0F':'rgba(255,255,255,.4)',boxShadow:aiProvider.key===p.key?`0 0 14px ${p.color}66`:'none',transition:'all .2s'}}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {batchLoading && (
                    <div style={{padding:'12px',background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.2)',borderRadius:'10px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                        <span style={{fontSize:'12px',color:'var(--green)',fontWeight:600}}>Procesez video {batchProgress} din {batchUrls.filter(u=>u.trim()).length}...</span>
                      </div>
                      <div style={{height:'3px',background:'var(--surface2)',borderRadius:'100px',overflow:'hidden'}}>
                        <div style={{height:'100%',background:'linear-gradient(90deg,var(--green),var(--teal))',width:`${(batchProgress/batchUrls.filter(u=>u.trim()).length)*100}%`,transition:'width .5s'}}/>
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={processBatch} disabled={batchLoading||batchUrls.every(u=>!u.trim())}
                    style={{width:'100%',padding:'14px',borderRadius:'11px',border:'none',cursor:batchLoading?'not-allowed':'pointer',fontFamily:'Inter,sans-serif',fontSize:'15px',fontWeight:700,
                      background:batchLoading?'rgba(52,211,153,.1)':'linear-gradient(135deg,#059669,#10B981)',
                      color:batchLoading?'var(--text3)':'white',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                    {batchLoading?<><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>Se procesează...</>:'⚡ Procesează toate simultan'}
                  </button>
                  {batchResults.length>0&&(
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      {batchResults.map((r,i)=>(
                        <div key={i} style={{background:r.error?'rgba(248,113,113,.06)':'var(--bg2)',border:`1px solid ${r.error?'rgba(248,113,113,.2)':'rgba(52,211,153,.2)'}`,borderRadius:'12px',overflow:'hidden'}}>
                          <div style={{padding:'10px 14px',borderBottom:`1px solid ${r.error?'rgba(248,113,113,.1)':'rgba(52,211,153,.1)'}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                            <span style={{fontSize:'12px',fontWeight:600,color:r.error?'#FCA5A5':'var(--green)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{r.error?'❌':'✓'} {r.title}</span>
                            {!r.error&&(
                              <div style={{display:'flex',gap:'5px'}}>
                                <button onClick={()=>navigator.clipboard.writeText(r.text)}
                                  style={{padding:'4px 9px',borderRadius:'5px',fontSize:'11px',background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.2)',color:'var(--green)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⎘ Copiază</button>
                                {r.shareId&&<button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/share/${r.shareId}`);setShareCopied(true);setTimeout(()=>setShareCopied(false),2000)}}
                                  style={{padding:'4px 9px',borderRadius:'5px',fontSize:'11px',background:'var(--goldbg)',border:'1px solid var(--goldbdr)',color:'var(--gold)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>{shareCopied?'✓':'🔗 Share'}</button>}
                              </div>
                            )}
                          </div>
                          {r.error?<p style={{padding:'10px 14px',fontSize:'12px',color:'rgba(248,113,113,.7)',margin:0}}>{r.error}</p>:(
                            <div style={{padding:'12px 14px',fontSize:'12px',lineHeight:1.7,color:'var(--text2)',maxHeight:'150px',overflowY:'auto',whiteSpace:'pre-wrap'}}>{r.text?.slice(0,300)}...</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── NORMAL FORM ── */}
          <form onSubmit={handleSubmit} style={{display:isGenerate||isBatch?'none':'flex',flexDirection:'column',gap:'16px'}}>

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
                      {detectedLang&&step==='done'&&<span style={{fontSize:'10px',fontWeight:600,padding:'2px 7px',borderRadius:'100px',background:'rgba(52,211,153,.1)',border:'1px solid rgba(52,211,153,.2)',color:'var(--green)'}}>🌐 {detectedLang}</span>}
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
                      style={{padding:'8px 6px',borderRadius:'100px',border:'none',background:aiProvider.key===p.key?p.color:'rgba(255,255,255,.05)',cursor:'pointer',fontSize:'11px',fontWeight:700,color:aiProvider.key===p.key?'#0A0A0F':'rgba(255,255,255,.4)',textAlign:'center',boxShadow:aiProvider.key===p.key?`0 0 16px ${p.color}66`:'none',transition:'all .2s'}}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  {aiProvider.models.map(m=>(
                    <button key={m.key} type="button" disabled={isLoading} onClick={()=>setAiModel(m)}
                      style={{padding:'5px 12px',borderRadius:'100px',border:'none',background:aiModel.key===m.key?aiProvider.color:'rgba(255,255,255,.05)',cursor:'pointer',fontSize:'11px',fontWeight:600,color:aiModel.key===m.key?'#0A0A0F':'rgba(255,255,255,.4)',boxShadow:aiModel.key===m.key?`0 0 12px ${aiProvider.color}55`:'none',transition:'all .2s'}}>
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
                      style={{padding:'10px 6px',borderRadius:'16px',border:'none',background:dlFormat.key===f.key?'#F0C444':'rgba(255,255,255,.05)',cursor:'pointer',textAlign:'center',boxShadow:dlFormat.key===f.key?'0 0 16px rgba(240,196,68,.45)':'none',transition:'all .2s'}}>
                      <div style={{fontSize:'16px',marginBottom:'3px'}}>{f.icon}</div>
                      <div style={{fontSize:'10px',fontWeight:700,color:dlFormat.key===f.key?'#0A0800':'rgba(255,255,255,.4)'}}>{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit — pill premium */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px' }}>
              <button type="submit" disabled={isLoading||!url}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 32px', borderRadius: '100px', border: 'none', cursor: isLoading||!url ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: 800, fontFamily: 'Inter,sans-serif',
                  background: isLoading||!url ? 'rgba(124,58,237,.12)' : 'linear-gradient(135deg,#7C3AED,#6D28D9)',
                  color: isLoading||!url ? 'rgba(255,255,255,.3)' : 'white',
                  boxShadow: isLoading||!url ? 'none' : '0 0 28px rgba(124,58,237,.45)',
                  position: 'relative', overflow: 'hidden', transition: 'all .2s' }}>
                {!isLoading&&!!url&&<span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,.1),transparent)', borderRadius: '100px' }}/>}
                {isLoading ? <><Spin/>{status}</> : <>
                  <span style={genStarStyle}>✦</span>
                  {mode==='extract'&&'Extrage scriptul'}
                  {mode==='translate'&&`Traduce în ${targetLang.label}`}
                  {mode==='trello'&&'Procesează și urcă pe Trello'}
                  {mode==='download'&&`Descarcă ${dlFormat.label}`}
                </>}
              </button>
            </div>
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
          </div>{/* end card inner */}
        </div>{/* end card wrap */}

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
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0CCFB0', display: 'inline-block', boxShadow: '0 0 6px rgba(12,207,176,.6)' }}/>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  {mode==='extract'?'Transcript':`Tradus — ${targetLang.label}`}
                </span>
                {detectedLang&&<span style={{ fontSize: '10px', color: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.05)', padding: '2px 8px', borderRadius: '100px' }}>sursă: {detectedLang}</span>}
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
                <button onClick={async()=>{
                  const r=await fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoUrl:url,videoTitle,videoChannel:videoInfo?.channel,videoDuration:videoInfo?.duration,thumbnail:videoInfo?.thumbnailMq,sourceLang:detectedLang,targetLang:targetLang.label,mode,scriptText:preview,aiProvider:aiProvider.key,aiModel:aiModel.key})})
                  const d=await r.json()
                  if(d.entry?.shareId){await navigator.clipboard.writeText(window.location.origin+'/share/'+d.entry.shareId);setShareCopied(true);setTimeout(()=>setShareCopied(false),3000)}
                }} style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',background:'rgba(240,196,68,.08)',border:'1px solid rgba(240,196,68,.25)',color:'var(--gold)'}}>
                  {shareCopied?'✓ Copiat!':'🔗 Share'}
                </button>
                <button onClick={async()=>{
                  const hRes=await fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({videoUrl:url,videoTitle:videoTitle,videoChannel:videoInfo?.channel,videoDuration:videoInfo?.duration,thumbnail:videoInfo?.thumbnailMq,sourceLang:detectedLang,targetLang:targetLang.label,mode,scriptText:preview,aiProvider:aiProvider.key,aiModel:aiModel.key})})
                  const hData=await hRes.json()
                  if(hData.entry?.shareId){const shareUrl=`${window.location.origin}/share/${hData.entry.shareId}`;await navigator.clipboard.writeText(shareUrl);setShareCopied(true);setTimeout(()=>setShareCopied(false),3000)}
                }}
                  style={{padding:'5px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',background:'rgba(240,196,68,.08)',border:'1px solid rgba(240,196,68,.25)',color:'var(--gold)'}}>
                  {shareCopied?'✓ Link copiat!':'🔗 Share'}
                </button>
              </div>
            </div>
            <div ref={previewRef} style={{padding:'16px',fontSize:'13px',lineHeight:1.8,color:'var(--text2)',maxHeight:'360px',overflowY:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
              {preview}
            </div>
            <div style={{padding:'9px 16px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'6px'}}>
              <span style={{fontSize:'11px',color:'var(--text3)'}}>{preview.length.toLocaleString()} caractere · {preview.split(/\s+/).filter(Boolean).length.toLocaleString()} cuvinte</span>
              <div style={{display:'flex',gap:'5px'}}>
                <button type="button" onClick={()=>{setPreviewTab('chapters');if(!chapters&&!chaptersLoading)generateChapters()}}
                  style={{padding:'4px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                    background:previewTab==='chapters'?'rgba(139,92,246,.15)':'var(--surface)',
                    border:'1px solid '+(previewTab==='chapters'?'rgba(139,92,246,.4)':'var(--border)'),
                    color:previewTab==='chapters'?'var(--violet)':'var(--text3)'}}>
                  {chaptersLoading?'⏳...':'📑 Chapters AI'}
                </button>
                <button type="button" onClick={()=>{setPreviewTab('thumbnail');if(!thumbnail&&!thumbLoading)generateThumbnail()}}
                  style={{padding:'4px 10px',borderRadius:'6px',fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',
                    background:previewTab==='thumbnail'?'var(--goldbg)':'var(--surface)',
                    border:'1px solid '+(previewTab==='thumbnail'?'var(--goldbdr)':'var(--border)'),
                    color:previewTab==='thumbnail'?'var(--gold)':'var(--text3)'}}>
                  {thumbLoading?'⏳...':'🖼️ Thumbnail AI'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chapters panel */}
        {previewTab==='chapters'&&preview&&(
          <div style={{background:'var(--bg2)',border:'1px solid rgba(139,92,246,.2)',borderRadius:'16px',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:'12px',fontWeight:700,color:'var(--violet)'}}>📑 Chapters AI</span>
              <button onClick={()=>setPreviewTab('script')} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:'16px'}}>✕</button>
            </div>
            <div style={{padding:'16px'}}>
              {chaptersLoading&&<div style={{textAlign:'center',padding:'32px',color:'var(--text3)'}}>
                <p>Claude analizează transcriptul și creează capitolele...</p>
              </div>}
              {chapters&&!chaptersLoading&&(
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  {chapters.summary&&<div style={{padding:'10px 12px',background:'rgba(139,92,246,.06)',border:'1px solid rgba(139,92,246,.15)',borderRadius:'9px'}}>
                    <p style={{fontSize:'11px',fontWeight:700,color:'var(--violet)',marginBottom:'4px'}}>📋 REZUMAT</p>
                    <p style={{fontSize:'13px',color:'var(--text2)',lineHeight:1.6,margin:0}}>{chapters.summary}</p>
                  </div>}
                  {(chapters.chapters||[]).map((ch:any,i:number)=>(
                    <div key={i} style={{display:'flex',gap:'10px',padding:'10px 12px',background:'var(--surface)',borderRadius:'9px',border:'1px solid var(--border)'}}>
                      <div style={{flexShrink:0,textAlign:'center',minWidth:'45px'}}>
                        <div style={{fontSize:'18px'}}>{ch.emoji}</div>
                        <span style={{fontSize:'10px',fontWeight:700,color:'var(--violet)',background:'rgba(139,92,246,.1)',padding:'1px 5px',borderRadius:'4px'}}>{ch.timestamp}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:'13px',fontWeight:700,color:'var(--text)',margin:'0 0 3px'}}>{ch.title}</p>
                        <p style={{fontSize:'11px',color:'var(--text3)',margin:'0 0 5px',lineHeight:1.4}}>{ch.description}</p>
                        <div style={{display:'flex',gap:'3px',flexWrap:'wrap'}}>
                          {(ch.keyPoints||[]).map((kp:string,j:number)=>(
                            <span key={j} style={{fontSize:'10px',padding:'1px 6px',borderRadius:'100px',background:'var(--surface2)',color:'var(--text3)'}}>· {kp}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{padding:'10px 12px',background:'rgba(255,255,255,.02)',border:'1px solid var(--border)',borderRadius:'9px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                      <p style={{fontSize:'11px',fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',margin:0}}>Format YouTube</p>
                      <button onClick={()=>navigator.clipboard.writeText((chapters.chapters||[]).map((ch:any)=>ch.timestamp+' '+ch.emoji+' '+ch.title).join('\n'))}
                        style={{padding:'3px 8px',borderRadius:'5px',fontSize:'10px',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text3)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⎘ Copiază</button>
                    </div>
                    <pre style={{fontSize:'12px',color:'var(--text2)',margin:0,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{(chapters.chapters||[]).map((ch:any)=>ch.timestamp+' '+ch.emoji+' '+ch.title).join('\n')}</pre>
                  </div>
                  {chapters.suggestedTags&&<div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                    {chapters.suggestedTags.map((tag:string,i:number)=>(
                      <span key={i} style={{fontSize:'10px',padding:'2px 8px',borderRadius:'100px',background:'var(--goldbg)',border:'1px solid var(--goldbdr)',color:'var(--gold)'}}>#{tag}</span>
                    ))}
                  </div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Thumbnail panel */}
        {previewTab==='thumbnail'&&preview&&(
          <div style={{background:'var(--bg2)',border:'1px solid var(--goldbdr)',borderRadius:'16px',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:'12px',fontWeight:700,color:'var(--gold)'}}>🖼️ Thumbnail AI — 3 Concepte</span>
              <button onClick={()=>setPreviewTab('script')} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:'16px'}}>✕</button>
            </div>
            <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
              {thumbLoading&&<div style={{textAlign:'center',padding:'32px',color:'var(--text3)'}}>
                <p>Claude generează conceptele de thumbnail...</p>
              </div>}
              {thumbnail&&!thumbLoading&&(
                <>
                {(thumbnail.thumbnails||[]).map((t:any,i:number)=>(
                  <div key={i} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'11px',overflow:'hidden'}}>
                    <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:`linear-gradient(135deg,${(t.colorPalette||[])[0]||'#8B5CF6'}18,transparent)`}}>
                      <div>
                        <p style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',margin:'0 0 2px'}}>Concept {i+1}</p>
                        <p style={{fontSize:'13px',fontWeight:700,color:'var(--text)',margin:0}}>{t.concept}</p>
                      </div>
                      <span style={{fontSize:'11px',padding:'3px 9px',borderRadius:'100px',background:'rgba(240,196,68,.1)',border:'1px solid var(--goldbdr)',color:'var(--gold)',fontWeight:600}}>{t.emotion}</span>
                    </div>
                    <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:'8px'}}>
                      {/* Imagine generată de Replicate */}
                      {t.imageUrl ? (
                        <div style={{borderRadius:'8px',overflow:'hidden',border:'1px solid rgba(255,255,255,.1)',position:'relative'}}>
                          <img src={t.imageUrl} alt={t.hook} style={{width:'100%',display:'block',borderRadius:'8px'}}/>
                          <a href={t.imageUrl} download={`thumbnail-${i+1}.jpg`} target="_blank" rel="noopener noreferrer"
                            style={{position:'absolute',bottom:'8px',right:'8px',padding:'5px 10px',borderRadius:'6px',background:'rgba(0,0,0,.7)',color:'white',fontSize:'11px',fontWeight:600,textDecoration:'none',border:'1px solid rgba(255,255,255,.2)'}}>
                            ↓ Download
                          </a>
                        </div>
                      ) : (
                        <div style={{padding:'10px 12px',background:'rgba(0,0,0,.4)',borderRadius:'8px',textAlign:'center'}}>
                          <p style={{fontSize:'22px',fontWeight:900,color:'white',margin:'0 0 3px',letterSpacing:'-.02em',textShadow:'0 2px 8px rgba(0,0,0,.8)'}}>{t.hook}</p>
                          {t.subtext&&<p style={{fontSize:'12px',color:'rgba(255,255,255,.6)',margin:0}}>{t.subtext}</p>}
                          {t.imageError&&<p style={{fontSize:'10px',color:'rgba(248,113,113,.7)',marginTop:'4px'}}>{t.imageError}</p>}
                        </div>
                      )}
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <span style={{fontSize:'11px',color:'var(--text3)'}}>Culori:</span>
                        {(t.colorPalette||[]).map((c:string,j:number)=>(
                          <div key={j} title={c} onClick={()=>navigator.clipboard.writeText(c)} style={{width:'22px',height:'22px',borderRadius:'4px',background:c,border:'1px solid rgba(255,255,255,.15)',cursor:'pointer'}}/>
                        ))}
                        <span style={{fontSize:'10px',color:'var(--text3)'}}>{(t.colorPalette||[]).join(' · ')}</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                        <div style={{padding:'7px 9px',background:'rgba(255,255,255,.03)',borderRadius:'7px'}}>
                          <p style={{fontSize:'9px',fontWeight:700,color:'var(--text3)',textTransform:'uppercase',margin:'0 0 2px'}}>🖼️ Fundal</p>
                          <p style={{fontSize:'11px',color:'var(--text2)',margin:0,lineHeight:1.4}}>{t.background}</p>
                        </div>
                        <div style={{padding:'7px 9px',background:'rgba(255,255,255,.03)',borderRadius:'7px'}}>
                          <p style={{fontSize:'9px',fontWeight:700,color:'var(--text3)',textTransform:'uppercase',margin:'0 0 2px'}}>👤 Prim plan</p>
                          <p style={{fontSize:'11px',color:'var(--text2)',margin:0,lineHeight:1.4}}>{t.foreground}</p>
                        </div>
                      </div>
                      <div style={{padding:'7px 9px',background:'rgba(139,92,246,.06)',borderRadius:'7px',border:'1px solid rgba(139,92,246,.15)'}}>
                        <p style={{fontSize:'9px',fontWeight:700,color:'var(--violet)',textTransform:'uppercase',margin:'0 0 2px'}}>💡 De ce funcționează</p>
                        <p style={{fontSize:'11px',color:'var(--text2)',margin:0,lineHeight:1.5}}>{t.whyItWorks}</p>
                      </div>
                      <div style={{padding:'7px 9px',background:'var(--goldbg)',borderRadius:'7px',border:'1px solid var(--goldbdr)'}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                          <p style={{fontSize:'9px',fontWeight:700,color:'var(--gold)',textTransform:'uppercase',margin:0}}>🤖 Prompt AI Image</p>
                          <button onClick={()=>navigator.clipboard.writeText(t.adobePrompt||'')} style={{padding:'2px 7px',borderRadius:'4px',fontSize:'10px',background:'rgba(240,196,68,.15)',border:'1px solid var(--goldbdr)',color:'var(--gold)',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>⎘</button>
                        </div>
                        <p style={{fontSize:'11px',color:'var(--text3)',margin:0,lineHeight:1.4,fontStyle:'italic'}}>{t.adobePrompt}</p>
                      </div>
                      <p style={{fontSize:'11px',color:'var(--text3)',margin:0}}>🔤 {t.font} · CTA: {t.ctaElement}</p>
                      {t.imageUrl&&<p style={{fontSize:'10px',color:'var(--green)',margin:0}}>✓ Generat cu Flux 1.1 Pro</p>}
                    </div>
                  </div>
                ))}
                {thumbnail.imagesGenerated&&<div style={{padding:'8px 12px',background:'rgba(52,211,153,.08)',border:'1px solid rgba(52,211,153,.25)',borderRadius:'8px',marginBottom:'4px',display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontSize:'16px'}}>🎨</span>
                  <p style={{fontSize:'12px',color:'var(--green)',fontWeight:600,margin:0}}>Thumbnailuri generate cu Flux 1.1 Pro — descarcă-le direct!</p>
                </div>}
                {thumbnail.generalTips&&<div style={{padding:'10px 12px',background:'rgba(52,211,153,.05)',border:'1px solid rgba(52,211,153,.2)',borderRadius:'9px'}}>
                  <p style={{fontSize:'10px',fontWeight:700,color:'var(--green)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:'6px'}}>✅ Tips</p>
                  {thumbnail.generalTips.map((tip:string,i:number)=><p key={i} style={{fontSize:'11px',color:'var(--text2)',margin:'0 0 3px'}}>· {tip}</p>)}
                </div>}
                </>
              )}
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

        {/* ── SIDEBAR / EXTRAS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* User card */}
        <div style={{ background: 'rgba(124,58,237,.06)', border: '1px solid rgba(124,58,237,.2)', borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(124,58,237,.6),rgba(12,207,176,.3),transparent)' }}/>
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

        {/* Tips */}
        <div style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.15)',borderRadius:'14px',padding:'14px'}}>
          <p style={{fontSize:'10px',fontWeight:700,color:'var(--violet)',marginBottom:'9px',letterSpacing:'.07em',textTransform:'uppercase'}}>💡 Tips</p>
          {['Transcript → Traduce → Trello în 3 click-uri','Script AI generează titluri SEO optimizate','Rescrie din URL = conținut nou din videoclipuri existente','Prompt custom = control total asupra outputului'].map(t=>(
            <p key={t} style={{fontSize:'11px',color:'var(--text2)',lineHeight:1.5,marginBottom:'5px'}}>· {t}</p>
          ))}
        </div>
        </div>{/* /tool-main */}
        </div>{/* /tool-root */}
    </div>
  )
}
