const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const fixture=require('../testdata/tokyu/minatomirai.json');
function encode(v){if(Array.isArray(v))return {arrayValue:{values:v.map(encode)}};if(v&&typeof v==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}};return typeof v==='number'?{integerValue:String(v)}:{stringValue:v};}
(async()=>{
  const {convertMinatomirai}=await import('../functions/api/tokyu/minatomirai.js');
  const documents=fixture.positions.map(([index,position_id,type])=>({fields:encode({index,position_id,type,trains:[{...fixture.train,tid_train_number:String(1000+index),direction:index%2?'DOWN':'UP'}]}).mapValue.fields}));
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    for(const width of [1280,390,320]){
      const page=await browser.newPage({viewport:{width,height:844}});
      await page.route('**/api/tokyu/toyoko',r=>r.fulfill({json:{data:{trains:convertMinatomirai(documents)},fetchedAt:Date.now(),source:'signed',file:'toyoko.json'}}));
      await page.goto('http://127.0.0.1:8796/location.html#rosen=159',{waitUntil:'domcontentloaded'});
      const last=page.locator('.ressha[data-cbango="1050"]').first();
      await last.waitFor({timeout:60000});
      assert.equal(await page.locator('#stationList .ressha').count(),10);
      assert.equal(await page.locator('#stationList .eki-panel.eki').count(),26);
      await last.scrollIntoViewIfNeeded();
      await page.screenshot({path:'.tmp/minatomirai-track-'+width+'.png'});
      await last.click();
      await page.locator('#resshaDetail').waitFor({state:'visible'});
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#resshaDetail')).opacity==='1');
      const text=await page.locator('#resshaDetail').innerText();
      assert.ok(text.includes('元町・中華街'));assert.ok(text.includes('和光市'));assert.ok(text.includes('10両'));
      await page.screenshot({path:'.tmp/minatomirai-detail-'+width+'.png'});
      await page.close();
    }
    console.log('Minatomirai UI: all positions, 26 stations, desktop/mobile and common details passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
