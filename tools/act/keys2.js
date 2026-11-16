module.exports=async(page,f,out,tag)=>{
  const sz=page.viewportSize()||{width:1100,height:700};
  await page.mouse.click(sz.width/2,sz.height/2); await page.waitForTimeout(500);
  for(const k of ['Space','KeyZ','Space']){ await page.keyboard.press(k); await page.waitForTimeout(1200); }
  await page.screenshot({path:`${out}/${tag}-3.png`});
  await page.mouse.click(sz.width/2,sz.height/2); await page.waitForTimeout(800);
  await page.screenshot({path:`${out}/${tag}-4.png`});
};
