const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {load} = require('../.tmp/tokyu-tools/node_modules/cheerio');
const {routes} = require('../js/sotetsu_routes');
const root = path.join(__dirname,'..');
const numbers = {main:Array.from({length:18},(_,i)=>i+1),izumino:[10,31,32,33,34,35,36,37],shinyokohama:[52,51,8]};
for (const route of routes) {
  const $ = load(fs.readFileSync(path.join(root,`rosen/rosen_${route.rosen}.html`),'utf8'));
  const icons = $('.sotetsu-station-number').toArray();
  assert.deepEqual(icons.map(el=>$(el).attr('alt')),numbers[route.key].map(n=>'SO'+String(n).padStart(2,'0')));
  assert.equal($('[key^="SOTETSU"]').length,route.stations.length);
  assert.equal($('.ressha-icon').length,route.stations.length*4-2);
  for (const el of icons) {
    const svg = load(fs.readFileSync(path.join(root,$(el).attr('src')),'utf8'),{xmlMode:true});
    if ($(el).attr('alt') !== 'SO52') assert.equal(svg('title').text().toUpperCase(),'NUMBER-'+$(el).attr('alt'));
    else assert.ok(svg('path').length > 0);
    assert.equal(svg('image,script,foreignObject').length,0);
  }
}
console.log('Sotetsu: all station numbers, SVGs and train anchors passed.');
if(process.argv.includes('--ui')) (async()=>{
  const {chromium}=require('playwright');
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try {
    for(const width of [320,375,1280]) {
      const page=await browser.newPage({viewport:{width,height:900}});
      await page.route('**/tid/trains.json*',r=>r.fulfill({json:{trains:[],updated_at:Date.now()/1000}}));
      for(const route of routes) {
        await page.goto(`http://127.0.0.1:8796/location.html#rosen=${route.rosen}`,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(count=>{
          const images=[...document.querySelectorAll('.sotetsu-station-number')];
          return images.length===count && images.every(img=>img.complete&&img.naturalWidth>0);
        },route.stations.length);
        assert.ok(await page.locator('.sotetsu-station-number').evaluateAll(images=>images.every(img=>{
          const row=img.parentElement,bounds=row.closest('.stalist-eki-link').getBoundingClientRect();
          return row.scrollWidth<=row.clientWidth && bounds.left>=0 && bounds.right<=innerWidth && img.getBoundingClientRect().right<=img.nextElementSibling.getBoundingClientRect().left;
        })));
        await page.locator('.sotetsu-station-number').first().scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(root,`.tmp/sotetsu-numbering-${route.key}-${width}.png`)});
      }
      await page.close();
    }
    console.log('Sotetsu desktop/mobile: images loaded, station names fit.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
