const fs = require('node:fs');
const path = require('node:path');
const { load } = require('../.tmp/tokyu-tools/node_modules/cheerio');
const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'original/sotetsu_station_numbering.json');

async function download() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    const source = 'https://www.sotetsu.co.jp/train/stations/';
    await page.goto(source, {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => document.querySelectorAll('.station-list-item__station .station-number img').length >= 29);
    const rows = [];
    for (const [tab, end] of [['相鉄本線','海老名'], ['相鉄いずみ野線','湘南台'], ['相鉄新横浜線','羽沢横浜国大']]) {
      console.log('Reading', tab);
      await page.getByRole('tab', {name:tab,exact:true}).click();
      await page.waitForFunction(name => [...document.querySelectorAll('.station-list-item__station')].some(el => el.textContent.includes(name) && el.querySelector('.station-number img')), end);
      rows.push(...await page.locator('.station-list-item__station').evaluateAll(elements => elements.map(el => {
      const name = el.querySelector('ruby')?.cloneNode(true);
      name?.querySelectorAll('rt').forEach(e => e.remove());
      const img = el.querySelector('.station-number img');
      return { name:name?.textContent.trim(), url:img?.src, href:el.href };
      })));
    }
    const stations = {};
    const directory = path.join(root, 'images/station/sotetsu');
    fs.mkdirSync(directory, {recursive:true});
    for (const row of rows) {
      if (!row.name || !row.url || stations[row.name]) continue;
      let body;
      if (row.url.startsWith('data:')) {
        const comma = row.url.indexOf(',');
        const header = row.url.slice(0,comma), data = row.url.slice(comma+1);
        body = header.endsWith(';base64') ? Buffer.from(data,'base64') : Buffer.from(decodeURIComponent(data));
      } else {
        const response = await page.request.get(row.url);
        if (!response.ok()) throw new Error(`HTTP ${response.status()}: ${row.url}`);
        body = await response.body();
      }
      const extension = body.toString().includes('<svg') ? 'svg' : 'png';
      if (extension === 'svg' && /<script|<foreignObject/i.test(body.toString())) throw new Error('Unsafe SVG');
      if (extension === 'png' && body.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Unknown image format');
      const slug = new URL(row.href).pathname.split('/').filter(Boolean).at(-1);
      if (!/^[a-z-]+$/.test(slug)) throw new Error('Unexpected station slug');
      const file = `${slug}.${extension}`;
      stations[row.name] = {file, source:row.href};
      fs.writeFileSync(path.join(directory, file), body);
    }
    if (Object.keys(stations).length !== 27) throw new Error(`Unexpected station count: ${Object.keys(stations).length}`);
    fs.writeFileSync(manifestPath, JSON.stringify({source,stations},null,2) + '\n');
    console.log(stations);
  } finally { await browser.close(); }
}

function apply() {
  const {stations} = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const route of require('../js/sotetsu_routes').routes) {
    const file = path.join(root, `rosen/rosen_${route.rosen}.html`);
    const $ = load(fs.readFileSync(file,'utf8'), null, false);
    for (const station of route.stations) {
      const asset = stations[station.name.replaceAll('ヶ','ケ')];
      if (!asset) throw new Error(`Missing station: ${station.name}`);
      const svg = load(fs.readFileSync(path.join(root,'images/station/sotetsu',asset.file),'utf8'), {xmlMode:true});
      // The official Shin-yokohama SVG has outlined SO52 but no title element.
      const code = svg('title').text().match(/so\d{2}/i)?.[0].toUpperCase() || (station.name === '新横浜' ? 'SO52' : null);
      if (!code) throw new Error(`Missing station number: ${station.name}`);
      const row = $(`[key="SOTETSU${route.rosen}S${station.index}"]`).parent();
      row.removeClass('non-icon');
      row.find('.sotetsu-station-number').remove();
      row.prepend(`<img class="sotetsu-station-number" src="./images/station/sotetsu/${asset.file}" alt="${code}" width="38" height="38">`);
    }
    fs.writeFileSync(file, $.html());
  }
}
module.exports = {apply};
if (require.main === module) (async () => {
  if (process.argv.includes('--download')) await download();
  apply();
})().catch(error => {console.error(error);process.exitCode=1;});
