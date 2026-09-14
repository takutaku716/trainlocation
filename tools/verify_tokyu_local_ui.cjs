const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const [key,id] of [['ikegami',164],['tamagawa',165],['setagaya',166]]){
      const r=await fetch('https://trainlocation-tokyu-proxy.densha716.workers.dev/api/tokyu/'+key,{headers:{origin:'https://takutaku716.github.io'}});
      assert.equal(r.status,200);const data=await r.json();assert.equal(data.source,'firestore');
      const page=await browser.newPage({viewport:{width:390,height:844}});
      await page.route('**/api/tokyu/'+key,r=>r.fulfill({json:data}));
      await page.goto('http://127.0.0.1:8796/location.html#rosen='+id,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#stationList .eki'));
      if(data.data.trains.length){
        const train=page.locator('#stationList .ressha').first();await train.waitFor({timeout:60000});
        assert.equal(await page.locator('#stationList .ressha').count(),data.data.trains.length);
        assert.ok(!(await page.locator('#message').innerText()).includes('w-tid'));
        await train.click();await page.locator('#resshaDetail').waitFor({state:'visible'});
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('#resshaDetail')).opacity==='1');
      }
      await page.screenshot({path:'.tmp/'+key+'-firestore.png'});
      console.log(key+': '+data.data.trains.length+' trains, Firestore, common display verified');
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
