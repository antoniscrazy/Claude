module.exports=async(page,f,out,tag)=>{ await page.waitForTimeout(15000); await page.mouse.click(550,350); await page.waitForTimeout(3000); await page.screenshot({path:`${out}/${tag}-3.png`}); };
