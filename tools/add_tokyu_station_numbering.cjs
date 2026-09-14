const fs = require('node:fs');
const path = require('node:path');
const { load } = require('../.tmp/tokyu-tools/node_modules/cheerio');
const root = path.join(__dirname, '..');
const manifestPath = path.join(root, 'original/tokyu_station_numbering.json');
const mmStations = { '横浜':'mm01', '新高島':'mm02', 'みなとみらい':'mm03', '馬車道':'mm04', '日本大通り':'mm05', '元町・中華街':'mm06' };

async function download() {
  const source = 'https://www.tokyu.co.jp/railway/station/';
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Station master: HTTP ${response.status}`);
  const $ = load(await response.text());
  const stations = {};
  const downloads = new Map();
  $('.portal-station-list-item').each((_, element) => {
    const name = $(element).find('.portal-station-list-item__title').text().trim();
    const codes = $(element).find('img.portal-station-list-item__numbering-icon').toArray();
    for (const image of codes) {
      const code = $(image).attr('alt');
      if (!/^(ty|mg|dt|om|sh|ik|tm|sg)\d{2}$/.test(code)) continue;
      stations[name] ||= {};
      stations[name][code.slice(0, 2)] = code;
      const target = path.join(root, 'images/station/tokyu', code + '.svg');
      if (fs.existsSync(target)) continue;
      const asset = new URL($(image).attr('src'), source).href;
      downloads.set(code, { target, url: asset });
    }
  });
  if (Object.keys(stations).length < 80) throw new Error('Incomplete station master');
  fs.mkdirSync(path.join(root, 'images/station/tokyu'), { recursive: true });
  for (const {target, url} of downloads.values()) {
    const result = await fetch(url);
    if (!result.ok) throw new Error(`${url}: HTTP ${result.status}`);
    const svg = await result.text();
    if (!svg.includes('<svg') || /<script|<foreignObject/i.test(svg)) throw new Error('Invalid SVG');
    fs.writeFileSync(target, svg);
  }
  fs.writeFileSync(manifestPath, JSON.stringify({ source, stations }, null, 2) + '\n');
}

function apply() {
  const { stations } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const { routes } = require('../js/tokyu_routes');
  const aliases = { '南町田': '南町田グランベリーパーク' };
  for (const route of routes) {
    const file = path.join(root, `rosen/rosen_${route.rosen}.html`);
    let html = fs.readFileSync(file, 'utf8');
    for (const station of route.stations) {
      const mmCode = route.key === 'toyoko' ? mmStations[station.name] : null;
      const prefix = route.key === 'oimachi' && ['二子新地', '高津'].includes(station.name) ? 'dt' : route.internalLineId;
      const code = stations[aliases[station.name] || station.name]?.[prefix];
      if (!code && !mmCode) throw new Error(`Missing numbering: ${route.key} ${station.name}`);
      const key = `TOKYU${route.rosen}S${station.index}`;
      const pattern = new RegExp(`<div class="stalist-eki-link" style="border-color:#[a-fA-F0-9]+"><div class="stalist-eki-contents(?: non-icon)?">(?:<img[^>]*>)*<div key="${key}">`);
      if (!pattern.test(html)) throw new Error(`Missing station element: ${key}`);
      const icons = [];
      if (code) icons.push({ code, file:`tokyu/${code}.svg` });
      if (mmCode) icons.push({ code:mmCode, file:`minatomirai/${mmCode}.svg` });
      const markup = icons.map(icon => `<img class="tokyu-station-number" src="./images/station/${icon.file}" alt="${icon.code.toUpperCase()}" width="38" height="38">`).join('');
      const borderColor = mmCode && mmCode !== 'mm01' ? '#4468b1' : route.color;
      html = html.replace(pattern, `<div class="stalist-eki-link" style="border-color:${borderColor}"><div class="stalist-eki-contents">${markup}<div key="${key}">`);
    }
    fs.writeFileSync(file, html);
  }
}
module.exports = { apply };
if (require.main === module) {
  (async () => {
    if (process.argv.includes('--download')) await download();
    apply();
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
