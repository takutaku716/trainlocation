const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const adapter=require('../js/tokyu_location_adapter');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const [kind,label] of [['普','各駅停車'],['Ｂ','各駅停車（高津・二子新地停車）'],['Ｇ','各駅停車（高津・二子新地通過）']]){
      const page=await browser.newPage({viewport:{width:320,height:844}});
      await page.route('**/api/tokyu/meguro',r=>r.fulfill({json:{data:{trains:[{line_id:26002,train_line_id:26002,train_number:'00012110',operation_number:1,station_id:adapter.routeFor(160).stations[0].id,up:false,kind,destination:'日吉'}]},fetchedAt:Date.now()}}));
      await page.goto('http://127.0.0.1:8796/location.html#rosen=160',{waitUntil:'domcontentloaded'});
      await page.locator('.ressha[data-cbango="00012110"]').first().click({timeout:60000});
      await page.locator('#resshaDetail').waitFor({state:'visible'});
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#resshaDetail')).opacity==='1');
      assert.equal(await page.locator('#aisho').innerText(),label);
      assert.ok(await page.locator('#aisho').evaluate(e=>e.scrollWidth<=e.clientWidth));
      await page.screenshot({path:'.tmp/tokyu-label-'+(kind==='普'?'local':kind==='Ｂ'?'b':'g')+'.png'});
      await page.close();
    }
    console.log('Tokyu detail labels and narrow-screen wrapping passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
