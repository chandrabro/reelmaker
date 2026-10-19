export type Item={text:string;sub?:string;start:number;dur:number};
export type Scene={id:string;duration:number;theme:string;chip:string;icon:string;headline:string;type:string;items:Item[]};
export type Project={id:string;name:string;orientation:'9:16'|'16:9';fps:number;brand:string;handle:string;watermark:boolean;scenes:Scene[]};
export const TYPES=['bubble','cards','compare','checklist','equation'];
export const THEMES:Record<string,any>={
dark:{a:'#1b2b22',b:'#0a110d',fg:'#fff',hl:'#f5b942',card:'#fff',cf:'#222'},
cream:{a:'#fbf1e6',b:'#e9efe4',fg:'#1f1f1f',hl:'#e8751a',card:'#fff',cf:'#222'},
green:{a:'#e4f3e6',b:'#c9e6cf',fg:'#17301f',hl:'#2f8f3e',card:'#fff',cf:'#17301f'},
orange:{a:'#ffb36b',b:'#f07a2a',fg:'#fff',hl:'#fff1b8',card:'#fff',cf:'#3a1d08'}};
export const uid=()=>Math.random().toString(36).slice(2,9);
export const newScene=():Scene=>({id:uid(),duration:6,theme:'cream',chip:'Rewind',icon:'⏪',headline:'७ बजे: [[chopping board]] मा',type:'cards',
items:[{text:'बिहान ७ बजे',sub:'',start:0.5,dur:0.5},{text:'माछा काटियो',sub:'',start:1.5,dur:0.5}]});
export const newProject=():Project=>({id:uid(),name:'Untitled project',orientation:'9:16',fps:30,brand:'Food Shield Nepal',handle:'@food.shield.nepal',watermark:true,scenes:[newScene()]});
export const total=(p:Project)=>p.scenes.reduce((s,x)=>s+x.duration,0);
const cl=(v:number)=>Math.max(0,Math.min(1,v));
const eo=(x:number)=>1-Math.pow(1-x,3);
function rr(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){c.beginPath();c.roundRect(x,y,w,h,r)}
function words(s:string){const o:{w:string;h:boolean}[]=[];let h=false;for(const part of s.split(/(\[\[|\]\])/)){if(part==='[[')h=true;else if(part===']]')h=false;else part.split(/\s+/).filter(Boolean).forEach(w=>o.push({w,h}))}return o}
function pill(c:CanvasRenderingContext2D,cx:number,y:number,txt:string,fs:number,th:any){c.font=`700 ${fs}px system-ui,'Noto Sans Devanagari',sans-serif`;const w=c.measureText(txt).width+fs*1.8,h=fs*2;c.save();c.shadowColor='#0003';c.shadowBlur=12;c.fillStyle='#fff';rr(c,cx-w/2,y,w,h,h/2);c.fill();c.restore();c.fillStyle='#222';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,cx,y+h/2)}
export function draw(c:CanvasRenderingContext2D,W:number,H:number,p:Project,t:number){
c.clearRect(0,0,W,H);let acc=0,sc=p.scenes[p.scenes.length-1],lt=t;
for(const s of p.scenes){if(t<acc+s.duration||s===p.scenes[p.scenes.length-1]){sc=s;lt=t-acc;break}acc+=s.duration}
if(!sc)return;const th=THEMES[sc.theme]||THEMES.cream,u=W/540;
const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,th.a);g.addColorStop(1,th.b);c.fillStyle=g;c.fillRect(0,0,W,H);
const fam=`system-ui,'Noto Sans Devanagari',sans-serif`;
pill(c,W/2,H*.03,`${p.brand}`,13*u,th);
pill(c,W/2,H*.03+34*u,`${sc.icon} ${sc.chip}`,14*u,th);
// headline
const fs=(p.orientation==='9:16'?34:30)*u;c.font=`800 ${fs}px ${fam}`;c.textAlign='left';c.textBaseline='alphabetic';
const ws=words(sc.headline),maxW=W*.86;let x=W*.07,y=H*.03+120*u;const sp=c.measureText(' ').width;const ha=eo(cl(lt/.5));c.globalAlpha=ha;
for(const w of ws){const m=c.measureText(w.w).width;if(x+m>W*.07+maxW){x=W*.07;y+=fs*1.3}c.fillStyle=w.h?th.hl:th.fg;c.fillText(w.w,x,y);x+=m+sp}
c.globalAlpha=1;
const top=y+fs*.9,bot=H*.9,ah=bot-top,its=sc.items;
const prog=(i:number)=>eo(cl((lt-its[i].start)/Math.max(.05,its[i].dur)));
const font=(f:number,wt=700)=>c.font=`${wt} ${f*u}px ${fam}`;
const card=(x:number,y:number,w:number,h:number,pr:number)=>{c.save();c.globalAlpha=pr;c.translate(0,(1-pr)*24*u);c.shadowColor='#0003';c.shadowBlur=16*u;c.fillStyle=th.card;rr(c,x,y,w,h,18*u);c.fill();c.restore();c.globalAlpha=pr;c.translate(0,(1-pr)*24*u)};
const done=()=>{c.setTransform(1,0,0,1,0,0);c.globalAlpha=1};
c.textBaseline='middle';c.textAlign='left';
if(sc.type==='bubble'){its.forEach((it,i)=>{const pr=prog(i),h=ah*.3,yy=top+i*(h+16*u);if(yy+h>bot)return;card(W*.07,yy,W*.86,h,pr);c.fillStyle=th.cf;font(13);c.fillText(it.sub||'Customer',W*.07+20*u,yy+h*.28);font(26,800);c.fillText('“'+it.text+'”',W*.07+20*u,yy+h*.64);done()})}
else if(sc.type==='cards'||sc.type==='checklist'){const n=Math.max(1,its.length),h=Math.min(70*u,(ah-(n-1)*12*u)/n);its.forEach((it,i)=>{const pr=prog(i),yy=top+i*(h+12*u);card(W*.07,yy,W*.86,h,pr);c.fillStyle=th.cf;if(sc.type==='checklist'){c.fillStyle=th.hl;c.beginPath();c.arc(W*.07+h*.5,yy+h/2,h*.25,0,7);c.fill();c.fillStyle='#fff';font(18);c.textAlign='center';c.fillText('✓',W*.07+h*.5,yy+h/2);c.textAlign='left';c.fillStyle=th.cf}font(22,700);c.fillText(it.text,W*.07+h*(sc.type==='checklist'?1:.4),yy+h/2-(it.sub?9*u:0));if(it.sub){font(14,500);c.fillText(it.sub,W*.07+h*(sc.type==='checklist'?1:.4),yy+h/2+16*u)}done()})}
else if(sc.type==='compare'){const w=W*.41,h=ah*.7;its.slice(0,2).forEach((it,i)=>{const pr=prog(i),xx=W*.07+i*(w+W*.04);card(xx,top,w,h,pr);c.fillStyle=th.cf;c.textAlign='center';font(22,800);c.fillText(it.text,xx+w/2,top+h*.4);font(15,500);c.fillText(it.sub||'',xx+w/2,top+h*.6);done()})}
else{const n=its.length;its.forEach((it,i)=>{const pr=prog(i);const sym=i===n-1&&n>1?'=':i>0?'+':'';const yy=top+i*(ah/Math.max(n,1));c.globalAlpha=pr;c.textAlign='center';c.fillStyle=th.hl;font(38,800);if(sym)c.fillText(sym,W/2,yy-4*u);c.fillStyle=th.fg;font(32,800);c.fillText(it.text,W/2,yy+36*u);c.globalAlpha=1})}
if(p.watermark){c.textAlign='left';c.textBaseline='alphabetic';c.fillStyle=th.fg;c.globalAlpha=.55;font(12,600);c.fillText(p.handle,W*.05,H*.965);c.globalAlpha=1}}
