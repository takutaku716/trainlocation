// Development-only: npm install --prefix .tmp/tokyu-tools cheerio@1.1.2 acorn@8.15.0
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('../.tmp/tokyu-tools/node_modules/cheerio');
const { parse } = require('../.tmp/tokyu-tools/node_modules/acorn');
const root = path.join(__dirname, '..');
const input = path.join(root, '.tmp/tokyu-source');
const definitions = [
  ['toyoko', 'ty', '26001', '東横線', '#ce0032'],
  ['meguro', 'mg', '26002', '目黒線', '#008dcb'],
  ['dento', 'dt', '26003', '田園都市線', '#009c7a'],
  ['oimachi', 'om', '26004', '大井町線', '#ee7630'],
  ['shinyokohama', 'sh', '26009', '東急新横浜線', '#890d84'],
  ['ikegami', 'ik', '26005', '池上線', '#ee86a7'],
  ['tamagawa', 'tm', '26006', '東急多摩川線', '#ae0378'],
  ['setagaya', 'sg', '26007', '世田谷線', '#fcc70d']
];
const source = load(fs.readFileSync(path.join(input, 'tokyutid.html'), 'utf8'));
// Extract literal tables only. Never execute downloaded JavaScript.
function literal(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'UnaryExpression' && node.operator === '-') return -literal(node.argument);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(p => {
    if (p.type !== 'Property' || p.computed || p.method) throw new Error('Non-literal property');
    return [p.key.name ?? p.key.value, literal(p.value)];
  }));
  throw new Error('Non-literal table: ' + node.type);
}
const tables = {};
source('script').each((_, el) => {
  for (const statement of parse(source(el).text(), { ecmaVersion: 'latest' }).body) {
    if (statement.type !== 'VariableDeclaration') continue;
    for (const decl of statement.declarations) if (['linedata', 'destination_name_tymg', 'destination_name_dtom'].includes(decl.id.name)) tables[decl.id.name] = literal(decl.init);
  }
});
const plain = table => Object.fromEntries(Object.entries(table).map(([code, value]) => [code, load(value).text()]));
const destinations = { tymg: plain(tables.destination_name_tymg), dtom: plain(tables.destination_name_dtom) };
Object.assign(destinations.tymg, {33:'副都心線直通',54:'三田線直通',67:'南北線直通',100:'みなとみらい',103:'元町・中華街',111:'相鉄線直通'});
Object.assign(destinations.dtom, {45:'半蔵門線直通',79:'たまプラーザ',89:'南町田グランベリーパーク'});
delete destinations.tymg['0']; delete destinations.dtom['0'];
const routes = definitions.map(([key, internalLineId, tidLineId, name, color], i) => {
  const route = { rosen: String(159 + i), key, internalLineId, tidLineId, name, color,
    source: i < 5 ? 'signed' : 'w-tid', file: ['ikegami', 'tamagawa'].includes(key) ? 'iketama.json' : key + '.json', stations: [], sections: {} };
  if (tables.linedata[key]) {
    const entries = tables.linedata[key].sections;
    route.stations = entries.filter(s => s.station_id != null).map(s => ({id: String(s.station_id), name: s.station_name}));
    if (key === 'toyoko') route.stations = route.stations.slice(0, route.stations.findIndex(s => s.name === '横浜') + 1);
    let index = 0;
    for (const entry of entries) {
      if (entry.station_id != null) index++;
      else if (index > 0 && index < route.stations.length) for (const id of entry.section_id || []) route.sections[id] = {from:index,to:index+1};
    }
  } else {
    const $ = load(fs.readFileSync(path.join(input, key + '.html'), 'utf8'));
    const stations = $('section.Line-section');
    stations.each((index, node) => {
      const name = $(node).find('h1').text().trim();
      if (!name) throw new Error('Missing station');
      route.stations.push({ id: $(node).attr('id'), name });
      if (index === stations.length - 1) return;
      $(node).nextUntil('section.Line-section').find('[data-section-id]').each((_, e) => {
        route.sections[$(e).attr('data-section-id')] = { from: index + 1, to: index + 2 };
      });
    });
  }
  route.stations.forEach((s, index) => { s.index = index + 1; });
  return route;
});
for (const route of routes) {
  const id = route.rosen, ss = route.stations;
  const html = [`<div id="homenNameUpText" hidden>${ss[0].name}方面</div><div id="homenNameDownText" hidden>${ss.at(-1).name}方面</div>`];
  ss.forEach((station, i) => {
    const n = i + 1, last = n === ss.length;
    html.push(`<div class="eki-panel eki${last ? ' end' : ''}"><div class="eki-contents"><div class="stalist-eki-link" style="border-color:${route.color}"><div class="stalist-eki-contents non-icon"><div key="TOKYU${id}S${n}">${station.name}</div></div></div><div class="ressha-contents"><div class="ressha-icon TOKYU${id}P${n}U"></div><div class="ressha-icon TOKYU${id}P${n}D"></div></div></div>${last ? '' : '<svg class="senro-img"><use xlink:href="#senro"></use></svg>'}</div>`);
    if (!last) html.push(`<div class="eki-panel"><div class="eki-contents"><div class="ressha-contents"><div class="ressha-icon TOKYU${id}P${n}_${n + 1}U"></div><div class="ressha-icon TOKYU${id}P${n}_${n + 1}D"></div></div></div><svg class="senro-img"><use xlink:href="#senro"></use></svg></div>`);
  });
  html.push('<svg style="display:none" xmlns="http://www.w3.org/2000/svg"><symbol id="senro" viewBox="0 0 8 300"><path d="M4 0V300" stroke="#000" stroke-width="6"/><path d="M4 0V300" stroke="#fff" stroke-width="4" stroke-dasharray="10 10"/></symbol></svg>');
  fs.writeFileSync(path.join(root, `rosen/rosen_${id}.html`), html.join('\n') + '\n');
  console.log(id, route.name, ss.length, Object.keys(route.sections).length);
}
fs.writeFileSync(path.join(root, 'js/tokyu_routes.js'), '// Generated by tools/generate_tokyu_routes.cjs.\n(function(root){const data=' + JSON.stringify({ routes, destinations }) + ';if(typeof module==="object"&&module.exports)module.exports=data;else root.TokyuRoutes=data;})(typeof self!=="undefined"?self:this);\n');
const masterPath = path.join(root, 'master/rosen_name_master.json');
const content = fs.readFileSync(masterPath, 'utf8');
const existing = new Set(JSON.parse(content).map(r => r.rosen));
const languages = value => Object.fromEntries(['ja', 'en', 'tc', 'sc', 'kr'].map(l => [l, value]));
const additions = routes.filter(r => !existing.has(r.rosen)).map(r => ({ rosen: r.rosen, rosenName: languages(r.name), kukanName: languages(`[${r.stations[0].name}～${r.stations.at(-1).name}間]`), area: '15' }));
if (additions.length) fs.writeFileSync(masterPath, content.replace('[', '[\n' + additions.map(r => JSON.stringify(r) + ',').join('\n')));
