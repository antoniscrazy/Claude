// Allgemein: Space/Enter/Z druecken, Mitte klicken, Screenshot
module.exports=async(page,f,out,tag)=>{
  const sz=page.viewportSize()||{width:1100,height:700};
  for(const k of ['Space','Enter','KeyZ']){ await page.keyboard.press(k); await page.waitForTimeout(600); }
  await page.mouse.click(sz.width/2,sz.height/2); await page.waitForTimeout(1500);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(800); await page.keyboard.up('ArrowRight');
  await page.screenshot({path:`${out}/${tag}-3.png`});
};
