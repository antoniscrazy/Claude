const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{
 const out=process.argv[2];fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1280,height:720}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+path.resolve(__dirname,'mega.html'));
 await p.waitForFunction('window.READY',{timeout:60000});
 const N=90*30;
 for(let f=0;f<N;f++){
  await p.evaluate(t=>render(t),f/30);
  const el=await p.$('canvas');
  await el.screenshot({path:`${out}/f${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:90});
 }
 await b.close();})();
