const {chromium}=require('playwright');const path=require('path');
(async()=>{const slug=process.argv[2];const b=await chromium.launch({args:['--no-sandbox','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader']});const p=await(await b.newContext({viewport:{width:1100,height:700}})).newPage();
const pend=new Set();p.on('request',r=>pend.add(r.url()));p.on('requestfinished',r=>pend.delete(r.url()));p.on('requestfailed',r=>{console.log('FAIL',r.failure().errorText,r.url().slice(-90));pend.delete(r.url())});
p.on('response',r=>{if(r.status()>=400)console.log(r.status(),r.url().slice(-90))});
p.on('console',m=>{if(['error','warning'].includes(m.type()))console.log('C',m.text().slice(0,150))});p.on('pageerror',e=>console.log('PE',String(e).slice(0,200)));
await p.goto('file://'+path.resolve('..',slug+'.html'));await p.waitForTimeout(+process.argv[3]*1000);console.log('PENDING',[...pend].map(u=>u.slice(-70)));await b.close()})();
