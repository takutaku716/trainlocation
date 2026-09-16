const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css/keikyu_train_icons.css'), 'utf8');
const colors = {express:'#006bac',kaitoku:'#00c266',airport:'#f79b1c',rapid:'#ff80a0',commuter:'#38c0f0'};
const original = fs.readFileSync(path.join(root, 'images/home/train_icon.svg'), 'utf8');
for (const [name,color] of Object.entries(colors)) {
  const svg = fs.readFileSync(path.join(root, `images/home/keikyu/train_icon_${name}.svg`), 'utf8');
  assert.equal(svg.replace(color,'#789').replace(/\r\n/g,'\n').trim(),original.replace(/\r\n/g,'\n').trim());
}
for (const [label,asset] of Object.entries({'急行':'express','快特':'kaitoku','エアポート快特':'airport','アクセス特急':'airport','快速':'rapid','通勤特急':'commuter'})) {
  const rule = css.split('\n').find(line => line.includes(`data-ressha_type_name="${label}"`));
  assert.ok(rule.includes(`train_icon_${asset}.svg`));
  assert.ok(rule.includes(`--train-type-color: ${colors[asset]}`));
  assert.ok(rule.includes('[data-source="toei"][data-source_rosen="140"]'));
  assert.ok(rule.includes('[data-source="keikyu"]'));
}
assert.ok(!css.includes('data-ressha_type_name="普通"'));
const wingRule = css.split('\n').find(line => line.includes('data-ressha_type_name="ウィング"'));
assert.ok(wingRule.includes('[data-source="keikyu"]'));
assert.ok(wingRule.includes('--train-type-color: #00a693'));
assert.ok(wingRule.includes('train_icon_wing.svg'));
const wingSvg = fs.readFileSync(path.join(root, 'images/home/keikyu/train_icon_wing.svg'), 'utf8');
assert.ok(wingSvg.includes('fill="#00a693"'));
assert.equal(wingSvg.match(/ d="([^"]+)"/)[1].replace(/\s+/g, ''), original.match(/ d="([^"]+)"/)[1].replace(/\s+/g, ''));
const detailScript = fs.readFileSync(path.join(root, 'js/location_unkou_detail.js'), 'utf8');
assert.ok(detailScript.includes('getPropertyValue("--train-type-color")'));
assert.ok(detailScript.includes('$("#resshaTypeName").css("background-color", iconTypeColor)'));
assert.ok(css.split('\n').find(line=>line.includes('data-ressha_type_name="特急"')).includes('../images/home/train_icon_red.svg'));
console.log('Keikyu/Asakusa shared icons: colors, original shape, scoped routes and existing local/limited express passed.');
