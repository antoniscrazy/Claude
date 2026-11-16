// Aufruf: node t.js slug [wartesek] [aktionen.js] [--ipad]
const { chromium, webkit, devices } = require('playwright');
const path=require('path');
(async()=>{
  const slug=process.argv[2], wait=+(process.argv[3]||8), act=process.argv[4]&&process.argv[4]!=='-'?require(path.resolve(process.argv[4])):null;
  const ipad=process.argv.includes('--ipad');
  const out=process.env.OUT||'/tmp/claude-0/-home-user-Claude/88691f5b-4ac7-5a9f-969d-82cab611ff8b/scratchpad';
  const args=['--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl','--no-sandbox','--autoplay-policy=no-user-gesture-required'];
  let browser, ctx;
  if(ipad){ browser=await webkit.launch(); ctx=await browser.newContext({...devices['iPad Pro 11 landscape']}); }
  else { browser=await chromium.launch({args}); ctx=await browser.newContext({viewport:{width:1100,height:700},hasTouch:true}); }
  const page=await ctx.newPage();
  const foreign=[], errs=[], bad=[];
  page.on('request',r=>{const u=new URL(r.url()); if(!/^(file:|blob:|data:|about:)/.test(r.url()) && !/(cdn\.jsdelivr\.net|raw\.githubusercontent\.com)$/.test(u.hostname)) foreign.push(r.url().slice(0,120));});
  page.on('response',r=>{ if(r.status()>=400) bad.push(r.status()+' '+r.url().slice(0,120)); });
  page.on('console',m=>{ if(m.type()==='error'||/^BLOCKED/.test(m.text())) errs.push(m.text().slice(0,160)); });
  page.on('pageerror',e=>errs.push('PAGEERR '+String(e).slice(0,160)));
  if(!process.env.REAL){
    const mime={html:'text/html',js:'application/javascript',mjs:'application/javascript',css:'text/css',json:'application/json',wasm:'application/wasm',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',svg:'image/svg+xml',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',txt:'text/plain',data:'application/octet-stream'};
    const fs=require('fs');
    await ctx.route(/cdn\.jsdelivr\.net\/gh\/antoniscrazy\/Claude@[0-9a-f]+\//,r=>{
      const u=new URL(r.request().url()); let p=decodeURIComponent(u.pathname).replace(/^\/gh\/antoniscrazy\/Claude@[0-9a-f]+\//,'');
      const f=path.resolve('..',p);
      if(!fs.existsSync(f)||fs.statSync(f).isDirectory()) return r.fulfill({status:404,body:'nf'});
      const ext=f.split('.').pop().toLowerCase();
      r.fulfill({status:200,body:fs.readFileSync(f),headers:{'content-type':mime[ext]||'application/octet-stream','access-control-allow-origin':'*'}});
    });
  }
  await page.goto('file://'+path.resolve('..',slug+'.html'));
  await page.waitForTimeout(wait*1000);
  const tag=slug+(ipad?'-ipad':'');
  await page.screenshot({path:`${out}/${tag}-1.png`});
  if(act){ await act(page, page.frames().find(f=>f!==page.mainFrame())||page.mainFrame(), out, tag); }
  await page.waitForTimeout(500);
  await page.screenshot({path:`${out}/${tag}-2.png`});
  console.log('FOREIGN',JSON.stringify([...new Set(foreign)].slice(0,10)));
  console.log('HTTP>=400',JSON.stringify([...new Set(bad)].slice(0,10)));
  console.log('ERRORS',JSON.stringify([...new Set(errs)].slice(0,8)));
  await browser.close();
})();
