// Nimmt eine echte Sitzung im Moki Studio (studio.html) auf (1920x1080). Datenbank gemockt.
// Aufruf: NODE_PATH=$(npm root -g) node studio-rec.js <ausgabeordner>
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const {OVERLAY,driver}=require('./rec-lib.js');
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:OUT,size:{width:1920,height:1080}}});
 const tCreate=Date.now();const p=await ctx.newPage();let saved=null;const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/rest/v1/rpc/**',r=>{const fn=r.request().url().split('/rpc/')[1];const a=JSON.parse(r.request().postData()||'{}');let body=[];
  if(fn==='moki_save'){saved={id:'g1',slug:'mein-sternenspiel',title:a.p_title,icon:a.p_icon,mode:a.p_mode,status:(saved&&saved.status)||'draft',updated_at:new Date().toISOString()};body={id:'g1',slug:saved.slug}}
  else if(fn==='moki_set_published'){if(saved)saved.status=a.p_published?'published':'draft';body={slug:'mein-sternenspiel'}}
  else if(fn==='moki_my')body=saved?[saved]:[];
  r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)})});
 await p.addInitScript(()=>{try{localStorage.setItem('moki-studio-name','"Max"')}catch(e){}window.__ZOOM=1.3333});
 await p.addInitScript(OVERLAY);
 await p.goto('file:///home/user/Claude/moki/studio.html');await p.waitForSelector('#d-new');await p.waitForTimeout(500);
 const off=(Date.now()-tCreate)/1000;const d=driver(p);d.reset();const {at,mv,mvEl,clk,cap,smoothScroll,sleep}=d;
 await at(0.1,()=>cap('MOKI STUDIO','Baue dein eigenes Spiel, ganz ohne Programmieren',2800),'cap1');
 await at(0.5,()=>mvEl('#d-new',1300),'zu Neues Spiel');
 await at(2.0,async()=>{await p.mouse.down();await sleep(60);await p.mouse.up()},'Neues Spiel');
 await at(2.5,()=>cap('11 VORLAGEN','Oder fang ganz leer an',2400),'cap2');
 await at(2.8,()=>mvEl('[data-k=platformer]',600),'hover1');
 await at(3.6,()=>mvEl('[data-k=shooter]',600),'hover2');
 await at(4.4,()=>clk('[data-k=catch]',500),'catch');
 await at(5.3,()=>cap('BAUKASTEN','Figuren, Regeln und Menüs per Klick',3000),'cap3');
 await at(5.6,async()=>{await mv(1450,420,700);await p.mouse.down();await sleep(50);await p.mouse.up()},'Spiel starten');
 await at(6.5,async()=>{for(let i=0;i<5;i++){await p.keyboard.down(i%2?'ArrowLeft':'ArrowRight');await sleep(380);await p.keyboard.up(i%2?'ArrowLeft':'ArrowRight');}},'spielen');
 await at(8.6,async()=>{await mv(420,600,500);await smoothScroll('#pane-builder',0,780,900)},'scroll');
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
 await at(22.7,()=>clk('.mo',500,4),'Motiv');
 await at(24.0,()=>clk('.pa',500,4),'Farbe');
 await at(24.9,()=>clk('#s-p',600),'Speichern+Veröffentlichen');
 await at(25.9,()=>cap('IN KREATIONEN','Dein Spiel erscheint bei Moki',1800),'cap8');
 await at(25.9,()=>clk('#e-back',700),'zurück');
 await at(28.6,async()=>{},'Ende');
 const vid=p.video();await p.close();await ctx.close();const f=await vid.path();await b.close();
 fs.writeFileSync(path.join(OUT,'info.json'),JSON.stringify({file:f,offset:off}));console.log('Offset',off.toFixed(2),errs);d.log.forEach(l=>console.log(String(l[0]).padEnd(26),'soll',l[1],'start',l[2].toFixed(1),'ende',l[3].toFixed(1)));
})();
