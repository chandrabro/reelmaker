import {useEffect,useRef,useState} from 'react';
import {Play,Pause,SkipBack,SkipForward,Plus,Copy,Trash2,ArrowUp,ArrowDown,Music,Download,Upload,Film} from 'lucide-react';
import {Project,Scene,newProject,newScene,draw,total,THEMES,TYPES,uid} from './engine';
const KEY='reelcanvas.projects';
const load=():Project[]=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return a.length?a:[newProject()]}catch{return[newProject()]}};
export default function App(){
const [projects,setProjects]=useState<Project[]>(load);const [pid,setPid]=useState(projects[0].id);const [si,setSi]=useState(0);
const [t,setT]=useState(0);const [playing,setPlaying]=useState(false);const [vol,setVol]=useState(1);const [audioUrl,setAudioUrl]=useState('');
const [rec,setRec]=useState('');const [jsonTxt,setJsonTxt]=useState('');const [err,setErr]=useState('');
const cv=useRef<HTMLCanvasElement>(null);const au=useRef<HTMLAudioElement>(null);
const p=projects.find(x=>x.id===pid)||projects[0];const T=total(p);
const vert=p.orientation==='9:16';const W=vert?540:960,H=vert?960:540;
const sc=p.scenes[Math.min(si,p.scenes.length-1)];
useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(projects))},[projects]);
useEffect(()=>{setJsonTxt(JSON.stringify(p,null,2))},[p]);
useEffect(()=>{const c=cv.current!.getContext('2d')!;draw(c,W,H,p,t)},[p,t,W,H]);
useEffect(()=>{if(au.current)au.current.volume=vol},[vol]);
useEffect(()=>{if(!playing)return;let last=performance.now(),cur=t;let raf=0;const a=au.current;if(a&&audioUrl){a.currentTime=cur;a.play().catch(()=>{})}
const f=(n:number)=>{cur+=(n-last)/1000;last=n;if(cur>=T){cur=T-1/p.fps;setT(cur);setPlaying(false);return}setT(cur);raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f);
return()=>{cancelAnimationFrame(raf);a?.pause()}},[playing]);
const upd=(fn:(p:Project)=>Project)=>setProjects(ps=>ps.map(x=>x.id===p.id?fn(x):x));
const updScene=(fn:(s:Scene)=>Scene)=>upd(q=>({...q,scenes:q.scenes.map((s,i)=>i===si?fn(s):s)}));
const seek=(v:number)=>{const x=Math.max(0,Math.min(T-1/p.fps,v));setT(x);if(au.current)au.current.currentTime=x};
const startOf=(i:number)=>p.scenes.slice(0,i).reduce((s,x)=>s+x.duration,0);
const move=(d:number)=>{const j=si+d;if(j<0||j>=p.scenes.length)return;upd(q=>{const a=[...q.scenes];[a[si],a[j]]=[a[j],a[si]];return{...q,scenes:a}});setSi(j)};
const upload=(f?:File)=>{if(f){if(audioUrl)URL.revokeObjectURL(audioUrl);setAudioUrl(URL.createObjectURL(f))}};
const download=(name:string,blob:Blob)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()};
const render=async()=>{setPlaying(false);const c=cv.current!;const ctx=c.getContext('2d')!;const stream=c.captureStream(p.fps);
if(au.current&&audioUrl){try{const as=(au.current as any).captureStream();as.getAudioTracks().forEach((k:MediaStreamTrack)=>stream.addTrack(k));au.current.currentTime=0;au.current.play()}catch{}}
const mime=['video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
const mr=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6e6});const chunks:Blob[]=[];mr.ondataavailable=e=>chunks.push(e.data);
const done=new Promise<void>(r=>mr.onstop=()=>r());mr.start();const t0=performance.now();
await new Promise<void>(res=>{const f=()=>{const e=(performance.now()-t0)/1000;if(e>=T){res();return}draw(ctx,W,H,p,e);setRec(`Rendering ${Math.round(e/T*100)}%`);requestAnimationFrame(f)};f()});
mr.stop();au.current?.pause();await done;setRec('');download(`${p.name}.${mime.includes('mp4')?'mp4':'webm'}`,new Blob(chunks,{type:mime}))};
const importJson=(s:string)=>{try{const o=JSON.parse(s);if(!o.scenes)throw new Error('Missing scenes[]');const q={...newProject(),...o,id:uid()};setProjects(ps=>[...ps,q]);setPid(q.id);setSi(0);setT(0);setErr('')}catch(e:any){setErr(e.message)}};
const F=(l:string,c:any)=><label className="block text-xs text-zinc-400 mb-2">{l}{c}</label>;
return <div className="min-h-screen grid lg:grid-cols-[320px_1fr_360px] gap-3 p-3">
<aside className="space-y-3 overflow-y-auto">
<div className="flex items-center gap-2 font-bold"><Film size={18}/>ReelCanvas Studio</div>
<div className="bg-zinc-900 rounded p-3">
<div className="flex gap-1 mb-2"><select className="in" value={p.id} onChange={e=>{setPid(e.target.value);setSi(0);setT(0)}}>{projects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
<button className="btn" onClick={()=>{const q=newProject();setProjects([...projects,q]);setPid(q.id);setSi(0)}}><Plus size={14}/></button>
<button className="btn" onClick={()=>{if(projects.length>1){setProjects(projects.filter(x=>x.id!==p.id));setPid(projects.find(x=>x.id!==p.id)!.id)}}}><Trash2 size={14}/></button></div>
{F('Name',<input className="in" value={p.name} onChange={e=>upd(q=>({...q,name:e.target.value}))}/>)}
<div className="flex gap-1 mb-2">{(['9:16','16:9'] as const).map(o=><button key={o} className={'btn flex-1 justify-center '+(p.orientation===o?'!bg-emerald-600':'')} onClick={()=>upd(q=>({...q,orientation:o}))}>{o}</button>)}</div>
<div className="grid grid-cols-2 gap-2">{F('FPS',<input type="number" className="in" value={p.fps} onChange={e=>upd(q=>({...q,fps:+e.target.value||30}))}/>)}
{F('Watermark',<input type="checkbox" className="block mt-2" checked={p.watermark} onChange={e=>upd(q=>({...q,watermark:e.target.checked}))}/>)}</div>
{F('Brand',<input className="in" value={p.brand} onChange={e=>upd(q=>({...q,brand:e.target.value}))}/>)}
{F('Handle',<input className="in" value={p.handle} onChange={e=>upd(q=>({...q,handle:e.target.value}))}/>)}</div>
<div className="bg-zinc-900 rounded p-3"><div className="text-sm font-semibold mb-2 flex items-center gap-1"><Music size={14}/>Audio</div>
<input type="file" accept=".mp3,.wav,.aac,audio/*" className="text-xs" onChange={e=>upload(e.target.files?.[0])}/>
{audioUrl&&<><audio ref={au} src={audioUrl}/><input type="range" min={0} max={1} step={.05} value={vol} onChange={e=>setVol(+e.target.value)} className="w-full"/><button className="btn" onClick={()=>setAudioUrl('')}><Trash2 size={14}/>Remove</button></>}</div>
<div className="bg-zinc-900 rounded p-3"><div className="flex justify-between mb-2"><span className="text-sm font-semibold">Scenes</span><button className="btn" onClick={()=>{upd(q=>({...q,scenes:[...q.scenes,newScene()]}));setSi(p.scenes.length)}}><Plus size={14}/></button></div>
{p.scenes.map((s,i)=><div key={s.id} onClick={()=>{setSi(i);seek(startOf(i))}} className={'text-xs p-2 rounded mb-1 cursor-pointer '+(i===si?'bg-emerald-700':'bg-zinc-800')}>{i+1}. {s.icon} {s.headline.replace(/\[\[|\]\]/g,'').slice(0,24)} · {s.duration}s</div>)}
<div className="flex gap-1 mt-2"><button className="btn" onClick={()=>move(-1)}><ArrowUp size={14}/></button><button className="btn" onClick={()=>move(1)}><ArrowDown size={14}/></button>
<button className="btn" onClick={()=>{upd(q=>{const a=[...q.scenes];a.splice(si+1,0,{...JSON.parse(JSON.stringify(sc)),id:uid()});return{...q,scenes:a}});setSi(si+1)}}><Copy size={14}/></button>
<button className="btn" onClick={()=>{if(p.scenes.length>1){upd(q=>({...q,scenes:q.scenes.filter((_,i)=>i!==si)}));setSi(0)}}}><Trash2 size={14}/></button></div></div>
</aside>
<main className="flex flex-col items-center gap-3">
<div className="bg-black rounded-2xl p-2" style={{height:vert?'72vh':'auto',width:vert?'auto':'100%',maxWidth:vert?undefined:900,aspectRatio:`${W}/${H}`}}><canvas ref={cv} width={W} height={H} className="w-full h-full rounded-xl"/></div>
<div className="w-full max-w-[900px] flex items-center gap-2">
<button className="btn" onClick={()=>seek(t-1/p.fps)}><SkipBack size={14}/></button>
<button className="btn" onClick={()=>setPlaying(!playing)}>{playing?<Pause size={14}/>:<Play size={14}/>}</button>
<button className="btn" onClick={()=>seek(t+1/p.fps)}><SkipForward size={14}/></button>
<input type="range" className="flex-1" min={0} max={T} step={1/p.fps} value={t} onChange={e=>{setPlaying(false);seek(+e.target.value)}}/>
<span className="text-xs w-24">{t.toFixed(2)}/{T}s · f{Math.round(t*p.fps)}</span>
<button className="btn !bg-emerald-600" disabled={!!rec} onClick={render}><Download size={14}/>{rec||'Render & Download'}</button></div>
</main>
<aside className="space-y-3 overflow-y-auto max-h-screen">
{sc&&<div className="bg-zinc-900 rounded p-3"><div className="text-sm font-semibold mb-2">Scene {si+1}</div>
<div className="grid grid-cols-2 gap-2">{F('Duration (s)',<input type="number" min={1} step={.5} className="in" value={sc.duration} onChange={e=>updScene(s=>({...s,duration:+e.target.value||1}))}/>)}
{F('Theme',<select className="in" value={sc.theme} onChange={e=>updScene(s=>({...s,theme:e.target.value}))}>{Object.keys(THEMES).map(k=><option key={k}>{k}</option>)}</select>)}
{F('Chip',<input className="in" value={sc.chip} onChange={e=>updScene(s=>({...s,chip:e.target.value}))}/>)}
{F('Icon',<input className="in" value={sc.icon} onChange={e=>updScene(s=>({...s,icon:e.target.value}))}/>)}</div>
{F('Headline  ( [[highlight]] )',<input className="in" value={sc.headline} onChange={e=>updScene(s=>({...s,headline:e.target.value}))}/>)}
{F('Component',<select className="in" value={sc.type} onChange={e=>updScene(s=>({...s,type:e.target.value}))}>{TYPES.map(k=><option key={k}>{k}</option>)}</select>)}
<div className="flex justify-between items-center my-2"><span className="text-xs font-semibold">Items & timings</span>
<span className="flex gap-1"><button className="btn" title="Stagger every 1s" onClick={()=>updScene(s=>({...s,items:s.items.map((it,i)=>({...it,start:+(.5+i*1).toFixed(2)}))}))}>Stagger</button>
<button className="btn" onClick={()=>updScene(s=>({...s,items:[...s.items,{text:'New item',start:+(s.items.length*1+.5),dur:.5}]}))}><Plus size={14}/></button></span></div>
{sc.items.map((it,i)=><div key={i} className="bg-zinc-800 rounded p-2 mb-2 space-y-1">
<input className="in" value={it.text} onChange={e=>updScene(s=>({...s,items:s.items.map((x,j)=>j===i?{...x,text:e.target.value}:x)}))}/>
<input className="in" placeholder="sub text" value={it.sub||''} onChange={e=>updScene(s=>({...s,items:s.items.map((x,j)=>j===i?{...x,sub:e.target.value}:x)}))}/>
<div className="flex gap-1 items-center text-xs">start<input type="number" step=".1" className="in" value={it.start} onChange={e=>updScene(s=>({...s,items:s.items.map((x,j)=>j===i?{...x,start:+e.target.value}:x)}))}/>dur<input type="number" step=".1" className="in" value={it.dur} onChange={e=>updScene(s=>({...s,items:s.items.map((x,j)=>j===i?{...x,dur:+e.target.value}:x)}))}/>
<button className="btn" onClick={()=>updScene(s=>({...s,items:s.items.filter((_,j)=>j!==i)}))}><Trash2 size={12}/></button></div></div>)}</div>}
<div className="bg-zinc-900 rounded p-3"><div className="flex justify-between mb-2"><span className="text-sm font-semibold">JSON</span>
<span className="flex gap-1"><button className="btn" onClick={()=>download(p.name+'.json',new Blob([jsonTxt],{type:'application/json'}))}><Download size={14}/></button>
<button className="btn" onClick={()=>importJson(jsonTxt)}><Upload size={14}/>Import</button></span></div>
<textarea className="in font-mono h-64 text-xs" value={jsonTxt} onChange={e=>setJsonTxt(e.target.value)}/>{err&&<p className="text-red-400 text-xs">{err}</p>}</div>
</aside></div>}
