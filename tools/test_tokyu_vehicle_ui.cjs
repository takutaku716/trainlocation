const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const adapter = require('../js/tokyu_location_adapter');
const fixture = JSON.parse(fs.readFileSync('testdata/tokyu_vehicle_5000.json','utf8'));
const base = process.env.TOKYU_TEST_URL || 'http://127.0.0.1:8796';
fs.mkdirSync('.tmp',{recursive:true});
(async()=>{
  const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
  try {
    for (const width of [1280,390,320]) {
      const page = await browser.newPage({viewport:{width,height:844}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      let calls=0, vehicleBody=fixture;
      await page.route('**/api/tokyu/dento',route=>route.fulfill({json:{fetchedAt:Date.now(),data:{trains:[{
        line_id:26003,train_line_id:26003,station_id:adapter.routeFor(161).stations[0].id,
        up:false,operation_number:30,train_number:'00301710',kind:'普',num_of_cars:0,destination:'中央林間'
      }]}}}));
      await page.route('https://train-info.tokyuapp.com/**',route=>{calls++;return route.fulfill({json:vehicleBody,headers:{'access-control-allow-origin':'*'}});});
      await page.goto(base+'/location.html#rosen=161',{waitUntil:'domcontentloaded'});
      await page.locator('.ressha[data-cbango="00301710"]').first().click({timeout:90000});
      const link=page.getByRole('button',{name:'（5103F）'});
      await link.click();
      const panel=page.locator('#tokyuCarDetailMain');
      await panel.waitFor({state:'visible'});
      assert.equal(await panel.locator('tbody tr').count(),10);
      assert.ok((await panel.innerText()).includes('21.5℃'));
      assert.equal(await panel.getByRole('columnheader',{name:'空調モード'}).count(),1);
      assert.equal(await panel.getByRole('cell',{name:'除湿',exact:true}).count(),10);
      assert.equal(calls,1);
      await page.waitForFunction(()=>Array.from(document.querySelectorAll('#tokyuCarDetailMain tbody img')).every(i=>i.complete&&i.naturalWidth>0));
      assert.equal(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
      assert.equal(await panel.locator('table').evaluate(el=>el.getBoundingClientRect().right<=innerWidth),true);
      await page.screenshot({path:path.join('.tmp','tokyu-vehicle-'+width+'.png')});
      await page.getByRole('button',{name:'列車詳細に戻る'}).click();
      assert.equal(await panel.isVisible(),false);
      assert.equal(await link.isVisible(),true);
      await link.click();assert.equal(calls,1);
      await page.keyboard.press('Escape');assert.equal(await panel.isVisible(),false);
      if (width === 390) {
        vehicleBody={...fixture,unit_number:'002145'};
        await page.reload({waitUntil:'domcontentloaded'});
        await page.locator('.ressha[data-cbango="00301710"]').first().click();
        await page.getByRole('button',{name:'（2145F）'}).click();
        assert.equal(await panel.getByRole('columnheader').count(),3);
        assert.equal(await panel.getByRole('columnheader',{name:'空調モード'}).count(),0);
        await page.locator('#resshaDetail .header .close').click();
        await page.locator('#resshaDetail').waitFor({state:'hidden'});
        await page.locator('.ressha[data-cbango="00301710"]').first().click();
        await page.getByRole('button',{name:'（2145F）'}).waitFor({state:'visible'});
        assert.equal(await panel.isVisible(),false);
        vehicleBody={};
        await page.reload({waitUntil:'domcontentloaded'});
        await page.locator('.ressha[data-cbango="00301710"]').first().click();
        await page.locator('#resshaDetail').waitFor({state:'visible'});
        assert.equal(await page.locator('#ryosu button').count(),0);
      }
      // Existing analytics can fail independently of train details.
      assert.deepEqual(errors.filter(e=>!e.includes("reading 'addEventListener'")),[]);
      await page.close();
    }
    console.log('Vehicle UI: desktop/mobile, ten cars, images, direct fetch reuse, back/Escape and overflow checks passed.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
