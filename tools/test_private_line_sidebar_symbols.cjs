const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page=await browser.newPage({viewport:{width:375,height:1000}});
    await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    for (const file of ['index.html','location.html']) {
    await page.goto('http://127.0.0.1:8796/'+file,{waitUntil:'domcontentloaded'});
    const markup=await page.locator('.rosen-name-contents').evaluateAll(elements=>elements.filter(el=>Number(el.getAttribute('value'))>=159&&Number(el.getAttribute('value'))<=169).map(el=>el.outerHTML).join(''));
    await page.setContent('<base href="http://127.0.0.1:8796/"><link rel="stylesheet" href="css/common_side_menu.css"><div class="side-menu" style="max-height:900px"><div class="area-contents"><div class="rosen-name-list" style="display:block">'+markup+'</div></div></div>');
    await page.waitForFunction(()=>[...document.querySelectorAll('.private-line-symbols img')].every(i=>i.complete&&i.naturalWidth>0));
    assert.equal(await page.locator('.private-line-symbols img').count(),12);
    for(const [index,codes] of [['TY','MM'],['MG'],['DT'],['OM'],['SH'],['IK'],['TM'],['SG'],['SO'],['SO'],['SO']].entries()) {
      assert.deepEqual(await page.locator(`[value="${159+index}"] img`).evaluateAll(images=>images.map(i=>i.alt)),codes);
    }
    assert.ok(await page.locator('.rosen-name-contents').evaluateAll(items=>items.every(el=>el.scrollWidth<=el.clientWidth)));
    await page.locator('.side-menu').screenshot({path:'.tmp/sidebar-symbols-'+file+'.png'});
    }
    console.log('Both sidebars: all 12 official images loaded and route mappings passed.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
