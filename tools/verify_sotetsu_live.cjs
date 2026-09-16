const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const page=await browser.newPage();
    await page.goto((process.env.SOTETSU_TEST_URL||'http://127.0.0.1:8796')+'/location.html#rosen=167',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.SotetsuLocationAdapter);
    const result=await page.evaluate(async()=>{
      const raw=await fetch('https://external-data.sotetsuapp.com/tid/trains.json?'+Date.now()).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();});
      return {updatedAt:raw.updated_at,total:raw.trains.length,lines:[...new Set(raw.trains.map(t=>t.line_id))],routes:[167,168,169].map(id=>({id,trains:SotetsuLocationAdapter.normalize(raw,id).trains.length}))};
    });
    assert.ok(Number.isFinite(result.updatedAt));console.log(JSON.stringify(result));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
