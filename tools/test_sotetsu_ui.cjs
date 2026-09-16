const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('../testdata/sotetsu_trains.json');
const base=process.env.SOTETSU_TEST_URL||'http://127.0.0.1:8796';
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const width of [1280,390,320])for(const id of [167,168,169]){
      const page=await browser.newPage({viewport:{width,height:844}});
      await page.route('https://external-data.sotetsuapp.com/**',r=>r.fulfill({json:{...fixture,updated_at:Math.floor(Date.now()/1000)},headers:{'access-control-allow-origin':'*'}}));
      await page.goto(base+'/location.html#rosen='+id,{waitUntil:'domcontentloaded'});
      const train=page.locator('#stationList .ressha[data-source="sotetsu"]').first();
      await train.waitFor({timeout:60000});
      assert.equal(await page.locator('#stationList .ressha[data-source="sotetsu"]').count(),id===167?1:id===168?2:3);
      const style=await train.locator('.icon-img').evaluate(e=>({background:getComputedStyle(e).backgroundImage,width:e.getBoundingClientRect().width}));
      assert.ok(style.background.includes('train_icon'));assert.ok(style.width>0);
      const number=await train.getAttribute('data-cbango');
      await train.click();
      await page.locator('#resshaDetail').waitFor({state:'visible'});
      const detail=await page.locator('#resshaDetail').innerText();
      assert.ok(detail.includes(number==='K334'?'34S':number),id+': '+detail);
      assert.ok(detail.includes(['3002','K334'].includes(number)?'8両':'10両'),detail);
      if(id===169)assert.ok((await train.innerText()).includes('34S'));
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#resshaDetail')).opacity==='1');
      await page.screenshot({path:'.tmp/sotetsu-'+id+'-'+width+'.png'});
      await page.close();
    }
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
    await page.locator('label[for="areaOperationSotetsuTab"]').click();
    await page.locator('.rosen-name-list.sotetsu').waitFor({state:'visible'});
    assert.equal(await page.locator('.rosen-name-list.sotetsu .rosen-name-contents').count(),3);
    await page.screenshot({path:'.tmp/sotetsu-top-mobile.png'});
    await page.close();
    console.log('Sotetsu UI: three routes, desktop/mobile icons and details passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
