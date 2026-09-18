const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const adapter=require('../js/tokyu_location_adapter');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  for(const routeId of [159,160,161,162]) for(const width of [320,1280]) {
   const page=await browser.newPage({viewport:{width,height:900}});
   const route=adapter.routeFor(routeId);
   const start={159:8,160:8,161:7,162:15}[routeId];
   const inner=routeId>=161?26004:26002,outer=inner-1;
   let counts=[2,1];
   function trains() {
    const result=[];
    const section=Object.keys(route.sections).find(k=>route.sections[k].from===start && route.sections[k].to===start+1);
    for(const place of ['station','section']) for(const up of [true,false]) for(const [system,count] of [[inner,counts[0]],[outer,counts[1]]]) for(let i=0;i<count;i++) {
     result.push({line_id:route.tidLineId,train_line_id:system,...(place==='station'?{station_id:route.stations[start-1].id}:{section_id:section}),up,
      train_number:place[0]+(up?'U':'D')+system+i,operation_number:38,affiliation:'急',num_of_cars:8,train_orchestration_number:'38',kind:'普',destination:'日吉'});
    }
    return result;
   }
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
   await page.route('**/api/mainte/**',r=>r.fulfill({json:{lines:[],status:0}}));
   await page.route('https://cors-proxy-*/**',r=>r.fulfill({json:r.request().url().includes('ressha_type_master')||r.request().url().includes('eki_master')?[]:{lines:[]}}));
   await page.route('**/api/tokyu/'+route.key,r=>r.fulfill({json:{fetchedAt:Date.now(),data:{trains:trains()}}}));
   for(const pair of [[2,1],[1,2],[2,0],[0,1],[8,1]]) {
    counts=pair;
    await page.goto('http://127.0.0.1:8796/location.html?fixture='+pair.join('-')+'#rosen='+routeId);
    await page.waitForFunction(n=>document.querySelectorAll('.tokyu-parallel-slot > .ressha').length===n,4*(pair[0]+pair[1]));
    for(const pos of [String(start),start+'_'+(start+1)]) for(const direction of ['U','D']) {
     const slot=page.locator('.TOKYU'+routeId+'P'+pos+direction);
     const boxes=await slot.locator('.ressha').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return {column:Number(el.style.gridColumn),row:Number(el.style.gridRow),x:r.x,y:r.y,w:r.width,h:r.height,display:getComputedStyle(el).display};}));
     assert.equal(boxes.length,pair[0]+pair[1]);
     for(const b of boxes) {assert.notEqual(b.display,'none');assert.ok(b.x>=0 && b.x+b.w<=width);}
     for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++) {
      const a=boxes[i],b=boxes[j];assert.ok(a.x+a.w<=b.x+1 || b.x+b.w<=a.x+1 || a.y+a.h<=b.y+1 || b.y+b.h<=a.y+1);
     }
     const content=await slot.evaluate(el=>el.parentElement.getBoundingClientRect().toJSON());
     assert.ok(boxes.every(b=>b.y+b.h<=content.bottom+1));
     const meguroColumn=direction==='U'?2:1;
     assert.equal(boxes.filter(b=>b.column===meguroColumn).length,pair[0]);
     assert.equal(boxes.filter(b=>b.column!==meguroColumn).length,pair[1]);
    }
    assert.equal(await page.locator('.TOKYU'+routeId+'P'+(start-1)+'U.tokyu-parallel-slot').count(),0);
    const before=await page.locator('.tokyu-parallel-slot > .ressha').evaluateAll(items=>items.map(el=>[el.style.gridColumn,el.style.gridRow]));
    await page.evaluate(({id,rows})=>{
     clear_location_positions(String(id));
     create_ressha_icon(String(id),TokyuLocationAdapter.normalize({fetchedAt:Date.now(),data:{trains:rows}},id),[],[]);
    },{id:routeId,rows:trains()});
    assert.deepEqual(await page.locator('.tokyu-parallel-slot > .ressha').evaluateAll(items=>items.map(el=>[el.style.gridColumn,el.style.gridRow])),before);
    if(pair[0]===2 && pair[1]===1) {
     await page.locator('.TOKYU'+routeId+'P'+start+'U').scrollIntoViewIfNeeded();
     await page.screenshot({path:'.tmp/tokyu-parallel-'+routeId+'-'+width+'.png'});
    }
   }
   await page.close();
  }
  console.log('Shared lanes: both routes, 320/1280px, stations/sections, both directions, unequal/empty/8-train lanes passed.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
