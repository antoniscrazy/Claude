// Nimmt eine echte Sitzung im Moki Studio (studio.html) auf. Datenbank-Aufrufe (Supabase) sind gemockt.
// Aufruf: NODE_PATH=$(npm root -g) node studio-rec.js <ausgabeordner>
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1500,height:844},recordVideo:{dir:OUT,size:{width:1280,height:720}}});
 const tCreate=Date.now();const p=await ctx.newPage();
 let saved=null;const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/rest/v1/rpc/**',r=>{const fn=r.request().url().split('/rpc/')[1];const a=JSON.parse(r.request().postData()||'{}');let body=[];
  if(fn==='moki_save'){saved={id:'g1',slug:'mein-sternenspiel',title:a.p_title,icon:a.p_icon,mode:a.p_mode,status:(saved&&saved.status)||'draft',updated_at:new Date().toISOString()};body={id:'g1',slug:saved.slug}}
  else if(fn==='moki_set_published'){if(saved)saved.status=a.p_published?'published':'draft';body={slug:'mein-sternenspiel'}}
  else if(fn==='moki_my')body=saved?[saved]:[];
  r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)})});
 await p.addInitScript(()=>{
  try{localStorage.setItem('moki-studio-name','"Max"')}catch(e){}
  addEventListener('DOMContentLoaded',()=>{
   const st=document.createElement('style');st.textContent=`
   #mk-cur{position:fixed;left:0;top:0;width:28px;height:34px;z-index:99999;pointer-events:none;filter:drop-shadow(0 2px 3px #0008)}
   .mk-rip{position:fixed;z-index:99998;pointer-events:none;border:3px solid #00e5a8;border-radius:50%;width:20px;height:20px;margin:-10px 0 0 -10px;animation:mkr .45s ease-out forwards}
   @keyframes mkr{to{transform:scale(4);opacity:0}}
   #mk-cap{position:fixed;left:50%;bottom:34px;z-index:99997;pointer-events:none;transform:translateX(-50%) scale(.6);opacity:0;transition:transform .3s cubic-bezier(.3,1.6,.5,1),opacity .2s;min-width:600px;text-align:center;padding:18px 40px 20px;border-radius:28px;background:rgba(10,13,43,.96);border:5px solid transparent;background-clip:padding-box;box-shadow:0 0 0 5px #00e5a8,0 14px 40px #000a;font-family:Inter,"Segoe UI",sans-serif}
   #mk-cap.on{opacity:1;transform:translateX(-50%) scale(1)}
   #mk-cap b{display:block;font-size:44px;font-weight:900;color:#fff;letter-spacing:.5px}#mk-cap span{display:block;font-size:20px;color:#a3abe0;margin-top:6px;font-weight:500}`;
   document.head.appendChild(st);
   const c=document.createElement('div');c.id='mk-cur';c.innerHTML='<svg viewBox="0 0 20 31" width="28" height="34"><path d="M1 1v25l7-6 5 10 4-2-5-10h9z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>';document.body.appendChild(c);
   const cap=document.createElement('div');cap.id='mk-cap';document.body.appendChild(cap);
   window.__mx=1100;window.__my=520;c.style.transform='translate(1100px,520px)';
   addEventListener('mousemove',e=>{window.__mx=e.clientX;window.__my=e.clientY;c.style.transform=`translate(${e.clientX}px,${e.clientY}px)`},true);
   addEventListener('mousedown',e=>{const r=document.createElement('div');r.className='mk-rip';r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),500)},true);
   window.__cap=(t,s,ms,top)=>{clearTimeout(window.__ct);cap.style.bottom=top?'auto':'34px';cap.style.top=top?'14px':'auto';cap.innerHTML='<b>'+t+'</b><span>'+s+'</span>';cap.classList.add('on');window.__ct=setTimeout(()=>cap.classList.remove('on'),ms)};
  });
 });
 await p.goto('file:///home/user/Claude/moki/studio.html');await p.waitForSelector('#d-new');await p.waitForTimeout(500);
 const t0=Date.now(),off=(t0-tCreate)/1000;
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const now=()=>(Date.now()-t0)/1000;
 const eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 async function at(t,fn,name){const w=t-now();if(w>0)await sleep(w*1000);const s0=now();try{await fn()}catch(e){console.log('FEHLER',name||t,e.message.split('\n')[0])}console.log(String(name||t).padEnd(28),'soll',t,'start',s0.toFixed(1),'ende',now().toFixed(1))}
 async function mv(x,y,dur=700){const sx=await p.evaluate(()=>window.__mx),sy=await p.evaluate(()=>window.__my);const t1=Date.now();
  for(;;){const u=Math.min(1,(Date.now()-t1)/dur),e=eio(u);await p.mouse.move(sx+(x-sx)*e,sy+(y-sy)*e);if(u>=1)break}}
 async function mvEl(sel,dur=700,dx=0,dy=0,opts){const l=opts&&opts.nth!==undefined?p.locator(sel).nth(opts.nth):p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});const bb=await l.boundingBox();await mv(bb.x+bb.width/2+dx,bb.y+bb.height/2+dy,dur);return l}
 async function clk(sel,dur=700,opts){const l=await mvEl(sel,dur,0,0,opts);await sleep(80);await p.mouse.down();await sleep(60);await p.mouse.up()}
 const cap=(t,s,ms=2600,top)=>p.evaluate(([t,s,ms,top])=>window.__cap(t,s,ms,top),[t,s,ms,top]);
 // --- Ablauf (Sekunden ab Start) ---
 await at(0.1,()=>cap('MOKI STUDIO','Dein eigener Spiele-Baukasten',2800),'cap1');
 await at(0.5,()=>mvEl('#d-new',1300),'zu Neues Spiel');
 await at(2.0,async()=>{await p.mouse.down();await sleep(60);await p.mouse.up()},'Neues Spiel');
 await at(2.5,()=>cap('11 VORLAGEN','Oder fang ganz leer an',2400),'cap2');
 await at(2.8,()=>mvEl('[data-k=platformer]',600),'hover1');
 await at(3.6,()=>mvEl('[data-k=shooter]',600),'hover2');
 await at(4.4,()=>clk('[data-k=catch]',500),'catch');
 await at(5.3,()=>cap('BAUKASTEN','Spiele bauen, ganz ohne Programmieren',3000),'cap3');
 await at(5.6,async()=>{await mv(1100,330,700);await p.mouse.down();await sleep(50);await p.mouse.up()},'Spiel starten');
 await at(6.5,async()=>{for(let i=0;i<5;i++){await p.keyboard.down(i%2?'ArrowLeft':'ArrowRight');await sleep(380);await p.keyboard.up(i%2?'ArrowLeft':'ArrowRight');}},'spielen');
 await at(8.6,async()=>{await mv(340,500,500);const t1=Date.now();for(;;){const u=Math.min(1,(Date.now()-t1)/900);await p.evaluate(u=>{const e=document.querySelector('#pane-builder');e.scrollTop=u*780},u);if(u>=1)break;await sleep(16)}},'scroll');
 await at(10.0,()=>clk('#pane-builder button:has-text("Sammelobjekt")',700),'Sammelobjekt');
 await at(11.0,()=>cap('FIGUREN & REGELN','Alles per Klick hinzufügen',2200),'cap4');
 await at(11.2,async()=>{await clk('#e-title',900);await p.keyboard.press('Control+A');await p.keyboard.type('Mein Sternenspiel',{delay:70})},'Titel');
 await at(13.6,()=>clk('[data-tab=code]',800),'Code-Tab');
 await at(14.7,()=>cap('CODE-MODUS','Oder schreib deinen eigenen Code',2600),'cap5');
 await at(15.3,()=>clk('#c-ai',900),'KI');
 await at(16.5,()=>cap('MIT KI BAUEN','Wunsch eintippen, KI schreibt das Spiel',2600),'cap6');
 await at(16.5,async()=>{await clk('#ai-req',500);await p.keyboard.type('Ein Spiel, in dem ich Meteoriten ausweiche',{delay:45})},'KI-Text');
 await at(19.7,()=>mvEl('#ai-copy',700),'Kopieren');
 await at(20.7,()=>clk('#ai-x',500),'KI zu');
 await at(21.6,()=>clk('#e-pub',800),'Veröffentlichen');
 await at(22.7,()=>cap('VERÖFFENTLICHEN','Bild aussuchen, schon steht es bei Moki',2600,true),'cap7');
 await at(22.7,()=>clk('.mo',500,{nth:4}),'Motiv');
 await at(24.0,()=>clk('.pa',500,{nth:4}),'Farbe');
 await at(24.9,()=>clk('#s-p',600),'Speichern+Veröffentlichen');
 await at(25.9,()=>cap('IN KREATIONEN','Dein Spiel erscheint bei Moki',1800),'cap8');
 await at(25.9,()=>clk('#e-back',700),'zurück');
 await at(28.6,async()=>{},'Ende');
 const vid=p.video();await p.close();await ctx.close();const f=await vid.path();await b.close();
 fs.writeFileSync(path.join(OUT,'info.json'),JSON.stringify({file:f,offset:off}));console.log('Offset',off.toFixed(2),f,errs);
})();
