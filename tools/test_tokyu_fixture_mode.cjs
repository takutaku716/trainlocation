const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const routes=require('../js/tokyu_routes');
const fixture=require('../testdata/tokyu_parallel_trains.json');
const formations=require('../original/tokyu_formation.json');
(async()=>{
 let calls=[];
 const context={self:{TokyuRoutes:routes},location:{search:'?tokyu_test=parallel',hostname:'127.0.0.1'},URLSearchParams,AbortSignal,fetch:async url=>{
  calls.push(url);assert.ok(url.startsWith('./'));
  return Response.json(url.includes('tokyu_formation')?formations:fixture);
 }};
 vm.runInNewContext(fs.readFileSync('js/tokyu_location_adapter.js','utf8'),context);
 for(const id of [159,160,161,162]) {
  const a=context.self.TokyuLocationAdapter;
  const result=await a.load(id);
  assert.ok(result.time.ja.includes('テストデータ'));
  assert.equal(result.tokyu.unmapped,0);
  assert.ok(result.trains.every(t=>!t.tokyu.dentoRequest));
  const route=a.routeFor(id);
  for(const station of route.stations) for(const dir of ['U','D']) {
   assert.ok(result.trains.filter(t=>t.pos===`TOKYU${id}P${station.index}${dir}`).length>=2);
   if(station.index<route.stations.length) assert.ok(result.trains.filter(t=>t.pos===`TOKYU${id}P${station.index}_${station.index+1}${dir}`).length>=2);
  }
 }
 assert.ok(calls.includes('./testdata/tokyu_parallel_trains.json'));
 if(process.argv.includes('--ui')) {
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
   const page=await browser.newPage({viewport:{width:390,height:900}});
   let liveCalls=0;
   await page.route('**/*',r=>{if(/\/api\/tokyu\//.test(r.request().url()))liveCalls++;return new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort();});
   await page.route('**/api/mainte/**',r=>r.fulfill({json:{lines:[],status:0}}));
   await page.route('https://cors-proxy-*/**',r=>r.fulfill({json:r.request().url().includes('ressha_type_master')||r.request().url().includes('eki_master')?[]:{lines:[]}}));
   for(const width of [320,390,1280]) for(const id of [159,160,161,162]) {
    await page.setViewportSize({width,height:900});
    await page.goto('http://127.0.0.1:8796/location.html?tokyu_test=parallel#rosen='+id);
    const expected=fixture.data.trains.filter(t=>t.line_id===Number(routes.routes.find(r=>r.rosen===String(id)).tidLineId)).length;
    await page.waitForFunction(n=>document.querySelectorAll('#stationList .ressha').length===n,expected);
    const overlaps=await page.locator('.tokyu-parallel-slot .icon-img').evaluateAll(items=>{
     const boxes=items.map(el=>({id:el.closest('.ressha').dataset.cbango,r:el.getBoundingClientRect().toJSON()}));
     return boxes.flatMap((a,i)=>boxes.slice(i+1).filter(b=>a.r.left<b.r.right && b.r.left<a.r.right && a.r.top<b.r.bottom && b.r.top<a.r.bottom).map(b=>[a,b]));
    });
    assert.deepEqual(overlaps,[]);
    // The station background ends 10px earlier; labels must still clear the next panel's trains.
    const collisions=await page.locator('.eki-panel:has(.tokyu-parallel-contents)').evaluateAll(panels=>panels.flatMap(panel=>{
     const next=panel.nextElementSibling;
     if(!next) return [];
     const bounds=el=>el.getBoundingClientRect();
     const a=Array.from(panel.querySelectorAll('.ressha *')).map(bounds).filter(r=>r.width&&r.height);
     const b=Array.from(next.querySelectorAll('.ressha *')).map(bounds).filter(r=>r.width&&r.height);
     return a.flatMap(x=>b.filter(y=>x.left<y.right && y.left<x.right && x.top<y.bottom && y.top<x.bottom).map(()=>1));
    }));
    assert.deepEqual(collisions,[]);
    await page.locator('.TOKYU'+id+'P'+({159:8,160:8,161:7,162:15}[id])+'U').scrollIntoViewIfNeeded();
    await page.screenshot({path:'.tmp/tokyu-fixture-'+id+'.png'});
   }
   assert.equal(liveCalls,0);
  } finally {await browser.close();}
 }
 console.log('Fixture mode: every station/section, both directions, clear test label and no live train API passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
