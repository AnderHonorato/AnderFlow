'use client'

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Send, X, Plus, Trash2, Maximize2, Minimize2, PanelLeft, Paperclip, Image, Download, ChevronLeft, ChevronRight, Pin, ThumbsUp, ThumbsDown, Reply, CornerDownRight, Brain, AlertTriangle, ChevronDown, Bug, ChevronUp } from 'lucide-react'
import { replaceIcons } from './chat-icons'

const THINKING = [
  'Buscando informacoes sobre sua duvida...','Um momento, analisando o contexto...','Consultando dados do ANDERFLOW...',
  'Verificando a base de conhecimento...','Processando sua pergunta com atencao...','Aguarde, estou analisando isso...',
  'Revisando os fluxos da plataforma...','Estou pesquisando a melhor resposta...','Coletando dados relevantes...',
  'Analisando documentacao do sistema...','So um instante, ja te respondo...','Estrutuando a resposta ideal...',
  'Deixa eu ver isso com cuidado...','Validando informacoes da plataforma...','Consultando metricas e dados...',
  'Preparando uma explicacao clara...','Organizando meu raciocinio...','Estou quase la, finalizando...',
  'So mais um momento...','Analisando em detalhes...','Aprofundando a pesquisa...','Comparando informacoes...',
  'Estudando o topico da sua pergunta...','Interpretando sua duvida...','Montando a melhor abordagem...',
  'Um minuto, processando dados...','Revisando antes de responder...','Buscando exemplos relevantes...',
  'Pesquisa em andamento...','Estou quase terminando a analise...',
]
const T_FAST=10,T_MED=20,T_SLOW=32,TH_BASE=600,TH_PER=2
const SUGS=['Como criar um novo projeto?','Quais sao as etapas do fluxo?','Como funciona o briefing?','Como acompanhar o progresso?','Como aprovar um design?','O que faz o financeiro?','Como assinar contrato?','Como ver notificacoes?','Como funciona a homologacao?','Como solicitar suporte?','Quais os prazos tipicos?','Como enviar feedback?','O que e o portal do cliente?','Como ver meus projetos?','Explicar o dashboard']
const MODELS={pro:'metrys-pro',flash:'metrys-flash'}
const CARD_BLOBS=['blobMorphA','blobMorphB','blobMorphC','blobMorphD','blobMorphE']
const CARD_BG=['rgba(232,98,42,0.07)','rgba(58,122,196,0.06)','rgba(61,154,110,0.06)','rgba(139,92,246,0.06)','rgba(196,133,42,0.06)']
const CARD_BLOB_RADII=['58% 42% 52% 48% / 52% 44% 56% 48%','48% 52% 64% 36% / 52% 44% 56% 48%','44% 56% 58% 42% / 50% 58% 42% 50%','42% 58% 56% 44% / 48% 56% 44% 56%','56% 44% 48% 52% / 52% 60% 40% 50%']
const CARD_RING_COLORS=['rgba(232,98,42,0.18)','rgba(58,122,196,0.14)','rgba(61,154,110,0.14)','rgba(139,92,246,0.14)','rgba(196,133,42,0.14)']
const CARD_SHAPES=['20px 8px 20px 20px','20px 20px 8px 20px','24px','18px 6px 22px 14px','14px 22px 6px 20px']
const PRIORITY_COLORS=['transparent','rgba(232,98,42,0.04)','rgba(232,98,42,0.08)','rgba(232,98,42,0.13)','rgba(232,98,42,0.20)','rgba(232,98,42,0.28)']
const PRIORITY_KEYWORDS:{[k:string]:number}={projeto:3,briefing:3,aprov:3,design:3,financeiro:5,contrato:5,homologa:5,prazo:2,assin:4,fluxo:2,etapas:1,notifica:1,suporte:1,feedback:1,dashboard:1,progresso:1,orçamento:3,orcamento:3}

function StarSVG({uid,r}:{uid:string;r?:boolean}){return(<svg className="metrys-icon" viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id={`mr-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f97316"/><stop offset="18%" stopColor="#facc15"/><stop offset="38%" stopColor="#22c55e"/><stop offset="58%" stopColor="#06b6d4"/><stop offset="78%" stopColor="#2563eb"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient><linearGradient id={`ms-${uid}`} x1="8%" y1="8%" x2="92%" y2="92%"><stop offset="0%" stopColor="#f97316"><animate attributeName="stop-color" values="#f97316;#facc15;#22c55e;#06b6d4;#2563eb;#f97316" dur="4s" repeatCount="indefinite"/></stop><stop offset="50%" stopColor="#facc15"><animate attributeName="stop-color" values="#facc15;#22c55e;#06b6d4;#2563eb;#8b5cf6;#facc15" dur="4s" repeatCount="indefinite"/></stop><stop offset="100%" stopColor="#2563eb"><animate attributeName="stop-color" values="#2563eb;#8b5cf6;#f97316;#facc15;#06b6d4;#2563eb" dur="4s" repeatCount="indefinite"/></stop></linearGradient></defs>{r&&(<g className="rainbow-rotor is-rainbow-slow" style={{transformOrigin:'28px 28px'}}><circle className="trail trail-head" cx="28" cy="28" r="18.5" fill="none" stroke={`url(#mr-${uid})`} strokeLinecap="round" style={{strokeWidth:4.2,strokeDasharray:'34 120',strokeDashoffset:0,opacity:1,filter:'drop-shadow(0 0 5px rgba(249,115,22,.26)) drop-shadow(0 0 8px rgba(59,130,246,.18))',transformOrigin:'28px 28px',transform:'rotate(-70deg)'}}/><circle className="trail trail-mid" cx="28" cy="28" r="18.5" fill="none" stroke={`url(#mr-${uid})`} strokeLinecap="round" style={{strokeWidth:2.8,strokeDasharray:'16 138',strokeDashoffset:-28,opacity:.82,filter:'drop-shadow(0 0 5px rgba(249,115,22,.26)) drop-shadow(0 0 8px rgba(59,130,246,.18))',transformOrigin:'28px 28px',transform:'rotate(-70deg)'}}/><circle className="trail trail-tail" cx="28" cy="28" r="18.5" fill="none" stroke={`url(#mr-${uid})`} strokeLinecap="round" style={{strokeWidth:1.3,strokeDasharray:'8 146',strokeDashoffset:-42,opacity:.45,filter:'drop-shadow(0 0 5px rgba(249,115,22,.26)) drop-shadow(0 0 8px rgba(59,130,246,.18))',transformOrigin:'28px 28px',transform:'rotate(-70deg)'}}/></g>)}<g className="metrys-star-wrap" style={{transformOrigin:'28px 28px'}}><path className="metrys-star" fill={`url(#ms-${uid})`} d="M28 12 C28 12 32.85 23.15 32.85 23.15 C32.85 23.15 44 28 44 28 C44 28 32.85 32.85 32.85 32.85 C32.85 32.85 28 44 28 44 C28 44 23.15 32.85 23.15 32.85 C23.15 32.85 12 28 12 28 C12 28 23.15 23.15 23.15 23.15 C23.15 23.15 28 12 28 12 Z"/></g></svg>)}
function AIIcon({s,rr}:{s?:number;rr?:boolean}){const z=s||56;const u=useId().replace(/:/g,'');return<div className="metrys-icon-wrap" style={{width:z,height:z}}><StarSVG uid={u} r={rr}/></div>}
function AIs({s}:{s?:number}){return<AIIcon s={s}/>}
function AIA({rr}:{rr?:boolean}){return<AIIcon s={28} rr={rr}/>}
function DDiv({label}:{label:string}){return(<div className="flex items-center gap-2 my-3 px-1"><svg width="100%" height="12" className="shrink" preserveAspectRatio="none" viewBox="0 0 100 12" fill="none"><path d="M0 6 C20 0,35 12,50 6 S80 0,100 6" stroke="var(--border)" strokeWidth=".5"/></svg><span className="text-[9px] text-[var(--text-3)] shrink-0">{label}</span><svg width="100%" height="12" className="shrink" preserveAspectRatio="none" viewBox="0 0 100 12" fill="none"><path d="M0 6 C20 0,35 12,50 6 S80 0,100 6" stroke="var(--border)" strokeWidth=".5"/></svg></div>)}

const bubbleKeys=['reasoningBubble1','reasoningBubble2','reasoningBubble3','reasoningBubble4','reasoningBubble5','reasoningBubble6']
const BUBBLES=[{w:18,h:18,top:'15%',left:'8%',d:'2.8s',a:bubbleKeys[0]},{w:12,h:12,top:'25%',right:'12%',d:'3.2s',a:bubbleKeys[1]},{w:22,h:22,bottom:'20%',left:'15%',d:'3.6s',a:bubbleKeys[2]},{w:14,h:14,top:'50%',right:'20%',d:'2.4s',a:bubbleKeys[3]},{w:10,h:10,bottom:'35%',right:'30%',d:'4s',a:bubbleKeys[4]},{w:16,h:16,top:'60%',left:'25%',d:'3s',a:bubbleKeys[5]}]

function ReasoningBox({content,msgIdx,onReport}:{content:string;msgIdx:number;onReport:(i:number)=>void}){
  const[open,setOpen]=useState(false)
  const[translated,setTranslated]=useState<string|null>(null)
  const[translating,setTranslating]=useState(false)
  useEffect(()=>{
    if(!content||content.length<15)return
    setTranslating(true)
    fetch('/api/ai/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:content})})
      .then(r=>r.json()).then(d=>{if(d.changed)setTranslated(d.translated);setTranslating(false)})
      .catch(()=>setTranslating(false))
  },[content])
  const display=translated||content
  const lines=display.split('\n').filter(Boolean)
  const preview=lines.slice(0,3).join('\n')
  return(<div className="mb-2 rounded-xl overflow-hidden relative" style={{background:'rgba(58,122,196,0.06)'}} id={`reasoning-${msgIdx}`}>
    {BUBBLES.map((b,i)=>(<div key={i} className="absolute rounded-full pointer-events-none" style={{width:b.w,height:b.h,top:b.top,left:b.left,right:b.right,bottom:b.bottom,background:'radial-gradient(circle,rgba(58,122,196,0.45) 0%,transparent 70%)',animation:`${b.a} ${b.d} ease-in-out infinite`}}/>))}
    <button title="Expandir pensamento" onClick={()=>setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface)]/30 transition-colors relative z-[1]">
      <Brain className="h-3.5 w-3.5 text-[var(--info)]"/><span className="text-[11px] font-[500] text-[var(--info)]">Pensamento{translating&&' (traduzindo...)'}{translated&&' (traduzido)'}</span>
      <ChevronDown className={`h-3 w-3 ml-auto text-[var(--text-3)] transition-transform ${open?'':'rotate-[-90deg]'}`}/>
    </button>
    <div className="px-3 pb-2.5 relative z-[1]">
      {!open?(
        <div className="relative" style={{maxHeight:'72px',overflow:'hidden'}}>
          <div className="thinking-metal text-[11px] leading-[24px] whitespace-pre-wrap">{preview}</div>
          {lines.length>3&&<div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" style={{background:'linear-gradient(to top, rgba(58,122,196,0.06) 0%, transparent 100%)'}}/>}
        </div>
      ):(
        <div className="thinking-metal text-[11px] leading-relaxed whitespace-pre-wrap max-h-[240px] overflow-y-auto scrollbar-thin">{display}</div>
      )}
    </div>
    <div className="px-3 pb-1.5 flex justify-end relative z-[1]"><button title="Reportar erro" onClick={()=>onReport(msgIdx)} className="flex items-center gap-1 text-[9px] text-[var(--text-3)] hover:text-[var(--destructive)] transition-colors"><Bug className="h-2.5 w-2.5"/>Reportar erro</button></div>
  </div>)
}

function ReasoningStream({lines,active}:{lines:string[];active:boolean}){
  const vis=lines.slice(-3)
  while(vis.length<3)vis.unshift('')
  const[rIdx,setRIdx]=useState(0)
  const[charIdx,setCharIdx]=useState(0)
  const animRef=useRef<ReturnType<typeof setInterval>|null>(null)
  useEffect(()=>{
    if(!active||vis.every(l=>!l)){setRIdx(0);setCharIdx(0);if(animRef.current)clearInterval(animRef.current);return}
    setRIdx(0);setCharIdx(0)
    const pump=()=>{
      setCharIdx(c=>{
        const line=vis[Math.min(rIdx,vis.length-1)]||''
        if(c>=line.length){setRIdx(r=>{const nr=r+1;if(nr>=vis.length)return 0;return nr});return 0}
        return c+1
      })
    }
    animRef.current=setInterval(pump,40+Math.random()*30)
    return()=>{if(animRef.current)clearInterval(animRef.current)}
  },[lines,active])
  useEffect(()=>{if(!active){if(animRef.current)clearInterval(animRef.current);setRIdx(0);setCharIdx(0)}},[active])
  const currLine=vis[Math.min(rIdx,vis.length-1)]||''
  return(<div className={`mb-2 rounded-xl overflow-hidden relative transition-all duration-300 ${active?'opacity-100 scale-100':'opacity-0 scale-95 pointer-events-none'}`} style={{background:'rgba(58,122,196,0.06)'}}>
    {BUBBLES.map((b,i)=>(<div key={i} className="absolute rounded-full pointer-events-none" style={{width:b.w,height:b.h,top:b.top,left:b.left,right:b.right,bottom:b.bottom,background:'radial-gradient(circle,rgba(58,122,196,0.45) 0%,transparent 70%)',animation:`${b.a} ${b.d} ease-in-out infinite`}}/>))}
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--info)]/8 relative z-[1]">
      <Brain className="h-3.5 w-3.5 text-[var(--info)]"/>
      <span className="text-[11px] font-[500] text-[var(--info)]">Pensamento</span>
      {active&&<span className="ml-auto text-[9px] text-[var(--text-3)] animate-pulse">gerando...</span>}
    </div>
    <div className="px-3 py-2 relative z-[1]" style={{height:72,overflow:'hidden',position:'relative'}}>
      {vis.map((l,i)=>{
        const isActive=i===rIdx&&active
        return(<p key={i} className="absolute left-3 right-3 truncate thinking-metal transition-all duration-400" style={{
          lineHeight:'24px',top:12+(i*24),fontSize:isActive?'12px':'10px',
          fontWeight:isActive?500:400,opacity:i<rIdx?0.35:i===rIdx?1:0.25,
          filter:isActive?'brightness(1.3)':'brightness(0.8)',
        }}>
          {l&&isActive?l.slice(0,charIdx)+(charIdx<l.length?'|':''):l||'\u00A0'}
        </p>)
      })}
    </div>
  </div>)
}

function MD({content}:{content:string}){const h=useMemo(()=>{
  let t=replaceIcons(content).replace(/\[PENSAMENTO\][\s\S]*?\[\/PENSAMENTO\]\n?/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  t=t.replace(/```(\w*)\n?([\s\S]*?)```/g,'<div class="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 my-2 overflow-x-auto"><pre class="text-[11px] leading-relaxed"><code>$2</code></pre></div>')
  t=t.replace(/`([^`]+)`/g,'<code class="bg-[var(--accent-subtle)] text-[var(--accent)] px-1.5 py-0.5 rounded-md text-[11px] font-mono">$1</code>')
  t=t.replace(/\*\*\*(.+?)\*\*\*/g,'<strong class="font-[600] text-[var(--text)]"><em>$1</em></strong>')
  t=t.replace(/\*\*(.+?)\*\*/g,'<strong class="font-[600] text-[var(--text)]">$1</strong>')
  t=t.replace(/\*(.+?)\*/g,'<em>$1</em>')
  t=t.replace(/^### (.+)$/gm,'<h4 class="text-[12px] font-[600] text-[var(--text)] mt-2.5 mb-1">$1</h4>')
  t=t.replace(/^## (.+)$/gm,'<h3 class="text-[13px] font-[600] text-[var(--text)] mt-3 mb-1.5">$1</h3>')
  const ls=t.split('\n');const rs:string[]=[];let li=0
  for(const l of ls){if(/^\d+\.\s+(.+)$/.test(l)){li++;rs.push(`<div class="flex items-start gap-2 ml-2 my-0.5"><span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[10px] font-[600] text-[var(--accent)]">${li}</span><span class="text-[12px] leading-relaxed">${l.replace(/^\d+\.\s+/,'')}</span></div>`)}
  else if(/^[\-\*]\s+(.+)$/.test(l))rs.push(`<div class="flex items-start gap-2 ml-2 my-0.5"><span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]"></span><span class="text-[12px] leading-relaxed">${l.replace(/^[\-\*]\s+/,'')}</span></div>`)
  else if(l.trim()==='')rs.push('<div class="h-1.5"></div>')
  else if(l.startsWith('<div')||l.startsWith('<h'))rs.push(l)
  else rs.push(`<span class="text-[12px] leading-relaxed">${l||' '}</span>`)}
  return rs.join('')},[content])
return<div className="markdown-body text-[var(--text-2)]" dangerouslySetInnerHTML={{__html:h}}/>}

function extractReasoning(content:string){const m=content.match(/\[PENSAMENTO\]([\s\S]*?)\[\/PENSAMENTO\]/);return m?m[1].trim():''}

const WELCOME=['Ola, sou Metrys! Se tiver alguma duvida estou aqui.','Ola! Sou o assistente IA da ANDERFLOW. Precisa de ajuda?','Ei! Sou o Metrys, seu assistente.','Ola! Estou aqui para te ajudar com seus projetos.']
type Atc={name:string;url:string;type:string;size:number}
type Msg={id?:string;role:string;content:string;createdAt?:string;attachments?:Atc[];replyTo?:string;liked?:boolean;feedback?:string;reasoning?:string}
type Cnv={id:string;title:string;preview:string;updatedAt:string;pinned?:boolean}
function getGreeting(){const h=new Date().getHours();if(h<6)return'Boa noite';if(h<12)return'Bom dia';if(h<18)return'Boa tarde';return'Boa noite'}

const INACTIVE_MSGS=['Ola! Sabia que voce pode acompanhar seu projeto em tempo real pelo portal?','Precisa de ajuda com o briefing? Posso te guiar em cada etapa!','Voce ja conhece o fluxo de 12 etapas do ANDERFLOW? E eficiente e transparente.','Quer enviar um feedback? Sua opiniao ajuda a melhorar a plataforma!','Tem duvidas sobre prazos ou orcamento? Me pergunte!','Sabia que pode assinar contratos diretamente pelo portal?','O dashboard mostra o progresso de todos os seus projetos.']

export function AIFab(){
  const{data:session}=useSession();const pp=usePathname()
  const[op,setOp]=useState(false);const[ex,setEx]=useState(false);const[sb,setSb]=useState(false)
  const[cn,setCn]=useState<Cnv[]>([]);const[aid,setAid]=useState<string|null>(null);const[ms,setMs]=useState<Msg[]>([])
  const[inp,setInp]=useState('');const[ld,setLd]=useState(false);const[ti,setTi]=useState(0)
  const[wv,setWv]=useState(false);const[wm,setWm]=useState('')
  const[pf,setPf]=useState<{name:string;url:string;type:string;size:number;isImg:boolean}[]>([])
  const[vi,setVi]=useState<number|null>(null)
  const[sbi,setSbi]=useState(-1);const[sch,setSch]=useState(0);const[sbs,setSbs]=useState<string[]>([]);const[sph,setSph]=useState<'idle'|'typing'|'think'|'done'>('idle')
  const[sReasoning,setSReasoning]=useState('')
  const[rp,setRp]=useState<Msg|null>(null)
  const[fbk,setFbk]=useState<string|null>(null)
  const[errIdx,setErrIdx]=useState<number|null>(null)
  const[errTxt,setErrTxt]=useState('')
  const[errConv,setErrConv]=useState(false)
  const[errPrint,setErrPrint]=useState(false)
  const[model,setModel]=useState<'metrys-pro'|'metrys-flash'>('metrys-pro')
  const[thinkSec,setThinkSec]=useState(0)
  const[thinkExpanded,setThinkExpanded]=useState(false)
  const autoTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const thinkStart=useRef(0)
  const abortRef=useRef<AbortController|null>(null)
  const sStreamContent=useRef('')
  const sStreamReasoning=useRef('')

  const sc=useRef<HTMLDivElement>(null);const ta=useRef<HTMLTextAreaElement>(null)
  const fi=useRef<HTMLInputElement>(null);const ii=useRef<HTMLInputElement>(null)
  const tt=useRef<ReturnType<typeof setInterval>|null>(null);const st=useRef<ReturnType<typeof setInterval>|null>(null)
  const sl=useRef(false);const spp=useRef(0);const sbb=useRef(0);const spph=useRef<'typing'|'think'|'done'>('typing');const sbl=useRef<string[]>([])

  const pw=ex?'520px':'400px';const ph=ex?'620px':'520px'
  const vim=useMemo(()=>ms.flatMap(m=>(m.attachments||[]).filter(a=>a.type.startsWith('image/'))),[ms])
  const pinCnv=useMemo(()=>cn.filter(c=>c.pinned),[cn])
  const unpinCnv=useMemo(()=>cn.filter(c=>!c.pinned),[cn])
const[cardSlots,setCardSlots]=useState<{text:string;visible:boolean;key:number;score:number;isHigh:boolean}[]>(()=>{
  const shuffled=[...SUGS].sort(()=>Math.random()-.5)
  return Array.from({length:5},(_,i)=>({text:shuffled[i]||SUGS[i],visible:true,key:Math.random(),score:0,isHigh:false}))
})
const cardSlotsRef=useRef(cardSlots)
useEffect(()=>{cardSlotsRef.current=cardSlots},[cardSlots])
const[welcomeIdx,setWelcomeIdx]=useState(0)
const[welcomeVisible,setWelcomeVisible]=useState(true)
const[welcomeStarKey,setWelcomeStarKey]=useState(0)
const[streamActive,setStreamActive]=useState(false)
const[reasoningLines,setReasoningLines]=useState<string[]>([])
const[streamText,setStreamText]=useState('')
const[streamPhase,setStreamPhase]=useState<'idle'|'thinking'|'typing'|'done'|'think'>('idle')
const[streamBlockIdx,setStreamBlockIdx]=useState(0)
const[autoMsgDisp,setAutoMsgDisp]=useState('')
const[autoMsgFull,setAutoMsgFull]=useState('')
const autoTypingRef=useRef<ReturnType<typeof setInterval>|null>(null)
const cardItems=useMemo(()=>{
  const scored=cardSlots.map(s=>{
    let sc=0;const low=s.text.toLowerCase()
    for(const[k,v]of Object.entries(PRIORITY_KEYWORDS)){if(low.includes(k)){sc+=v;break}}
    if(cn.length>0&&(low.includes('conversa')||low.includes('projeto')))sc+=2
    if(cn.length>4)sc+=1
    return{...s,score:sc}
  })
  const sorted=[...scored].sort((a,b)=>b.score-a.score)
  const topTexts=new Set(sorted.slice(0,Math.min(2,sorted.filter(s=>s.score>=2).length)).filter(s=>s.score>=2).map(s=>s.text))
  return scored.map(s=>({...s,isHigh:topTexts.has(s.text)}))
},[cardSlots,cn])
const welcomeMsgs=useMemo(()=>{
  if(cn.length>0){
    return[
      `Voce tem ${cn.length} conversa${cn.length>1?'s':''} salva${cn.length>1?'s':''}. Continue de onde parou!`,
      `Retome qualquer conversa na barra lateral. Suas interacoes ficam salvas.`,
      `${cn.length>1?'Varias conversas':'Uma conversa'} esta${cn.length>1?'o':''} te esperando. Escolha uma para continuar.`,
      `Seus chats estao organizados e prontos para voce retomar a qualquer momento.`,
    ]
  }
  return[
    'Sou seu assistente para tirar duvidas sobre projetos, fluxos e funcionalidades.',
    'Pergunte sobre briefings, etapas de desenvolvimento ou qualquer duvida do ANDERFLOW.',
    'Estou aqui para ajudar voce com gestao de projetos de software.',
    'Tire duvidas sobre o portal, acompanhe projetos e receba orientacoes.',
    'Use o chat para aprender sobre o ANDERFLOW ou pedir ajuda com suas tarefas.',
  ]
},[cn])
const welcomeMsg=welcomeMsgs[welcomeIdx%welcomeMsgs.length]
const DS_CTX=64000
const DS_INPUT_COST=0.27
const DS_OUTPUT_COST=1.10
const tokenStats=useMemo(()=>{
  let totalChars=0;let inputChars=0;let outputChars=0
  for(const m of ms){
    const len=(m.content||'').length
    totalChars+=len
    if(m.role==='user')inputChars+=len
    else outputChars+=len
  }
  if(streamText)outputChars+=streamText.length
  const used=Math.round(Math.max(1,totalChars/3.5))
  const inputTk=Math.round(Math.max(0,inputChars/3.5))
  const outputTk=Math.round(Math.max(0,outputChars/3.5))
  const pct=Math.min(100,Math.round((used/DS_CTX)*100))
  const cost=(inputTk/1e6)*DS_INPUT_COST+(outputTk/1e6)*DS_OUTPUT_COST
  return{used,inputTk,outputTk,pct,cost,limit:DS_CTX}
},[ms,streamText])
useEffect(()=>{
  if(ms.length===0&&op){
    const timers:ReturnType<typeof setTimeout>[]=[]
    const scheduleSlot=(idx:number)=>{
      const delay=8000+Math.random()*12000
      const t=setTimeout(()=>{
        setCardSlots(prev=>{
          const next=[...prev]
          next[idx]={...next[idx],visible:false}
          return next
        })
        setTimeout(()=>{
          const used=new Set(cardSlotsRef.current.map(s=>s.text))
          const pool=SUGS.filter(s=>!used.has(s))
          const pick=pool.length>0?pool[Math.floor(Math.random()*pool.length)]:SUGS[Math.floor(Math.random()*SUGS.length)]
          setCardSlots(prev2=>{
            const next2=[...prev2]
            next2[idx]={text:pick,visible:true,key:Math.random(),score:0,isHigh:false}
            return next2
          })
        },420+Math.random()*200)
        scheduleSlot(idx)
      },delay)
      timers.push(t)
    }
    for(let i=0;i<5;i++){setTimeout(()=>scheduleSlot(i),i*1800+Math.random()*3000)}
    let msgT:ReturnType<typeof setTimeout>|null=null
    const scheduleMsg=()=>{
      const delay=6000+Math.random()*8000
      msgT=setTimeout(()=>{
        setWelcomeVisible(false)
        setTimeout(()=>{
          setWelcomeIdx(p=>p+1)
          setWelcomeStarKey(p=>p+1)
          setWelcomeVisible(true)
        },450+Math.random()*200)
        scheduleMsg()
      },delay)
    }
    setTimeout(()=>scheduleMsg(),2500+Math.random()*3000)
    return()=>{timers.forEach(t=>clearTimeout(t));if(msgT)clearTimeout(msgT)}
  }
},[ms.length,op])
useEffect(()=>{setWelcomeIdx(0);setWelcomeStarKey(p=>p+1)},[cn])

  useEffect(()=>{if(op&&sc.current)sc.current.scrollTo({top:sc.current.scrollHeight,behavior:'smooth'})},[ms,op,sch])
  useEffect(()=>{if(streamActive&&streamPhase==='thinking'&&reasoningLines.length===0){const r=Math.floor(Math.random()*THINKING.length);setTi(r);tt.current=setInterval(()=>setTi(p=>{let n=Math.floor(Math.random()*THINKING.length);return n===p?(n+1)%THINKING.length:n}),3000)}else{if(tt.current)clearInterval(tt.current)}return()=>{if(tt.current)clearInterval(tt.current)}},[streamActive,streamPhase,reasoningLines.length])
  useEffect(()=>{const e=ta.current;if(!e)return;e.style.height='auto';e.style.height=Math.min(e.scrollHeight,120)+'px'},[inp])
  const exPid=useCallback(()=>{const m=pp?.match(/\/projects\/([a-zA-Z0-9_-]+)/);return m?m[1]:undefined},[pp])
  const lCnv=useCallback(async()=>{try{const r=await fetch('/api/ai/conversations');const j=await r.json();const d=Array.isArray(j.data)?j.data.filter(Boolean):[];setCn(d.map((c:Cnv)=>({...c,pinned:c.pinned||false})))}catch{setCn([])}},[op])
  const lMs=useCallback(async(id:string)=>{try{const r=await fetch(`/api/ai/conversations/${id}`);const j=await r.json();const arr=(j.data?.messages||[]).map((m:any)=>{const rn=extractReasoning(m.content||'');return{...m,reasoning:rn||undefined,content:m.content?.replace(/\[PENSAMENTO\][\s\S]*?\[\/PENSAMENTO\]\n?/g,'')||''}});setMs(arr)}catch{}},[op])
  useEffect(()=>{if(op)lCnv()},[op,lCnv])
  useEffect(()=>{if(!aid||sl.current)return;lMs(aid)},[aid,lMs])
  useEffect(()=>{
    const dismissed=sessionStorage.getItem('metrys_dismiss_ts')
    if(!dismissed){
      const msg=WELCOME[Math.floor(Math.random()*WELCOME.length)]
      const t=setTimeout(()=>{
        setWm(msg);setWv(true);setAutoMsgFull(msg);setAutoMsgDisp('')
        let ci=0;if(autoTypingRef.current)clearInterval(autoTypingRef.current)
        autoTypingRef.current=setInterval(()=>{ci++;if(ci<=msg.length)setAutoMsgDisp(msg.slice(0,ci));else{clearInterval(autoTypingRef.current!);autoTypingRef.current=null}},35+Math.random()*30)
      },2000)
      return()=>clearTimeout(t)
    }
    const ts=parseInt(dismissed)
    if(!ts)return // permanent dismiss
    const now=Date.now()
    if(now<ts)return // still in cooldown
    // cooldown expired, restart
    sessionStorage.removeItem('metrys_dismiss_ts')
  },[op])
  useEffect(()=>{const p=(e:ClipboardEvent)=>{if(!op)return;const it=e.clipboardData?.items;if(!it)return;for(let i=0;i<it.length;i++){if(it[i].type.startsWith('image/')){const b=it[i].getAsFile();if(b)af(b);e.preventDefault();break}}};document.addEventListener('paste',p);return()=>document.removeEventListener('paste',p)})

  const stopStream=()=>{
    if(abortRef.current){abortRef.current.abort();abortRef.current=null}
    spph.current='done';setSph('done');setLd(false)
    if(st.current)clearInterval(st.current)
    setSbi(-1);setSbs([]);setSReasoning('')
    setStreamActive(false);setStreamPhase('idle')
  }
  const stp=stopStream
  const sst=(txt:string,reasoning?:string)=>{
    if(reasoning){
      setReasoningLines(reasoning.split('\n').filter(Boolean))
      setStreamPhase('thinking')
      const rTimer=setTimeout(()=>{
        const bl=txt.split(/\n?---\n?/).filter(b=>b.trim())
        if(!bl.length)bl.push(txt)
        startAdaptiveTypewriter(bl,reasoning)
      },Math.min(reasoning.length*5+400,3000))
    }else{
      setStreamPhase('idle')
      const bl=txt.split(/\n?---\n?/).filter(b=>b.trim())
      if(!bl.length)bl.push(txt)
      startAdaptiveTypewriter(bl)
    }
  }
  const startAdaptiveTypewriter=(blocks:string[],reasoning?:string)=>{
    thinkStart.current=Date.now();setThinkSec(0);setThinkExpanded(false)
    let bi=0;let ci=0;let bt=0
    setStreamText('');setStreamPhase('typing')
    const pump=()=>{
      if(bi>=blocks.length){
        const content=blocks.join('\n\n')
        setThinkSec(Math.round((Date.now()-thinkStart.current)/1000))
        setMs(p=>[...p,{role:'assistant',content,createdAt:new Date().toISOString(),reasoning:reasoning||undefined}])
        setStreamPhase('done');setStreamActive(false)
        stopStream()
        lCnv()
        return
      }
      const b=blocks[bi]
      if(ci<b.length){
        const ch=b[ci]
        const speed=getTypingSpeed(b.length)
        ci++;setStreamText(blocks.slice(0,bi).join('\n\n')+'\n\n'+b.slice(0,ci))
        bt=window.setTimeout(pump,speed)
      }else{
        bi++;ci=0
        if(bi<blocks.length){
          setStreamPhase('think')
          const nb=blocks[bi]||''
          const pause=Math.min(3000,Math.max(400,nb.length*3))
          bt=window.setTimeout(()=>{setStreamPhase('typing');pump()},pause)
        }else{pump()}
      }
    }
    bt=window.setTimeout(pump,80)
    st.current=bt as any
  }
  const getTypingSpeed=(blockLen:number):number=>{
    if(blockLen>500)return 6
    if(blockLen>300)return 10
    if(blockLen>150)return 16
    if(blockLen>60)return 25
    return 40
  }

  const af=(file:File)=>{if(file.size>10*1024*1024){toast.error(`${file.name} excede 10MB`);return};const r=new FileReader();r.onload=()=>setPf(p=>[...p,{name:file.name,url:r.result as string,type:file.type,size:file.size,isImg:file.type.startsWith('image/')}]);r.readAsDataURL(file)}
  const rf=(i:number)=>setPf(p=>p.filter((_,j)=>j!==i))
  const thinkLabel=(text:string)=>{const t=text.toLowerCase();if(t.includes('criar')||t.includes('gerar')||t.includes('criando'))return'Criando...';if(t.includes('editar')||t.includes('alterar')||t.includes('editando'))return'Editando...';if(t.includes('analisar')||t.includes('anális')||t.includes('analisando'))return'Analisando...';if(t.includes('pesquisar')||t.includes('buscar')||t.includes('pesquisando'))return'Pesquisando...';if(t.includes('verificar')||t.includes('validar')||t.includes('verificando'))return'Verificando...';if(t.includes('calcular')||t.includes('estimar'))return'Calculando...';if(t.includes('estruturar')||t.includes('planejar')||t.includes('organizar'))return'Estruturado...';if(t.includes('revisar')||t.includes('corrigir')||t.includes('revisando'))return'Revisando...';if(t.includes('escrever')||t.includes('redigir')||t.includes('responder'))return'Escrevendo...';if(t.includes('pensar')||t.includes('raciocinar'))return'Pensando...';return'Processando...'}
  const dw=()=>{setWv(false);setAutoMsgDisp('');setAutoMsgFull('');if(autoTypingRef.current){clearInterval(autoTypingRef.current);autoTypingRef.current=null};sessionStorage.setItem('metrys_dismiss_ts',String(Date.now()+3600000))}
  const autoShow=()=>{
    if(op||wv)return
    const msg=INACTIVE_MSGS[Math.floor(Math.random()*INACTIVE_MSGS.length)]
    setWm(msg);setWv(true);setAutoMsgFull(msg);setAutoMsgDisp('')
    let ci=0
    if(autoTypingRef.current)clearInterval(autoTypingRef.current)
    autoTypingRef.current=setInterval(()=>{
      ci++
      if(ci<=msg.length)setAutoMsgDisp(msg.slice(0,ci))
      else{clearInterval(autoTypingRef.current!);autoTypingRef.current=null}
    },35+Math.random()*30)
    autoTimer.current=setTimeout(()=>{setWv(false);setAutoMsgDisp('');setAutoMsgFull('');if(autoTypingRef.current){clearInterval(autoTypingRef.current);autoTypingRef.current=null};autoTimer.current=setTimeout(()=>autoShow(),180000+Math.random()*240000)},8000+msg.length*50)
  }
  useEffect(()=>{
    if(!op){autoTimer.current=setTimeout(()=>autoShow(),120000)}
    else{if(autoTimer.current)clearTimeout(autoTimer.current)}
    return()=>{if(autoTimer.current)clearTimeout(autoTimer.current)}
  },[op])
  const nc=async()=>{stopStream();setStreamPhase('idle');setStreamActive(false);setRp(null);setErrIdx(null);setReasoningLines([]);setStreamText('');try{const r=await fetch('/api/ai/conversations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Nova conversa'})});const j=await r.json();const n=j.data;if(!n?.id)throw Error();setCn(p=>[{...n,pinned:false},...p]);setAid(n.id);setMs([])}catch{toast.error('Erro')}}
  const dc=async(id:string)=>{try{await fetch(`/api/ai/conversations/${id}`,{method:'DELETE'});if(aid===id){stopStream();setStreamPhase('idle');setStreamActive(false);setAid(null);setMs([]);setRp(null);setErrIdx(null);setReasoningLines([]);setStreamText('')};setCn(p=>p.filter(c=>c.id!==id))}catch{toast.error('Erro')}}
  const tc=async(id:string)=>{const upd=cn.map(c=>c.id===id?{...c,pinned:!c.pinned}:c);setCn(upd)}
  const sfb=async(msgIdx:number,liked:boolean,feedback?:string)=>{const upd=[...ms];upd[msgIdx]={...upd[msgIdx],liked,feedback:feedback||''};setMs(upd);try{await fetch('/api/ai/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messageContent:ms[msgIdx]?.content,liked,feedback:feedback||''})})}catch{}}
  const reportErr=async(msgIdx:number)=>{const msg=ms[msgIdx];if(!msg)return;setErrIdx(msgIdx);setErrTxt('');setErrConv(false);setErrPrint(false)}
  const sendReport=async()=>{if(errIdx===null||!errConv)return;const msg=ms[errIdx];
    const conversationText=errConv?`\nConversa completa: Sim\nMensagens: ${ms.map(m=>`[${m.role}] ${m.content?.slice(0,200)}`).join(' | ')}`:''
    const printText=errPrint?'\nScreenshot: Sim':''
    try{await fetch('/api/ai/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messageContent:msg?.content,liked:false,feedback:`${errTxt||'Sem descricao'}${conversationText}${printText}`,errorReport:true})});toast.success('Erro reportado. Obrigado!')}catch{toast.error('Falha ao reportar')};setErrIdx(null);setErrTxt('');setErrConv(false);setErrPrint(false)}

  const send=async(text?:string)=>{
    const txt=text||inp.trim()
    if((!txt&&pf.length===0)||streamPhase==='typing')return
    // Se estiver em streaming (thinking), aborta e envia nova mensagem com contexto parcial
    if(streamActive){abortRef.current?.abort();abortRef.current=null}
    stopStream();setStreamText('');setReasoningLines([]);setErrIdx(null)
    setStreamPhase('idle');setStreamActive(false)
    sStreamContent.current='';sStreamReasoning.current=''

    const att=pf.map(f=>({name:f.name,url:f.url,type:f.type,size:f.size}))
    const um:Msg={role:'user',content:txt,createdAt:new Date().toISOString(),attachments:att,replyTo:rp?.id}
    setMs(p=>[...p,um]);setInp('');setPf([]);setRp(null);setLd(true)
    let cid:string|null=aid
    if(!cid){try{const r=await fetch('/api/ai/conversations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:txt.slice(0,50)||'Nova conversa'})});const j=await r.json();const nid=j.data?.id as string;if(!nid)throw Error();cid=nid;setCn(p=>[{id:nid,title:txt.slice(0,50)||'Nova conversa',preview:txt.slice(0,60),updatedAt:new Date().toISOString(),pinned:false},...p])}catch{toast.error('Erro');setLd(false);return}}
    const am=[...ms,um];const fcid=cid!
    const ip=att.filter(a=>a.type.startsWith('image/')).map(a=>({type:'image_url' as const,image_url:{url:a.url}}))
    const fp=pf.filter(f=>!f.isImg).map(f=>({name:f.name,type:f.type,content:f.url.split(',')[1]||''}))
    const mc:any[]=[];if(txt)mc.push({type:'text',text:txt});mc.push(...ip);const lm=mc.length>1?mc:txt||'(imagem)'

    const ac=new AbortController();abortRef.current=ac
    try{
      const r=await fetch('/api/ai/chat/stream',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:[...am.map(m=>({role:m.role,content:m.content||'(imagem)',msgId:m.id})),{role:'user',content:lm}],conversationId:fcid,projectId:exPid(),files:fp,replyTo:rp?.id,modelKey:model}),
        signal:ac.signal,
      })
      if(!r.ok){const ej=await r.json().catch(()=>({reply:'Erro de conexao'}));toast.error(ej.reply||ej.error||'Erro');stopStream();setLd(false);return}
      setStreamActive(true);setStreamPhase('thinking');setReasoningLines([]);setStreamText('')
      const reader=r.body!.getReader();const dec=new TextDecoder();let buf=''
      let contentAcc='';let reasoningAcc='';const rLines:string[]=[]

      while(true){
        const{value,done}=await reader.read()
        if(done)break
        buf+=dec.decode(value,{stream:true})
        const lines=buf.split('\n');buf=lines.pop()||''
        for(const line of lines){
          const t=line.trim();if(!t.startsWith('data: '))continue
          const d=t.slice(6);if(!d)continue
          let p:any;try{p=JSON.parse(d)}catch{continue}
          if(p.type==='done'){
            if(!aid){sl.current=true;setAid(fcid);setTimeout(()=>{sl.current=false},500)}
            if(p.code==='OK'){
              const bl=(contentAcc||'').split(/\n?---\n?/).filter((b:string)=>b.trim())
              if(!bl.length)bl.push(contentAcc||'')
              startAdaptiveTypewriter(bl,reasoningAcc||undefined)
            }else{setLd(false);setStreamActive(false);setStreamPhase('idle')}
            lCnv()
          }else if(p.type==='error'){
            toast.error(p.reply||'Erro');setLd(false);setStreamActive(false);setStreamPhase('idle')
          }else if(p.type==='chunk'){
            const delta=p?.choices?.[0]?.delta
            if(delta?.reasoning_content){
              reasoningAcc+=delta.reasoning_content
              // Split into lines for 3-line rotating display
              const newLines=reasoningAcc.split('\n').filter(Boolean)
              setReasoningLines(newLines)
            }
            if(delta?.content){
              contentAcc+=delta.content
              setStreamPhase('thinking') // keep showing reasoning during content arrival too
            }
          }
        }
      }
    }catch(e:any){
      if(e.name==='AbortError'){
        // Stream was interrupted by user - send was called again
        // The new send call will handle the rest
        return
      }
      sst('Erro de conexao.')
    }
  }

  const fmtT=(s?:string)=>s?new Date(s).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''
  const fmtD=(s?:string)=>{if(!s)return'';const d=new Date(s);const t=new Date();if(d.toDateString()===t.toDateString())return'Hoje';t.setDate(t.getDate()-1);if(d.toDateString()===t.toDateString())return'Ontem';return d.toLocaleDateString('pt-BR')}
  const sTx=sbi>=0&&sbs[sbi]?sbs[sbi].slice(0,sch):''

  return(<>
    {wv&&!op&&(<div className="fixed bottom-20 right-6 z-[60] max-w-[260px] rounded-2xl font-sans-dm p-3.5 shadow-xl backdrop-blur-sm" style={{background:'var(--surface)',border:'1.5px solid rgba(232,98,42,0.18)',animation:'autoMsgGlow 2.6s ease-in-out infinite, md-card-pop 0.4s var(--ease-spring) both'}}><button title="Fechar" onClick={dw} className="absolute top-1.5 right-1.5 h-5 w-5 flex items-center justify-center rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-3)] transition-colors"><X className="h-3 w-3"/></button><div className="flex items-start gap-2.5"><div style={{animation:'autoMsgBgPulse 2.6s ease-in-out infinite'}} className="shrink-0 rounded-full p-1"><AIs s={28}/></div><p className="text-[12px] leading-relaxed text-[var(--text)] pr-4"><span>{autoMsgDisp||wm}</span>{autoMsgDisp&&autoMsgDisp.length<autoMsgFull.length&&<span className="typewriter-cursor"/>}</p></div></div>)}

    <div style={{position:'fixed',zIndex:50,bottom:'1.5rem',right:'1.5rem',transform:op?'scale(0.5) translateY(12px)':'scale(1) translateY(0)',opacity:op?0:1,transition:'all 0.35s cubic-bezier(0.34,1.2,0.64,1)',pointerEvents:op?'none':'auto'}}><button onClick={()=>{setOp(true);dw()}} className={`group flex items-center h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-all duration-[300ms] ease-[cubic-bezier(0.2,0,0,1)] w-12 hover:w-[172px] justify-center hover:justify-start hover:pl-2.5 hover:pr-4 overflow-hidden font-sans-dm ${wv?'pulse-fab':''}`} title="Assistente IA"><span className="shrink-0 w-10 h-10 flex items-center justify-center"><AIs s={40}/></span><span className="text-[12px] font-[500] text-[var(--text)] whitespace-nowrap truncate w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-[300ms] overflow-hidden select-none">Metrys Assistente</span></button></div>

    <div className="fixed bottom-6 right-6 z-[55] bg-[var(--surface)] border border-[var(--border)] shadow-2xl flex overflow-visible font-sans-dm" style={{width:pw,height:ph,maxHeight:'calc(100vh - 40px)',      borderLeft:sb?'none':undefined,borderRadius:sb?'0 16px 16px 16px':'16px',transform:op?'scale(1) translateY(0)':'scale(0.96) translateY(8px)',transformOrigin:'bottom right',opacity:op?1:0,pointerEvents:op?'auto':'none',transition:'width 0.3s ease, height 0.3s ease, border-radius 0.3s ease, opacity 0.35s cubic-bezier(0.34,1.2,0.64,1), transform 0.35s cubic-bezier(0.34,1.2,0.64,1)'}}>
      <div className={`absolute top-0 bottom-0 right-full flex flex-col overflow-hidden transition-all duration-[300ms] ease-[cubic-bezier(0.34,1.2,0.64,1)] ${sb?'w-[140px] opacity-100 translate-x-0':'w-[140px] opacity-0 translate-x-4 pointer-events-none'}`}>
        <div className="w-[140px] flex flex-col h-full bg-[var(--surface)]" style={{borderRadius:'16px 0 0 16px'}}>
        <div className="px-3 py-2.5 flex items-center justify-between"><span className="text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Chats</span><button onClick={nc} className="h-5 w-5 flex items-center justify-center rounded hover:bg-[var(--surface-hover)] text-[var(--text-3)]" title="Novo chat"><Plus className="h-3 w-3"/></button></div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {[...pinCnv,...unpinCnv].filter(Boolean).map(c=>(<div key={c.id} onClick={()=>{stp();setAid(c.id);setLd(false);setRp(null);setErrIdx(null)}} className={`group px-3 py-2 cursor-pointer transition-colors border-l-2 ${aid===c.id?'border-l-[var(--accent)] bg-[var(--accent-subtle)]/30':c.pinned?'border-l-[var(--warning)]':'border-l-transparent hover:bg-[var(--surface-hover)]'}`}>
            <div className="flex items-start justify-between gap-0.5"><p className={`text-[11px] font-[500] truncate ${c.pinned?'text-[var(--warning)]':'text-[var(--text)]'}`}>{c.title}</p>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e=>{e.stopPropagation();tc(c.id)}} className="h-4 w-4 flex items-center justify-center rounded hover:bg-[var(--surface-hover)]" title="Fixar"><Pin className={`h-2.5 w-2.5 ${c.pinned?'text-[var(--warning)] fill-[var(--warning)]':'text-[var(--text-3)]'}`}/></button>
                <button onClick={e=>{e.stopPropagation();dc(c.id)}} className="h-4 w-4 flex items-center justify-center rounded hover:bg-[var(--destructive-subtle)] text-[var(--text-3)] hover:text-[var(--destructive)]" title="Apagar"><Trash2 className="h-2.5 w-2.5"/></button>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-3)] truncate mt-0.5">{c.preview||'Nova conversa'}</p>
          </div>))}
        </div></div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-3 py-2 shrink-0 backdrop-blur-md" style={{background:'linear-gradient(180deg, rgba(20,20,24,0.75) 0%, rgba(20,20,24,0.25) 85%, transparent 100%)'}}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={()=>setSb(!sb)} className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all mr-0.5 ${sb?'bg-[var(--accent-subtle)] text-[var(--accent)]':'text-[var(--text-3)] hover:bg-[var(--surface-hover)]'}`} title="Chats"><PanelLeft className="h-3.5 w-3.5"/></button>
            <div className="min-w-0 flex flex-col"><p className="text-[12px] font-[500] truncate">Metrys do Flow</p>{aid&&cn.find(c=>c.id===aid)&&<p className="text-[9px] text-[var(--text-3)] truncate">{cn.find(c=>c.id===aid)?.title}</p>}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={()=>setEx(!ex)} className="h-6 w-6 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--surface-hover)]" title={ex?'Reduzir':'Expandir'}>{ex?<Minimize2 className="h-3.5 w-3.5"/>:<Maximize2 className="h-3.5 w-3.5"/>}</button>
            <button onClick={()=>setOp(false)} className="h-6 w-6 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]" title="Minimizar"><ChevronDown className="h-4 w-4"/></button>
          </div>
        </div>
        {ms.length>0&&(<div className="group/tok relative mx-3 mb-0.5" style={{height:'3px'}}>
          <div className="absolute right-0 top-0 h-full rounded-full transition-all duration-500 overflow-hidden" style={{width:ms.length>0?`${Math.max(3,Math.min(100,tokenStats.pct))}%`:'0%',minWidth:ms.length>0?'16px':'0px',background:`linear-gradient(90deg,var(--success),var(--accent),var(--destructive))`,backgroundSize:`${100/(tokenStats.pct/100||0.01)}% 100%`,animation:'tokenBarFlow 2s ease-in-out infinite'}}/>
          <div className="absolute right-0 -top-1 opacity-0 group-hover/tok:opacity-100 transition-opacity duration-200 pointer-events-none" style={{transform:'translateY(-100%)'}}>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl px-3 py-2.5 text-left whitespace-nowrap" style={{minWidth:'200px'}}>
              <div className="flex items-center justify-between gap-3 mb-1.5"><span className="text-[10px] text-[var(--text-3)]">Tokens usados</span><span className="text-[11px] font-[600] text-[var(--text)]">{tokenStats.used.toLocaleString()} / {tokenStats.limit.toLocaleString()}</span></div>
              <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] mb-2 overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{width:`${tokenStats.pct}%`,background:tokenStats.pct>80?'var(--destructive)':tokenStats.pct>50?'var(--accent)':'var(--success)'}}/></div>
              <div className="flex items-center justify-between gap-3 mb-1"><span className="text-[9px] text-[var(--text-3)]">Input / Output</span><span className="text-[10px] text-[var(--text-2)]">{tokenStats.inputTk.toLocaleString()} / {tokenStats.outputTk.toLocaleString()}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-[9px] text-[var(--text-3)]">Custo estimado</span><span className="text-[10px] font-[500] text-[var(--warning)]">${tokenStats.cost<0.01?'<0.01':tokenStats.cost.toFixed(tokenStats.cost<0.1?3:2)}</span></div>
              <div className="mt-1.5 pt-1.5 border-t border-[var(--border)]"><p className="text-[8px] text-[var(--text-3)]">DeepSeek V3 · 64K contexto · $0.27/$1.10 por 1M tokens</p></div>
            </div>
          </div>
        </div>)}
        <div className="flex-1 overflow-y-auto px-3 scrollbar-thin" ref={sc}><div className="py-3">
        {ms.length===0&&!streamActive&&streamPhase!=='typing'&&!rp?(<div className="flex flex-col h-full px-2">
          <div className="flex items-start gap-3 mb-4 mt-4">
            <div key={welcomeStarKey} className="animation-shine shrink-0 star-flip-3d"><AIIcon s={72}/></div>
            <div className="text-left pt-1 min-w-0">
              <p className="text-[14px] font-[400] text-[var(--text-3)] animate-fade-up">{getGreeting()}, <span className="text-[var(--accent)] font-[600]">{session?.user?.name?.split(' ')[0]||'Usuario'}</span>!</p>
              <p className={`text-[18px] font-[600] text-[var(--text)] mt-1 leading-tight ${welcomeVisible?'welcome-text-in':'welcome-text-out'}`} style={{letterSpacing:'-0.02em'}}>{welcomeMsg}</p>
            </div>
          </div>
           <div className="flex flex-wrap gap-2.5 w-full">
            {cardItems.map((c,i)=>{
              const blobKey=CARD_BLOBS[i%CARD_BLOBS.length]
              const priColor=PRIORITY_COLORS[Math.min(c.score,PRIORITY_COLORS.length-1)]
              return(<div key={`${i}-${c.key}`} className="relative" style={{flex:'1 1 auto',minWidth:'calc(50% - 5px)',maxWidth:'calc(50% - 5px)'}}>
                {/* decorative ring accent (pompet style) */}
                <div className="absolute pointer-events-none" style={{
                  width:i===2?'42px':'32px',height:i===2?'42px':'32px',
                  top:i%2===0?'-8px':'auto',bottom:i%2!==0?'-6px':'auto',
                  left:i<=1?'-6px':'auto',right:i>=3?'-8px':'auto',
                  border:`2px solid ${CARD_RING_COLORS[i%CARD_RING_COLORS.length]}`,
                  borderRadius:'50%',opacity:c.visible?0.5:0.15,zIndex:0,
                  transition:'opacity 0.6s ease, transform 0.6s ease',
                  transform:c.visible?'scale(1)':'scale(0.8)',
                  animation:`blobMorph${String.fromCharCode(65+i%5)} ${4+i*1.4}s ease-in-out infinite`,
                }}/>
                {/* organic blob background */}
                <div className="absolute -inset-[2px] pointer-events-none" style={{
                  borderRadius:CARD_BLOB_RADII[i%CARD_BLOB_RADII.length],
                  background:priColor||CARD_BG[i%CARD_BG.length],
                  opacity:c.visible?0.9:0.2,
                  transition:'opacity 0.5s ease, transform 0.5s ease',
                  transform:c.visible?'scale(1)':'scale(0.92)',
                  zIndex:0,filter:'blur(2px)',
                  animation:`${blobKey} ${4.5+i*1.2}s ease-in-out infinite`,
                }}/>
                {/* card button */}
                <button onClick={()=>send(c.text)} className="relative w-full text-left px-3 py-3 border transition-all duration-500"
                  style={{
                    background:'var(--surface)',
                    borderColor:'var(--border)',
                    borderRadius:CARD_SHAPES[i%CARD_SHAPES.length],
                    opacity:c.visible?1:0.3,
                    transform:c.visible?'translateY(0)':'translateY(6px)',
                    transition:'opacity 0.5s ease, transform 0.5s ease',
                    zIndex:1,
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.boxShadow='0 0 16px rgba(232,98,42,0.1)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow=''}}>
                  <p className={`text-[11px] leading-relaxed ${c.score>=4?'text-[var(--text)] font-[500]':c.score>=2?'text-[var(--text-2)]':'text-[var(--text-3)]'}`}>{c.text}</p>
                </button>
              </div>)
            })}
          </div>
          </div>
        ):(<div className="space-y-3">
          {ms.map((msg,i)=>{const ia=msg.role==='assistant';const sd=i===0||(msg.createdAt&&ms[i-1]?.createdAt&&new Date(msg.createdAt).toDateString()!==new Date(ms[i-1].createdAt!).toDateString());const imgs=(msg.attachments||[]).filter(a=>a.type.startsWith('image/'));const docs=(msg.attachments||[]).filter(a=>!a.type.startsWith('image/'));const rpMsg=msg.replyTo?ms.find(m=>m.id===msg.replyTo):null
          return(<div key={msg.id||i}>{sd&&msg.createdAt&&<DDiv label={fmtD(msg.createdAt)}/>}
            {rpMsg&&(<div className={`flex mb-1 ${ia?'justify-start ml-8':'justify-end mr-8'}`}><div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--surface-2)] border-l-2 border-l-[var(--accent)] text-[10px] text-[var(--text-3)] max-w-[200px] truncate"><CornerDownRight className="h-3 w-3 shrink-0"/><span className="truncate">{rpMsg.content?.slice(0,40)||'(imagem)'}</span></div></div>)}
            {ia&&msg.reasoning&&<ReasoningBox content={msg.reasoning} msgIdx={i} onReport={reportErr}/>}
            <div className={`flex group ${ia?'justify-start':'justify-end'}`}><div className={`flex items-start gap-2 max-w-[90%] ${ia?'':'flex-row-reverse'}`}>
              {ia?<AIA/>:session?.user?.image?<img src={session.user.image} alt="" className="h-7 w-7 rounded-full shrink-0 mt-0.5 object-cover"/>:<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-[500] text-white mt-0.5">{session?.user?.name?.slice(0,2).toUpperCase()||'VC'}</div>}
              <div className="min-w-0">
                {imgs.length>0&&(<div className={`flex gap-1.5 flex-wrap mb-1.5 ${ia?'':'justify-end'}`}>{imgs.map((img,ii)=>(<button key={ii} title={`Ver ${img.name}`} onClick={()=>setVi(vim.indexOf(img))} className="rounded-xl border border-[var(--border)] overflow-hidden hover:ring-2 ring-[var(--accent)]/40 transition-all"><img src={img.url} alt={img.name} className="h-16 w-16 object-cover"/></button>))}</div>)}
                {docs.length>0&&(<div className={`flex gap-1.5 flex-wrap mb-1.5 ${ia?'':'justify-end'}`}>{docs.map((doc,di)=>(<div key={di} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-3)]"><Paperclip className="h-3 w-3"/>{doc.name}</div>))}</div>)}
                {msg.content&&(ia?<div className="text-[12px] leading-relaxed whitespace-pre-wrap break-words"><MD content={msg.content}/></div>:<div className="rounded-2xl px-3 py-2 bg-[var(--accent-subtle)] border border-[var(--accent)]/20 rounded-tr-sm"><p className="text-[12px] leading-relaxed whitespace-pre-wrap break-words text-[var(--text)]">{msg.content}</p></div>)}
                {msg.liked!==undefined&&(<p className="text-[9px] text-[var(--success)] mt-0.5 px-1">Agradecemos pelo feedback!</p>)}
                <div className={`flex items-center gap-1 mt-0.5 px-1 ${ia?'':'justify-end'}`}>
                  <span className="text-[9px] text-[var(--text-3)]">{fmtT(msg.createdAt)}</span>
                  {ia&&(<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
                    <button title="Gostei" onClick={()=>{if(msg.liked===undefined){sfb(i,true,fbk||undefined);setFbk(null)}}} className={`h-4 w-4 flex items-center justify-center rounded ${msg.liked===true?'text-[var(--success)]':'text-[var(--text-3)] hover:text-[var(--success)]'}`}><ThumbsUp className="h-3 w-3"/></button>
                    <button title="Nao gostei" onClick={()=>{if(msg.liked===undefined)sfb(i,false)}} className={`h-4 w-4 flex items-center justify-center rounded ${msg.liked===false?'text-[var(--destructive)]':'text-[var(--text-3)] hover:text-[var(--destructive)]'}`}><ThumbsDown className="h-3 w-3"/></button>
                    <button title="Responder" onClick={()=>setRp(msg)} className="h-4 w-4 flex items-center justify-center rounded text-[var(--text-3)] hover:text-[var(--accent)]"><Reply className="h-3 w-3"/></button>
    </div>)}

                </div>
              </div>
            </div></div></div>)})}
          {/* Streaming reasoning display - 3 linhas rotativas com card arredondado visivel durante geracao */}
          {streamActive&&reasoningLines.length>0&&<div className="flex justify-start"><div className="flex items-start gap-2"><AIA rr={streamPhase==='thinking'}/><div className="min-w-0 flex-1"><ReasoningStream lines={reasoningLines} active={streamPhase==='thinking'||streamPhase==='typing'}/></div></div></div>}
          {/* Loading fallback while waiting for first chunk */}
          {streamActive&&reasoningLines.length===0&&streamPhase==='thinking'&&(<div className="flex justify-start"><div className="flex items-start gap-2"><AIA rr/><div className="min-w-0"><div className="rounded-xl border border-[var(--info)]/20 bg-[var(--info-subtle)]/30 px-3 py-2 animate-pulse"><p className="text-[11px] text-[var(--info)] font-[500]">Pensamento iniciando...</p></div></div></div></div>)}
          {/* Fallback - thinking message when no stream active but loading (backward compat) */}
          {!streamActive&&ld&&(reasoningLines.length>0?<div className="flex justify-start"><div className="flex items-start gap-2"><AIA rr/><div className="min-w-0 flex-1"><ReasoningStream lines={reasoningLines} active={true}/></div></div></div>:
          streamPhase==='idle'&&!streamActive?<div className="flex justify-start"><div className="flex items-start gap-2"><AIA rr/><div className="min-w-0"><div className="text-[12px] italic font-[500] thinking-metal animate-fade-up">{THINKING[ti]}</div></div></div></div>:null)}
          {/* Typewriter display */}
          {streamPhase==='typing'&&streamText&&(<div className="flex justify-start"><div className="flex items-start gap-2"><AIA rr/><div className="min-w-0"><div className="text-[12px] leading-relaxed whitespace-pre-wrap break-words"><MD content={streamText}/></div></div></div></div>)}
          {/* Thinking pause between blocks */}
          {streamPhase==='think'&&streamText&&(<div className="flex justify-start"><div className="flex items-start gap-2"><AIA rr/><div className="min-w-0"><div className="rounded-2xl rounded-tl-sm px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)]"><p className="text-[11px] text-[var(--text-3)] italic">Estruturado resposta...</p></div></div></div></div>)}
          {/* Done - show think time */}
          {!ld&&streamPhase==='done'&&ms.length>0&&ms[ms.length-1]?.role==='assistant'&&(<div className="flex justify-start"><div className="flex items-start gap-2"><AIA/><div className="min-w-0"><button onClick={()=>{const r=ms[ms.length-1]?.reasoning;if(r){const idx=ms.length-1;const el=document.getElementById(`reasoning-${idx}`);if(el)el.classList.toggle('hidden')}}} className="text-[9px] font-[500] thinking-metal hover:opacity-100 opacity-60 transition-opacity">Pensou por {thinkSec||'alguns'} segundos</button></div></div></div>)}
        </div>)}
        </div></div>

        {errIdx!==null&&(<div className="px-3 pb-1"><div className="bg-[var(--surface-2)] rounded-xl border border-[var(--destructive)]/20 px-3 py-2"><p className="text-[10px] font-[500] text-[var(--destructive)] mb-1">Reportar erro</p><textarea placeholder="Descreva o erro..." value={errTxt} onChange={e=>setErrTxt(e.target.value)} className="w-full text-[11px] bg-transparent border border-[var(--border)] rounded-lg outline-none placeholder:text-[var(--text-3)] text-[var(--text)] p-1.5 min-h-[36px] resize-none scrollbar-thin"/>
          <div className="flex flex-col gap-1 mt-1.5">
            <label className="flex items-center gap-1.5 text-[10px] text-[var(--text-2)] cursor-pointer"><input type="checkbox" checked={errConv} onChange={e=>setErrConv(e.target.checked)} className="accent-[var(--accent)] h-3 w-3"/>Enviar conversa completa (obrigatorio)</label>
            <label className="flex items-center gap-1.5 text-[10px] text-[var(--text-2)] cursor-pointer"><input type="checkbox" checked={errPrint} onChange={e=>setErrPrint(e.target.checked)} className="accent-[var(--accent)] h-3 w-3"/>Incluir print da tela (Ctrl+Shift+S)</label>
          </div>
          <div className="flex items-center gap-1.5 mt-2"><button onClick={sendReport} disabled={!errConv} className="text-[10px] text-[var(--accent)] font-[500] px-2 py-0.5 rounded bg-[var(--accent-subtle)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-30">Enviar reporte</button><button title="Cancelar" onClick={()=>setErrIdx(null)} className="text-[var(--text-3)] hover:text-[var(--destructive)] ml-auto"><X className="h-3.5 w-3.5"/></button></div></div></div>)}

        {fbk!==null&&(<div className="px-3 pb-1"><div className="flex items-center gap-1.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] px-3 py-1.5"><input autoFocus placeholder="Feedback opcional..." value={fbk} onChange={e=>setFbk(e.target.value)} onBlur={()=>{if(fbk===null)return;const li=ms.findIndex(m=>m.liked===undefined&&m.role==='assistant');if(li>=0)sfb(li,true,fbk);setFbk(null)}} className="flex-1 text-[11px] bg-transparent border-none outline-none placeholder:text-[var(--text-3)] text-[var(--text)]"/><button title="Enviar feedback" onClick={()=>{const li=ms.findIndex(m=>m.liked===undefined&&m.role==='assistant');if(li>=0)sfb(li,true,fbk);setFbk(null)}} className="text-[10px] text-[var(--accent)] font-[500]">Enviar</button></div></div>)}

        {rp&&(<div className="px-3 pb-1"><div className="flex items-center gap-2 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] px-2.5 py-1.5"><div className="flex-1 min-w-0"><p className="text-[10px] text-[var(--text-3)]">Respondendo a {rp.role==='assistant'?'Metrys':session?.user?.name||'Voce'}</p><p className="text-[11px] text-[var(--text)] truncate">{rp.content?.slice(0,60)||'(imagem)'}</p></div><button title="Cancelar resposta" onClick={()=>setRp(null)} className="text-[var(--text-3)] hover:text-[var(--destructive)]"><X className="h-3.5 w-3.5"/></button></div></div>)}

        {pf.length>0&&(<div className="px-3 pb-1 flex gap-1.5 flex-wrap">{pf.map((f,i)=>(<div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px]">{f.isImg?<img src={f.url} alt={f.name} className="h-5 w-5 rounded object-cover"/>:<><Paperclip className="h-3 w-3 text-[var(--text-3)]"/><span className="text-[var(--text-2)] truncate max-w-[100px]">{f.name}</span></>}<button title="Remover anexo" onClick={()=>rf(i)} className="text-[var(--text-3)] hover:text-[var(--destructive)]"><X className="h-3 w-3"/></button></div>))}</div>)}

        <div className="px-2 pb-1"><div className="relative">
          <input title="Selecionar imagens" type="file" ref={ii} multiple accept="image/*" className="hidden" onChange={e=>{if(e.target.files)Array.from(e.target.files).forEach(f=>af(f));if(ii.current)ii.current.value=''}}/>
          <input title="Selecionar arquivos" type="file" ref={fi} multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.xml,.md" className="hidden" onChange={e=>{if(e.target.files)Array.from(e.target.files).forEach(f=>af(f));if(fi.current)fi.current.value=''}}/>
          <textarea ref={ta} rows={1} aria-label={rp?'Responder mensagem':'Perguntar algo'} placeholder={rp?'Responder...':'Pergunte algo...'} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} className="w-full text-[12px] bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl outline-none resize-none placeholder:text-[var(--text-3)] text-[var(--text)] leading-relaxed px-3 pt-3.5 pb-[52px] min-h-[64px] max-h-[180px] transition-all duration-200 focus:bg-[var(--surface)] focus:border-[var(--accent)]/20 focus:scale-[1.01] overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,0.06) transparent'}}/>
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1">
            <div className="flex rounded-full bg-[var(--surface)] border border-[var(--border)] shrink-0 overflow-hidden">
              <button onClick={()=>setModel('metrys-pro')} className={`px-1.5 py-0.5 text-[9px] font-[500] transition-colors ${model==='metrys-pro'?'bg-[var(--accent)] text-white':'text-[var(--text-3)] hover:text-[var(--text)]'}`}>Pro</button>
              <button onClick={()=>setModel('metrys-flash')} className={`px-1.5 py-0.5 text-[9px] font-[500] transition-colors ${model==='metrys-flash'?'bg-[var(--accent)] text-white':'text-[var(--text-3)] hover:text-[var(--text)]'}`}>Flash</button>
            </div>
            <button onClick={()=>ii.current?.click()} className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all shrink-0" title="Imagem"><Image className="h-3.5 w-3.5"/></button>
            <button onClick={()=>fi.current?.click()} className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all shrink-0" title="Arquivo"><Paperclip className="h-3.5 w-3.5"/></button>
            <div className="flex-1"/>
            <Button size="icon" className="h-8 w-8 shrink-0 rounded-xl" disabled={(!inp.trim()&&pf.length===0)||(streamPhase==='typing'||streamPhase==='think')} onClick={()=>send()}><Send className="h-3.5 w-3.5"/></Button>
          </div>
        </div></div>
        <div className="pb-1.5 text-center"><p className="text-[9px] text-[var(--text-3)]">Metrys e uma IA e pode cometer erros.</p></div>
      </div>
    </div>

    <Dialog open={vi!==null} onOpenChange={()=>setVi(null)}><DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-[var(--bg)] border-[var(--border)]">{vi!==null&&vim[vi]&&(<div className="flex flex-col h-full max-h-[85vh]"><div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0"><span className="text-[12px] font-[500] text-[var(--text)] truncate">{vim[vi].name}</span><div className="flex items-center gap-1">{vim.length>1&&(<div className="flex items-center gap-0.5 mr-2"><button title="Anterior" onClick={()=>setVi(Math.max(0,vi-1))} disabled={vi===0} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-3)] disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button><span className="text-[11px] text-[var(--text-3)]">{vi+1}/{vim.length}</span><button title="Proxima" onClick={()=>setVi(Math.min(vim.length-1,vi+1))} disabled={vi===vim.length-1} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-3)] disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button></div>)}<a title="Baixar imagem" href={vim[vi].url} download={vim[vi].name} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-3)]"><Download className="h-4 w-4"/></a><button title="Fechar visualizador" onClick={()=>setVi(null)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-3)]"><X className="h-4 w-4"/></button></div></div><div className="flex-1 flex items-center justify-center p-4 overflow-auto"><img src={vim[vi].url} alt={vim[vi].name} className="max-w-full max-h-[70vh] object-contain rounded-lg"/></div></div>)}</DialogContent></Dialog>
  </>)
}
