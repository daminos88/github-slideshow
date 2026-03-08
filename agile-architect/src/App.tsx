/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Agile Architect OS - Phase 9 Complete
 */

import { useState, useEffect, useRef, useReducer, createContext, useContext } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { Send, X, Terminal, Loader2 } from "lucide-react";
import './App.css';

// ─── LANDING & EDITOR DATA ───────────────────────────────────
const PHASE_META = [
  { n:1, name:"Blueprint Sync",   agent:"ARCHITECT", icon:"◈", desc:"Schema foundation. Prisma models, enums, relations." },
  { n:2, name:"Env Hardening",    agent:"SECURITY",  icon:"⬡", desc:"Middleware, CSP headers, JWT tokens, CORS whitelist." },
  { n:3, name:"Logic Core",       agent:"ARCHITECT", icon:"⬟", desc:"Server Actions, Zod contracts, auth handshake." },
  { n:4, name:"UI/UX Aesthetic",  agent:"STYLIST",   icon:"◉", desc:"Bento grid, skeleton states, Framer Motion." },
  { n:5, name:"Security Auditor", agent:"AUDITOR",   icon:"⬢", desc:"Vulnerability scan, XSS/SQLi/secret detection." },
  { n:6, name:"The Publisher",    agent:"PUBLISHER", icon:"◈", desc:"Atomic VPS deployment, PM2, Nginx, SSL." },
  { n:7, name:"Growth Engine",    agent:"GROWTH",    icon:"⬡", desc:"SEO factory, 30-day calendar, social automation." },
  { n:8, name:"SEO Mastery",      agent:"SEO",       icon:"◉", desc:"Competitor matrix, JSON-LD, /vs/ pages." },
  { n:9, name:"Market Penetration", agent:"GROWTH",  icon:"⬡", desc:"Viral loops, pixel tracking, affiliate logic." },
];

const STATS = [
  { value:"8",      label:"Guided Phases"    },
  { value:"$20",    label:"Monthly VPS Cost" },
  { value:"13",     label:"Rules Per Phase"  },
  { value:"<100ms", label:"Target TTFB"      },
];

const HOMEWORK_DATA: Record<number, string> = {
  1: "Initialize the project repository. Define the Prisma schema for User, Account, and Subscription models. Configure the database connection string in the .env file.",
  2: "Implement security headers using Helmet or Next.js config. Set up CORS policies. Configure rate limiting for API routes.",
  3: "Create Server Actions for user authentication and data mutation. Implement Zod schemas for input validation. Set up the auth handshake flow.",
  4: "Design the dashboard layout using a Bento grid system. Implement skeleton loading states for data fetching. Add Framer Motion transitions for page navigation.",
  5: "Run a vulnerability scan using standard tools. Check for XSS and SQL injection vulnerabilities. Ensure no secrets are committed to the repository.",
  6: "Prepare the deployment script. Configure PM2 for process management. Set up Nginx as a reverse proxy. Obtain and configure SSL certificates.",
  7: "Generate sitemaps and robots.txt. Implement Open Graph tags for social sharing. Create a content calendar for the next 30 days.",
  8: "Analyze competitor keywords. Implement JSON-LD structured data. Create comparison pages (/vs/competitor) to target specific search terms.",
  9: "Implement viral referral loops (K-Factor > 1). Hardcode conversion pixels for Meta/Google. Deploy affiliate link generator logic."
};

// ─── STATE ENGINE ─────────────────────────────────────────────
interface LogEntry {
  agent: string;
  msg: string;
  ts: number;
}

interface AppState {
  currentPhase: number;
  activeAgent: string;
  viewMode: string;
  isSignedOff: boolean;
  sentinelOpen: boolean;
  homeworkText: string;
  signedPhases: number[];
  agentLog: LogEntry[];
  vsPages: string[];
}

type Action =
  | { type: "SET_PHASE"; p: number }
  | { type: "SET_VIEW"; p: string }
  | { type: "SET_HW"; p: string }
  | { type: "USER_MSG"; p: string }
  | { type: "PUSH_LOG"; p: LogEntry }
  | { type: "UPDATE_LAST_LOG"; p: LogEntry }
  | { type: "ADD_VS_PAGE"; p: string }
  | { type: "TOGGLE_SENTINEL" }
  | { type: "SIGN_OFF" };

const BlueprintCtx = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

const initState: AppState = {
  currentPhase:9, activeAgent:"GROWTH", viewMode:"HOMEWORK",
  isSignedOff:false, sentinelOpen:false, homeworkText: HOMEWORK_DATA[9],
  signedPhases:[], agentLog:[], vsPages: ['SaaS-A vs AgileArchitect', 'SaaS-B Alternative', 'Top 10 Growth Tools'],
};

function reducer(s: AppState, a: Action): AppState {
  switch(a.type) {
    case "SET_PHASE": return {...s, currentPhase:a.p, isSignedOff:false, homeworkText: HOMEWORK_DATA[a.p] || ""};
    case "SET_VIEW": return {...s, viewMode:a.p};
    case "SET_HW": return {...s, homeworkText:a.p};
    case "USER_MSG": return {...s, agentLog:[...s.agentLog.slice(-30), {agent:"USER", msg:a.p, ts:Date.now()}]};
    case "PUSH_LOG": return {...s, agentLog:[...s.agentLog.slice(-30), a.p]};
    case "UPDATE_LAST_LOG": {
       const newLog = [...s.agentLog];
       if (newLog.length > 0) {
          newLog[newLog.length - 1] = a.p;
       }
       return {...s, agentLog: newLog};
    }
    case "ADD_VS_PAGE": return {...s, vsPages: [...s.vsPages, a.p]};
    case "TOGGLE_SENTINEL": return {...s, sentinelOpen:!s.sentinelOpen};
    case "SIGN_OFF": return {...s, isSignedOff:true, signedPhases:[...s.signedPhases, s.currentPhase], currentPhase:Math.min(s.currentPhase+1, 9)};
    default: return s;
  }
}

function BlueprintProvider({children}: {children: React.ReactNode}) {
  const [state, dispatch] = useReducer(reducer, initState);
  return <BlueprintCtx.Provider value={{state,dispatch}}>{children}</BlueprintCtx.Provider>;
}

function useBlueprintCtx() {
  const ctx = useContext(BlueprintCtx);
  if (!ctx) throw new Error("Missing BlueprintProvider");
  return ctx;
}

// ─── COMPONENTS ───────────────────────────────────────────────
function FadeUp({children, delay=0}: {children: React.ReactNode; delay?: number}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {once:true, margin:"0px"});
  return (
    <motion.div ref={ref} initial={{opacity:0,y:15}} animate={inView?{opacity:1,y:0}:{}} transition={{delay}}>
      {children}
    </motion.div>
  );
}

function AgentSentinel({mobile=false}: {mobile?: boolean}) {
  const {state, dispatch} = useBlueprintCtx();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.agentLog, isTyping]);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const query = input.trim();
    setInput("");
    dispatch({type:"USER_MSG", p:query});
    setIsTyping(true);
    
    const currentPhaseData = PHASE_META.find(p => p.n === state.currentPhase);
    const agentName = currentPhaseData ? currentPhaseData.agent : "ARCHITECT";

    try {
      const res = await fetch('/api/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: query, 
          currentPhase: state.currentPhase 
        })
      });
      
      const data = await res.json();
      dispatch({type:"PUSH_LOG", p:{agent:agentName, msg:data.message, ts:Date.now()}});
    } catch {
      dispatch({type:"PUSH_LOG", p:{agent:"SYSTEM", msg:"Agent is in demo mode. No backend connected.", ts:Date.now()}});
    } finally {
      setIsTyping(false);
    }
  };

  const Content = (
    <div className="flex flex-col h-full bg-white font-sans">
      <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
           <span className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">Agent Sentinel</span>
        </div>
        {mobile && (
          <button onClick={()=>dispatch({type:"TOGGLE_SENTINEL"})} className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
            <X size={16} className="text-neutral-400"/>
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
        {state.agentLog.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
              <Terminal size={32} className="mb-4 text-neutral-300"/>
              <p className="text-xs font-medium text-neutral-400">System Ready. Awaiting Input.</p>
           </div>
        )}
        
        {state.agentLog.map((log, i) => {
          const isUser = log.agent === "USER";
          return (
            <motion.div 
              key={i} 
              initial={{opacity:0, y:10}} 
              animate={{opacity:1, y:0}} 
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                 {!isUser && (
                    <span className="text-[9px] font-black text-neutral-300 uppercase mb-1 ml-1 tracking-widest">{log.agent}</span>
                 )}
                 <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed shadow-sm border ${
                    isUser 
                      ? "bg-emerald-500 text-white border-emerald-600 rounded-tr-sm" 
                      : "bg-white text-neutral-600 border-neutral-100 rounded-tl-sm"
                 }`}>
                    {isUser ? (
                       log.msg
                    ) : (
                       <div className="markdown-body">
                          <ReactMarkdown components={{
                            code(props) {
                              const {className, children, ...rest} = props;
                              const isInline = !className;
                              return !isInline ? (
                                <pre className="bg-neutral-900 text-emerald-400 p-3 rounded-lg overflow-x-auto my-2 text-[10px] font-mono border border-neutral-800">
                                  <code {...rest} className={className}>{children}</code>
                                </pre>
                              ) : (
                                <code className={`bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[10px] font-mono border border-neutral-200 ${className || ''}`} {...rest}>
                                  {children}
                                </code>
                              )
                            },
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="pl-1">{children}</li>,
                            strong: ({children}) => <span className="font-bold text-neutral-800">{children}</span>,
                            a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{children}</a>
                          }}>
                            {log.msg}
                          </ReactMarkdown>
                       </div>
                    )}
                 </div>
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
           <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-start">
              <div className="bg-white border border-neutral-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                 <Loader2 size={12} className="animate-spin text-emerald-500"/>
                 <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Processing...</span>
              </div>
           </motion.div>
        )}
      </div>

      <form onSubmit={handleQuery} className="p-3 border-t border-neutral-100 bg-white flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400 font-medium" 
          placeholder="Command the architect..."
          disabled={isTyping}
        />
        <button 
          disabled={!input.trim() || isTyping}
          className="bg-emerald-500 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none hover:bg-emerald-600 transition-all"
        >
           {isTyping ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} className="ml-0.5"/>}
        </button>
      </form>
    </div>
  );

  return mobile ? (
    <AnimatePresence>
      {state.sentinelOpen && (
        <>
          <motion.div 
             initial={{opacity:0}} 
             animate={{opacity:1}} 
             exit={{opacity:0}} 
             onClick={()=>dispatch({type:"TOGGLE_SENTINEL"})} 
             className="fixed inset-0 bg-neutral-900/20 z-[110] backdrop-blur-sm"
          />
          <motion.div 
             initial={{y:"100%"}} 
             animate={{y:0}} 
             exit={{y:"100%"}} 
             transition={{type:"spring", damping:30, stiffness:300}} 
             className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white z-[120] rounded-t-[32px] shadow-2xl overflow-hidden border-t border-white/20"
          >
            {Content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  ) : (
    <div className="w-[360px] border-l border-neutral-100 h-full shadow-[-10px_0_40px_-20px_rgba(0,0,0,0.05)] relative z-10">
       {Content}
    </div>
  );
}

function EditorLayout() {
  const {state, dispatch} = useBlueprintCtx();
  const [competitorInput, setCompetitorInput] = useState("");
  const [isGeneratingVs, setIsGeneratingVs] = useState(false);

  const handleGenerateVs = async () => {
     if (!competitorInput.trim()) return;
     setIsGeneratingVs(true);
     try {
        await new Promise(r => setTimeout(r, 1200));
        const newPage = `Agile Architect vs ${competitorInput.trim()}`;
        dispatch({type: "ADD_VS_PAGE", p: newPage});
        dispatch({type: "PUSH_LOG", p: {agent: "SEO", msg: `Generated comparison matrix for: ${newPage}`, ts: Date.now()}});
        setCompetitorInput("");
     } catch (e) {
        console.error(e);
     } finally {
        setIsGeneratingVs(false);
     }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-neutral-100 flex items-center justify-between px-6">
           <span className="font-bold text-[13px] tracking-tight text-neutral-400">PROJECT / <span className="text-neutral-900">NEW_SAAS</span></span>
           <button className="md:hidden text-emerald-500 font-bold text-xs" onClick={()=>dispatch({type:"TOGGLE_SENTINEL"})}>SENTINEL</button>
        </header>
        <main className="flex-1 p-6 bg-white flex gap-6 overflow-hidden">
           <div className="w-64 flex flex-col gap-2 overflow-y-auto pr-2 shrink-0">
              {PHASE_META.map(p => {
                 const isLocked = state.currentPhase < p.n;
                 const isDone = state.signedPhases.includes(p.n);
                 const isActive = state.currentPhase === p.n;
                 return (
                    <button key={p.n} disabled={isLocked} onClick={()=>dispatch({type:"SET_PHASE", p:p.n})}
                      className={`text-left p-4 rounded-2xl border transition-all group relative overflow-hidden ${isActive ? "bg-neutral-900 text-white border-neutral-900 shadow-xl" : isLocked ? "opacity-40 border-transparent grayscale" : "bg-white border-neutral-100 hover:border-emerald-200"}`}>
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold tracking-widest ${isActive?"text-emerald-400":"text-neutral-400"}`}>PHASE {p.n}</span>
                          {isDone && <span className="text-emerald-500 text-xs">&#10003;</span>}
                       </div>
                       <div className={`font-bold text-sm mb-1 ${isActive?"text-white":"text-neutral-900"}`}>{p.name}</div>
                       <div className={`text-[10px] leading-relaxed ${isActive?"text-neutral-400":"text-neutral-400"}`}>{p.desc}</div>
                       {isActive && <motion.div layoutId="active-glow" className="absolute inset-0 bg-emerald-500/5 pointer-events-none"/>}
                    </button>
                 );
              })}
           </div>
           
           <div className="flex-1 bg-neutral-50 rounded-3xl border border-neutral-100 p-8 overflow-y-auto relative shadow-inner">
              <div className="max-w-5xl mx-auto space-y-8 pb-20">
                 <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} key={state.currentPhase} className="mb-8 p-6 bg-white border border-neutral-100 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                       <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Current Objective</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-700 leading-relaxed max-w-3xl">{state.homeworkText}</p>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <span className="text-6xl font-black text-neutral-900">{state.currentPhase}</span>
                    </div>
                 </motion.div>

                 {state.currentPhase === 1 && (
                   <>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-100">&#9672;</div>
                           <div>
                              <h2 className="text-2xl font-black tracking-tight">BLUEPRINT SYNC</h2>
                              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Phase 01 / Data Foundation</p>
                           </div>
                        </div>
                        <span className="px-3 py-1 bg-white border border-neutral-100 rounded-full text-[10px] font-bold text-neutral-400">STATUS: DRAFT</span>
                     </div>

                     <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Target Niche</span>
                           <p className="text-sm font-bold text-neutral-800">[Your SaaS Niche]</p>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Primary Persona</span>
                           <p className="text-sm font-bold text-neutral-800">[Target User]</p>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Core Value Prop</span>
                           <p className="text-sm font-bold text-emerald-600">[Your Main Benefit]</p>
                        </div>
                     </motion.div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} transition={{delay:0.1}} className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                           <div className="flex items-center gap-2 mb-6">
                              <span className="text-emerald-500 font-mono text-sm">{"{ }"}</span>
                              <h3 className="text-sm font-black uppercase tracking-widest">Prisma Models</h3>
                           </div>
                           <div className="bg-neutral-50 rounded-2xl p-6 font-mono text-[11px] text-neutral-500 leading-relaxed border border-neutral-100">
                              <div>model <span className="text-neutral-900 font-bold">User</span> {"{"} id, email, role {"}"}</div>
                              <div className="mt-2 text-emerald-600">// Mapping concept to entities...</div>
                              <div className="mt-2">model <span className="text-neutral-900 font-bold">Project</span> {"{"} id, name, status {"}"}</div>
                              <div className="mt-1">model <span className="text-neutral-900 font-bold">Event</span> {"{"} id, type, ts {"}"}</div>
                           </div>
                        </motion.div>

                        <motion.div initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} transition={{delay:0.2}} className="flex flex-col gap-4">
                           <div className="flex-1 bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Agent Verification</h3>
                              <div className="space-y-3">
                                 {["Relations validated", "CUID normalization", "Cascade safety"].map(check => (
                                    <div key={check} className="flex items-center gap-2 text-[11px] font-medium text-neutral-400">
                                       <span className="text-emerald-500">&#10003;</span> {check}
                                    </div>
                                 ))}
                              </div>
                           </div>
                           <button 
                              onClick={() => {
                                 dispatch({type: "PUSH_LOG", p: {agent: "ARCHITECT", msg: "Blueprint signed and locked.", ts: Date.now()}});
                                 setTimeout(() => dispatch({type: "SIGN_OFF"}), 800);
                              }}
                              className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">
                              Lock Blueprint & Proceed →
                           </button>
                        </motion.div>
                     </div>
                   </>
                 )}

                 {state.currentPhase === 2 && (
                   <>
                     <header className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-emerald-100">&#11041;</div>
                           <div>
                              <h2 className="text-2xl font-black tracking-tight text-neutral-900 uppercase italic">Phase 02</h2>
                              <p className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">Env Hardening</p>
                           </div>
                        </div>
                        <button onClick={() => {
                             dispatch({type: "PUSH_LOG", p: {agent: "SECURITY", msg: "Environment hardened. Security protocols active.", ts: Date.now()}});
                             setTimeout(() => dispatch({type: "SIGN_OFF"}), 800);
                          }} className="px-8 py-3 bg-neutral-900 text-white rounded-2xl font-black text-[12px] tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-xl shadow-neutral-200">Sign Off Phase 2 →</button>
                     </header>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                           <div className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-6">Security Middleware</div>
                           <pre className="font-mono text-[10px] leading-relaxed text-neutral-400 bg-neutral-50 p-5 rounded-2xl border border-neutral-100 overflow-x-hidden whitespace-pre-wrap">
{`// Hardening Headers
res.headers.set('Content-Security-Policy',
  "default-src 'self'...");
// JWT Phase Gating
if (token.phase < ${state.currentPhase})
  return redirect('/lock');`}
                           </pre>
                        </div>

                        <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                           <div className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-6">Environment Checklist</div>
                           <div className="space-y-4">
                              {["CSP Sentinel Active", "CORS Origin White-list", "JWT Signed Cookies", "HTTP-Only Flags"].map(item => (
                                 <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                                    <span className="text-[11px] font-bold text-neutral-600">{item}</span>
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white">&#10003;</div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                   </>
                 )}
                 
                 {state.currentPhase === 3 && (
                   <>
                     <header className="flex items-end justify-between">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Phase 03 // Back-end Core</div>
                           <h2 className="text-4xl font-black tracking-tighter text-neutral-900 uppercase leading-none">Logic Core</h2>
                        </div>
                        <button onClick={() => {
                             dispatch({type: "PUSH_LOG", p: {agent: "ARCHITECT", msg: "Logic core locked. Server actions validated.", ts: Date.now()}});
                             setTimeout(() => dispatch({type: "SIGN_OFF"}), 800);
                          }} className="px-10 py-4 bg-emerald-500 text-white rounded-3xl font-black text-[12px] tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-emerald-100">Lock Logic Core →</button>
                     </header>

                     <div className="grid grid-cols-12 gap-6">
                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="col-span-12 lg:col-span-7 bg-white border border-neutral-100 rounded-3xl p-10 shadow-sm">
                           <div className="flex items-center gap-3 mb-8">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Type-Safe Server Actions</span>
                           </div>
                           <div className="bg-neutral-50 rounded-3xl p-6 font-mono text-[11px] text-neutral-500 border border-neutral-50 leading-relaxed overflow-x-auto">
                              <div className="text-emerald-600 italic mb-4">// lib/actions/core.ts</div>
                              <div><span className="text-neutral-900">"use server";</span></div>
                              <div className="mt-2 text-neutral-900 font-bold">{"export async function syncBlueprint(data: z.infer<typeof Schema>) {"}</div>
                              <div className="pl-4">{"const { session } = await auth();"}</div>
                              <div className="pl-4 mt-2 font-bold text-emerald-600">// Atomic Transaction Layer</div>
                              <div className="pl-4">{"return await prisma.$transaction(async (tx) => {"}</div>
                              <div className="pl-8">{"const res = await tx.blueprint.update({ ... });"}</div>
                              <div className="pl-8">{"await tx.auditLog.create({ ... });"}</div>
                              <div className="pl-8">return res;</div>
                              <div className="pl-4">{"});"}</div>
                              <div>{"}"}</div>
                           </div>
                        </motion.div>

                        <div className="col-span-12 lg:col-span-5 space-y-6">
                           <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                              <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-6">Validation Flow</h3>
                              <div className="space-y-4">
                                 {[
                                    {label: "Zod Schema Gating", status: "STRICT"},
                                    {label: "Transactional Locking", status: "ACID"},
                                    {label: "Edge Execution", status: "FAST"}
                                 ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 border border-neutral-50">
                                       <span className="text-[11px] font-bold text-neutral-600">{item.label}</span>
                                       <span className="text-[10px] font-black text-emerald-500 tracking-tighter italic">{item.status}</span>
                                    </div>
                                 ))}
                              </div>
                           </motion.div>

                           <div className="bg-neutral-900 rounded-3xl p-8 text-white shadow-2xl">
                              <div className="flex items-center gap-3 mb-4">
                                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-mono text-emerald-500">{"<>"}</div>
                                 <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Runtime Integrity</div>
                              </div>
                              <p className="text-[11px] font-medium leading-relaxed opacity-80 italic">"Server-side validation is non-negotiable. Every entry-point is sanitized before DB persistence."</p>
                           </div>
                        </div>
                     </div>
                   </>
                 )}
                 
                 {state.currentPhase === 4 && (
                   <>
                     <header className="flex items-end justify-between">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase">Phase 04 // Design System</div>
                           <h2 className="text-4xl font-black tracking-tighter text-neutral-900 uppercase leading-none">UI/UX Aesthetic</h2>
                        </div>
                        <button onClick={() => {
                             dispatch({type: "PUSH_LOG", p: {agent: "STYLIST", msg: "Bento grid active. Design tokens locked.", ts: Date.now()}});
                             setTimeout(() => dispatch({type: "SIGN_OFF"}), 800);
                          }} className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[12px] tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-emerald-100">Sign Off & Export →</button>
                     </header>

                     <div className="grid grid-cols-12 gap-6">
                        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="col-span-12 lg:col-span-8 bg-white border border-neutral-100 rounded-3xl p-1 shadow-sm overflow-hidden min-h-96">
                           <div className="w-full h-full bg-neutral-50 rounded-3xl border border-neutral-50 flex flex-col">
                              <div className="h-10 border-b border-neutral-100 flex items-center px-6 gap-2">
                                 <div className="flex gap-1.5">{[0,1,2].map(i=>(<div key={i} className="w-2 h-2 rounded-full bg-neutral-200"/>))}</div>
                                 <div className="mx-auto bg-white border border-neutral-100 px-4 py-0.5 rounded-full text-[9px] font-bold text-neutral-300 tracking-tighter">preview.agile-architect.cloud</div>
                              </div>
                              <div className="flex-1 flex items-center justify-center p-10">
                                 <div className="w-64 h-96 bg-white rounded-3xl border-8 border-neutral-900 shadow-2xl overflow-hidden relative">
                                    <div className="p-6 space-y-4">
                                       <div className="w-12 h-12 rounded-2xl bg-emerald-500"/>
                                       <div className="h-4 w-32 bg-neutral-900 rounded-full"/>
                                       <div className="h-2 w-full bg-neutral-100 rounded-full"/>
                                       <div className="h-2 w-2/3 bg-neutral-100 rounded-full"/>
                                       <div className="grid grid-cols-2 gap-2 mt-8">
                                          <div className="aspect-square bg-neutral-50 rounded-2xl border border-neutral-100"/>
                                          <div className="aspect-square bg-neutral-50 rounded-2xl border border-neutral-100"/>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </motion.div>

                        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.2}} className="col-span-12 lg:col-span-4 space-y-6">
                           <div className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                              <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-6">Active Tokens</h3>
                              <div className="space-y-4">
                                 {[
                                    {label: "Primary", color: "bg-emerald-500", hex: "#10B981"},
                                    {label: "Surface", color: "bg-white border border-neutral-200", hex: "#FFFFFF"},
                                    {label: "Ink", color: "bg-neutral-900", hex: "#171717"}
                                 ].map(t => (
                                    <div key={t.label} className="flex items-center justify-between">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-xl ${t.color}`}/>
                                          <span className="text-[11px] font-bold text-neutral-600">{t.label}</span>
                                       </div>
                                       <span className="text-[10px] font-mono text-neutral-300">{t.hex}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                           <div className="bg-emerald-500 rounded-3xl p-8 text-white">
                              <h3 className="text-xs font-black uppercase tracking-widest mb-2">Stylist Agent</h3>
                              <p className="text-[11px] font-medium leading-relaxed opacity-80">Injecting Framer Motion variants into Bento layout. CLS is zero. Mobile-first scaling enforced.</p>
                           </div>
                        </motion.div>
                     </div>
                   </>
                 )}
                 
                 {state.currentPhase === 5 && (
                   <>
                     <header className="flex items-end justify-between">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Phase 05 // Logic Hardening</div>
                           <h2 className="text-4xl font-black tracking-tighter text-neutral-900 uppercase leading-none">Security Auditor</h2>
                        </div>
                        <button onClick={() => {
                             dispatch({type: "PUSH_LOG", p: {agent: "AUDITOR", msg: "Vulnerability scan complete. 0 Critical issues.", ts: Date.now()}});
                             setTimeout(() => dispatch({type: "SIGN_OFF"}), 800);
                          }} className="px-10 py-4 bg-red-600 text-white rounded-3xl font-black text-[12px] tracking-widest uppercase hover:bg-neutral-900 transition-all shadow-xl shadow-red-100">Verify & Seal Audit →</button>
                     </header>

                     <div className="grid grid-cols-12 gap-6">
                        <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} className="col-span-12 lg:col-span-8 bg-white border border-neutral-100 rounded-3xl p-10 shadow-sm relative overflow-hidden">
                           <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                                 <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Sentinel Deep-Scan Terminal</span>
                              </div>
                              <span className="text-[9px] font-mono text-neutral-300">SEC-OS v9.4.1</span>
                           </div>

                           <div className="space-y-4 font-mono text-[11px] leading-relaxed">
                              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                 <div className="text-emerald-600 font-bold mb-1">&#8250; [PASS] SQL INJECTION TEST</div>
                                 <div className="text-neutral-400">Prisma Client parameterized queries verified. No raw templates detected.</div>
                              </div>
                              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                 <div className="text-emerald-600 font-bold mb-1">&#8250; [PASS] XSS SANITIZATION</div>
                                 <div className="text-neutral-400">Next.js 15 auto-escaping confirmed. dangerouslySetInnerHTML not found.</div>
                              </div>
                              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                                 <div className="text-amber-500 font-bold mb-1">&#8250; [WARN] DEPENDENCY AUDIT</div>
                                 <div className="text-neutral-400">2 minor vulnerabilities in 'lucide-react'. Patching via resolutions...</div>
                              </div>
                           </div>

                           <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between">
                              <div className="flex gap-4">
                                 <div className="text-center">
                                    <div className="text-xl font-black text-neutral-900">0</div>
                                    <div className="text-[9px] font-bold text-neutral-300 uppercase">Critical</div>
                                 </div>
                                 <div className="text-center">
                                    <div className="text-xl font-black text-neutral-900">1</div>
                                    <div className="text-[9px] font-bold text-neutral-300 uppercase">Moderate</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Status: Ready</div>
                              </div>
                           </div>
                        </motion.div>

                        <div className="col-span-12 lg:col-span-4 space-y-6">
                           <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="bg-neutral-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                              <div className="relative z-10">
                                 <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Final Safety Grade</h3>
                                 <div className="text-6xl font-black leading-none italic tracking-tighter">A+</div>
                                 <p className="text-[10px] opacity-40 mt-4 leading-relaxed italic">Architect Sentinel has verified 142 logic nodes. Encryption-at-rest is operational.</p>
                              </div>
                              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"/>
                           </motion.div>

                           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                              <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-6">Hardening Checklist</h3>
                              <div className="space-y-3">
                                 {["CSP Gating", "CORS Origin Lock", "JWT Rotation", "Rate Limiter (1k)"].map(check => (
                                    <div key={check} className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 border border-neutral-50">
                                       <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white">&#10003;</div>
                                       <span className="text-[11px] font-bold text-neutral-700 tracking-tight">{check}</span>
                                    </div>
                                 ))}
                              </div>
                           </motion.div>
                        </div>
                     </div>
                   </>
                 )}
                 
                 {state.currentPhase === 6 && (
                   <>
                     <header className="flex items-end justify-between">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Phase 06 // Tunneling & Exposure</div>
                           <h2 className="text-4xl font-black tracking-tighter text-neutral-900 uppercase leading-none">Cloudflare Tunnel</h2>
                        </div>
                        <button onClick={() => {
                             dispatch({type: "PUSH_LOG", p: {agent: "NET_OPS", msg: "Tunnel established. Public edge active.", ts: Date.now()}});
                             setTimeout(() => dispatch({type: "SIGN_OFF"}), 800);
                          }} className="px-10 py-4 bg-emerald-500 text-white rounded-3xl font-black text-[12px] tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-emerald-100">Confirm Public Link →</button>
                     </header>

                     <div className="grid grid-cols-12 gap-6">
                        <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} className="col-span-12 lg:col-span-8 bg-white border border-neutral-100 rounded-3xl p-10 shadow-sm relative overflow-hidden">
                           <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                                 <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Cloudflared CLI Terminal</span>
                              </div>
                              <span className="text-[9px] font-mono text-neutral-300">tunnel-v2.11.0</span>
                           </div>

                           <div className="bg-neutral-900 rounded-3xl p-6 font-mono text-[11px] text-emerald-400 border border-neutral-800 leading-relaxed shadow-2xl">
                              <div>$ cloudflared tunnel --url http://localhost:3000</div>
                              <div className="mt-2 text-white">2026-03-07T18:42:01Z INF +-------------------------------------------------------+</div>
                              <div className="text-white">2026-03-07T18:42:01Z INF | <span className="text-emerald-400 font-bold">Your public URL: https://architect-os-temp.trycloudflare.com</span> |</div>
                              <div className="text-white">2026-03-07T18:42:01Z INF +-------------------------------------------------------+</div>
                              <div className="mt-2 opacity-50 text-white italic">&#8250; Redirecting traffic to local dev server...</div>
                           </div>

                           <div className="mt-8 grid grid-cols-3 gap-4">
                              {['Encryption', 'Auto-HTTPS', 'Global Edge'].map(feature => (
                                 <div key={feature} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-50 flex flex-col items-center">
                                    <span className="text-[10px] font-black text-emerald-500 mb-1">&#10003;</span>
                                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{feature}</span>
                                 </div>
                              ))}
                           </div>
                        </motion.div>

                        <div className="col-span-12 lg:col-span-4 space-y-6">
                           <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                              <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-6">Traffic Analytics</h3>
                              <div className="space-y-4">
                                 <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                                    <div className="text-[10px] font-bold text-neutral-400 uppercase">Latency (Edge)</div>
                                    <div className="text-xl font-black text-neutral-900 italic">22ms</div>
                                 </div>
                                 <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase">Requests</div>
                                    <div className="text-xl font-black text-emerald-900">1,244 <span className="text-xs font-normal opacity-50">/hr</span></div>
                                 </div>
                              </div>
                           </motion.div>

                           <div className="bg-orange-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                              <div className="relative z-10">
                                 <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Argo Smart Routing</h3>
                                 <div className="text-2xl font-black leading-tight tracking-tighter">Live Preview Path</div>
                                 <p className="text-[10px] opacity-60 mt-4 leading-relaxed font-mono">Status: Routing via PHL-Edge-Node-01</p>
                              </div>
                              <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"/>
                           </div>
                        </div>
                     </div>
                   </>
                 )}

                 {state.currentPhase === 7 && (
                   <>
                     <header className="flex items-end justify-between">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase">Phase 07 // Marketing Logic</div>
                           <h2 className="text-4xl font-black tracking-tighter text-neutral-900 uppercase leading-none">Growth Engine</h2>
                        </div>
                        <button onClick={() => {
                             dispatch({type: "PUSH_LOG", p: {agent: "GROWTH", msg: "SEO Engine active. Distribution matrix locked.", ts: Date.now()}});
                             setTimeout(() => dispatch({type: "SIGN_OFF"}), 800);
                          }} className="px-10 py-4 bg-emerald-500 text-white rounded-3xl font-black text-[12px] tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-emerald-100">Activate Growth Flow →</button>
                     </header>

                     <div className="grid grid-cols-12 gap-6">
                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="col-span-12 lg:col-span-8 bg-white border border-neutral-100 rounded-3xl p-10 shadow-sm">
                           <div className="flex items-center justify-between mb-8">
                              <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">SEO Content Engine</span>
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                 <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Keywords Synced</span>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-50">
                                 <h4 className="text-[10px] font-black text-neutral-400 uppercase mb-4">Meta-Tag Generator</h4>
                                 <div className="font-mono text-[11px] text-neutral-500 space-y-1">
                                    <div className="text-emerald-600">{"<title>"}<span className="text-neutral-900">Agile Architect | High-Perf SaaS</span>{"</title>"}</div>
                                    <div className="text-emerald-600">{"<meta "}<span className="text-neutral-900">name="description"</span>{" ... />"}</div>
                                    <div className="text-emerald-600">{"<meta "}<span className="text-neutral-900">property="og:image"</span>{" ... />"}</div>
                                 </div>
                              </div>
                              <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-50">
                                 <h4 className="text-[10px] font-black text-neutral-400 uppercase mb-4">Sitemap Indexing</h4>
                                 <div className="flex flex-col gap-2">
                                    {['/blog/how-to-scale', '/vs/competitor-a', '/pricing'].map(url => (
                                       <div key={url} className="flex justify-between items-center text-[10px] font-mono">
                                          <span className="text-neutral-400">{url}</span>
                                          <span className="text-emerald-500 font-bold">INDEXED</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="bg-neutral-900 rounded-3xl p-6 text-white font-mono text-[11px]">
                              <div className="flex justify-between mb-2">
                                 <span className="text-emerald-500 font-bold tracking-tighter italic">Growth_Hook.ts</span>
                                 <span className="opacity-40">Auto-Generate Mode</span>
                              </div>
                              <div className="text-emerald-400">{"export function generateSocialCopy(niche: string) {"}</div>
                              <div className="pl-4 opacity-70">{"return openai.chat.completions.create({ ... });"}</div>
                              <div className="text-emerald-400">{"}"}</div>
                           </div>
                        </motion.div>

                        <div className="col-span-12 lg:col-span-4 space-y-6">
                           <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="bg-white border border-neutral-100 rounded-3xl p-8 shadow-sm">
                              <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-6">Distribution Matrix</h3>
                              <div className="space-y-4">
                                 {[
                                    { platform: "X / TWITTER", reach: "8.4k", color: "bg-blue-500" },
                                    { platform: "LINKEDIN", reach: "2.1k", color: "bg-blue-700" },
                                    { platform: "REDDIT", reach: "1.2k", color: "bg-orange-500" }
                                 ].map(site => (
                                    <div key={site.platform} className="flex items-center justify-between">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${site.color}`} />
                                          <span className="text-[10px] font-black text-neutral-900 tracking-tighter">{site.platform}</span>
                                       </div>
                                       <span className="text-[11px] font-mono text-neutral-400">{site.reach}</span>
                                    </div>
                                 ))}
                              </div>
                           </motion.div>

                           <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                              <div className="relative z-10">
                                 <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Conversion Opt</h3>
                                 <div className="text-3xl font-black leading-none tracking-tighter">Growth V2</div>
                                 <p className="text-[10px] opacity-80 mt-4 leading-relaxed font-medium">Automatic generation of competitor displacement pages (/vs/ competitors) active.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                   </>
                 )}

                 {state.currentPhase === 8 && (
                   <>
                     <header className="flex items-end justify-between mb-8">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black text-emerald-500 tracking-[0.4em] uppercase animate-pulse">Phase 08 // Final Dominion</div>
                           <h2 className="text-5xl font-black tracking-tighter text-neutral-900 uppercase leading-none">SEO Mastery</h2>
                        </div>
                        <button onClick={() => dispatch({ type: "PUSH_LOG", p: { agent: "SYSTEM", msg: "8-Phase Lifecycle Complete. Scaling Mode Active.", ts: Date.now() }})} className="px-8 py-3 bg-neutral-900 text-white rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-emerald-500 transition-all shadow-xl">
                           Final Sign-Off & Scale →
                        </button>
                     </header>

                     <div className="grid grid-cols-12 gap-6 h-full">
                        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                           <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm flex-1 flex flex-col relative overflow-hidden">
                              <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Competitive Displacement Matrix</h3>
                                 <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-neutral-100 rounded-md text-[9px] font-mono text-neutral-500">JSON-LD: ACTIVE</span>
                                    <span className="px-2 py-1 bg-emerald-100 rounded-md text-[9px] font-mono text-emerald-600">INDEXING: AUTO</span>
                                 </div>
                              </div>

                              <div className="bg-neutral-50 p-4 rounded-2xl mb-6 border border-neutral-100">
                                 <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">Target Competitor</label>
                                 <div className="flex gap-3">
                                    <input 
                                       value={competitorInput}
                                       onChange={(e) => setCompetitorInput(e.target.value)}
                                       placeholder="e.g. Jira, Linear, Asana"
                                       className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all"
                                       onKeyDown={(e) => e.key === 'Enter' && handleGenerateVs()}
                                    />
                                    <button 
                                       onClick={handleGenerateVs}
                                       disabled={!competitorInput.trim() || isGeneratingVs}
                                       className="bg-neutral-900 text-white px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                       {isGeneratingVs ? <Loader2 size={14} className="animate-spin"/> : "Deploy /VS/ Page"}
                                    </button>
                                 </div>
                              </div>

                              <div className="flex-1 overflow-hidden flex flex-col">
                                 <div className="grid grid-cols-4 border-b border-neutral-100 pb-2 mb-2">
                                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Target Keyword</div>
                                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-right">Vol</div>
                                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-right">KD%</div>
                                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-right">Status</div>
                                 </div>
                                 <div className="overflow-y-auto pr-2 space-y-1">
                                    {state.vsPages.map((page, i) => (
                                       <motion.div 
                                          key={page}
                                          initial={{opacity:0, x:-10}}
                                          animate={{opacity:1, x:0}}
                                          transition={{delay:i*0.05}}
                                          className="grid grid-cols-4 items-center py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors px-2 rounded-lg"
                                       >
                                          <div className="text-[11px] font-bold text-neutral-700 truncate">{page}</div>
                                          <div className="text-[11px] font-mono text-neutral-500 text-right">2.4k</div>
                                          <div className="text-[11px] font-mono text-neutral-500 text-right">45%</div>
                                          <div className="flex justify-end">
                                             <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"/>
                                                RANK #1
                                             </span>
                                          </div>
                                       </motion.div>
                                    ))}
                                 </div>
                              </div>
                           </motion.div>
                        </div>

                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                           <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="bg-neutral-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                              <div className="relative z-10">
                                 <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">SERP Visibility</h3>
                                 <div className="flex items-end gap-2 mb-2">
                                    <span className="text-6xl font-black tracking-tighter">94</span>
                                    <span className="text-2xl font-bold text-emerald-500 mb-1">%</span>
                                 </div>
                                 <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[200px]">Dominant impression share across all high-intent transactional keywords.</p>
                                 
                                 <div className="mt-8 space-y-3">
                                    <div className="flex justify-between items-center text-[10px]">
                                       <span className="text-neutral-400">Avg. Position</span>
                                       <span className="font-mono font-bold text-emerald-400">1.2</span>
                                    </div>
                                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-emerald-500 w-11/12"/>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-[10px] pt-2">
                                       <span className="text-neutral-400">CTR</span>
                                       <span className="font-mono font-bold text-emerald-400">32.8%</span>
                                    </div>
                                    <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-emerald-500 w-2/3"/>
                                    </div>
                                 </div>
                              </div>
                              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"/>
                           </motion.div>

                           <div className="bg-white border border-neutral-200 rounded-3xl p-8 flex-1 shadow-sm">
                              <h3 className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-4">Technical Health</h3>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-neutral-50 rounded-2xl text-center">
                                    <div className="text-xl font-black text-neutral-900 mb-1">100</div>
                                    <div className="text-[9px] font-bold text-neutral-400 uppercase">Lighthouse</div>
                                 </div>
                                 <div className="p-4 bg-neutral-50 rounded-2xl text-center">
                                    <div className="text-xl font-black text-neutral-900 mb-1">0.0s</div>
                                    <div className="text-[9px] font-bold text-neutral-400 uppercase">CLS</div>
                                 </div>
                              </div>
                              <div className="mt-6 p-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl">
                                 <div className="flex gap-3 items-start">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"/>
                                    <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                                       Core Web Vitals passed. Mobile usability score at max. Schema markup validated.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   </>
                 )}

                 {state.currentPhase === 9 && (
                   <>
                     <header className="flex items-end justify-between mb-8">
                        <div className="space-y-2">
                           <div className="text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase mb-2">Phase 09 // Global Scaling</div>
                           <h2 className="text-5xl font-black text-neutral-900 tracking-tighter uppercase italic leading-none">Marketing Penetration</h2>
                        </div>
                        <button onClick={() => dispatch({ type: "SIGN_OFF" })} className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-black transition-all shadow-xl">Initialize Viral Loop →</button>
                     </header>

                     <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                          <div className="bg-white border border-neutral-100 rounded-3xl p-10 shadow-sm overflow-hidden">
                             <div className="flex items-center justify-between mb-10">
                                <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Viral Referral Engine</span>
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 italic">K-Factor: 1.2</span>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-50">
                                   <h4 className="text-[10px] font-black text-neutral-400 uppercase mb-4 tracking-widest">Pixel Tracking</h4>
                                   <div className="font-mono text-[10px] text-neutral-500 space-y-1">
                                      <div>{"fbq('track', "}<span className="text-emerald-600">{"'Purchase'"}</span>{");"}</div>
                                      <div>{"gtag('event', "}<span className="text-emerald-600">{"'conversion'"}</span>{");"}</div>
                                      <div className="mt-2 text-neutral-300 italic">// Attribution: 7-day click</div>
                                   </div>
                                </div>
                                <div className="p-6 rounded-3xl bg-neutral-50 border border-neutral-50 flex flex-col justify-center">
                                   <div className="text-[9px] font-black text-neutral-400 uppercase mb-2">Referral Credit</div>
                                   <div className="text-2xl font-black text-neutral-900 tracking-tighter italic">"GET $20 / GIVE $20"</div>
                                   <div className="mt-2 w-full h-1 bg-emerald-100 rounded-full overflow-hidden">
                                      <div className="w-2/3 h-full bg-emerald-500" />
                                   </div>
                                </div>
                             </div>

                             <div className="bg-neutral-900 rounded-3xl p-6 text-white font-mono text-[11px]">
                                <div className="flex justify-between mb-2">
                                   <span className="text-emerald-500 font-bold italic">affiliate_logic.ts</span>
                                   <span className="opacity-40 tracking-widest">v2.1</span>
                                </div>
                                <div className="text-emerald-400">{"export async function generateAffiliateLink(userId: string) {"}</div>
                                <div className="pl-4 text-white opacity-80">{"const code = hash(userId).slice(0, 8);"}</div>
                                <div className="pl-4 text-white opacity-80">{`return \`https://app.io/ref/\${code}\`;`}</div>
                                <div className="text-emerald-400">{"}"}</div>
                             </div>
                          </div>
                        </div>
                     </div>
                   </>
                 )}
              </div>
           </div>
        </main>
      </div>
      <div className="hidden md:block">
        <AgentSentinel/>
      </div>
      <AgentSentinel mobile={true}/>
    </div>
  );
}

// ─── MASTER CONTROLLER ────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("LANDING");
  const handleCta = () => { setView("LOADING"); setTimeout(()=>setView("EDITOR"), 1500); };

  return (
    <div className="bg-white text-neutral-900 selection:bg-emerald-100 min-h-screen font-sans">
      <AnimatePresence mode="wait">
        {view === "LANDING" && (
          <motion.div key="landing" exit={{opacity:0, y:-20}} className="min-h-screen">
             <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto">
               <div className="font-black text-lg tracking-tighter">AGILE ARCHITECT</div>
               <button onClick={handleCta} className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100">Start Building</button>
             </nav>
             <section className="h-screen flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto -mt-20">
                <FadeUp><h1 className="text-6xl md:text-7xl font-black mb-8 leading-none tracking-tight">Build SaaS<br/><span className="text-emerald-500">Fast & Solid.</span></h1></FadeUp>
                <FadeUp delay={0.1}><p className="text-neutral-400 text-lg md:text-xl max-w-xl mb-12 font-medium">Guide your AI through 8 hard-gated phases. Security, SEO, and Deployment included.</p></FadeUp>
                <FadeUp delay={0.2}><div className="flex flex-wrap justify-center gap-4">
                  {STATS.map(s => (
                    <div key={s.label} className="bg-white border border-neutral-100 p-6 rounded-3xl min-w-36 shadow-sm">
                      <div className="text-3xl font-black text-emerald-500 mb-1">{s.value}</div>
                      <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest">{s.label}</div>
                    </div>
                  ))}
                </div></FadeUp>
             </section>
          </motion.div>
        )}
        
        {view === "LOADING" && (
          <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-screen flex flex-col items-center justify-center bg-white">
            <motion.div animate={{rotate:360}} transition={{repeat:Infinity, duration:1, ease:"linear"}} className="text-5xl text-emerald-500 mb-6">&#9672;</motion.div>
            <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-neutral-300">Initializing OS v2.0</div>
            <div className="mt-8 w-48 h-0.5 bg-neutral-50 rounded-full overflow-hidden">
               <motion.div initial={{width:0}} animate={{width:"100%"}} transition={{duration:1.4}} className="h-full bg-emerald-500"/>
            </div>
          </motion.div>
        )}

        {view === "EDITOR" && (
           <BlueprintProvider>
              <EditorLayout />
           </BlueprintProvider>
        )}
      </AnimatePresence>
    </div>
  );
}
