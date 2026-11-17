const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const set=process.argv[2],out=process.argv[3],only=process.argv[4]?process.argv[4].split(',').map(Number):null;fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch(),p=await b.newPage({viewport:{width:1920,height:1080}});p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+path.resolve(__dirname,'scenes.html'));await p.waitForFunction('window.READY',{timeout:30000});
 const N=420;for(let f=0;f<N;f++){if(only&&!only.includes(f))continue;await p.evaluate(([t,s])=>render(t,s),[f/30,set]);
  const el=await p.$('canvas');await el.screenshot({path:`${out}/f${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:92})}
 await b.close()})();
