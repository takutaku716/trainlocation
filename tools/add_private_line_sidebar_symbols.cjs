const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const {load} = require('../.tmp/tokyu-tools/node_modules/cheerio');
// Reuse the previously downloaded official page; no network access is needed.
if (process.argv.includes('--cached-sotetsu')) {
  const $ = load(fs.readFileSync(path.join(root,'.tmp/sotetsu-stations.html'),'utf8'));
  const directory = path.join(root,'images/line');
  fs.mkdirSync(directory,{recursive:true});
  for (const [label,code] of [['東急線','TY'],['みなとみらい線','MM']]) {
    const image = $('img').toArray().find(el => $(el).parent().text().trim() === label && ($(el).attr('src') || '').startsWith('data:image/svg+xml,'));
    if (!image) throw new Error(`Missing official icon: ${label}`);
    const svg = decodeURIComponent($(image).attr('src').split(',').slice(1).join(','));
    if (!svg.includes('<svg') || /<script|<foreignObject/i.test(svg)) throw new Error('Invalid SVG');
    fs.writeFileSync(path.join(directory,`${code.toLowerCase()}.svg`),svg);
  }
}
const routes = require('../js/tokyu_routes').routes.map(r => [r.rosen, r.internalLineId.toUpperCase(), r.color]);
for (const id of ['167','168','169']) routes.push([id, 'SO', '#0073bc']);
for (const file of ['index.html','location.html']) {
  let html = fs.readFileSync(path.join(root,file),'utf8');
  for (const [id,code,color] of routes) {
    const pattern = new RegExp(`(<div value="${id}" class="rosen-name-contents">)(?:<span class="eki-icon private-line-symbol kigo-bg"[^>]*><span class="kigo">[^<]*</span></span>|<span class="private-line-symbols">(?:<img[^>]*>)+</span>)?`,'g');
    if (!pattern.test(html)) throw new Error(`Missing route ${id} in ${file}`);
    const codes = id === '159' ? ['TY','MM'] : [code];
    const images = codes.map(symbol => {
      const filename = symbol === 'SO' ? 'sotetsu_so.svg' : symbol.toLowerCase()+'.svg';
      const svg = load(fs.readFileSync(path.join(root,'images/line',filename),'utf8'),{xmlMode:true});
      if (svg('svg').length !== 1 || svg('script,foreignObject,image').length) throw new Error(`Invalid SVG: ${filename}`);
      return `<img src="./images/line/${filename}" alt="${symbol}" width="28" height="28">`;
    }).join('');
    const symbol = `<span class="private-line-symbols">${images}</span>`;
    html = html.replace(pattern, '$1' + symbol);
  }
  fs.writeFileSync(path.join(root,file),html);
}
