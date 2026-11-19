// Mega-Update-Trailer: Aufnahme einer echten Sitzung auf Moki (1920x1080) mit allen Neuerungen seit den ersten 50 Spielen:
// Ankuendigungs-Popup, Wochenchallenge mit Spielzeit-Balken, 54 neue Spiele, Spiele direkt in Moki, Tester-Programm.
// Datenbank (Supabase) gemockt. Spiele werden lokal aus den Git-Staenden geladen (statt von GitHub), es laufen also die echten Spiele.
// Vorher: python3 prepare-moki.py   Aufruf: node moki-rec-mega.js <ausgabeordner>
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const {OVERLAY,driver}=require('../rec-lib.js');
const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
const REPO='/home/user/Claude';
const TYPES={html:'text/html',js:'text/plain',css:'text/css',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',json:'application/json',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',woff:'font/woff',woff2:'font/woff2',ico:'image/x-icon'};
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:OUT,size:{width:1920,height:1080}}});
 const tCreate=Date.now();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 // ---- Datenbank-Attrappe
 let tester={state:'none'};
 const CONFIRMED=['2048-merge','sandboxels','idle-success','drive-mad','longcat','plonky'];
 await p.route('**/rest/v1/rpc/**',r=>{const fn=r.request().url().split('/rpc/')[1];let body=[];
  if(fn==='moki_challenge_get')body=540;                       // 9 von 15 Minuten
  else if(fn==='moki_announcements_active')body=[{id:'rec-1',title:'Das Mega-Update ist da!',emoji:'🎉',body:'54 neue Spiele, alle direkt in Moki, dazu Wochenchallenge mit Spielzeit-Balken und das Tester-Programm. Viel Spaß!'}];
  else if(fn==='moki_tester_state')body=tester;
  else if(fn==='moki_tester_board')body={confirmed:CONFIRMED,claims:[]};
  else if(fn.startsWith('moki_tester_'))body=null;
  r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)})});
 // ---- Spiele lokal aus Git ausliefern (raw.githubusercontent.com/<user>/Claude/<sha>/<pfad>)
 await p.route(/^https:\/\/raw\.githubusercontent\.com\/antoniscrazy\/Claude\/([0-9a-f]{40})\/(.+?)(\?.*)?$/,r=>{
  const m=r.request().url().match(/Claude\/([0-9a-f]{40})\/([^?]+)/);
  try{const buf=execFileSync('git',['-C',REPO,'show',m[1]+':'+decodeURIComponent(m[2])],{maxBuffer:1<<30});
   const ext=(m[2].split('.').pop()||'').toLowerCase();r.fulfill({status:200,headers:{'content-type':TYPES[ext]||'application/octet-stream','access-control-allow-origin':'*'},body:buf})}
  catch(e){r.fulfill({status:404,body:'nicht gefunden'})}});
 await p.route(/^https?:\/\/(?!localhost)(?!raw\.githubusercontent\.com\/antoniscrazy)[^/]+\/.*/,r=>{if(/supabase/.test(r.request().url()))return r.fallback();r.abort('aborted')});
 await p.addInitScript(()=>{try{localStorage.setItem('moki-intro-v2','1')}catch(e){}});
 await p.addInitScript(()=>{window.__ZOOM=1.3333});await p.addInitScript(OVERLAY);
 // Fusszeile (Tester-Knopf) fuer die Aufnahme am unteren Bildrand festhalten (Seitenende ist unter Zoom nicht erreichbar)
 await p.addInitScript(()=>addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='html,body{scroll-behavior:auto!important}#tfoot{position:fixed!important;left:0;right:0;bottom:0;z-index:40;background:#0a0d2bf2;border-top:2px solid #00e5a855}';document.head.appendChild(st)}));
 await p.goto('file:///home/user/Claude/moki/_trailer-moki.html');await p.waitForSelector('.tile');await p.waitForTimeout(500);
 const off=(Date.now()-tCreate)/1000;const d=driver(p);d.reset();
 const {at,mv,mvEl,clk,cap,smoothScroll,sleep}=d;
 const tile=id=>`#app a[data-id="${id}"]`;
 const scrollTo=async y=>{await smoothScroll(null,await p.evaluate(()=>scrollY),y,1200)};
 const elY=(sel,off2=250)=>p.evaluate(([s,o])=>document.querySelector(s).getBoundingClientRect().top+scrollY-o,[sel,off2]);
 const frameClick=async(frameSel,sel,dur=800)=>{const bb=await p.frameLocator(frameSel).locator(sel).boundingBox();await mv(bb.x+bb.width/2,bb.y+bb.height/2,dur);await sleep(80);await p.mouse.down();await sleep(60);await p.mouse.up()};
 // ---- 1. Ankuendigung beim Oeffnen
 await at(0.2,()=>cap('MEGA-UPDATE','Alles Neue seit den ersten 50 Spielen',3300),'cap0');
 await at(1.8,()=>cap('ANKÜNDIGUNGEN','Neuigkeiten direkt beim Öffnen von Moki',3000,true),'cap-ann');
 await at(5.4,async()=>{await p.waitForSelector('.ann-close.ready',{timeout:6000});await clk('.ann-close',900,0,true)},'Ankuendigung zu');
 // ---- 2. Wochenchallenge
 await at(7.6,async()=>{await scrollTo(await elY('.chal',200))},'scroll Challenge');
 await at(8.8,()=>cap('WOCHENCHALLENGE','Spielzeit sammeln, Fortschritt im Balken',3600),'cap-ch');
 await at(9.2,()=>mvEl('.chal .cpbar',1000,0,0,0,true),'zum Balken');
 // ---- 3. Neue Spiele
 await at(13.4,async()=>{await scrollTo(await elY('#app .grid .tile',260))},'scroll Grid');
 await at(14.8,()=>cap('54 NEUE SPIELE','Frisch dazugekommen, mit NEU-Schild',3000),'cap-new');
 await at(15,async()=>{for(const n of [1,4,7,10]){await mvEl(`#app .grid .tile >> nth=${n}`,520,0,0,0,true);await sleep(180)}},'Kacheln');
 // ---- 4. Spiele direkt in Moki (drei spannende Spiele, jeweils kurz gespielt)
 const ZF=1.3333;   // Koordinaten von Elementen in Frames sind unter Seiten-Zoom gestaucht
 const back=async()=>{const bb=await p.frameLocator('#player iframe').locator('#moki-back').boundingBox();await mv((bb.x+bb.width/2)*ZF,(bb.y+bb.height/2)*ZF,800);await sleep(80);await p.mouse.down();await sleep(60);await p.mouse.up()};
 await at(19.4,()=>cap('DIREKT AUF MOKI','Jedes Spiel läuft hier, ohne Umweg',3400),'cap-play');
 await at(19.6,async()=>{await scrollTo(await elY(tile('tunnel-rush'),420))},'scroll Tunnel Rush');
 await at(21,()=>clk(tile('tunnel-rush'),900,0,true),'Tunnel Rush oeffnen');
 await at(28.6,async()=>{await mv(975,735,700);await p.mouse.down();await sleep(60);await p.mouse.up()},'Tunnel Rush starten');
 await at(29.6,async()=>{for(let i=0;i<9;i++){await p.keyboard.down(i%2?'ArrowLeft':'ArrowRight');await sleep(330);await p.keyboard.up(i%2?'ArrowLeft':'ArrowRight')}},'Tunnel Rush spielen');
 await at(34,back,'zurueck 1');
 await at(35.6,async()=>{await scrollTo(await elY(tile('stackball'),420))},'scroll Stackball');
 await at(37,()=>clk(tile('stackball'),900,0,true),'Stackball oeffnen');
 await at(41,async()=>{await mv(960,780,600);await p.mouse.down();await sleep(3000);await p.mouse.up()},'Stackball spielen');
 await at(44.8,back,'zurueck 2');
 await at(46.2,async()=>{await scrollTo(await elY(tile('granny'),420))},'scroll Granny');
 await at(47.6,()=>clk(tile('granny'),900,0,true),'Granny oeffnen');
 await at(51,async()=>{await mv(520,470,900);await sleep(900);await mv(300,300,900)},'Granny Menue');
 await at(53.6,back,'zurueck 3');
 // ---- 5. Tester-Programm
 await at(55.2,()=>cap('TESTER-PROGRAMM','Hilf mit und teste neue Spiele',3000,true),'cap-test');
 await at(55.6,()=>clk('[data-tf=apply]',900,0,true),'Tester werden');
 await at(57.4,async()=>{await clk('#tf-name',500,0,true);await p.keyboard.type('Max',{delay:120})},'Name');
 await at(59.2,async()=>{tester={state:'pending'};await clk('[data-a=send]',700,0,true)},'Bewerben');
 await at(61.8,async()=>{tester={state:'tester',name:'Max',notice:'accepted'};await p.reload();await p.waitForSelector('.tmodal',{timeout:8000})},'angenommen');
 await at(63,()=>cap('DU BIST TESTER','Mit Anleitung und Checkliste',2800,true),'cap-ok');
 await at(66.8,async()=>{tester={state:'tester',name:'Max'};await clk('.tmodal [data-a=ok]',800,0,true)},'Los geht\'s');
 await at(68.4,()=>clk('[data-tf=mode]',800,0,true),'Tester-Modus an');
 await at(70.6,async()=>{await scrollTo(await elY('#app .grid .tile',260))},'zum Grid');
 await at(72,()=>cap('TESTER-MODUS','Bereits getestete Spiele sind ausgegraut',3000),'cap-mode');
 await at(75.4,async()=>{await scrollTo(await elY(tile('stackball'),420))},'scroll zum Spiel');
 await at(77.2,()=>clk(tile('stackball'),900,0,true),'Spiel pruefen');
 await at(81,async()=>{for(const k of ['laedt','start','steuerung','fluessig','kein_fehler']){await clk(`#tpanel [data-k="${k}"]`,420,0,true);await sleep(120)}},'Checkliste');
 await at(84.6,()=>cap('CHECKLISTE','Haken setzen, Fehler mit Screenshot melden',2800,true),'cap-check');
 await at(85,()=>clk('#tp-send',800,0,true),'Meldung abschicken');
 await at(88.2,async()=>{},'Ende');
 const vid=p.video();await p.close();await ctx.close();const f=await vid.path();await b.close();
 fs.writeFileSync(path.join(OUT,'info.json'),JSON.stringify({file:f,offset:off,log:d.log}));
 console.log('Offset',off.toFixed(2),errs);d.log.forEach(l=>console.log(String(l[0]).padEnd(26),'soll',l[1],'start',l[2].toFixed(1),'ende',l[3].toFixed(1)));
})();
