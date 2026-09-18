const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const table=require('../original/tx_formation.json');
const fixture=require('./fixtures/tx/trains.json');
const stops=require('./fixtures/tx/stops.json');
const status=require('./fixtures/tx/status.json');
(async()=>{
  let fail=true, tableRequests=0;
  const context={self:{},AbortSignal,fetch:async url=>{
    if(url==='./original/tx_formation.json') {tableRequests++;return fail?new Response('',{status:503}):Response.json(table);}
    return Response.json(String(url).includes('status.json')?status:fixture);
  }};
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/tx_location_adapter.js'),'utf8'),context);
  const adapter=context.self.TxLocationAdapter;
  assert.equal((await adapter.load()).trains.length,4);
  fail=false;
  assert.equal((await adapter.load()).trains[0].tx.formation,'1613F');
  await adapter.load();
  assert.equal(tableRequests,2,'Retry failure, cache success');
  console.log('TX formation JSON loader: failure isolation, retry and cache passed.');
  if(!process.argv.includes('--ui')) return;
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    for(const [number,label] of [[14,'TX-1000系・1614F'],[66,'TX-2000系・2666F'],[71,'TX-2000系・2671F(増備車)'],[85,'TX-3000系・3685F'],[86,'TX-2000系']]) {
      const page=await browser.newPage({viewport:{width:375,height:900}});
      page.setDefaultTimeout(15000);
      await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
      await page.route('**/api/mainte/**',r=>r.fulfill({json:r.request().url().includes('rosen_maintenance')?{lines:[]}:{status:0}}));
      await page.route('https://cors-proxy-*/**',r=>r.fulfill({json:[]}));
      await page.route('**/api/tx/**',r=>r.fulfill({json:r.request().url().includes('/tid/')?{...fixture,trains:[{...fixture.trains[0],train_orchestration_number:number}]}:r.request().url().includes('status.json')?status:stops}));
      await page.goto('http://127.0.0.1:8796/location.html#rosen=151',{waitUntil:'domcontentloaded'});
      await page.locator('.ressha[data-cbango="5398"]').first().click({timeout:30000});
      await page.locator('#resshaDetail').waitFor({state:'visible'});
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('#resshaDetail')).opacity==='1');
      assert.ok((await page.locator('#resshaDetail').innerText()).includes(label));
      if(number===71) await page.screenshot({path:path.join(root,'.tmp/tx-formation-detail.png')});
      await page.close();
    }
    console.log('TX detail dialog: all series, 2671F supplement, unknown formation passed.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
