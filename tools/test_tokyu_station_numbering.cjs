const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('../.tmp/tokyu-tools/node_modules/cheerio');
const { routes } = require('../js/tokyu_routes');
const root = path.join(__dirname, '..');
const expected = {
  toyoko: [...Array.from({length:21}, (_, i) => `ty${String(i+1).padStart(2,'0')}`), ...Array.from({length:6}, (_, i) => `mm${String(i+1).padStart(2,'0')}`)],
  meguro: Array.from({length:13}, (_, i) => `mg${String(i+1).padStart(2,'0')}`),
  dento: Array.from({length:27}, (_, i) => `dt${String(i+1).padStart(2,'0')}`),
  oimachi: [...Array.from({length:15}, (_, i) => `om${String(i+1).padStart(2,'0')}`), 'dt08', 'dt09', 'om16'],
  shinyokohama: ['sh03','sh02','sh01'],
  ikegami: Array.from({length:15}, (_, i) => `ik${String(i+1).padStart(2,'0')}`),
  tamagawa: Array.from({length:7}, (_, i) => `tm${String(i+1).padStart(2,'0')}`),
  setagaya: Array.from({length:10}, (_, i) => `sg${String(i+1).padStart(2,'0')}`)
};
for (const route of routes) {
  const $ = load(fs.readFileSync(path.join(root, `rosen/rosen_${route.rosen}.html`), 'utf8'));
  const images = $('img.tokyu-station-number').toArray();
  assert.deepEqual(images.map(e => $(e).attr('alt').toLowerCase()), expected[route.key]);
  for (const image of images) {
    const file = path.join(root, $(image).attr('src'));
    const content = fs.readFileSync(file);
    assert.ok(file.endsWith('.svg') ? content.toString().includes('<svg') : content.subarray(0,8).toString('hex') === '89504e470d0a1a0a');
  }
  if (route.key === 'toyoko') assert.deepEqual($('[key="TOKYU159S21"]').siblings('img').toArray().map(e => $(e).attr('alt')), ['TY21','MM01']);
  assert.equal($('[key^="TOKYU"]').length, route.stations.length);
}
console.log('All eight Tokyu routes: numbering, assets and station count passed.');

if (process.argv.includes('--ui')) (async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    for (const width of [375, 1280]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      await page.route('**/api/tokyu/**', r => r.fulfill({json:{data:{trains:[]},fetchedAt:Date.now()}}));
      for (const route of routes) {
        await page.goto(`http://127.0.0.1:8796/location.html#rosen=${route.rosen}`, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(count => {
          const images = [...document.querySelectorAll('#stationList img.tokyu-station-number')];
          return images.length === count && images.every(img => img.complete && img.naturalWidth > 0);
        }, expected[route.key].length);
        assert.ok(await page.locator('#stationList img.tokyu-station-number').evaluateAll(images => images.every(img => {
          const a = img.getBoundingClientRect(), b = img.nextElementSibling.getBoundingClientRect();
          return img.offsetWidth === 38 && a.right <= b.left && img.parentElement.scrollWidth <= img.parentElement.clientWidth;
        })), `${width}: ${route.key}`);
        if (['toyoko', 'shinyokohama'].includes(route.key)) await page.screenshot({path:path.join(root, `.tmp/tokyu-numbering-${route.key}-${width}.png`)});
        if (route.key === 'toyoko') {
          await page.locator('[key="TOKYU159S21"]').scrollIntoViewIfNeeded();
          await page.screenshot({path:path.join(root, `.tmp/mm-numbering-${width}.png`)});
        }
      }
      await page.close();
    }
    console.log('Desktop/mobile: all numbering images loaded without station-name overlap.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
