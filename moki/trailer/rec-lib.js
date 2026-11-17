// Gemeinsame Helfer fuer die Aufnahmen (Moki-Seite und Studio): Cursor, Einblendungen, zeitgesteuerte Schritte.
const OVERLAY=function(){
  addEventListener('DOMContentLoaded',()=>{
   const K=Math.max(.5,innerWidth/1920);const st=document.createElement('style');st.textContent=`
   #mk-cur{position:fixed;left:0;top:0;width:${34*K}px;height:${41*K}px;z-index:2147483600;pointer-events:none;filter:drop-shadow(0 2px 3px #0008)}
   .mk-rip{position:fixed;z-index:2147483599;pointer-events:none;border:${4*K}px solid #00e5a8;border-radius:50%;width:${24*K}px;height:${24*K}px;margin:-${12*K}px 0 0 -${12*K}px;animation:mkr .5s ease-out forwards}
   @keyframes mkr{to{transform:scale(4.2);opacity:0}}
   #mk-cap{position:fixed;left:50%;bottom:${44*K}px;z-index:2147483598;pointer-events:none;transform:translateX(-50%) scale(.6);opacity:0;transition:transform .35s cubic-bezier(.3,1.6,.5,1),opacity .2s;min-width:${760*K}px;text-align:center;padding:${22*K}px ${52*K}px ${26*K}px;border-radius:${34*K}px;background:rgba(10,13,43,.96);box-shadow:0 0 0 ${6*K}px #00e5a8,0 ${18*K}px ${50*K}px #000a;font-family:Inter,"Segoe UI",sans-serif}
   #mk-cap.on{opacity:1;transform:translateX(-50%) scale(1)}
   #mk-cap b{display:block;font-size:${56*K}px;font-weight:900;color:#fff;letter-spacing:.5px}#mk-cap span{display:block;font-size:${25*K}px;color:#a3abe0;margin-top:${8*K}px;font-weight:500}`;
   document.head.appendChild(st);if(window.__ZOOM)document.body.style.zoom=window.__ZOOM;
   const c=document.createElement('div');c.id='mk-cur';c.innerHTML=`<svg viewBox="0 0 20 31" width="${34*K}" height="${41*K}"><path d="M1 1v25l7-6 5 10 4-2-5-10h9z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>`;document.documentElement.appendChild(c);
   const cap=document.createElement('div');cap.id='mk-cap';document.documentElement.appendChild(cap);
   window.__mx=1100*K;window.__my=520*K;c.style.transform=`translate(${1100*K}px,${520*K}px)`;
   addEventListener('mousemove',e=>{window.__mx=e.clientX;window.__my=e.clientY;c.style.transform=`translate(${e.clientX}px,${e.clientY}px)`},true);
   addEventListener('mousedown',e=>{const r=document.createElement('div');r.className='mk-rip';r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.documentElement.appendChild(r);setTimeout(()=>r.remove(),550)},true);
   window.__cap=(t,s,ms,top)=>{clearTimeout(window.__ct);cap.style.bottom=top?'auto':(44*K)+'px';cap.style.top=top?(20*K)+'px':'auto';cap.innerHTML='<b>'+t+'</b><span>'+s+'</span>';cap.classList.add('on');window.__ct=setTimeout(()=>cap.classList.remove('on'),ms)};
  });
};
function driver(p){
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let t0=Date.now();
  const now=()=>(Date.now()-t0)/1000;
  const eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  const log=[];
  async function at(t,fn,name){const w=t-now();if(w>0)await sleep(w*1000);const s0=now();try{await fn()}catch(e){console.log('FEHLER',name||t,e.message.split('\n')[0])}log.push([name||t,t,s0,now()])}
  async function mv(x,y,dur=700){const sx=await p.evaluate(()=>window.__mx),sy=await p.evaluate(()=>window.__my);const t1=Date.now();
    for(;;){const u=Math.min(1,(Date.now()-t1)/dur),e=eio(u);await p.mouse.move(sx+(x-sx)*e,sy+(y-sy)*e);if(u>=1)break}}
  async function mvEl(sel,dur=700,dx=0,dy=0,nth=0,noScroll){const l=p.locator(sel).nth(nth);if(!noScroll)await l.scrollIntoViewIfNeeded().catch(()=>{});const bb=await l.boundingBox();await mv(bb.x+bb.width/2+dx,bb.y+bb.height/2+dy,dur);return l}
  async function clk(sel,dur=700,nth=0,noScroll){await mvEl(sel,dur,0,0,nth,noScroll);await sleep(80);await p.mouse.down();await sleep(60);await p.mouse.up()}
  const cap=(t,s,ms=2600,top)=>p.evaluate(([t,s,ms,top])=>window.__cap(t,s,ms,top),[t,s,ms,top]);
  async function smoothScroll(sel,from,to,dur){const t1=Date.now();for(;;){const u=Math.min(1,(Date.now()-t1)/dur),e=eio(u);await p.evaluate(([sel,y])=>{(sel?document.querySelector(sel):document.scrollingElement).scrollTop=y},[sel,from+(to-from)*e]);if(u>=1)break;await sleep(10)}}
  return {sleep,now,at,mv,mvEl,clk,cap,smoothScroll,reset:()=>{t0=Date.now()},log};
}
module.exports={OVERLAY,driver};
