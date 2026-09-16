const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const adapter=require('../js/tokyu_location_adapter');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    for(const [id,width,cars,type,formation] of [[159,390,10,'4000','4112F'],[159,320,10,'4000','4115F'],[160,1280,8,'3000','3101F'],[160,320,8,'3000','3101F']]) {
      const page=await browser.newPage({viewport:{width,height:900}});
      const route=adapter.routeFor(id);
      let fail=false;
      await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
      await page.route('**/api/mainte/**',r=>r.fulfill({json:{lines:[],status:0}}));
      await page.route('https://cors-proxy-*/**',r=>r.fulfill({json:r.request().url().includes('ressha_type_master')||r.request().url().includes('eki_master')?[]:{lines:[]}}));
      await page.route('**/api/tokyu/'+route.key,r=>r.fulfill({json:{fetchedAt:Date.now(),data:{trains:[{
        line_id:route.tidLineId,train_line_id:route.tidLineId,station_id:route.stations[0].id,
        up:id===160,operation_number:51,train_number:'00511230',kind:'急',num_of_cars:cars,affiliation:'急',train_orchestration_number:formation.slice(2,4),destination:'日吉'
      }]}}}));
      await page.route('https://cars-info.tokyuapp.com/**',r=>r.fulfill(fail?{status:503,body:''}:{json:{info:[type,{train_cars:Array.from({length:cars},(_,i)=>({name:String(i+1),congestion:'3'}))}]}}));
      await page.goto('http://127.0.0.1:8796/location.html#rosen='+id);
      await page.locator('.ressha[data-cbango="00511230"]').first().click();
      const link=page.getByRole('button',{name:'（'+formation+'）'});
      await link.click();
      const panel=page.locator('#tokyuCarDetailMain');
      assert.equal(await panel.locator('tbody tr').count(),cars);
      assert.equal(await panel.getByRole('columnheader',{name:'車内設備'}).count(),1);
      assert.equal(await panel.getByRole('columnheader',{name:'車内温度'}).count(),0);
      assert.equal(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
      assert.equal(await panel.locator('.tokyu-car-diagram').count(),cars);
      assert.equal(await panel.locator('.tokyu-door').count(),cars*8);
      assert.equal(await panel.locator('.tokyu-equipment-slot').count(),cars*4);
      const slots=panel.locator('.tokyu-car-diagram').first().locator('.tokyu-equipment-slot');
      const left=await slots.nth(0).boundingBox(),right=await slots.nth(1).boundingBox();
      assert.ok(left.x+left.width<=right.x+1);
      assert.equal(await panel.locator('.tokyu-car-diagram .cool').count(),0);
      if (id===159) {
        assert.equal(await panel.locator('.tokyu-q-seat').count(),2);
        assert.ok(await panel.locator('.tokyu-car-badges .cool').count()>0);
        assert.deepEqual(await panel.locator('tbody tr:has(.tokyu-q-seat) .tokyu-car-number').allTextContents(),['4','5']);
      }
      await page.waitForFunction(()=>Array.from(document.querySelectorAll('.tokyu-equipment-symbol img')).every(img=>img.complete && img.naturalWidth>0));
      assert.ok((await panel.locator('.tokyu-travel-direction').innerText()).includes(id===160?'↑ 目黒':'↓ 横浜'));
      assert.ok((await panel.locator('th:has(.tokyu-leading-car)').innerText()).startsWith(id===160?'1':String(cars)));
      await page.screenshot({path:'.tmp/tokyu-cars-'+id+'.png'});
      await page.getByRole('button',{name:'列車詳細に戻る'}).click();
      assert.equal(await link.isVisible(),true);
      assert.equal((await page.locator('#ryosu').innerText()).split(formation).length,2);
      fail=true;
      await page.reload();
      await page.locator('.ressha[data-cbango="00511230"]').first().click();
      await page.locator('#resshaDetail').waitFor({state:'visible'});
      assert.equal(await page.locator('#ryosu button').count(),0);
      assert.ok((await page.locator('#ryosu').innerText()).includes(formation));
      await page.close();
    }
    console.log('Toyoko/Meguro UI: formation links, equipment, mobile/desktop, back and API failure passed.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
