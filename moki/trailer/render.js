const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{
 const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+path.resolve(__dirname,'trailer.html'));
 await p.waitForFunction('window.READY',{timeout:30000});
 const only=process.argv[3]?process.argv[3].split(',').map(Number):null;
 const N=Math.round(34*30);
 for(let f=0;f<N;f++){ if(only&&!only.includes(f))continue;
  await p.evaluate(t=>render(t),f/30);
  const el=await p.$('canvas');await el.screenshot({path:`${out}/f${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
 await b.close();})();
