module.exports=async(page,f,out,tag)=>{
  await f.click('#play-btn').catch(e=>console.log('noplay',e.message.slice(0,80)));
  await page.waitForTimeout(2500);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1500);
  await page.screenshot({path:`${out}/${tag}-3.png`});
};
